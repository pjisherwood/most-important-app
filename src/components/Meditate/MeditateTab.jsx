import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { uid } from '../../hooks/utils.js'
import { LS, KEYS } from '../../hooks/useStorage.js'
import './Meditate.css'

// ══════════════════════════════════════════════
// WAVES ANIMATION
// ══════════════════════════════════════════════
function WavesAnimation() {
  const waves = [
    { y: 0.82, amp: 0.12, freq: 1.1, phase: 0.0, fill: 'rgba(0,160,255,0.9)',    blur: 2,  dur: 22 },
    { y: 0.78, amp: 0.14, freq: 0.9, phase: 0.7, fill: 'rgba(30,140,255,0.7)',   blur: 8,  dur: 28 },
    { y: 0.72, amp: 0.16, freq: 0.8, phase: 1.4, fill: 'rgba(80,160,255,0.55)',  blur: 16, dur: 34 },
    { y: 0.66, amp: 0.18, freq: 0.7, phase: 0.3, fill: 'rgba(120,180,255,0.45)', blur: 24, dur: 40 },
    { y: 0.60, amp: 0.20, freq: 0.6, phase: 1.1, fill: 'rgba(160,200,255,0.35)', blur: 32, dur: 48 },
    { y: 0.54, amp: 0.22, freq: 0.55,phase: 0.6, fill: 'rgba(180,210,255,0.25)', blur: 40, dur: 55 },
  ]
  const W = 400, H = 700
  const makePath = (yFrac, amp, freq, phase) => {
    const cy = yFrac * H, a = amp * H, steps = 60
    const top = Array.from({ length: steps + 1 }, (_, i) => {
      const x = (i / steps) * W
      const y = cy + a * Math.sin((i / steps) * 2 * Math.PI * freq + phase)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    return [...top, `L${W},${H} L0,${H} Z`].join(' ')
  }
  return (
    <svg className="anim-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        {waves.map((w, i) => (
          <filter key={i} id={`wblur${i}`} x="-20%" y="-30%" width="140%" height="160%">
            <feGaussianBlur stdDeviation={w.blur} />
          </filter>
        ))}
      </defs>
      {waves.map((w, i) => {
        const p1 = makePath(w.y, w.amp, w.freq, w.phase)
        const p2 = makePath(w.y, w.amp, w.freq, w.phase + Math.PI)
        const p3 = makePath(w.y - 0.03, w.amp, w.freq, w.phase + Math.PI * 0.5)
        return (
          <path key={i} fill={w.fill} filter={`url(#wblur${i})`}>
            <animate attributeName="d" values={`${p1};${p3};${p2};${p3};${p1}`}
              dur={`${w.dur}s`} repeatCount="indefinite" calcMode="spline"
              keySplines="0.5 0 0.5 1;0.5 0 0.5 1;0.5 0 0.5 1;0.5 0 0.5 1" />
          </path>
        )
      })}
    </svg>
  )
}

// ══════════════════════════════════════════════
// FIRE ANIMATION
// ══════════════════════════════════════════════
function FireAnimation() {
  const W = 400, H = 700
  const makeFlamePath = (cxFrac, wFrac, hFrac, sway) => {
    const cx = cxFrac * W, hw = (wFrac * W) / 2
    const top = H * (1 - hFrac) + sway * H * 0.06
    const mid = H * 0.72, bot = H
    return [
      `M${cx.toFixed(1)},${top.toFixed(1)}`,
      `C${(cx+hw*0.25).toFixed(1)},${(top+(mid-top)*0.35).toFixed(1)}`,
      ` ${(cx+hw).toFixed(1)},${(top+(mid-top)*0.75).toFixed(1)}`,
      ` ${(cx+hw).toFixed(1)},${mid.toFixed(1)}`,
      `C${(cx+hw).toFixed(1)},${(mid+(bot-mid)*0.65).toFixed(1)}`,
      ` ${(cx+hw*0.4).toFixed(1)},${bot.toFixed(1)}`,
      ` ${cx.toFixed(1)},${bot.toFixed(1)}`,
      `C${(cx-hw*0.4).toFixed(1)},${bot.toFixed(1)}`,
      ` ${(cx-hw).toFixed(1)},${(mid+(bot-mid)*0.65).toFixed(1)}`,
      ` ${(cx-hw).toFixed(1)},${mid.toFixed(1)}`,
      `C${(cx-hw).toFixed(1)},${(top+(mid-top)*0.75).toFixed(1)}`,
      ` ${(cx-hw*0.25).toFixed(1)},${(top+(mid-top)*0.35).toFixed(1)}`,
      ` ${cx.toFixed(1)},${top.toFixed(1)} Z`,
    ].join(' ')
  }
  const flames = [
    { cx:0.10, w:0.30, h:0.52, fill:'rgba(190,90,0,0.38)',  blur:30, dur:7  },
    { cx:0.32, w:0.34, h:0.68, fill:'rgba(170,70,0,0.32)',  blur:38, dur:10 },
    { cx:0.55, w:0.38, h:0.78, fill:'rgba(200,100,0,0.35)', blur:28, dur:8  },
    { cx:0.78, w:0.32, h:0.58, fill:'rgba(180,80,0,0.30)',  blur:34, dur:11 },
    { cx:0.20, w:0.44, h:0.44, fill:'rgba(210,120,0,0.28)', blur:44, dur:13 },
    { cx:0.65, w:0.40, h:0.48, fill:'rgba(195,95,0,0.25)',  blur:48, dur:10 },
    { cx:0.44, w:0.55, h:0.88, fill:'rgba(165,65,0,0.30)',  blur:24, dur:6  },
    { cx:0.92, w:0.38, h:0.72, fill:'rgba(205,110,0,0.32)', blur:30, dur:9  },
  ]
  return (
    <svg className="anim-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        {flames.map((f, i) => (
          <filter key={i} id={`fblur${i}`} x="-60%" y="-20%" width="220%" height="140%">
            <feGaussianBlur stdDeviation={f.blur} />
          </filter>
        ))}
      </defs>
      {flames.map((f, i) => {
        const p1 = makeFlamePath(f.cx, f.w, f.h, 0)
        const p2 = makeFlamePath(f.cx, f.w, f.h * 1.12,  0.45)
        const p3 = makeFlamePath(f.cx, f.w, f.h * 0.88, -0.38)
        return (
          <path key={i} fill={f.fill} filter={`url(#fblur${i})`}>
            <animate attributeName="d" values={`${p1};${p2};${p3};${p1}`}
              dur={`${f.dur}s`} repeatCount="indefinite" calcMode="spline"
              keySplines="0.5 0 0.5 1;0.5 0 0.5 1;0.5 0 0.5 1" />
          </path>
        )
      })}
    </svg>
  )
}

// ══════════════════════════════════════════════
// MEDITATION SETTINGS
// Base + increment override system
// ══════════════════════════════════════════════
function MeditationSettings({ meditations, setMeditations, onClose, medStreak, totalMins, totalSessions }) {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [adding,    setAdding]    = useState(null)

  const meditatedDays = new Set(
    meditations.map(m => new Date(m.timestamp).toDateString())
  )

  const firstDay    = new Date(viewYear, viewMonth, 1)
  const lastDay     = new Date(viewYear, viewMonth + 1, 0)
  const startDow    = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()
  const monthName   = firstDay.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const cellDate      = d => new Date(viewYear, viewMonth, d)
  const isToday       = d => d && cellDate(d).toDateString() === today.toDateString()
  const isFuture      = d => d && cellDate(d) > today
  const hasMeditation = d => d && meditatedDays.has(cellDate(d).toDateString())

  const minMonth = new Date(today.getFullYear(), today.getMonth() - 12, 1)
  const curMonth = new Date(viewYear, viewMonth, 1)
  const isPrevOK = curMonth > minMonth
  const isNextOK = !(viewYear === today.getFullYear() && viewMonth === today.getMonth())

  const prevMonth = () => {
    if (!isPrevOK) return
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (!isNextOK) return
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const handleDayTap = d => {
    if (!d || isFuture(d) || hasMeditation(d)) return
    setAdding({ dateStr: cellDate(d).toDateString(), d })
  }

  const confirmAdd = () => {
    if (!adding) return
    const ts = new Date(adding.dateStr)
    ts.setHours(8, 0, 0, 0)
    setMeditations(prev =>
      [...prev, { id: uid(), timestamp: ts.toISOString(), duration: 10 }]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    )
    setAdding(null)
  }

  const monthCount = cells.filter(d => d && hasMeditation(d)).length

  const sheet = (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "linear-gradient(160deg, var(--bg-a), var(--bg-b))",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "calc(env(safe-area-inset-top) + 0.875rem) 1.25rem 0.875rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
          Back
        </button>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 500, color: "var(--text-hi)" }}>
          Your Practice
        </span>
        <div style={{ width: 48 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1rem" }}>

        <div style={{ display: "flex", background: "rgba(255,255,255,0.65)", borderRadius: 16, marginBottom: "1.25rem", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {[
            { label: "Day Streak", value: medStreak },
            { label: "Total Days", value: totalSessions },
            { label: "Total Mins", value: totalMins },
          ].map(({ label, value }, i) => (
            <div key={label} style={{ flex: 1, textAlign: "center", padding: "0.875rem 0.25rem", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 300, color: "var(--text-hi)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-lo)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", fontSize: "1.6rem", lineHeight: 1, color: isPrevOK ? "var(--accent)" : "var(--border)", cursor: isPrevOK ? "pointer" : "default", padding: "0.25rem 0.5rem" }}>&#8249;</button>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 500, color: "var(--text-hi)" }}>{monthName}</span>
          <button onClick={nextMonth} style={{ background: "none", border: "none", fontSize: "1.6rem", lineHeight: 1, color: isNextOK ? "var(--accent)" : "var(--border)", cursor: isNextOK ? "pointer" : "default", padding: "0.25rem 0.5rem" }}>&#8250;</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
          {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
            <div key={d} style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-lo)", paddingBottom: 4 }}>{d}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: "1.5rem" }}>
          {cells.map((d, i) => {
            const med     = hasMeditation(d)
            const future  = isFuture(d)
            const thisDay = isToday(d)
            return (
              <div key={i} onClick={() => handleDayTap(d)} style={{
                aspectRatio: "1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", borderRadius: 10, gap: 3,
                background: thisDay ? "var(--accent-soft)" : "rgba(255,255,255,0.5)",
                border: thisDay ? "1.5px solid var(--accent)" : "1px solid rgba(0,0,0,0.05)",
                cursor: d && !future && !med ? "pointer" : "default",
                opacity: future ? 0.3 : 1,
              }}>
                {d && (
                  <>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: thisDay ? 700 : 400, color: thisDay ? "var(--accent)" : "var(--text-hi)", lineHeight: 1 }}>{d}</span>
                    {med
                      ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--now-dk)" }} />
                      : <div style={{ width: 6, height: 6 }} />
                    }
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--now-dk)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "var(--text-lo)" }}>Meditation day</span>
          </div>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "var(--text-lo)", opacity: 0.7 }}>
            Tap a past day to log a missed session
          </span>
        </div>

        <div style={{ background: "rgba(255,255,255,0.65)", borderRadius: 16, padding: "0.875rem 1.25rem", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          {monthCount > 0 ? (
            <>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 300, color: "var(--text-hi)", lineHeight: 1 }}>{monthCount}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-lo)", marginTop: 4 }}>
                {monthCount === 1 ? "day this month" : "days this month"}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "0.9rem", color: "var(--text-lo)" }}>No sessions this month yet</div>
          )}
        </div>
      </div>

      {adding && (
        <div onClick={() => setAdding(null)} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "linear-gradient(160deg, var(--bg-a), var(--bg-b))", borderRadius: "22px 22px 0 0", padding: "1.5rem 1.5rem calc(env(safe-area-inset-bottom) + 1.5rem)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 500, color: "var(--text-hi)", marginBottom: "0.5rem" }}>Log missed session</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--text-lo)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Add a 10-minute session for {new Date(adding.dateStr).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}?
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setAdding(null)} style={{ flex: 1, padding: "0.875rem", borderRadius: 14, border: "1.5px solid var(--border)", background: "transparent", fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--text-lo)", cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmAdd} style={{ flex: 1, padding: "0.875rem", borderRadius: 14, border: "none", background: "var(--accent)", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 700, color: "#fff", cursor: "pointer" }}>Add Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  return createPortal(sheet, document.body)
}

const SOUNDS = [
  { key: 'silence',              label: 'Silence',                file: null },
  { key: 'piano',                label: 'Piano',                  file: '/piano.mp3' },
  { key: 'soothing-fire',        label: 'Soothing Fire',          file: '/soothing-fire.mp3' },
  { key: 'bonfire',              label: 'Bonfire',                file: '/bonfire.mp3' },
  { key: 'ocean-waves',          label: 'Ocean Waves',            file: '/ocean-waves.mp3' },
  { key: 'rain',                 label: 'Rain',                   file: '/rain.mp3' },
  { key: 'stream',               label: 'Stream',                 file: '/stream.mp3' },
]


// ══════════════════════════════════════════════
// STREAM ANIMATION — blue teal vertical ribbons
// ══════════════════════════════════════════════
function StreamAnimation() {
  const W = 390, H = 844
  const sd = (n) => ((n * 9301 + 49297) % 233280) / 233280
  const streams = Array.from({ length: 14 }, (_, i) => {
    const s0=sd(i*7),s1=sd(i*13),s2=sd(i*17),s3=sd(i*23),s4=sd(i*31),s5=sd(i*37),s6=sd(i*41),s7=sd(i*43),s8=sd(i*47)
    const xBase = 35 + (i / 13) * 30
    const thickness = 18 + s0 * 72
    const waveScale = 65 + s1 * 45
    const sign = s0 < 0.5 ? 1 : -1
    const lean = waveScale * (0.4 + s1 * 0.5)
    const w = [
      sign * lean * 0.2,
      sign * lean * 0.8,
      sign * lean * 1.0,
      sign * lean * 0.9,
      sign * lean * 0.5,
      sign * lean * 0.15,
    ]
    const isSoft = i % 3 !== 2
    const blur = isSoft ? 8 + s8*14 : 2 + s8*4
    const isDeep = thickness > 60
    const isFoam = thickness < 28
    const color = isFoam
      ? "rgba(210,240,255,0.9)"
      : isDeep
        ? "rgba(" + (10+Math.floor(s4*25)) + "," + (55+Math.floor(s5*45)) + "," + (100+Math.floor(s6*40)) + ",0.9)"
        : "rgba(" + (20+Math.floor(s4*40)) + "," + (140+Math.floor(s5*50)) + "," + (195+Math.floor(s6*35)) + ",0.9)"
    const opacity = isFoam ? 0.45+s1*0.25 : isDeep ? 0.35+s1*0.2 : 0.38+s1*0.22
    const dur = 18 + s1*16
    return { id:i, x:xBase, thickness, w, isSoft, blur, dur, delay:-(s2*dur), opacity, color }
  })
  const foamBlobs = Array.from({ length: 10 }, (_, i) => {
    const s0=sd(i*71),s1=sd(i*73),s2=sd(i*79),s3=sd(i*83)
    return { id:i, cx:(28+s0*44)/100*W, cy:H*(0.2+s1*0.6), rx:12+s1*28, ry:6+s2*14, opacity:0.08+s3*0.12, dur:20+s0*14, delay:-(s1*20) }
  })
  const wp = (xPct, w, y0, y1) => {
    const px = xPct/100*W
    const q1=y0+(y1-y0)*0.33, mid=(y0+y1)/2, q3=y0+(y1-y0)*0.67
    return "M "+(px+w[0])+","+y0+" C "+(px+w[1])+","+q1+" "+(px+w[2])+","+mid+" "+(px+w[3])+","+mid+" S "+(px+w[4])+","+q3+" "+(px+w[5])+","+y1
  }
  return (
    <svg className="anim-svg" viewBox={"0 0 "+W+" "+H} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="stbg" cx="50%" cy="50%" r="45%">
          <stop offset="0%" stopColor="#0d3252" />
          <stop offset="100%" stopColor="#04111e" />
        </radialGradient>
        <radialGradient id="stglow" cx="50%" cy="40%" r="38%">
          <stop offset="0%" stopColor="#1a88b8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0a3060" stopOpacity="0" />
        </radialGradient>
        {streams.map(s => (
          <filter key={s.id} id={"stf"+s.id} x="-60%" y="-5%" width="220%" height="110%">
            <feGaussianBlur stdDeviation={s.blur} />
          </filter>
        ))}
        <filter id="stblobf" x="-60%" y="-5%" width="220%" height="110%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect width={W} height={H} fill="url(#stbg)" />
      <rect width={W} height={H} fill="url(#stglow)" />
      {foamBlobs.map(b => (
        <ellipse key={b.id} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill="white" opacity={b.opacity} filter="url(#stblobf)">
          <animateTransform attributeName="transform" type="translate" from={"0 "+(-H)} to={"0 "+H} dur={b.dur+"s"} begin={b.delay+"s"} repeatCount="indefinite" calcMode="linear" />
        </ellipse>
      ))}
      {streams.map(s => {
        const ps = wp(s.x,s.w,-H,0), pe = wp(s.x,s.w,0,H)
        return (
          <path key={s.id} fill="none" stroke={s.color} strokeWidth={s.thickness} strokeLinecap="round" opacity={s.opacity} filter={"url(#stf"+s.id+")"} d={ps}>
            <animate attributeName="d" values={ps+";"+pe} dur={s.dur+"s"} begin={s.delay+"s"} repeatCount="indefinite" calcMode="linear" />
            <animate attributeName="opacity" values={"0;"+s.opacity+";"+s.opacity+";0"} keyTimes="0;0.04;0.94;1" dur={s.dur+"s"} begin={s.delay+"s"} repeatCount="indefinite" />
          </path>
        )
      })}
    </svg>
  )
}

// ══════════════════════════════════════════════
// STREAM GENTLE ANIMATION — grey-green-white
// ══════════════════════════════════════════════
function StreamGentleAnimation() {
  const W = 390, H = 844
  const sd = (n) => ((n * 9301 + 49297) % 233280) / 233280
  const streams = Array.from({ length: 14 }, (_, i) => {
    const s0=sd(i*7),s1=sd(i*13),s2=sd(i*17),s3=sd(i*23),s4=sd(i*31),s5=sd(i*37),s6=sd(i*41),s7=sd(i*43),s8=sd(i*47)
    const xBase = 35 + (i / 13) * 30
    const thickness = 18 + s0 * 72
    const waveScale = 65 + s1 * 45
    const sign = s0 < 0.5 ? 1 : -1
    const lean = waveScale * (0.4 + s1 * 0.5)
    const w = [
      sign * lean * 0.2,
      sign * lean * 0.8,
      sign * lean * 1.0,
      sign * lean * 0.9,
      sign * lean * 0.5,
      sign * lean * 0.15,
    ]
    const isSoft = i % 3 !== 2
    const blur = isSoft ? 8 + s8*14 : 2 + s8*4
    const isDeep = thickness > 60
    const isFoam = thickness < 28
    const color = isFoam
      ? "rgba(230,240,235,0.9)"
      : isDeep
        ? "rgba(" + (30+Math.floor(s4*20)) + "," + (55+Math.floor(s5*35)) + "," + (45+Math.floor(s6*30)) + ",0.9)"
        : "rgba(" + (70+Math.floor(s4*50)) + "," + (120+Math.floor(s5*50)) + "," + (100+Math.floor(s6*35)) + ",0.9)"
    const opacity = isFoam ? 0.42+s1*0.22 : isDeep ? 0.32+s1*0.18 : 0.35+s1*0.20
    const dur = 18 + s1*16
    return { id:i, x:xBase, thickness, w, isSoft, blur, dur, delay:-(s2*dur), opacity, color }
  })
  const foamBlobs = Array.from({ length: 10 }, (_, i) => {
    const s0=sd(i*71),s1=sd(i*73),s2=sd(i*79),s3=sd(i*83)
    return { id:i, cx:(28+s0*44)/100*W, cy:H*(0.2+s1*0.6), rx:12+s1*28, ry:6+s2*14, opacity:0.08+s3*0.12, dur:20+s0*14, delay:-(s1*20) }
  })
  const wp = (xPct, w, y0, y1) => {
    const px = xPct/100*W
    const q1=y0+(y1-y0)*0.33, mid=(y0+y1)/2, q3=y0+(y1-y0)*0.67
    return "M "+(px+w[0])+","+y0+" C "+(px+w[1])+","+q1+" "+(px+w[2])+","+mid+" "+(px+w[3])+","+mid+" S "+(px+w[4])+","+q3+" "+(px+w[5])+","+y1
  }
  return (
    <svg className="anim-svg" viewBox={"0 0 "+W+" "+H} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sgbg" cx="50%" cy="50%" r="45%">
          <stop offset="0%" stopColor="#1a2e20" />
          <stop offset="100%" stopColor="#080f0a" />
        </radialGradient>
        <radialGradient id="sgglow" cx="50%" cy="40%" r="38%">
          <stop offset="0%" stopColor="#3a7055" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#0a1f10" stopOpacity="0" />
        </radialGradient>
        {streams.map(s => (
          <filter key={s.id} id={"sgf"+s.id} x="-60%" y="-5%" width="220%" height="110%">
            <feGaussianBlur stdDeviation={s.blur} />
          </filter>
        ))}
        <filter id="sgblobf" x="-60%" y="-5%" width="220%" height="110%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect width={W} height={H} fill="url(#sgbg)" />
      <rect width={W} height={H} fill="url(#sgglow)" />
      {foamBlobs.map(b => (
        <ellipse key={b.id} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill="white" opacity={b.opacity} filter="url(#sgblobf)">
          <animateTransform attributeName="transform" type="translate" from={"0 "+(-H)} to={"0 "+H} dur={b.dur+"s"} begin={b.delay+"s"} repeatCount="indefinite" calcMode="linear" />
        </ellipse>
      ))}
      {streams.map(s => {
        const ps = wp(s.x,s.w,-H,0), pe = wp(s.x,s.w,0,H)
        return (
          <path key={s.id} fill="none" stroke={s.color} strokeWidth={s.thickness} strokeLinecap="round" opacity={s.opacity} filter={"url(#sgf"+s.id+")"} d={ps}>
            <animate attributeName="d" values={ps+";"+pe} dur={s.dur+"s"} begin={s.delay+"s"} repeatCount="indefinite" calcMode="linear" />
            <animate attributeName="opacity" values={"0;"+s.opacity+";"+s.opacity+";0"} keyTimes="0;0.04;0.94;1" dur={s.dur+"s"} begin={s.delay+"s"} repeatCount="indefinite" />
          </path>
        )
      })}
    </svg>
  )
}

// ══════════════════════════════════════════════
// BIRDS ANIMATION
// ══════════════════════════════════════════════
function BirdsAnimation() {
  const W = 400, H = 700
  const particles = [
    { id:0,  w:26, h:16, x:12,  y:18,  dur:34, delay:-8,  driftX:16, driftY:-12, opacity:0.38, color:"#8BBF4E", blur:8,  wobA:5, wobD:6  },
    { id:1,  w:38, h:24, x:68,  y:42,  dur:28, delay:-22, driftX:14, driftY:-9,  opacity:0.32, color:"#C5DC72", blur:12, wobA:7, wobD:8  },
    { id:2,  w:22, h:14, x:35,  y:72,  dur:42, delay:-5,  driftX:18, driftY:-14, opacity:0.42, color:"#8BBF4E", blur:6,  wobA:4, wobD:5  },
    { id:3,  w:44, h:27, x:82,  y:25,  dur:31, delay:-14, driftX:12, driftY:-8,  opacity:0.28, color:"#C5DC72", blur:16, wobA:8, wobD:9  },
    { id:4,  w:18, h:11, x:55,  y:58,  dur:38, delay:-28, driftX:20, driftY:-11, opacity:0.45, color:"#A8D45A", blur:5,  wobA:3, wobD:6  },
    { id:5,  w:32, h:20, x:22,  y:88,  dur:26, delay:-18, driftX:15, driftY:-16, opacity:0.35, color:"#8BBF4E", blur:10, wobA:6, wobD:7  },
    { id:6,  w:28, h:17, x:75,  y:78,  dur:45, delay:-3,  driftX:13, driftY:-10, opacity:0.40, color:"#C5DC72", blur:9,  wobA:5, wobD:8  },
    { id:7,  w:20, h:12, x:48,  y:32,  dur:30, delay:-35, driftX:17, driftY:-13, opacity:0.33, color:"#A8D45A", blur:7,  wobA:6, wobD:5  },
    { id:8,  w:36, h:22, x:8,   y:52,  dur:36, delay:-11, driftX:14, driftY:-8,  opacity:0.30, color:"#8BBF4E", blur:13, wobA:7, wobD:9  },
    { id:9,  w:24, h:15, x:91,  y:65,  dur:40, delay:-24, driftX:19, driftY:-15, opacity:0.43, color:"#C5DC72", blur:8,  wobA:4, wobD:6  },
    { id:10, w:42, h:26, x:30,  y:14,  dur:29, delay:-7,  driftX:11, driftY:-9,  opacity:0.27, color:"#A8D45A", blur:18, wobA:9, wobD:10 },
    { id:11, w:16, h:10, x:62,  y:95,  dur:44, delay:-19, driftX:16, driftY:-12, opacity:0.48, color:"#8BBF4E", blur:4,  wobA:3, wobD:5  },
    { id:12, w:30, h:19, x:44,  y:48,  dur:33, delay:-30, driftX:13, driftY:-10, opacity:0.36, color:"#C5DC72", blur:11, wobA:5, wobD:7  },
    { id:13, w:46, h:28, x:18,  y:35,  dur:27, delay:-16, driftX:15, driftY:-7,  opacity:0.25, color:"#A8D45A", blur:20, wobA:10,wobD:11 },
    { id:14, w:20, h:12, x:85,  y:88,  dur:39, delay:-9,  driftX:18, driftY:-13, opacity:0.41, color:"#8BBF4E", blur:6,  wobA:4, wobD:6  },
    { id:15, w:34, h:21, x:58,  y:12,  dur:32, delay:-26, driftX:12, driftY:-11, opacity:0.34, color:"#C5DC72", blur:14, wobA:6, wobD:8  },
  ]
  return (
    <svg className="anim-svg" viewBox={"0 0 " + W + " " + H} preserveAspectRatio="xMidYMid slice" style={{ background: "linear-gradient(160deg,#1e3510,#2a4a18)" }}>
      <defs>
        {particles.map(p => (
          <filter key={p.id} id={"bfil" + p.id} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={p.blur} />
          </filter>
        ))}
      </defs>
      {particles.map(p => (
        <ellipse key={p.id} cx={p.x / 100 * W} cy={p.y / 100 * H} rx={p.w} ry={p.h}
          fill={p.color} opacity={p.opacity} filter={"url(#bfil" + p.id + ")"}>
          <animateTransform attributeName="transform" type="translate"
            values={"0,0; " + p.driftX + "," + (-p.driftY) + "; " + (p.driftX*0.5) + "," + (-p.driftY*1.3)}
            dur={p.dur + "s"} begin={p.delay + "s"} repeatCount="indefinite"
            calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
          <animate attributeName="cy"
            values={(p.y/100*H) + ";" + (p.y/100*H - p.wobA) + ";" + (p.y/100*H) + ";" + (p.y/100*H + p.wobA*0.5) + ";" + (p.y/100*H)}
            dur={p.wobD + "s"} begin={p.delay + "s"} repeatCount="indefinite"
            calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" />
          <animate attributeName="opacity"
            values={p.opacity + ";" + (p.opacity*0.45) + ";" + p.opacity}
            dur={(p.wobD*1.8) + "s"} begin={p.delay + "s"} repeatCount="indefinite" />
        </ellipse>
      ))}
    </svg>
  )
}

// ══════════════════════════════════════════════
// WIND ANIMATION
// ══════════════════════════════════════════════
function WindAnimation() {
  const blobs = [
    { id:0,  w:90,  h:40,  x:15,  y:20,  dur:13, delay:-3,  op:0.42, color:"#8a6a3a", blur:32, dX:38,  dY:-28, sD:16, sMin:0.65, sMax:1.35 },
    { id:1,  w:110, h:50,  x:70,  y:55,  dur:15, delay:-9,  op:0.38, color:"#705030", blur:40, dX:-42, dY:32,  sD:18, sMin:0.58, sMax:1.28 },
    { id:2,  w:75,  h:38,  x:40,  y:80,  dur:11, delay:-6,  op:0.45, color:"#9a7848", blur:28, dX:30,  dY:-22, sD:14, sMin:0.70, sMax:1.40 },
    { id:3,  w:95,  h:42,  x:85,  y:30,  dur:14, delay:-12, op:0.36, color:"#604828", blur:36, dX:-35, dY:25,  sD:17, sMin:0.62, sMax:1.32 },
    { id:4,  w:80,  h:35,  x:25,  y:60,  dur:12, delay:-4,  op:0.40, color:"#8a6a3a", blur:30, dX:40,  dY:-30, sD:15, sMin:0.68, sMax:1.38 },
    { id:5,  w:100, h:45,  x:55,  y:10,  dur:16, delay:-8,  op:0.35, color:"#705030", blur:38, dX:-28, dY:20,  sD:19, sMin:0.60, sMax:1.25 },
    { id:6,  w:140, h:60,  x:30,  y:40,  dur:14, delay:-2,  op:0.30, color:"#f0e0c0", blur:22, dX:45,  dY:-35, sD:17, sMin:0.55, sMax:1.45 },
    { id:7,  w:120, h:55,  x:75,  y:70,  dur:13, delay:-11, op:0.28, color:"#e8d4a8", blur:26, dX:-38, dY:28,  sD:16, sMin:0.60, sMax:1.35 },
    { id:8,  w:160, h:70,  x:10,  y:85,  dur:15, delay:-7,  op:0.32, color:"#f8ead0", blur:20, dX:35,  dY:-25, sD:18, sMin:0.65, sMax:1.50 },
    { id:9,  w:130, h:58,  x:60,  y:25,  dur:12, delay:-14, op:0.26, color:"#ddc898", blur:24, dX:-42, dY:32,  sD:15, sMin:0.58, sMax:1.40 },
    { id:10, w:110, h:48,  x:45,  y:55,  dur:16, delay:-5,  op:0.34, color:"#f0e0c0", blur:28, dX:30,  dY:-20, sD:19, sMin:0.62, sMax:1.30 },
    { id:11, w:145, h:65,  x:88,  y:15,  dur:11, delay:-10, op:0.24, color:"#e8d4a8", blur:32, dX:-36, dY:26,  sD:14, sMin:0.55, sMax:1.55 },
    { id:12, w:125, h:56,  x:20,  y:72,  dur:14, delay:-3,  op:0.29, color:"#f8ead0", blur:25, dX:44,  dY:-34, sD:17, sMin:0.60, sMax:1.42 },
    { id:13, w:105, h:46,  x:65,  y:45,  dur:13, delay:-8,  op:0.31, color:"#ddc898", blur:29, dX:-32, dY:24,  sD:16, sMin:0.63, sMax:1.35 },
    { id:14, w:135, h:60,  x:35,  y:10,  dur:15, delay:-6,  op:0.27, color:"#f0e0c0", blur:22, dX:38,  dY:-28, sD:18, sMin:0.57, sMax:1.48 },
    { id:15, w:115, h:52,  x:80,  y:88,  dur:12, delay:-13, op:0.33, color:"#e8d4a8", blur:26, dX:-40, dY:30,  sD:15, sMin:0.65, sMax:1.32 },
  ]
  return (
    <svg className="anim-svg" viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" style={{ background: "linear-gradient(150deg,#e8d5b0,#d4c090)" }}>
      <defs>
        {blobs.map(b => (
          <filter key={b.id} id={"wfil" + b.id} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={b.blur} />
          </filter>
        ))}
      </defs>
      {blobs.map(b => {
        const cx = b.x / 100 * 400
        const cy = b.y / 100 * 700
        return (
          <ellipse key={b.id} cx={cx} cy={cy} rx={b.w} ry={b.h}
            fill={b.color} opacity={b.op} filter={"url(#wfil" + b.id + ")"}>
            <animate attributeName="cx" values={cx + ";" + (cx+b.dX*0.6) + ";" + (cx+b.dX) + ";" + (cx+b.dX*0.2) + ";" + cx} dur={b.dur + "s"} begin={b.delay + "s"} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" />
            <animate attributeName="cy" values={cy + ";" + (cy+b.dY) + ";" + (cy+b.dY*0.3) + ";" + (cy-b.dY*0.4) + ";" + cy} dur={b.dur + "s"} begin={b.delay + "s"} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" />
            <animate attributeName="rx" values={b.w + ";" + (b.w*b.sMax) + ";" + (b.w*b.sMin) + ";" + (b.w*1.1) + ";" + b.w} dur={b.sD + "s"} begin={b.delay + "s"} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" />
            <animate attributeName="opacity" values={b.op + ";" + (b.op*1.4) + ";" + (b.op*0.4) + ";" + (b.op*1.1) + ";" + b.op} dur={(b.dur*0.75) + "s"} begin={b.delay + "s"} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" />
          </ellipse>
        )
      })}
    </svg>
  )
}

// ══════════════════════════════════════════════
// RAIN ANIMATION
// ══════════════════════════════════════════════
function RainAnimation() {
  const W = 390, H = 844
  const sd = (n) => ((n * 9301 + 49297) % 233280) / 233280
  const streams = Array.from({ length: 16 }, (_, i) => {
    const s0=sd(i*7),s1=sd(i*13),s2=sd(i*17),s3=sd(i*23),s4=sd(i*31),s5=sd(i*37),s6=sd(i*41),s7=sd(i*43),s8=sd(i*47)
    const isBroken = i % 3 === 0
    const isSoft   = i % 4 === 1
    return {
      id: i, x: 3 + (i/15)*94,
      thickness: 7 + s0*10,
      isBroken, isSoft,
      blur: isSoft ? 3 + s8*4 : 0.5,
      seg1: 0.2 + s7*0.25, gap: 0.08 + s0*0.12,
      w: [-10+s1*20, -15+s2*30, -8+s3*16, -12+s4*24, -6+s5*12, -10+s6*20],
      dur: 13 + s1*12, delay: -(s2*18),
      opacity: isSoft ? 0.12 + s1*0.18 : 0.20 + s1*0.25,
      color: isSoft ? "rgba(200,220,238,0.9)" : "rgba(" + (155+Math.floor(s4*40)) + "," + (180+Math.floor(s5*35)) + "," + (210+Math.floor(s6*28)) + ",0.9)",
    }
  })
  const drops = Array.from({ length: 55 }, (_, i) => {
    const s=sd(i*53),s2=sd(i*59),s3=sd(i*61),s4=sd(i*67)
    return { id:i, x:s*100, y:2+s2*94, rx:1.5+s3*4.5, ry:2+s4*8, op:0.06+sd(i*71)*0.2 }
  })
  const wp = (xPct, w, y0, y1) => {
    const px = xPct/100*W
    const q1=y0+(y1-y0)*0.33, mid=(y0+y1)/2, q3=y0+(y1-y0)*0.67
    return "M " + (px+w[0]) + "," + y0 + " C " + (px+w[1]) + "," + q1 + " " + (px+w[2]) + "," + mid + " " + (px+w[3]) + "," + mid + " S " + (px+w[4]) + "," + q3 + " " + (px+w[5]) + "," + y1
  }
  return (
    <svg className="anim-svg" viewBox={"0 0 " + W + " " + H} preserveAspectRatio="xMidYMid slice" style={{ background: "linear-gradient(180deg,#4a5560,#363f48)" }}>
      <defs>
        {streams.filter(s => s.isSoft).map(s => (
          <filter key={s.id} id={"rsf" + s.id} x="-40%" y="-5%" width="180%" height="110%">
            <feGaussianBlur stdDeviation={s.blur} />
          </filter>
        ))}
        <filter id="rcrisp"><feGaussianBlur stdDeviation="0.5" /></filter>
        <filter id="rdrop"><feGaussianBlur stdDeviation="1" /></filter>
        <radialGradient id="rainGlow" cx="50%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#7a8898" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#363f48" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#rainGlow)" />
      {drops.map(d => <ellipse key={d.id} cx={d.x/100*W} cy={d.y/100*H} rx={d.rx} ry={d.ry} fill="rgba(190,215,235,0.65)" opacity={d.op} filter="url(#rdrop)" />)}
      {streams.map(s => {
        const fa = s.isSoft ? "url(#rsf" + s.id + ")" : "url(#rcrisp)"
        if (s.isBroken) {
          const p1s=wp(s.x,s.w,-H,-H+H*s.seg1), p1e=wp(s.x,s.w,0,H*s.seg1)
          const p2s=wp(s.x,s.w,-H+H*(s.seg1+s.gap),-H+H), p2e=wp(s.x,s.w,H*(s.seg1+s.gap),H)
          return (
            <g key={s.id}>
              <path fill="none" stroke={s.color} strokeWidth={s.thickness} strokeLinecap="round" opacity={s.opacity} filter={fa} d={p1s}>
                <animate attributeName="d" values={p1s + ";" + p1e} dur={s.dur + "s"} begin={s.delay + "s"} repeatCount="indefinite" calcMode="linear" />
                <animate attributeName="opacity" values={"0;" + s.opacity + ";" + s.opacity + ";0"} keyTimes="0;0.05;0.92;1" dur={s.dur + "s"} begin={s.delay + "s"} repeatCount="indefinite" />
              </path>
              <path fill="none" stroke={s.color} strokeWidth={s.thickness*0.7} strokeLinecap="round" opacity={s.opacity*0.75} filter={fa} d={p2s}>
                <animate attributeName="d" values={p2s + ";" + p2e} dur={s.dur + "s"} begin={s.delay + "s"} repeatCount="indefinite" calcMode="linear" />
                <animate attributeName="opacity" values={"0;" + (s.opacity*0.75) + ";" + (s.opacity*0.75) + ";0"} keyTimes="0;0.05;0.92;1" dur={s.dur + "s"} begin={s.delay + "s"} repeatCount="indefinite" />
              </path>
            </g>
          )
        }
        const ps=wp(s.x,s.w,-H,0), pe=wp(s.x,s.w,0,H)
        return (
          <path key={s.id} fill="none" stroke={s.color} strokeWidth={s.thickness} strokeLinecap="round" opacity={s.opacity} filter={fa} d={ps}>
            <animate attributeName="d" values={ps + ";" + pe} dur={s.dur + "s"} begin={s.delay + "s"} repeatCount="indefinite" calcMode="linear" />
            <animate attributeName="opacity" values={"0;" + s.opacity + ";" + s.opacity + ";0"} keyTimes="0;0.05;0.92;1" dur={s.dur + "s"} begin={s.delay + "s"} repeatCount="indefinite" />
          </path>
        )
      })}
    </svg>
  )
}


// ══════════════════════════════════════════════
// SILENCE ANIMATION — navy night sky with stars
// ══════════════════════════════════════════════
function SilenceAnimation() {
  const sd = (n) => ((n * 9301 + 49297) % 233280) / 233280
  const stars = Array.from({ length: 55 }, (_, i) => ({
    id: i, x: sd(i*17)*100, y: sd(i*31)*100,
    r: 0.8+sd(i*43)*2.2, dur: 3+sd(i*53)*6,
    delay: -(sd(i*61)*8), baseOp: 0.3+sd(i*71)*0.6, bright: i%7===0,
  }))
  return (
    <svg className="anim-svg" viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice"
      style={{ background: "linear-gradient(170deg,#0a0e2a,#111830,#080d20)" }}>
      <defs>
        <filter id="silGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="neb1" cx="30%" cy="25%" r="45%">
          <stop offset="0%" stopColor="#283278" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#283278" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="neb2" cx="75%" cy="60%" r="40%">
          <stop offset="0%" stopColor="#141e50" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#141e50" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="700" fill="url(#neb1)" />
      <rect width="400" height="700" fill="url(#neb2)" />
      {stars.filter(s => !s.bright).map(s => (
        <circle key={s.id} cx={s.x/100*400} cy={s.y/100*700} r={s.r} fill="rgba(200,215,255,0.9)">
          <animate attributeName="opacity"
            values={s.baseOp+";"+s.baseOp*0.15+";"+s.baseOp*0.7+";"+s.baseOp*0.3+";"+s.baseOp}
            dur={s.dur+"s"} begin={s.delay+"s"} repeatCount="indefinite"
            calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" />
          <animate attributeName="r"
            values={s.r+";"+s.r*1.3+";"+s.r*0.8+";"+s.r}
            dur={s.dur*1.2+"s"} begin={s.delay+"s"} repeatCount="indefinite"
            calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" />
        </circle>
      ))}
      {stars.filter(s => s.bright).map(s => (
        <circle key={s.id} cx={s.x/100*400} cy={s.y/100*700} r={s.r*1.8}
          fill="rgba(220,230,255,0.95)" filter="url(#silGlow)">
          <animate attributeName="opacity"
            values={s.baseOp+";"+s.baseOp*0.2+";"+s.baseOp*0.85+";"+s.baseOp*0.4+";"+s.baseOp}
            dur={s.dur*0.8+"s"} begin={s.delay+"s"} repeatCount="indefinite"
            calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1" />
        </circle>
      ))}
    </svg>
  )
}

// ══════════════════════════════════════════════
// PIANO ANIMATION — notes drifting left to right
// ══════════════════════════════════════════════
function PianoAnimation() {
  const sd = (n) => ((n * 9301 + 49297) % 233280) / 233280
  const W = 390, H = 700
  const notes = Array.from({ length: 12 }, (_, i) => {
    const scale  = 0.6 + sd(i*37)*0.75
    const startY = 20 + sd(i*23)*60
    const midYOff = -5 + sd(i*29)*10
    const endYOff = -(10 + sd(i*41)*20)
    const dur    = 30 + sd(i*47)*25
    const delay  = -(sd(i*53)*45)
    const tilt   = -25 + sd(i*59)*18
    const style  = i % 3
    const opacity = 0.18 + sd(i*89)*0.22
    const color  = sd(i*97) > 0.5
      ? "rgba(200,155,255,"+opacity+")"
      : "rgba(170,115,255,"+opacity+")"
    return { id:i, scale, startY, midYOff, endYOff, dur, delay, tilt, style, color, opacity }
  })

  return (
    <svg className="anim-svg" viewBox={"0 0 "+W+" "+H} preserveAspectRatio="xMidYMid slice"
      style={{ background: "linear-gradient(160deg,#1a0a2e,#120820,#0e0618)" }}>
      <defs>
        <filter id="pGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="purp1" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#501480" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#501480" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#purp1)" />
      {notes.map(n => {
        const sy = n.startY/100*H
        const my = sy + n.midYOff/100*H
        const ey = sy + n.endYOff/100*H
        const hRx = 7*n.scale, hRy = 5*n.scale, stemH = 26*n.scale
        const sx = n.tilt > 0 ? hRx*0.7 : hRx*0.7
        const flagD = "M "+sx+","+-stemH+" C "+(sx+11*n.scale)+","+-( stemH-5*n.scale)+" "+(sx+9*n.scale)+","+-( stemH-13*n.scale)+" "+sx+","+-( stemH-17*n.scale)
        return (
          <g key={n.id} filter="url(#pGlow)">
            <g transform={"rotate("+n.tilt+")"}>
              <animateTransform attributeName="transform" type="translate"
                values={(-45)+","+sy+"; "+(W*0.4)+","+(sy+my)*0.5+"; "+(W*0.5)+","+my+"; "+(W*1.6)+","+(my+ey)*0.5+"; "+(W+45)+","+ey}
                dur={n.dur+"s"} begin={n.delay+"s"} repeatCount="indefinite"
                calcMode="spline" keySplines="0.25 0 0.75 1;0.35 0 0.65 1;0.3 0 0.7 1;0.4 0 0.6 1"
                additive="replace" />
              <animate attributeName="opacity"
                values={"0;"+n.opacity+";"+n.opacity+";"+(n.opacity*0.5)+";0"}
                keyTimes="0;0.1;0.75;0.9;1"
                dur={n.dur+"s"} begin={n.delay+"s"} repeatCount="indefinite" />
              <ellipse cx="0" cy="0" rx={hRx} ry={hRy} fill={n.color} />
              <line x1={hRx*0.7} y1={-hRy*0.3} x2={hRx*0.7} y2={-stemH}
                stroke={n.color} strokeWidth={1.8*n.scale} strokeLinecap="round" />
              {n.style === 1 && <path d={flagD} fill="none" stroke={n.color} strokeWidth={1.8*n.scale} strokeLinecap="round" />}
              {n.style === 2 && <>
                <path d={flagD} fill="none" stroke={n.color} strokeWidth={1.8*n.scale} strokeLinecap="round" />
                <path d={"M "+sx+","+(-(stemH-8*n.scale))+" C "+(sx+11*n.scale)+","+(-(stemH-13*n.scale))+" "+(sx+9*n.scale)+","+(-(stemH-21*n.scale))+" "+sx+","+(-(stemH-25*n.scale))}
                  fill="none" stroke={n.color} strokeWidth={1.8*n.scale} strokeLinecap="round" />
              </>}
            </g>
          </g>
        )
      })}
    </svg>
  )
}

// ══════════════════════════════════════════════
// MAIN MEDITATE TAB
// ══════════════════════════════════════════════
export default function MeditateTab({ meditations, setMeditations, refreshQuote, audio, logActivity, onNavigate, onDimChange }) {
  const [medDur, setMedDurRaw] = useState(() => LS.get(KEYS.MED_DUR, 5))
  const [medSnd, setMedSndRaw] = useState(() => LS.get(KEYS.MED_SND, 'silence'))
  const [chime,  setChimeRaw]  = useState(() => LS.get(KEYS.CHIME, true))
  const [phase,  setPhase]     = useState('setup')
  const [paused, setPaused]    = useState(false)
  const [timeLeft,  setTimeLeft]  = useState(0)
  const [totalSecs, setTotalSecs] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [dimmed, setDimmed]    = useState(false)  // screen dim overlay
  const [medDurDone, setMedDurDone] = useState(0)    // duration of completed session

  useEffect(() => { if (onDimChange) onDimChange(dimmed) }, [dimmed])

  const timerRef      = useRef(null)
  const startRef      = useRef(null)
  const elapsedRef    = useRef(0)
  const wakeLockRef   = useRef(null)
  const silentAudioRef = useRef(null)
  const dimTimerRef   = useRef(null)

  const setMedDur = v => { setMedDurRaw(v); LS.set(KEYS.MED_DUR, v) }
  const setMedSnd = v => { setMedSndRaw(v); LS.set(KEYS.MED_SND, v) }
  const [favSounds, setFavSoundsRaw] = useState(() => LS.get('med-favourites', []))
  const [testingSound, setTestingSound] = useState(null)

  // Preload audio files in background when on setup screen
  useEffect(() => {
    if (phase === 'setup') {
      audio.preload(medSnd).catch(() => {})
    }
  }, [phase, medSnd])
  const setFavSounds = v => { setFavSoundsRaw(v); LS.set('med-favourites', v) }
  const handleTest = (e, key) => {
    e.stopPropagation()
    if (testingSound === key) {
      audio.stopBackground()
      setTestingSound(null)
    } else {
      audio.stopBackground()
      audio.unlock()
      if (key !== 'silence') audio.startBackground(key)
      setTestingSound(key)
    }
  }

  const toggleFav = (key) => {
    setFavSounds(favSounds.includes(key)
      ? favSounds.filter(k => k !== key)
      : [...favSounds, key]
    )
  }
  const setChime  = v => { setChimeRaw(v);  LS.set(KEYS.CHIME, v) }

  // ── Compute displayed stats using base+increment system ──
  // Migration: remove any med-overrides that have a setAt cutoff
  // which was causing real sessions to be filtered out
  useEffect(() => {
    const overrides = LS.get('med-overrides', {})
    if (overrides.setAt) {
      LS.remove('med-overrides')
    }
  }, [])

  // Count all meditations directly — no cutoff filtering
  const earnedMins     = meditations.reduce((s, m) => s + (m.duration || 0), 0)
  const earnedSessions = meditations.length

  const medStreak = (() => {
    const days = [...new Set(meditations.map(m => new Date(m.timestamp).toDateString()))]
      .sort((a, b) => new Date(b) - new Date(a))
    if (!days.length) return 0
    const todayStr = new Date().toDateString()
    const yest = new Date(); yest.setDate(yest.getDate() - 1)
    const yesterdayStr = yest.toDateString()
    if (days[0] !== todayStr && days[0] !== yesterdayStr) return 0
    let s = 0
    for (let i = 0; i < days.length; i++) {
      const exp = new Date()
      if (days[0] === yesterdayStr) exp.setDate(exp.getDate() - 1 - i)
      else exp.setDate(exp.getDate() - i)
      if (exp.toDateString() === days[i]) s++; else break
    }
    return s
  })()

  const totalMins     = earnedMins
  const totalSessions = earnedSessions

  // ── Silent audio keepalive ────────────────────
  const startSilentAudio = () => {
    if (!silentAudioRef.current) {
      const el = new Audio()
      el.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgCenp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6e////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
      el.loop = true
      el.volume = 0.001
      // Restart if interrupted by iOS audio session
      el.addEventListener('pause', () => { setTimeout(() => { if (silentAudioRef.current) silentAudioRef.current.play().catch(() => {}) }, 500) })
      silentAudioRef.current = el
    }
    silentAudioRef.current.play().catch(() => {})
  }

  const stopSilentAudio = () => {
    if (silentAudioRef.current) silentAudioRef.current.pause()
  }

  // ── Wake Lock ─────────────────────────────────
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator)
        wakeLockRef.current = await navigator.wakeLock.request('screen')
    } catch {}
  }

  const releaseWakeLock = () => {
    if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null }
  }

  // ── Media Session ─────────────────────────────
  const setupMediaSession = (durationMins) => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${durationMins} Minute Meditation`,
      artist: 'The Most Important Hour',
    })
    navigator.mediaSession.playbackState = 'playing'
  }

  const clearMediaSession = () => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none'
  }

  // ── Dim timer — dims after 60s, tap to restore ──
  const startDimTimer = () => {
    clearTimeout(dimTimerRef.current)
    setDimmed(false)
    dimTimerRef.current = setTimeout(() => setDimmed(true), 60000)
  }

  const handleScreenTap = () => {
    if (dimmed) {
      setDimmed(false)
      startDimTimer()
    }
  }

  // ── Timer tick ────────────────────────────────
  useEffect(() => {
    if (phase !== 'active' || paused) return
    startRef.current = Date.now() - elapsedRef.current * 1000
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000)
      const rem = totalSecs - elapsed
      if (rem <= 0) { clearInterval(timerRef.current); setTimeLeft(0); handleNaturalEnd() }
      else setTimeLeft(rem)
    }, 500)
    return () => clearInterval(timerRef.current)
  }, [phase, paused]) // eslint-disable-line

  // ── Reacquire Wake Lock when screen comes back ──
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && phase === 'active' && !paused) {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [phase, paused])

  // ── Begin ─────────────────────────────────────
  const begin = () => {
    if (testingSound) { audio.stopBackground(); setTestingSound(null) }
    const secs = medDur * 60
    setTotalSecs(secs); setTimeLeft(secs)
    elapsedRef.current = 0; setPaused(false)
    // Audio must be started synchronously in the gesture handler
    audio.unlock()
    if (medSnd !== 'silence') audio.startBackground(medSnd)
    if (chime) audio.playChime()
    // Non-audio setup
    setPhase('active')
    startSilentAudio()
    requestWakeLock()
    setupMediaSession(medDur)
    startDimTimer()
  }

  const togglePause = () => {
    if (!paused) {
      clearInterval(timerRef.current)
      elapsedRef.current = totalSecs - timeLeft
      setPaused(true)
      setDimmed(false)
      clearTimeout(dimTimerRef.current)
      audio.stopBackground()
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
    } else {
      setPaused(false)
      startDimTimer()
      audio.unlock()
      if (medSnd !== 'silence') audio.startBackground(medSnd)
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
    }
  }

  const finish = () => {
    clearInterval(timerRef.current)
    clearTimeout(dimTimerRef.current)
    setDimmed(false)
    audio.stopBackground()
    stopSilentAudio()
    releaseWakeLock()
    clearMediaSession()
    setMedDurDone(medDur)
    logSession()
    setPhase('done')
  }

  const discard = () => {
    clearInterval(timerRef.current)
    clearTimeout(dimTimerRef.current)
    setDimmed(false)
    audio.stopBackground()
    stopSilentAudio()
    releaseWakeLock()
    clearMediaSession()
    setPhase('setup'); setPaused(false); setTimeLeft(0)
  }

  const handleNaturalEnd = async () => {
    clearTimeout(dimTimerRef.current)
    setDimmed(false)  // lift dim so completion screen is visible
    audio.stopBackground()
    if (chime) audio.playChime()
    stopSilentAudio()
    releaseWakeLock()
    clearMediaSession()
    setMedDurDone(medDur)
    logSession()
    setPhase('done')
  }

  const logSession = () => {
    setMeditations([{ id: uid(), timestamp: new Date().toISOString(), duration: medDur }, ...meditations])
    refreshQuote()
  }

  const fmtMed = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const progress = totalSecs > 0 ? Math.max(0, 1 - timeLeft / totalSecs) : 0
  const CIRC = 2 * Math.PI * 80

  const isWaves   = ['ocean-waves', 'beach-waves'].includes(medSnd)
  const isStream  = medSnd === 'stream'
  const isStreamG = medSnd === 'stream-gentle'
  const isFire    = ['soothing-fire', 'bonfire'].includes(medSnd)
  const isBirds   = medSnd === 'birds-morning-breeze'
  const isWind    = medSnd === 'gentle-wind'
  const isRain    = medSnd === 'rain'
  const isPiano   = medSnd === 'piano'
  const isSilence = medSnd === 'silence'
  const timerCol = isWaves ? 'rgba(0,60,180,0.82)'    : isFire ? 'rgba(120,45,0,0.88)'   : 'rgba(255,255,255,0.9)'
  const ringCol  = isWaves ? 'rgba(0,80,200,0.35)'    : isFire ? 'rgba(130,50,0,0.35)'   : 'rgba(255,255,255,0.35)'
  const btnBg    = isWaves ? 'rgba(255,255,255,0.42)' : isFire ? 'rgba(255,220,80,0.38)' : 'rgba(255,255,255,0.1)'
  const btnCol   = isWaves ? 'rgba(0,60,180,0.82)'    : isFire ? 'rgba(120,45,0,0.88)'   : 'rgba(255,255,255,0.88)'
  const btnBorder= isWaves ? 'rgba(0,80,200,0.25)'    : isFire ? 'rgba(130,50,0,0.25)'   : 'rgba(255,255,255,0.3)'

  // ── Settings ──────────────────────────────────
  if (showSettings) return (
    <MeditationSettings
      meditations={meditations}
      setMeditations={setMeditations}
      onClose={() => setShowSettings(false)}
      medStreak={medStreak}
      totalMins={totalMins}
      totalSessions={totalSessions}
    />
  )

  // ── Active screen ─────────────────────────────
  if (phase === 'active') {
    const bgClass = isFire ? 'med-bg-fire' : isWaves ? 'med-bg-waves' : isStream || isStreamG ? 'med-bg-waves' : isBirds ? 'med-bg-birds' : isWind ? 'med-bg-wind' : isRain ? 'med-bg-rain' : isPiano ? 'med-bg-piano' : isSilence ? 'med-bg-silence' : 'med-bg-silent'
    return (
      <div className={`med-fullscreen ${bgClass}`} onClick={handleScreenTap}>
        {isFire    && <FireAnimation />}
        {isWaves   && <WavesAnimation />}
        {isBirds   && <BirdsAnimation />}
        {isWind    && <WindAnimation />}
        {isRain    && <RainAnimation />}
        {isStream  && <StreamAnimation />}
        {isStreamG && <StreamGentleAnimation />}
        {isPiano   && <PianoAnimation />}
        {isSilence && <SilenceAnimation />}

        {/* 90% dim overlay — fades in after 60s, tap anywhere to lift */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          background: 'rgba(0,0,0,0.8)',
          opacity: dimmed ? 1 : 0,
          transition: 'opacity 3s ease',
          pointerEvents: dimmed ? 'auto' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Faint timer still visible through dim */}
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem,12vw,4rem)',
            fontWeight: 300, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.1em',
          }}>
            {fmtMed(timeLeft)}
          </div>
        </div>

        <div className="med-content" style={{ zIndex: 2 }}>
          <div className="breath-ring-wrap">
            <svg className="breath-ring-svg" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="80" fill="none" stroke={ringCol} strokeWidth="4" opacity="0.4" />
              <circle cx="90" cy="90" r="80" fill="none"
                stroke={ringCol} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC - CIRC * progress}
                style={{ transform:'rotate(-90deg)', transformOrigin:'90px 90px', transition:'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="med-timer" style={{ color: timerCol }}>{fmtMed(timeLeft)}</div>
          </div>
          <div className="med-controls">
            {!paused ? (
              <button className="med-btn"
                style={{ background: btnBg, borderColor: btnBorder, color: btnCol }}
                onClick={e => { e.stopPropagation(); togglePause() }}>Pause</button>
            ) : (
              <>
                <button className="med-btn" style={{ background: btnBg, borderColor: btnBorder, color: btnCol }} onClick={e => { e.stopPropagation(); togglePause() }}>Resume</button>
                <button className="med-btn" style={{ background: btnBg, borderColor: btnBorder, color: btnCol }} onClick={e => { e.stopPropagation(); finish() }}>Finish</button>
                <button className="med-btn" style={{ background:'rgba(200,0,0,0.08)', borderColor:'rgba(200,0,0,0.2)', color:'rgba(160,0,0,0.7)' }} onClick={e => { e.stopPropagation(); discard() }}>Discard</button>
                {/* Sound switcher while paused */}
                <div className="pause-sound-list" onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize:'0.6rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', marginBottom:'0.5rem', textAlign:'center' }}>Change Sound</div>
                  {(() => {
                    const favList = SOUNDS.filter(s => favSounds.includes(s.key))
                    const restList = SOUNDS.filter(s => !favSounds.includes(s.key))
                    const ordered = favList.length > 0 ? [...favList, { key: '__divider__' }, ...restList] : restList
                    return ordered.map(s => {
                      if (s.key === '__divider__') return (
                        <div key="divider" style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '0.2rem 0' }} />
                      )
                      return (
                        <button key={s.key}
                          className={`sound-row pause-sound-row${medSnd === s.key ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); setMedSnd(s.key); audio.stopBackground() }}>
                          <div className={`sound-radio${medSnd === s.key ? ' active' : ''}`} />
                          <span className="sound-label">{s.label}</span>
                          <button className="sound-fav-btn" onClick={e2 => { e2.stopPropagation(); toggleFav(s.key) }}
                            style={{ marginLeft: 'auto' }}>
                            <svg viewBox="0 0 24 24" width="14" height="14"
                              fill={favSounds.includes(s.key) ? 'rgba(255,255,255,0.9)' : 'none'}
                              stroke={favSounds.includes(s.key) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'}
                              strokeWidth="1.8">
                              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                            </svg>
                          </button>
                        </button>
                      )
                    })
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Done screen ───────────────────────────────
  if (phase === 'done') return createPortal(
    <div className="med-completion">
      <div className="completion-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" width="48" height="48">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      </div>
      <div className="completion-title">Well done</div>
      <div className="completion-sub">{medDurDone} minute meditation complete</div>
      <div className="completion-streak">Day streak: {medStreak}</div>
    </div>,
    document.body
  )

  // ── Setup screen — fully scrollable, no overlap possible ──
  return (
    <div className="tab-screen">
      <div className="med-setup-scroll">

        {/* Header with settings gear */}
        <div className="med-setup-header">
          <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="dreams-eyebrow">Your Daily</div>
              <div className="med-app-title">Meditation</div>
            </div>
            <button onClick={() => setShowSettings(true)} style={{
              position: 'absolute', right: 0, top: 0,
              background: 'none', border: 'none',
              cursor: 'pointer', padding: 4,
              opacity: 0.45,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2.2" width="20" height="20">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
          <div className="dreams-rule" style={{ margin: '0.3rem auto 0.15rem' }} />
          <div className="dreams-sub" style={{ textAlign: 'center' }}>Find your calm · Breathe · Be still</div>

          {/* Stats — clearly separated with generous margin */}
          <div className="med-stats-row" style={{ marginTop: '1.25rem' }}>
            <div className="med-stat-block">
              <div className="med-stat-num">{medStreak}</div>
              <div className="med-stat-label">Day streak</div>
            </div>
            <div className="med-stat-div" />
            <div className="med-stat-block">
              <div className="med-stat-num">{totalMins}</div>
              <div className="med-stat-label">Total mins</div>
            </div>
            <div className="med-stat-div" />
            <div className="med-stat-block">
              <div className="med-stat-num">{totalSessions}</div>
              <div className="med-stat-label">Sessions</div>
            </div>
          </div>
        </div>

        {/* Begin button and controls */}
        <div className="med-centre">
          <button className="begin-btn" onClick={begin}>
            Begin<br />{medDur} min
          </button>

          <div className="selector">
            <div className="selector-label">Duration</div>
            <div className="pill-row">
              {[2, 5, 10, 15].map(d => (
                <button key={d} className={`pill${medDur === d ? ' active' : ''}`}
                  onClick={() => setMedDur(d)}>{d}m</button>
              ))}
            </div>
          </div>

          <div className="selector">
            <div className="selector-label">Chime</div>
            <div className="pill-row">
              <button className={`pill${chime  ? ' active' : ''}`} onClick={() => setChime(true)}>On</button>
              <button className={`pill${!chime ? ' active' : ''}`} onClick={() => setChime(false)}>Off</button>
            </div>
          </div>

          {/* Sound list — scrollable rows with favourites pinned */}
          <div className="selector">
            <div className="selector-label">Sound</div>
            <div className="sound-list">
              {(() => {
                const favList = SOUNDS.filter(s => favSounds.includes(s.key))
                const restList = SOUNDS.filter(s => !favSounds.includes(s.key))
                const ordered = favList.length > 0
                  ? [...favList, { key: '__divider__' }, ...restList]
                  : restList
                return ordered.map(s => {
                  if (s.key === '__divider__') return (
                    <div key="divider" style={{ height: 1, background: 'var(--border)', margin: '0.2rem 0.5rem' }} />
                  )
                  const isFav = favSounds.includes(s.key)
                  return (
                    <button key={s.key} className={`sound-row${medSnd === s.key ? ' active' : ''}`}
                      onClick={() => setMedSnd(s.key)}>
                      <div className={`sound-radio${medSnd === s.key ? ' active' : ''}`} />
                      <span className="sound-label">{s.label}</span>
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.1rem', flexShrink: 0 }}>
                        {s.key !== 'silence' && (
                          <button className="sound-test-btn" onClick={e => handleTest(e, s.key)}>
                            {testingSound === s.key ? '■' : 'Test'}
                          </button>
                        )}
                        <button className="sound-fav-btn" onClick={e => { e.stopPropagation(); toggleFav(s.key) }}
                        aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}>
                        <svg viewBox="0 0 24 24" width="16" height="16"
                          fill={isFav ? 'var(--accent)' : 'none'}
                          stroke={isFav ? 'var(--accent)' : 'var(--text-lo)'}
                          strokeWidth="1.8" opacity={isFav ? 1 : 0.4}>
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                        </svg>
                      </button>
                      </span>
                    </button>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
