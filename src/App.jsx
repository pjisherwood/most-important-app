import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { LS, KEYS } from './hooks/useStorage.js'
import { loadPhotos } from './hooks/usePhoto.js'
import { useAudio } from './hooks/useAudio.js'
import { isToday, dayKey, calcStreak, getRandomQuote, uid } from './hooks/utils.js'
import { THEMES, FONT_SIZES, THEME_OVERRIDE_KEY, DEFAULT_DREAM_CATS } from './constants/index.js'
import { GOLD_FOIL_DATA_URI } from './assets/goldFoil.js'

import HomeTab       from './components/Home/HomeTab.jsx'
import MeditateTab   from './components/Meditate/MeditateTab.jsx'
import NotesTab      from './components/Notes/NotesTab.jsx'
import DreamsTab     from './components/Dreams/DreamsTab.jsx'
import HistoryTab    from './components/History/HistoryTab.jsx'
import SettingsSheet from './components/Settings/SettingsSheet.jsx'
import PrivacyWelcome from './components/shared/PrivacyWelcome.jsx'
import DailyWelcome from './components/shared/DailyWelcome.jsx'

export default function App() {
  const rootRef = useRef(null)
  const audio   = useAudio()

  const [activeTab,    setActiveTab]    = useState('home')
  const [homeScreen,   setHomeScreen]   = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [medResetKey,  setMedResetKey]  = useState(0)
  const [medDimmed,    setMedDimmed]    = useState(false)
  const [notesEditing, setNotesEditing] = useState(false)
  const [photoVersion, setPhotoVersion] = useState(0)
  const [privacySeen, setPrivacySeen] = useState(() => !!localStorage.getItem('mih-privacy-seen'))

  // Show welcome on every app open, and once per calendar day
  const [showWelcome, setShowWelcome] = useState(() => {
    const lastSeen = localStorage.getItem('mih-welcome-date')
    const today = new Date().toDateString()
    return lastSeen !== today
  })
  const handleWelcomeDismiss = () => {
    localStorage.setItem('mih-welcome-date', new Date().toDateString())
    setShowWelcome(false)
  }

  const handleNavTab = (key) => {
    if (key === 'meditate' && activeTab === 'meditate') {
      setMedResetKey(k => k + 1)  // signals MeditateTab to reset to setup
    }
    setActiveTab(key)
    if (key === 'home') setHomeScreen(null)
  }

  // ── Persisted state ──────────────────────────
  const [nowItems,     setNowItemsRaw]     = useState(() => LS.get(KEYS.NOW,   []))
  const [justItems,    setJustItemsRaw]    = useState(() => LS.get(KEYS.JUST,  []))
  const [wouldItems,   setWouldItemsRaw]   = useState(() => LS.get(KEYS.WOULD, []))
  const [ciSessions,   setCiSessionsRaw]   = useState(() => LS.get(KEYS.SESSIONS, []))
  const [todayEntries, setTodayEntriesRaw] = useState(() => LS.get(KEYS.TODAY, []))
  const [inspEntries,  setInspEntriesRaw]  = useState(() => LS.get(KEYS.INSP,  []))
  const [planEntries,       setPlanEntriesRaw]       = useState(() => LS.get(KEYS.PLAN,       []))
  const [highlightEntries, setHighlightEntriesRaw]   = useState(() => LS.get(KEYS.HIGHLIGHTS, []))
  const [physicalEntries,  setPhysicalEntriesRaw]    = useState(() => LS.get(KEYS.PHYSICAL,   []))
  const [activityLog,      setActivityLogRaw]        = useState(() => LS.get(KEYS.ACTIVITY, []))
  const [meditations,  setMeditationsRaw]  = useState(() => LS.get(KEYS.MEDITATIONS, []))
  const [notes,        setNotesRaw]        = useState(() => {
    const v4 = LS.get(KEYS.NOTES, [])
    if (v4.length) return v4
    const old = LS.get(KEYS.NOTES_OLD, [])
    return old.map(n => ({ ...n, title: n.title || 'Note', body: n.text || n.data || '', formatting: {} }))
  })
  const [noteFolders,  setNoteFoldersRaw]  = useState(() => {
    const saved = LS.get(KEYS.FOLDERS, null)
    if (saved !== null) return saved
    return [
      { id: 'folder-journal', name: 'Journal',             color: '#6B96D6', timestamp: new Date().toISOString() },
      { id: 'folder-ideas',   name: 'Ideas & Inspiration', color: '#b06ad4', timestamp: new Date().toISOString() },
    ]
  })
  const [dreams,    setDreamsRaw]    = useState(() => LS.get(KEYS.DREAMS, []))
  const [dreamCats, setDreamCatsRaw] = useState(() => LS.get(KEYS.DREAM_CATS, DEFAULT_DREAM_CATS))

  // Persist wrappers
  const setNowItems     = v => { setNowItemsRaw(v);     LS.set(KEYS.NOW,         v) }
  const setJustItems    = v => { setJustItemsRaw(v);    LS.set(KEYS.JUST,        v) }
  const setWouldItems   = v => { setWouldItemsRaw(v);   LS.set(KEYS.WOULD,       v) }
  const setCiSessions   = v => { setCiSessionsRaw(v);   LS.set(KEYS.SESSIONS,    v) }
  const setTodayEntries = v => { setTodayEntriesRaw(v); LS.set(KEYS.TODAY,       v) }
  const setInspEntries  = v => { setInspEntriesRaw(v);  LS.set(KEYS.INSP,        v) }
  const setPlanEntries      = v => { setPlanEntriesRaw(v);      LS.set(KEYS.PLAN,       v) }
  const setHighlightEntries = v => { setHighlightEntriesRaw(v); LS.set(KEYS.HIGHLIGHTS, v) }
  const setPhysicalEntries  = v => { setPhysicalEntriesRaw(v);  LS.set(KEYS.PHYSICAL,   v) }
  const setActivityLog      = v => { setActivityLogRaw(v);      LS.set(KEYS.ACTIVITY,   v) }
  const setMeditations  = v => { setMeditationsRaw(v);  LS.set(KEYS.MEDITATIONS, v) }
  const setNotes        = v => { setNotesRaw(v);        LS.set(KEYS.NOTES,       v) }
  const setNoteFolders  = v => { setNoteFoldersRaw(v);  LS.set(KEYS.FOLDERS,     v) }
  const setDreams       = v => { setDreamsRaw(v);       LS.set(KEYS.DREAMS,      v) }
  const setDreamCats    = v => { setDreamCatsRaw(v);    LS.set(KEYS.DREAM_CATS,  v) }

  // ── Theme ────────────────────────────────────
  const [themeKey,    setThemeKeyRaw]    = useState(() => LS.get(KEYS.THEME, 'vivid'))
  const [fontSizeKey, setFontSizeKeyRaw] = useState(() => LS.get(KEYS.FONT_SIZE, 'small'))

  const applyTheme = useCallback((key, overrideColours) => {
    const t = THEMES[key]
    if (!t) return
    const root = document.documentElement
    Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v))
    document.documentElement.setAttribute('data-theme', key)
    const saved = overrideColours || LS.get(THEME_OVERRIDE_KEY(key), {})
    const SLOTS = [
      ['header',     '--now',            '--now-dk',            '--accent'],
      ['enjoy',      '--btn-enjoy',      '--btn-enjoy-dk',      null],
      ['plan',       '--btn-plan',       '--btn-plan-dk',       null],
      ['achieve',    '--btn-achieve',    '--btn-achieve-dk',    null],
      ['highlights', '--btn-highlights', '--btn-highlights-dk', null],
      ['physical',   '--btn-physical',   '--btn-physical-dk',   null],
    ]
    SLOTS.forEach(([slot, varMain, varDk, varExtra]) => {
      if (saved[slot]) {
        root.style.setProperty(varMain, saved[slot])
        const hex = saved[slot].replace('#','')
        const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16)
        const dk = '#' + [r,g,b].map(c => Math.max(0,Math.round(c*0.72)).toString(16).padStart(2,'0')).join('')
        root.style.setProperty(varDk, dk)
        if (varExtra) root.style.setProperty(varExtra, saved[slot])
      }
    })
    const td = saved.textDark || {}
    ;['enjoy','plan','achieve','highlights','physical'].forEach((s,i) => {
      const vars = ['--btn-enjoy-text','--btn-plan-text','--btn-achieve-text','--btn-highlights-text','--btn-physical-text']
      root.style.setProperty(vars[i], td[s] ? '#1a1a1a' : '#ffffff')
    })

    // ── Per-button fill style (flat colour vs gold foil texture) + outline ──
    const fill    = saved.fill    || {}
    const outline = saved.outline || {}
    ;['enjoy','plan','achieve','highlights','physical'].forEach((s) => {
      const imageVar  = `--btn-${s}-image`
      const tintVar   = `--btn-${s}-tint`
      const borderVar = `--btn-${s}-border-w`
      const isGold = fill[s] === 'gold'
      if (isGold) {
        const baseColour = saved[s] || t.vars[`--btn-${s}`] || '#A88030'
        const hex = baseColour.replace('#','')
        const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16)
        root.style.setProperty(imageVar, `url("${GOLD_FOIL_DATA_URI}")`)
        root.style.setProperty(tintVar, `rgba(${r},${g},${b},0.32)`)
      } else {
        root.style.setProperty(imageVar, 'none')
        root.style.setProperty(tintVar, 'transparent')
      }
      root.style.setProperty(borderVar, outline[s] ? '1.5px' : '0px')
    })
  }, [])

  useEffect(() => { applyTheme(themeKey) }, [themeKey, applyTheme])

  useEffect(() => {
    const fs = FONT_SIZES.find(f => f.key === fontSizeKey)
    if (fs) document.documentElement.style.fontSize = fs.px
  }, [fontSizeKey])

  const setThemeKey = (key, overrideColours) => { setThemeKeyRaw(key); LS.set(KEYS.THEME, key); applyTheme(key, overrideColours) }
  const setFontSizeKey = (key) => { setFontSizeKeyRaw(key); LS.set(KEYS.FONT_SIZE, key) }

  // ── Activity log ─────────────────────────────
  const logActivity = useCallback((type, label, sessionId) => {
    const entry = { id: uid(), ts: new Date().toISOString(), type, label, sessionId: sessionId || null }
    setActivityLog(prev => {
      const updated = [entry, ...prev]
      LS.set(KEYS.ACTIVITY, updated)
      return updated
    })
  }, [])

  // ── Quote ─────────────────────────────────────
  const [quote,    setQuote]    = useState(getRandomQuote)
  const [quoteKey, setQuoteKey] = useState(0)
  const refreshQuote = useCallback(() => {
    setQuote(getRandomQuote()); setQuoteKey(k => k + 1)
  }, [])

  // ── Derived stats ─────────────────────────────
  // grandTotal = everything good done today across ALL activity types
  const grandTotal = useMemo(() => {
    const todayNow    = nowItems.filter(i => isToday(i.ts)).length
    const todayJust   = justItems.filter(i => isToday(i.ts)).length
    const todayWould  = wouldItems.filter(i => isToday(i.ts)).length
    const todayFree   = todayEntries.filter(i => isToday(i.ts)).length
    const todayInsp   = inspEntries.filter(i => isToday(i.ts)).length
    const todayPlan   = planEntries.filter(i => isToday(i.ts)).length
    const todayHigh   = highlightEntries.filter(i => isToday(i.ts)).length
    const todayMed    = meditations.filter(m => isToday(m.timestamp)).length
    // Notes and dreams from activity log
    const todayAct    = activityLog.filter(e => isToday(e.ts) && (e.type === 'note' || e.type === 'dream')).length
    return todayNow + todayJust + todayWould + todayFree + todayInsp + todayPlan + todayHigh + todayMed + todayAct
  }, [nowItems, justItems, wouldItems, todayEntries, inspEntries, planEntries, highlightEntries, physicalEntries, meditations, activityLog])

  // allTimeTotal = everything across all time
  const allTimeTotal = useMemo(() => {
    const noteDreams = activityLog.filter(e => e.type === 'note' || e.type === 'dream').length
    const meds = meditations.length
    return nowItems.length + justItems.length + wouldItems.length + todayEntries.length +
           inspEntries.length + planEntries.length + highlightEntries.length + physicalEntries.length + meds + noteDreams
  }, [nowItems, justItems, wouldItems, todayEntries, inspEntries, planEntries, highlightEntries, physicalEntries, meditations, activityLog])

  const allDaySet = useMemo(() => {
    const allTs = [
      ...nowItems, ...justItems, ...wouldItems, ...todayEntries,
      ...inspEntries, ...planEntries, ...highlightEntries, ...physicalEntries,
    ].map(i => i.ts)
    meditations.forEach(m => allTs.push(m.timestamp))
    activityLog.forEach(e => allTs.push(e.ts))
    return new Set(allTs.map(ts => dayKey(ts)))
  }, [nowItems, justItems, wouldItems, todayEntries, inspEntries, planEntries, highlightEntries, physicalEntries, meditations, activityLog])

  const allTimeStreak = useMemo(() =>
    calcStreak([...nowItems, ...justItems, ...wouldItems, ...todayEntries].map(i => i.ts)),
    [nowItems, justItems, wouldItems, todayEntries]
  )

  // ── Refresh when photos change (e.g. deleted from History) ──
  useEffect(() => {
    const handler = (e) => { if (e.key === 'mih-photos') setPhotoVersion(v => v + 1) }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // ── All events (for History) ──────────────────
  const allEvents = useMemo(() => {
    const evs = []
    const allCi = [
      ...nowItems.map(i  => ({ ...i, q: i.q || 'now'  })),
      ...justItems.map(i => ({ ...i, q: 'just' })),
      ...wouldItems.map(i=> ({ ...i, q: 'would' })),
    ]
    const sessMap = {}
    allCi.forEach(item => {
      if (item.sessionId) {
        if (!sessMap[item.sessionId]) sessMap[item.sessionId] = []
        sessMap[item.sessionId].push(item)
      }
    })
    ciSessions.forEach(s => evs.push({
      type: 'pause', ts: s.ts, sessionId: s.id,
      entries: (sessMap[s.id] || []).sort((a, b) => new Date(a.ts) - new Date(b.ts)),
    }))
    allCi.forEach(item => {
      if (!item.sessionId) evs.push({ type: 'pause-legacy', ts: item.ts, text: item.text })
    })
    todayEntries.forEach(e => evs.push({ type: 'today', ts: e.ts, text: e.label, id: e.id }))
    meditations.forEach(m  => evs.push({ type: 'med', ts: m.timestamp, duration: m.duration, id: m.id }))
    loadPhotos().forEach(p => evs.push({ type: 'photo', ts: p.ts, dataUrl: p.dataUrl, id: p.id, entryType: p.entryType }))

    // Build session groups for plan/insp/highlights from activityLog
    // Individual entries grouped by sessionId
    const planSessions = {}
    planEntries.forEach(e => {
      const sid = e.sessionId || e.id
      if (!planSessions[sid]) planSessions[sid] = { ts: e.ts, entries: [], sessionId: sid }
      planSessions[sid].entries.push(e)
    })
    Object.values(planSessions).forEach(s =>
      evs.push({ type: 'plan', ts: s.ts, sessionId: s.sessionId, entries: s.entries })
    )

    const inspSessions = {}
    inspEntries.forEach(e => {
      const sid = e.sessionId || e.id
      if (!inspSessions[sid]) inspSessions[sid] = { ts: e.ts, entries: [], sessionId: sid }
      inspSessions[sid].entries.push(e)
    })
    Object.values(inspSessions).forEach(s =>
      evs.push({ type: 'insp', ts: s.ts, sessionId: s.sessionId, entries: s.entries })
    )

    const hlSessions = {}
    highlightEntries.forEach(e => {
      const sid = e.sessionId || e.id
      if (!hlSessions[sid]) hlSessions[sid] = { ts: e.ts, entries: [], sessionId: sid }
      hlSessions[sid].entries.push(e)
    })
    Object.values(hlSessions).forEach(s =>
      evs.push({ type: 'highlights', ts: s.ts, sessionId: s.sessionId, entries: s.entries })
    )

    const physSessions = {}
    physicalEntries.forEach(e => {
      const sid = e.sessionId || e.id
      if (!physSessions[sid]) physSessions[sid] = { ts: e.ts, entries: [], sessionId: sid }
      physSessions[sid].entries.push(e)
    })
    Object.values(physSessions).forEach(s =>
      evs.push({ type: 'physical', ts: s.ts, sessionId: s.sessionId, entries: s.entries })
    )

    activityLog.forEach(e => evs.push({ type: e.type, ts: e.ts, text: e.label, id: e.id }))
    return evs.sort((a, b) => new Date(b.ts) - new Date(a.ts))
  }, [nowItems, justItems, wouldItems, ciSessions, todayEntries, meditations, inspEntries, planEntries, highlightEntries, physicalEntries, activityLog, photoVersion])

  // ── Export / Import ───────────────────────────
  const handleExport = () => {
    const data = {}
    LS.keys().forEach(k => { try { data[k] = JSON.parse(localStorage.getItem(k)) } catch {} })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'most-important-backup-' + new Date().toISOString().slice(0, 10) + '.json'
    a.click(); URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result)
          Object.entries(data).forEach(([k, v]) => LS.set(k, v))
          window.location.reload()
        } catch { alert('Could not read backup file.') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // ── Nav tabs ──────────────────────────────────
  const NAV_TABS = [
    { key: 'home',     label: 'Home',     icon: '⌂' },
    { key: 'meditate', label: 'Meditate', icon: '○' },
    { key: 'notes',    label: 'Notes',    icon: '✎' },
    { key: 'dreams',   label: 'Dreams',   icon: '✦' },
    { key: 'history',  label: 'History',  icon: '◷' },
  ]

  const handlePrivacyDismiss = () => {
    localStorage.setItem('mih-privacy-seen', 'true')
    setPrivacySeen(true)
  }

  return (
    <div id="app-root" ref={rootRef}>
      {!privacySeen && <PrivacyWelcome onDismiss={handlePrivacyDismiss} />}
      {privacySeen && showWelcome && <DailyWelcome onDismiss={handleWelcomeDismiss} />}
      {showSettings && (
        <SettingsSheet
          themeKey={themeKey}       setThemeKey={setThemeKey}
          fontSizeKey={fontSizeKey} setFontSizeKey={setFontSizeKey}
          onClose={() => setShowSettings(false)}
          onExport={handleExport}
          onImport={handleImport}
          onShowPrivacy={() => { setShowSettings(false); setPrivacySeen(false) }}
        />
      )}

      {activeTab === 'home' && (
        <HomeTab
          quote={quote} quoteKey={quoteKey} refreshQuote={refreshQuote}
          nowItems={nowItems}         justItems={justItems}       wouldItems={wouldItems}
          setNowItems={setNowItems}   setJustItems={setJustItems} setWouldItems={setWouldItems}
          ciSessions={ciSessions}     setCiSessions={setCiSessions}
          todayEntries={todayEntries} setTodayEntries={setTodayEntries}
          inspEntries={inspEntries}   setInspEntries={setInspEntries}
          planEntries={planEntries}         setPlanEntries={setPlanEntries}
          highlightEntries={highlightEntries} setHighlightEntries={setHighlightEntries}
          physicalEntries={physicalEntries}   setPhysicalEntries={setPhysicalEntries}
          meditations={meditations}
          onOpenSettings={() => setShowSettings(true)}
          grandTotal={grandTotal}
          allTimeTotal={allTimeTotal}
          allTimeStreak={allTimeStreak}
          activeScreen={homeScreen}
          setActiveScreen={setHomeScreen}
          activityLog={activityLog}
          logActivity={logActivity}
        />
      )}

      {activeTab === 'meditate' && (
        <MeditateTab
          key={medResetKey}
          meditations={meditations} setMeditations={setMeditations}
          refreshQuote={refreshQuote}
          audio={audio}
          logActivity={logActivity}
          activeTab={activeTab}
          onNavigate={handleNavTab}
          onDimChange={setMedDimmed}
        />
      )}

      {activeTab === 'notes' && (
        <NotesTab
          notes={notes}             setNotes={setNotes}
          noteFolders={noteFolders} setNoteFolders={setNoteFolders}
          onEditingChange={setNotesEditing}
          logActivity={logActivity}
        />
      )}

      {activeTab === 'dreams' && (
        <DreamsTab
          dreams={dreams}       setDreams={setDreams}
          dreamCats={dreamCats} setDreamCats={setDreamCats}
          logActivity={logActivity}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          allTimeTotal={allTimeTotal}
          allDaySet={allDaySet}
          allTimeStreak={allTimeStreak}
          allEvents={allEvents}
        />
      )}

      {createPortal(
        <nav className="app-nav" style={{
          opacity: medDimmed ? 0.08 : notesEditing ? 0 : 1,
          pointerEvents: (medDimmed || notesEditing) ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
        }}>
          {NAV_TABS.map(({ key, label, icon }) => (
            <button key={key}
              className={'app-nav-item' + (activeTab === key ? ' active' : '')}
              onClick={() => handleNavTab(key)}>
              <span className="nav-icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>,
        document.body
      )}
    </div>
  )
}
