import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { THEMES, THEME_OVERRIDE_KEY, FONT_SIZES } from '../../constants/index.js'
import { LS, KEYS } from '../../hooks/useStorage.js'
import { GOLD_FOIL_DATA_URI } from '../../assets/goldFoil.js'
import './Settings.css'

// ── Luminance → dark text needed? ─────────────
function needsDarkText(hex) {
  if (!hex || hex.length < 7) return false
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  const L = [r,g,b].map(c => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4) })
  return 0.2126*L[0]+0.7152*L[1]+0.0722*L[2] > 0.35
}

// ── Hex → rgba string (for gold-foil tint overlay) ─
function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(168,128,48,${alpha})`
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ── Suggest a theme name from colours ─────────
function suggestThemeName(colours) {
  const { header, enjoy, plan } = colours
  const h = header || enjoy || '#3D82E0'
  const hex = h.replace('#','')
  const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16)
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  const hue = max===0 ? 0 : max===r ? 60*((g-b)/(max-min)+6)%360 : max===g ? 60*((b-r)/(max-min)+2) : 60*((r-g)/(max-min)+4)
  const bright = max/255
  if (bright < 0.25) return 'Midnight'
  if (hue < 20 || hue > 340) return bright > 0.6 ? 'Coral' : 'Crimson'
  if (hue < 45) return bright > 0.6 ? 'Sunset' : 'Amber'
  if (hue < 70) return bright > 0.6 ? 'Golden' : 'Harvest'
  if (hue < 150) return bright > 0.5 ? 'Garden' : 'Forest'
  if (hue < 190) return 'Teal'
  if (hue < 250) return bright > 0.5 ? 'Sky' : 'Ocean'
  if (hue < 290) return 'Indigo'
  if (hue < 330) return 'Plum'
  return 'Rose'
}

// ── 100-colour Pages-style grid ───────────────
function buildGrid() {
  const rows = []
  // Greyscale row
  const greys = []
  for (let i = 0; i <= 9; i++) {
    const v = Math.round(255 * (1 - i / 9))
    greys.push('#' + [v,v,v].map(x => x.toString(16).padStart(2,'0')).join(''))
  }
  rows.push(greys)

  // Colour rows: 10 hues, brightness from dark to light (including pastels)
  const HUES = [0, 30, 50, 75, 120, 165, 200, 225, 265, 300]
  // Brightness steps: 0.25 (dark) → 1.0 (light/pastel)
  // Saturation varies: full sat for mid rows, lower for pastels
  const STEPS = [
    { b: 0.25, s: 0.90 },
    { b: 0.38, s: 0.90 },
    { b: 0.52, s: 0.90 },
    { b: 0.65, s: 0.88 },
    { b: 0.75, s: 0.85 },
    { b: 0.85, s: 0.80 },
    { b: 0.90, s: 0.65 },
    { b: 0.93, s: 0.50 },
    { b: 0.96, s: 0.35 },
    { b: 0.99, s: 0.20 },
  ]

  for (const { b, s } of STEPS) {
    const row = []
    for (const h of HUES) {
      const k = n => (n + h / 60) % 6
      const f = n => b - b * s * Math.max(0, Math.min(k(n), 4 - k(n), 1))
      const r = Math.round(f(5) * 255)
      const g = Math.round(f(3) * 255)
      const bv = Math.round(f(1) * 255)
      row.push('#' + [r, g, bv].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join(''))
    }
    rows.push(row)
  }
  return rows
}

const COLOUR_GRID = buildGrid()

// ── Colour Wheel (HSB circular picker) ───────
function ColourWheel({ value, onChange }) {
  const canvasRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [brightness, setBrightness] = useState(1.0)
  const [baseHex, setBaseHex] = useState(null)

  const SIZE = 220
  const RADIUS = SIZE / 2

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    for (let angle = 0; angle < 360; angle++) {
      const grad = ctx.createRadialGradient(RADIUS, RADIUS, 0, RADIUS, RADIUS, RADIUS)
      grad.addColorStop(0, "hsl(" + angle + ",0%,100%)")
      grad.addColorStop(1, "hsl(" + angle + ",100%,50%)")
      ctx.beginPath()
      ctx.moveTo(RADIUS, RADIUS)
      ctx.arc(RADIUS, RADIUS, RADIUS, (angle - 1.5) * Math.PI / 180, (angle + 1.5) * Math.PI / 180)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()
    }
  }, [])

  const applyBrightness = useCallback((hex, b) => {
    if (!hex || hex.length < 7) return hex
    const r = Math.round(parseInt(hex.slice(1,3),16) * b)
    const g = Math.round(parseInt(hex.slice(3,5),16) * b)
    const bv = Math.round(parseInt(hex.slice(5,7),16) * b)
    return "#" + [r,g,bv].map(v => Math.max(0,Math.min(255,v)).toString(16).padStart(2,"0")).join("")
  }, [])

  const pickColour = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = (clientX - rect.left) * (SIZE / rect.width)
    const y = (clientY - rect.top) * (SIZE / rect.height)
    const dx = x - RADIUS, dy = y - RADIUS
    if (Math.sqrt(dx*dx + dy*dy) > RADIUS) return
    const ctx = canvas.getContext("2d")
    const px = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data
    if (px[3] < 10) return
    const hex = "#" + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2,"0")).join("")
    setBaseHex(hex)
    const final = applyBrightness(hex, brightness)
    onChange(final)
  }, [onChange, brightness, applyBrightness])

  const handleBrightness = useCallback((e) => {
    const b = parseFloat(e.target.value)
    setBrightness(b)
    const base = baseHex || value
    if (base) onChange(applyBrightness(base, b))
  }, [baseHex, value, onChange, applyBrightness])

  // Brightness gradient for the slider track
  const sliderBg = baseHex || value || "#888"

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{ width: "100%", borderRadius: "50%", cursor: "crosshair", touchAction: "none", display: "block" }}
        onMouseDown={(e) => { setDragging(true); pickColour(e) }}
        onMouseUp={() => setDragging(false)}
        onMouseMove={e => dragging && pickColour(e)}
        onTouchStart={e => { e.preventDefault(); pickColour(e) }}
        onTouchMove={e => { e.preventDefault(); pickColour(e) }}
      />

      {/* Brightness slider */}
      <div style={{ width: "100%", padding: "0 4px" }}>
        <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-body)", color: "var(--text-lo)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>Brightness</div>
        <div
          style={{ position: "relative", height: 32, borderRadius: 16,
            background: "linear-gradient(to right, #000, " + sliderBg + ")",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
            touchAction: "none", cursor: "pointer" }}
          onMouseDown={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const b = Math.min(1, Math.max(0.05, (e.clientX - rect.left) / rect.width))
            setBrightness(b)
            const base = baseHex || value
            if (base) onChange(applyBrightness(base, b))
          }}
          onMouseMove={e => {
            if (e.buttons !== 1) return
            const rect = e.currentTarget.getBoundingClientRect()
            const b = Math.min(1, Math.max(0.05, (e.clientX - rect.left) / rect.width))
            setBrightness(b)
            const base = baseHex || value
            if (base) onChange(applyBrightness(base, b))
          }}
          onTouchStart={e => {
            e.preventDefault()
            const rect = e.currentTarget.getBoundingClientRect()
            const b = Math.min(1, Math.max(0.05, (e.touches[0].clientX - rect.left) / rect.width))
            setBrightness(b)
            const base = baseHex || value
            if (base) onChange(applyBrightness(base, b))
          }}
          onTouchMove={e => {
            e.preventDefault()
            const rect = e.currentTarget.getBoundingClientRect()
            const b = Math.min(1, Math.max(0.05, (e.touches[0].clientX - rect.left) / rect.width))
            setBrightness(b)
            const base = baseHex || value
            if (base) onChange(applyBrightness(base, b))
          }}
        >
          <div style={{
            position: "absolute", top: "50%",
            left: (brightness * 100) + "%",
            transform: "translate(-50%, -50%)",
            width: 26, height: 26, borderRadius: "50%",
            background: applyBrightness(sliderBg, brightness),
            border: "3px solid #fff",
            boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }} />
        </div>
      </div>

      {value && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: value, border: "2px solid rgba(0,0,0,0.15)" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--text-lo)" }}>{value.toUpperCase()}</span>
        </div>
      )}
    </div>
  )
}


function ColourGrid({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
      {COLOUR_GRID.map((row, ri) => (
        <div key={ri} style={{ display: 'flex' }}>
          {row.map((hex, ci) => (
            <div
              key={ci}
              onClick={() => onChange(hex)}
              style={{
                flex: 1,
                aspectRatio: '1',
                height: 'auto',
                background: hex,
                cursor: 'pointer',
                outline: value === hex ? '3px solid rgba(255,255,255,0.9)' : 'none',
                outlineOffset: -3,
                position: 'relative',
                zIndex: value === hex ? 1 : 0,
                boxSizing: 'border-box',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Slot definitions ──────────────────────────
const SLOTS = [
  { key: 'header',     label: 'Header',              isHeader: true },
  { key: 'enjoy',      label: 'Enjoy Now',           isHeader: false },
  { key: 'plan',       label: 'Planning',            isHeader: false },
  { key: 'physical',   label: 'Physical',            isHeader: false },
  { key: 'achieve',    label: 'Achievement',         isHeader: false },
  { key: 'highlights', label: 'Highlights',          isHeader: false },
]

// ── Mini preview ──────────────────────────────
function MiniPreview({ themeKey, colours, textDark, fill, outline, activeSlot, onSelectSlot }) {
  const base = THEMES[themeKey]?.vars || {}
  const get = (slot, fallbackVar) => colours[slot] || base[fallbackVar] || '#888'

  const headerCol = get('header', '--now')
  const enjoyCol  = get('enjoy',  '--btn-enjoy')
  const planCol   = get('plan',   '--btn-plan')
  const achCol    = get('achieve','--btn-achieve')
  const highCol   = get('highlights','--btn-highlights')
  const physCol   = get('physical','--btn-physical')

  const btnStyle = (slot, col) => {
    const isGold = fill[slot] === 'gold'
    const hasOutline = !!outline[slot]
    return {
      borderRadius: 8, height: 22, display: 'flex', alignItems: 'center',
      justifyContent: 'center', cursor: 'pointer',
      backgroundColor: col,
      backgroundImage: isGold
        ? `linear-gradient(${hexToRgba(col, 0.32)}, ${hexToRgba(col, 0.32)}), url("${GOLD_FOIL_DATA_URI}")`
        : 'none',
      backgroundBlendMode: 'multiply',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      border: hasOutline ? '1.5px solid rgba(255,255,255,0.65)' : '1.5px solid transparent',
      outline: activeSlot === slot ? '3px solid rgba(0,0,0,0.45)' : 'none',
      outlineOffset: -2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      marginBottom: 4,
    }
  }

  const labelStyle = (slot) => ({
    fontFamily: 'var(--font-display)', fontSize: '0.68rem',
    color: textDark[slot] ? '#1a1a1a' : '#fff', fontWeight: 500,
    textShadow: fill[slot] === 'gold' ? '0 1px 2px rgba(0,0,0,0.25)' : 'none',
  })

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.18)', marginBottom: 8 }}>
      {/* Header */}
      <div onClick={() => onSelectSlot('header')} style={{
        background: `linear-gradient(135deg,${headerCol},${headerCol}cc)`,
        padding: '0.6rem 0.75rem 0.5rem', cursor: 'pointer',
        outline: activeSlot === 'header' ? '3px solid rgba(255,255,255,0.9)' : 'none',
        outlineOffset: -3,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
          ✦ The Most Important Hour
        </div>
      </div>
      {/* Buttons */}
      <div style={{ background: 'rgba(255,255,255,0.85)', padding: '0.5rem 0.6rem 0.4rem' }}>
        {[
          ['enjoy',      enjoyCol, 'Enjoy Now'],
          ['plan',       planCol,  'Planning'],
          ['physical',   physCol,  'Physical'],
          ['achieve',    achCol,   'Achievement & Progress'],
          ['highlights', highCol,  'Highlights'],
        ].map(([slot, col, lbl]) => (
          <div key={slot} onClick={() => onSelectSlot(slot)} style={btnStyle(slot, col)}>
            <span style={labelStyle(slot)}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Theme editor portal ───────────────────────
function ThemeEditor({ themeKey, onClose, onThemeChange }) {
  const overrideKey = THEME_OVERRIDE_KEY(themeKey)
  const saved = LS.get(overrideKey, {})
  const base = THEMES[themeKey]?.vars || {}
  const dragStartY = useRef(null)

  const handleTouchStart = (e) => { dragStartY.current = e.touches[0].clientY }
  const handleTouchEnd = (e) => {
    if (dragStartY.current === null) return
    const dy = e.changedTouches[0].clientY - dragStartY.current
    if (dy > 80) onClose()
    dragStartY.current = null
  }

  const [colours, setColours] = useState(() => {
    const c = {}
    SLOTS.forEach(s => { if (saved[s.key]) c[s.key] = saved[s.key] })
    return c
  })

  const [textDark, setTextDark] = useState(() => saved.textDark || {})
  const [fill, setFill] = useState(() => saved.fill || {})
  const [outline, setOutline] = useState(() => saved.outline || {})
  const [manualOverride, setManualOverride] = useState({}) // tracks slots user has manually toggled
  const [activeSlot, setActiveSlot] = useState('header')
  const [savedThemes, setSavedThemes] = useState(() => LS.get('ci-saved-themes', []))
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [pickerMode, setPickerMode] = useState('wheel') // 'wheel' | 'grid'

  const currentColour = useMemo(() => {
    const fallbacks = {
      header: '--now', enjoy: '--btn-enjoy', plan: '--btn-plan',
      physical: '--btn-physical', achieve: '--btn-achieve', highlights: '--btn-highlights',
    }
    return colours[activeSlot] || base[fallbacks[activeSlot]] || '#3D82E0'
  }, [colours, activeSlot, base])

  const isBtn = activeSlot !== 'header'

  const CSS_MAP = {
    header:     ['--now', '--now-dk', '--accent'],
    enjoy:      ['--btn-enjoy', '--btn-enjoy-dk'],
    plan:       ['--btn-plan', '--btn-plan-dk'],
    physical:   ['--btn-physical', '--btn-physical-dk'],
    achieve:    ['--btn-achieve', '--btn-achieve-dk'],
    highlights: ['--btn-highlights', '--btn-highlights-dk'],
  }

  const handleColourChange = useCallback((hex) => {
    const newColours = { ...colours, [activeSlot]: hex }
    // Only auto-update textDark if user hasn't manually overridden this slot
    const autoDetect = isBtn && !manualOverride[activeSlot]
    const newTextDark = autoDetect
      ? { ...textDark, [activeSlot]: needsDarkText(hex) }
      : { ...textDark }
    setColours(newColours)
    if (autoDetect) setTextDark(newTextDark)

    // Directly apply to DOM for instant visual feedback
    const root = document.documentElement
    const vars = CSS_MAP[activeSlot] || []
    const h = hex.replace('#','')
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
    const dk = '#' + [r,g,b].map(c => Math.max(0,Math.round(c*0.72)).toString(16).padStart(2,'0')).join('')
    vars.forEach((v, i) => root.style.setProperty(v, i === 0 ? hex : dk))
    // If gold texture is active on this slot, refresh its tint to match the new colour
    if (isBtn && fill[activeSlot] === 'gold') {
      root.style.setProperty(`--btn-${activeSlot}-tint`, hexToRgba(hex, 0.32))
    }

    // Save and propagate
    const overrides = { ...newColours, textDark: newTextDark, fill, outline }
    LS.set(overrideKey, overrides)
    onThemeChange(themeKey, overrides)
  }, [colours, activeSlot, isBtn, textDark, manualOverride, fill, outline, overrideKey, themeKey, onThemeChange])

  // ── Gold-foil texture toggle (per button) ────
  const handleFillToggle = useCallback(() => {
    if (!isBtn) return
    const isGold = fill[activeSlot] === 'gold'
    const newFill = { ...fill, [activeSlot]: isGold ? 'colour' : 'gold' }
    setFill(newFill)

    const root = document.documentElement
    const hex = colours[activeSlot] || base[CSS_MAP[activeSlot]?.[0]] || '#A88030'
    if (!isGold) {
      root.style.setProperty(`--btn-${activeSlot}-image`, `url("${GOLD_FOIL_DATA_URI}")`)
      root.style.setProperty(`--btn-${activeSlot}-tint`, hexToRgba(hex, 0.32))
    } else {
      root.style.setProperty(`--btn-${activeSlot}-image`, 'none')
      root.style.setProperty(`--btn-${activeSlot}-tint`, 'transparent')
    }

    const overrides = { ...colours, textDark, fill: newFill, outline }
    LS.set(overrideKey, overrides)
    onThemeChange(themeKey, overrides)
  }, [isBtn, fill, activeSlot, colours, base, textDark, outline, overrideKey, themeKey, onThemeChange])

  // ── Outline toggle (per button) ───────────────
  const handleOutlineToggle = useCallback(() => {
    if (!isBtn) return
    const isOn = !!outline[activeSlot]
    const newOutline = { ...outline, [activeSlot]: !isOn }
    setOutline(newOutline)

    const root = document.documentElement
    root.style.setProperty(`--btn-${activeSlot}-border-w`, isOn ? '0px' : '1.5px')

    const overrides = { ...colours, textDark, fill, outline: newOutline }
    LS.set(overrideKey, overrides)
    onThemeChange(themeKey, overrides)
  }, [isBtn, outline, activeSlot, colours, textDark, fill, overrideKey, themeKey, onThemeChange])

  const handleRestore = () => {
    LS.remove(overrideKey)
    setColours({})
    setTextDark({})
    setFill({})
    setOutline({})
    setManualOverride({})
    onThemeChange(themeKey, {})
  }

  const handleSaveAsNew = () => {
    setSaveName(suggestThemeName({ ...colours }))
    setShowSaveDialog(true)
  }

  const confirmSave = () => {
    const newTheme = {
      key: 'saved-' + Date.now(),
      name: saveName,
      baseKey: themeKey,
      colours: { ...colours },
      textDark: { ...textDark },
    }
    const updated = [...savedThemes, newTheme]
    setSavedThemes(updated)
    LS.set('ci-saved-themes', updated)
    setShowSaveDialog(false)
  }

  const activeLabel = SLOTS.find(s => s.key === activeSlot)?.label || ''

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%', maxWidth: 480,
          background: 'linear-gradient(160deg, var(--bg-a), var(--bg-b))',
          borderRadius: '22px 22px 0 0',
          padding: '0.75rem 1.1rem calc(env(safe-area-inset-bottom) + 1.5rem)',
          maxHeight: '92dvh', overflowY: 'auto',
          animation: 'sheetUp 0.28s cubic-bezier(0.32,0,0.2,1)',
        }}>
        {/* Pull indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.15)' }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 500, color: 'var(--text-hi)' }}>
            Edit {THEMES[themeKey]?.name}
          </span>
          <button className="close-x" onClick={onClose}>&#10005;</button>
        </div>

        {/* Mini preview */}
        <MiniPreview
          themeKey={themeKey}
          colours={colours}
          textDark={textDark}
          fill={fill}
          outline={outline}
          activeSlot={activeSlot}
          onSelectSlot={setActiveSlot}
        />

        {/* Active slot + text toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.65)', borderRadius: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: currentColour, border: '2px solid rgba(0,0,0,0.12)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-hi)', flex: 1 }}>{activeLabel}</span>
          {isBtn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-lo)', fontFamily: 'var(--font-body)' }}>
                {textDark[activeSlot] ? 'Dark' : 'Light'}
              </span>
              <div onClick={() => {
                const newVal = !textDark[activeSlot]
                const newTextDark = { ...textDark, [activeSlot]: newVal }
                setTextDark(newTextDark)
                setManualOverride(prev => ({ ...prev, [activeSlot]: true }))
                // Apply immediately
                const textVars = { enjoy: '--btn-enjoy-text', plan: '--btn-plan-text', physical: '--btn-physical-text', achieve: '--btn-achieve-text', highlights: '--btn-highlights-text' }
                if (textVars[activeSlot]) document.documentElement.style.setProperty(textVars[activeSlot], newVal ? '#1a1a1a' : '#ffffff')
                // Save
                const overrides = { ...colours, textDark: newTextDark, fill, outline }
                LS.set(overrideKey, overrides)
                onThemeChange(themeKey, overrides)
              }}
                style={{ width: 36, height: 20, borderRadius: 10, background: textDark[activeSlot] ? '#1a1a1a' : 'var(--accent)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: textDark[activeSlot] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          )}
        </div>

        {/* Gold texture + Outline toggles (per button only) */}
        {isBtn && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0.5rem 0.7rem', background: 'rgba(255,255,255,0.65)', borderRadius: 12 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-hi)' }}>✦ Gold texture</span>
              <div onClick={handleFillToggle}
                style={{ width: 36, height: 20, borderRadius: 10, background: fill[activeSlot] === 'gold' ? '#B8860B' : 'rgba(0,0,0,0.18)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: fill[activeSlot] === 'gold' ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0.5rem 0.7rem', background: 'rgba(255,255,255,0.65)', borderRadius: 12 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-hi)' }}>Outline</span>
              <div onClick={handleOutlineToggle}
                style={{ width: 36, height: 20, borderRadius: 10, background: outline[activeSlot] ? 'var(--accent)' : 'rgba(0,0,0,0.18)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: outline[activeSlot] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>
        )}

        {/* Picker mode toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {['wheel', 'grid'].map(mode => (
            <button key={mode} onClick={() => setPickerMode(mode)} style={{
              flex: 1, padding: '0.3rem', borderRadius: 10,
              border: pickerMode === mode ? 'none' : '1.5px solid var(--border)',
              background: pickerMode === mode ? 'var(--now)' : 'rgba(255,255,255,0.6)',
              fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 600,
              color: pickerMode === mode ? '#fff' : 'var(--text-lo)',
              cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{mode === 'grid' ? 'Grid' : 'Wheel'}</button>
          ))}
        </div>

        {/* Colour picker */}
        {pickerMode === 'wheel'
          ? <ColourWheel value={currentColour} onChange={handleColourChange} />
          : <ColourGrid value={currentColour} onChange={handleColourChange} />
        }

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
          <button onClick={handleRestore} style={{
            flex: 1, padding: '0.7rem', borderRadius: 12,
            border: '1.5px solid var(--border)', background: 'rgba(255,255,255,0.7)',
            fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600,
            color: 'var(--text-lo)', cursor: 'pointer',
          }}>Restore defaults</button>
          <button onClick={handleSaveAsNew} style={{
            flex: 1, padding: '0.7rem', borderRadius: 12,
            border: 'none', background: 'linear-gradient(135deg, var(--now), var(--now-dk))',
            fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 700,
            color: '#fff', cursor: 'pointer',
          }}>Save as new theme</button>
        </div>

        {/* Save dialog */}
        {showSaveDialog && (
          <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-hi)', marginBottom: 8 }}>Name your theme</div>
            <input
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 10, padding: '0.5rem 0.75rem', fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-hi)', background: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowSaveDialog(false)} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--text-lo)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmSave} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: 'none', background: 'var(--now)', fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ── Main Settings Sheet ───────────────────────
const CLAUDE_PROMPT = "Describe this image as a detailed factual record. Read all visible text exactly as written. Describe objects, people, colours, and setting. If you recognise a brand, place, or person, name it as an identification. Prioritise capturing all text completely."

async function describePhotoWithClaude(dataUrl, apiKey) {
  const base64 = dataUrl.split(',')[1]
  const mediaType = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: CLAUDE_PROMPT },
        ],
      }],
    }),
  })
  if (!res.ok) throw new Error('API error ' + res.status)
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

export default function SettingsSheet({ themeKey, setThemeKey, fontSizeKey, setFontSizeKey, onClose, onExport, onImport, onShowPrivacy, btnConfig, setBtnConfig, defaultBtnConfig }) {
  const [editingTheme, setEditingTheme] = useState(null)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('mih-claude-key') || '')
  const [showKey, setShowKey] = useState(false)
  const sheetRef = useRef(null)
  const dragStartY = useRef(null)

  /* ONE-TIME PHOTO DESCRIPTION — REMOVE AFTER USE */
  const [batchStatus, setBatchStatus] = useState(null) // null | 'running' | 'done'
  const [batchMsg, setBatchMsg] = useState('')

  const runBatchDescribe = async () => {
    const key = localStorage.getItem('mih-claude-key')
    if (!key) { alert('Please save a Claude API key first.'); return }
    setBatchStatus('running')
    const PHOTO_KEY = 'mih-photos'
    const photos = JSON.parse(localStorage.getItem(PHOTO_KEY) || '[]')
    const todo = photos.filter(p => p.dataUrl && !p.photoDesc)
    const total = todo.length
    if (total === 0) { setBatchMsg('All photos already described.'); setBatchStatus('done'); return }
    let done = 0
    for (const photo of todo) {
      setBatchMsg(`Describing photo ${done + 1} of ${total}…`)
      try {
        const desc = await describePhotoWithClaude(photo.dataUrl, key)
        const all = JSON.parse(localStorage.getItem(PHOTO_KEY) || '[]')
        const updated = all.map(p => p.id === photo.id ? { ...p, photoDesc: desc } : p)
        localStorage.setItem(PHOTO_KEY, JSON.stringify(updated))
        done++
      } catch (e) {
        console.warn('Batch describe failed for photo', photo.id, e)
      }
      await new Promise(r => setTimeout(r, 500))
    }
    setBatchMsg(`Done — ${done} photo${done === 1 ? '' : 's'} described`)
    setBatchStatus('done')
  }
  /* END ONE-TIME PHOTO DESCRIPTION */

  const handleTouchStart = (e) => { dragStartY.current = e.touches[0].clientY }
  const handleTouchEnd = (e) => {
    if (dragStartY.current === null) return
    const dy = e.changedTouches[0].clientY - dragStartY.current
    if (dy > 80) { onClose(); setEditingTheme(null) }
    dragStartY.current = null
  }

  const handleFontSize = (key) => {
    const fs = FONT_SIZES.find(f => f.key === key)
    if (!fs) return
    document.documentElement.style.fontSize = fs.px
    setFontSizeKey(key)
    LS.set(KEYS.FONT_SIZE, key)
  }

  const handleThemeChange = useCallback((key, overrides) => {
    setThemeKey(key, overrides)
  }, [setThemeKey])

  const getPreviewColours = (key) => {
    const override = LS.get(THEME_OVERRIDE_KEY(key), {})
    const base = THEMES[key]?.vars || {}
    return [
      override.header || base['--now'] || '#888',
      override.enjoy  || base['--btn-enjoy'] || '#888',
      override.plan   || base['--btn-plan'] || '#888',
      override.achieve|| base['--btn-achieve'] || '#888',
    ]
  }

  return createPortal(
    <>
      <div className="settings-overlay" onClick={onClose}>
        <div
          className="settings-sheet"
          ref={sheetRef}
          onClick={e => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ maxHeight: '82dvh' }}
        >
          {/* Pull indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '0.5rem', marginTop: '-0.25rem' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.15)' }} />
          </div>
          <div className="settings-head">
            <span className="settings-title">Settings</span>
            <button className="close-x" onClick={onClose}>&#10005;</button>
          </div>

          {/* Colour Theme */}
          <div className="s-card">
            <div className="s-card-title">Colour Theme</div>
            <div className="theme-grid">
              {Object.entries(THEMES).map(([key, t]) => {
                const previewCols = getPreviewColours(key)
                const hasOverride = Object.keys(LS.get(THEME_OVERRIDE_KEY(key), {})).length > 0
                return (
                  <button key={key}
                    className={'theme-card' + (themeKey === key ? ' active' : '')}
                    onClick={() => setThemeKey(key)}>
                    <div className="theme-preview">
                      {previewCols.map((c, i) => (
                        <div key={i} className="theme-sq" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="theme-info">
                      <span className="theme-name">{t.emoji} {t.name}{hasOverride ? ' ✎' : ''}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span
                          onClick={e => { e.stopPropagation(); setThemeKey(key); setEditingTheme(key) }}
                          style={{ fontSize: '0.65rem', color: 'var(--accent)', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.04em', padding: '2px 6px', borderRadius: 8, background: 'var(--accent-soft)' }}>
                          Edit
                        </span>
                        {themeKey === key && <span style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>&#10003;</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Font size */}
          <div className="s-card">
            <div className="s-card-title">Text Size</div>
            <div className="font-size-row">
              {FONT_SIZES.map(({ key, label, px }) => (
                <button key={key}
                  className={'fsz-btn' + (fontSizeKey === key ? ' active' : '')}
                  onClick={() => handleFontSize(key)}>
                  <span className="fsz-letter" style={{ fontSize: px }}>A</span>
                  <span className="fsz-label">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Button Config */}
          {btnConfig && (
            <div className="s-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div className="s-card-title" style={{ marginBottom: 0 }}>Home Buttons</div>
                <button
                  onClick={() => setBtnConfig(defaultBtnConfig)}
                  style={{ fontSize: '0.65rem', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-soft)', border: 'none', borderRadius: 8, padding: '3px 8px', cursor: 'pointer', letterSpacing: '0.04em' }}
                >Restore defaults</button>
              </div>
              {Object.entries(btnConfig).map(([key, cfg]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '8px 10px' }}>
                  {/* Visible toggle */}
                  <div
                    onClick={() => setBtnConfig({ ...btnConfig, [key]: { ...cfg, visible: !cfg.visible } })}
                    style={{ width: 36, height: 20, borderRadius: 10, background: cfg.visible ? 'var(--accent)' : 'rgba(0,0,0,0.15)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                  >
                    <div style={{ position: 'absolute', top: 2, left: cfg.visible ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  {/* Label input */}
                  <input
                    value={cfg.label}
                    onChange={e => setBtnConfig({ ...btnConfig, [key]: { ...cfg, label: e.target.value } })}
                    style={{ flex: 1, border: 'none', borderBottom: '1.5px solid var(--border)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600, color: cfg.visible ? 'var(--text-hi)' : 'var(--text-lo)', padding: '2px 0', outline: 'none' }}
                  />
                </div>
              ))}
              <div style={{ fontSize: '0.65rem', color: 'var(--text-lo)', fontFamily: 'var(--font-body)', marginTop: 4, lineHeight: 1.4 }}>
                Toggle buttons on/off · Tap a name to rename it
              </div>
            </div>
          )}

          {/* API Key */}
          <div className="s-card">
            <div className="s-card-title">Claude API Key</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-…"
                style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.78rem', border: '1.5px solid var(--border)', borderRadius: 10, padding: '7px 10px', background: 'var(--bg-b)', color: 'var(--text-hi)', outline: 'none' }}
              />
              <button onClick={() => setShowKey(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', fontSize: '0.75rem', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <button
              onClick={() => { localStorage.setItem('mih-claude-key', apiKey); alert('API key saved.') }}
              style={{ width: '100%', padding: '8px 0', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
            >Save Key</button>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-lo)', fontFamily: 'var(--font-body)', marginTop: 6, lineHeight: 1.4 }}>
              Used for AI photo descriptions. Stored locally only — never sent anywhere except Anthropic.
            </div>
          </div>

          {/* ONE-TIME PHOTO DESCRIPTION — REMOVE AFTER USE */}
          <div className="s-card">
            <div className="s-card-title">One-Time Setup</div>
            <button
              onClick={runBatchDescribe}
              disabled={batchStatus === 'running' || batchStatus === 'done'}
              style={{ width: '100%', padding: '8px 0', borderRadius: 10, border: 'none', background: batchStatus === 'done' ? 'var(--border)' : 'var(--accent-soft)', color: batchStatus === 'done' ? 'var(--text-lo)' : 'var(--accent)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.82rem', cursor: batchStatus ? 'default' : 'pointer' }}
            >Describe All My Photos</button>
            {batchMsg ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-lo)', fontFamily: 'var(--font-body)', marginTop: 6, textAlign: 'center' }}>{batchMsg}</div>
            ) : (
              <div style={{ fontSize: '0.65rem', color: 'var(--text-lo)', fontFamily: 'var(--font-body)', marginTop: 6, lineHeight: 1.4 }}>
                Sends each existing photo to Claude to generate a searchable description. Skips already-described photos. Requires API key above.
              </div>
            )}
          </div>
          {/* END ONE-TIME PHOTO DESCRIPTION */}

          {/* Data */}
          <div className="s-card">
            <div className="s-card-title">Your Data</div>
            <div className="data-btn-row">
              <button className="data-btn data-btn-export" onClick={onExport}>
                <span style={{ fontSize: '1.3rem' }}>&#11014;&#65039;</span>
                <span>Export backup</span>
              </button>
              <button className="data-btn data-btn-import" onClick={onImport}>
                <span style={{ fontSize: '1.3rem' }}>&#11015;&#65039;</span>
                <span>Import backup</span>
              </button>
            </div>
            <div className="data-hint">Export saves all your data as a file.<br />Import restores from a previous backup.</div>
          </div>

          {/* Privacy */}
          <div className="s-card">
            <div className="s-card-title">Privacy</div>
            <button onClick={onShowPrivacy} style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: 12, border: '1.5px solid var(--border)', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: '1.3rem' }}>&#128274;</span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-hi)' }}>Privacy Information</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--text-lo)', marginTop: 2 }}>Your data stays on this device only</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-lo)', fontSize: '1.1rem' }}>&#8250;</span>
            </button>
          </div>
        </div>
      </div>

      {editingTheme && (
        <ThemeEditor
          themeKey={editingTheme}
          onClose={() => setEditingTheme(null)}
          onThemeChange={handleThemeChange}
        />
      )}
    </>,
    document.body
  )
}
