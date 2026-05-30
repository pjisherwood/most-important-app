import { useState, useRef, useMemo, useEffect } from 'react'
import StarSvg from '../shared/StarSvg.jsx'
import DetailScreen from './DetailScreen.jsx'
import StandaloneScreen from './StandaloneScreen.jsx'
import CameraButton, { PhotoThumb } from '../shared/CameraButton.jsx'
import { loadPhotos, deletePhoto } from '../../hooks/usePhoto.js'
import { uid, isToday, fmtTime, fmtHour, dayKey, paleTint } from '../../hooks/utils.js'
import './Home.css'

// Helper: read a CSS variable from the document
function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export default function HomeTab({
  quote, quoteKey, refreshQuote,
  nowItems, justItems, wouldItems, setNowItems, setJustItems, setWouldItems,
  ciSessions, setCiSessions,
  todayEntries, setTodayEntries,
  inspEntries, setInspEntries,
  planEntries, setPlanEntries,
  highlightEntries, setHighlightEntries,
  physicalEntries, setPhysicalEntries,
  meditations,
  onOpenSettings,
  grandTotal, allTimeTotal, allTimeStreak,
  activeScreen, setActiveScreen,
  activityLog,
  logActivity,
}) {
  const [currentSession, setCurrentSession] = useState(null)
  const [currentPlanSess,  setCurrentPlanSess]  = useState(null)
  const [currentInspSess,  setCurrentInspSess]  = useState(null)
  const [currentHlSess,    setCurrentHlSess]    = useState(null)
  const [currentPhysSess,  setCurrentPhysSess]  = useState(null)
  const [todayDraft, setTodayDraft] = useState('')
  const [recentPhotos, setRecentPhotos] = useState(() => loadPhotos())

  // Refresh photos when deleted from another screen (e.g. History)
  useEffect(() => {
    const handler = (e) => { if (e.key === 'mih-photos') setRecentPhotos(loadPhotos()) }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])
  const [sparkles,   setSparkles]   = useState([])
  const [expandedSess, setExpandedSess] = useState({})
  const wrapRef = useRef(null)

  // ── Open Enjoy Now ────────────────────────────
  const openEnjoyNow = (q) => {
    const sess = { id: uid(), ts: new Date().toISOString() }
    setCiSessions([sess, ...ciSessions])
    setCurrentSession(sess.id)
    setActiveScreen(q)
    refreshQuote()
  }

  // ── Open standalone screens with session IDs ──
  const openStandalone = (screen) => {
    const sessId = uid()
    if (screen === 'plan')       setCurrentPlanSess(sessId)
    if (screen === 'insp')       setCurrentInspSess(sessId)
    if (screen === 'highlights') setCurrentHlSess(sessId)
    if (screen === 'physical')   setCurrentPhysSess(sessId)
    setActiveScreen(screen)
    refreshQuote()
  }

  // ── Log a free moment ─────────────────────────
  const logToday = (text, e) => {
    if (!text.trim()) return
    const entry = { id: uid(), ts: new Date().toISOString(), label: text.trim() }
    setTodayEntries([entry, ...todayEntries])
    refreshQuote()
    if (e) fireSparkle(e)
  }

  // ── Sparkle ───────────────────────────────────
  const fireSparkle = (e) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = uid()
    setSparkles(s => [...s, { id, x, y }])
    setTimeout(() => setSparkles(s => s.filter(sp => sp.id !== id)), 800)
  }

  // ── Get button colours for tints ─────────────
  const btnColours = {
    enjoy:      getCssVar('--btn-enjoy')      || '#3D82E0',
    plan:       getCssVar('--btn-plan')       || '#E07830',
    achieve:    getCssVar('--btn-achieve')    || '#0AABBB',
    highlights: getCssVar('--btn-highlights') || '#C060A8',
    physical:   getCssVar('--btn-physical')   || '#C06040',
    med:        getCssVar('--accent')         || '#6B96D6',
    note:       '#6B96D6',
    dream:      '#3AA870',
    today:      '#A08040',
  }

  // ── Today timeline ────────────────────────────
  const todayTimeline = useMemo(() => {
    const tl = []

    todayEntries.filter(e => isToday(e.ts))
      .forEach(e => tl.push({ type: 'today', ts: e.ts, text: e.label, id: e.id }))

    // Add photos - will be grouped into pairs when rendering
    // Only show 'today' prompt photos on home timeline - others belong to their screens
    recentPhotos.filter(p => isToday(p.ts) && (!p.entryType || p.entryType === 'today'))
      .forEach(p => tl.push({ type: 'photo', ts: p.ts, dataUrl: p.dataUrl, id: p.id }))

    ciSessions.filter(s => isToday(s.ts)).forEach(s => {
      const entries = [...nowItems, ...justItems, ...wouldItems]
        .filter(i => isToday(i.ts) && i.sessionId === s.id)
        .sort((a, b) => new Date(a.ts) - new Date(b.ts))
      tl.push({ type: 'pause', ts: s.ts, sessionId: s.id, entries })
    })

    meditations.filter(m => isToday(m.timestamp))
      .forEach(m => tl.push({ type: 'med', ts: m.timestamp, duration: m.duration, id: m.id }))

    // Group plan/insp/highlights by sessionId
    const groupBySession = (arr, type) => {
      const map = {}
      arr.filter(e => isToday(e.ts)).forEach(e => {
        const sid = e.sessionId || e.id
        if (!map[sid]) map[sid] = { type, ts: e.ts, sessionId: sid, entries: [] }
        map[sid].entries.push(e)
      })
      Object.values(map).forEach(g => tl.push(g))
    }
    groupBySession(inspEntries, 'insp')
    groupBySession(planEntries, 'plan')
    groupBySession(highlightEntries, 'highlights')

    // Activity log — notes and dreams
    ;(activityLog || []).filter(e => isToday(e.ts))
      .forEach(e => tl.push({ type: e.type, ts: e.ts, text: e.label, id: e.id }))

    const sorted = tl.sort((a, b) => new Date(b.ts) - new Date(a.ts))
    const result = []; let lastH = null
    sorted.forEach(ev => {
      const h = new Date(ev.ts).getHours()
      if (lastH === null || h !== lastH) {
        if (lastH !== null) result.push({ type: 'hm', hour: fmtHour(ev.ts) })
        lastH = h
      }
      result.push(ev)
    })
    return result
  }, [todayEntries, ciSessions, nowItems, justItems, wouldItems, recentPhotos,
      meditations, inspEntries, planEntries, highlightEntries, activityLog])

  // ── Render a timeline row ─────────────────────
  const renderRow = (ev, i, todayTimeline) => {
    if (ev.type === 'hm') return (
      <div key={'hm-' + i} className="hour-marker">
        <div className="hour-line" /><span className="hour-text">{ev.hour}</span><div className="hour-line" />
      </div>
    )

    if (ev.type === 'photo') {
      const prevEv = i > 0 ? todayTimeline[i-1] : null
      if (prevEv && prevEv.type === 'photo') return null
      const nextEv = todayTimeline[i+1]
      const isPair = nextEv && nextEv.type === 'photo'
      const handleDel = (id) => { deletePhoto(id); setRecentPhotos(loadPhotos()) }
      return (
        <div key={ev.id} className="t-photo-row">
          <span className="t-photo-time">{fmtTime(ev.ts)}</span>
          <div className={isPair ? "t-photo-grid" : "t-photo-single"}>
            <PhotoThumb photo={ev} onDelete={handleDel} />
            {isPair && <PhotoThumb photo={nextEv} onDelete={handleDel} />}
          </div>
        </div>
      )
    }

    if (ev.type === 'today') return (
      <div key={ev.id} className="t-row" style={{ background: paleTint(btnColours.today) }}>
        <span className="t-time">{fmtTime(ev.ts)}</span>
        <span className="t-text">{ev.text}</span>
        <button className="t-del" onClick={() => setTodayEntries(todayEntries.filter(e => e.id !== ev.id))}>&#10005;</button>
      </div>
    )

    if (ev.type === 'pause') return (
      <div key={ev.sessionId}>
        <div className="t-row" style={{ background: paleTint(btnColours.enjoy), cursor: 'pointer' }}
          onClick={() => setExpandedSess(p => ({ ...p, [ev.sessionId]: !p[ev.sessionId] }))}>
          <span className="t-time">{fmtTime(ev.ts)}</span>
          <span className="t-text">Enjoyed now{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
          {ev.entries?.length > 0 && <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{expandedSess[ev.sessionId] ? '25b2' : '25bc'}</span>}
        </div>
        {expandedSess[ev.sessionId] && ev.entries?.map((e, j) => (
          <div key={j} className="t-sub-row">· {e.text}</div>
        ))}
      </div>
    )

    if (ev.type === 'med') return (
      <div key={ev.id} className="t-row" style={{ background: paleTint(btnColours.med) }}>
        <span className="t-time">{fmtTime(ev.ts)}</span>
        <span className="t-text">Meditation · {ev.duration} mins</span>
      </div>
    )

    if (ev.type === 'insp') return (
      <div key={ev.sessionId || i}>
        <div className="t-row" style={{ background: paleTint(btnColours.achieve), cursor: 'pointer' }}
          onClick={() => setExpandedSess(p => ({ ...p, ['insp-' + ev.sessionId]: !p['insp-' + ev.sessionId] }))}>
          <span className="t-time">{fmtTime(ev.ts)}</span>
          <span className="t-text">Achievement{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
          {ev.entries?.length > 0 && <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{expandedSess['insp-' + ev.sessionId] ? '25b2' : '25bc'}</span>}
        </div>
        {expandedSess['insp-' + ev.sessionId] && ev.entries?.map((e, j) => (
          <div key={j} className="t-sub-row">· {e.text}</div>
        ))}
      </div>
    )

    if (ev.type === 'plan') return (
      <div key={ev.sessionId || i}>
        <div className="t-row" style={{ background: paleTint(btnColours.plan), cursor: 'pointer' }}
          onClick={() => setExpandedSess(p => ({ ...p, ['plan-' + ev.sessionId]: !p['plan-' + ev.sessionId] }))}>
          <span className="t-time">{fmtTime(ev.ts)}</span>
          <span className="t-text">Planning{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
          {ev.entries?.length > 0 && <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{expandedSess['plan-' + ev.sessionId] ? '25b2' : '25bc'}</span>}
        </div>
        {expandedSess['plan-' + ev.sessionId] && ev.entries?.map((e, j) => (
          <div key={j} className="t-sub-row">· {e.text}</div>
        ))}
      </div>
    )

    if (ev.type === 'highlights') return (
      <div key={ev.sessionId || i}>
        <div className="t-row" style={{ background: paleTint(btnColours.highlights), cursor: 'pointer' }}
          onClick={() => setExpandedSess(p => ({ ...p, ['hl-' + ev.sessionId]: !p['hl-' + ev.sessionId] }))}>
          <span className="t-time">{fmtTime(ev.ts)}</span>
          <span className="t-text">Highlights{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
          {ev.entries?.length > 0 && <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{expandedSess['hl-' + ev.sessionId] ? '25b2' : '25bc'}</span>}
        </div>
        {expandedSess['hl-' + ev.sessionId] && ev.entries?.map((e, j) => (
          <div key={j} className="t-sub-row">· {e.text}</div>
        ))}
      </div>
    )

    if (ev.type === 'note') return (
      <div key={ev.id || i} className="t-row" style={{ background: paleTint(btnColours.note) }}>
        <span className="t-time">{fmtTime(ev.ts)}</span>
        <span className="t-text">Note saved{ev.text ? ' · ' + ev.text : ''}</span>
      </div>
    )

    if (ev.type === 'dream') return (
      <div key={ev.id || i} className="t-row" style={{ background: paleTint(btnColours.dream) }}>
        <span className="t-time">{fmtTime(ev.ts)}</span>
        <span className="t-text">Dream added{ev.text ? ' · ' + ev.text : ''}</span>
      </div>
    )

    return null
  }

  return (
    <div className="tab-screen" style={{ position: 'relative' }} ref={wrapRef}>
      {sparkles.map(sp => (
        <div key={sp.id} className="sparkle" style={{ left: sp.x - 10, top: sp.y - 10 }}>✨</div>
      ))}

      {/* Detail screens */}
      {['now', 'just', 'would'].map(q => (
        <DetailScreen key={q}
          isActive={activeScreen === q} q={q}
          onBack={() => setActiveScreen(null)}
          nowItems={nowItems} justItems={justItems} wouldItems={wouldItems}
          setNowItems={setNowItems} setJustItems={setJustItems} setWouldItems={setWouldItems}
          sessionId={currentSession} refreshQuote={refreshQuote}
          allTimeTotal={allTimeTotal}
        />
      ))}

      <StandaloneScreen
        isActive={activeScreen === 'insp'} onBack={() => setActiveScreen(null)}
        entries={inspEntries} setEntries={setInspEntries} refreshQuote={refreshQuote}
        title="Achievement &amp; Progress" historyTitle="Progress History"
        placeholder="Note an achievement or progress…" icon="⭐"
        headerBg="linear-gradient(135deg,var(--btn-achieve),var(--btn-achieve-dk))"
        historyBtnStyle={{ background: 'rgba(0,160,160,0.15)', color: 'rgba(0,100,110,0.9)', border: '1.5px solid rgba(0,160,160,0.3)' }}
        sessionId={currentInspSess}
        accentColour={btnColours.achieve}
      />

      <StandaloneScreen
        isActive={activeScreen === 'highlights'} onBack={() => setActiveScreen(null)}
        entries={highlightEntries} setEntries={setHighlightEntries} refreshQuote={refreshQuote}
        title="Highlights" historyTitle="Highlights History"
        placeholder="A highlight from today…" icon="✨"
        headerBg="linear-gradient(135deg,var(--btn-highlights),var(--btn-highlights-dk))"
        historyBtnStyle={{ background: 'rgba(180,60,140,0.12)', color: 'rgba(130,20,90,0.9)', border: '1.5px solid rgba(180,60,140,0.25)' }}
        message="Take a moment to enjoy today&apos;s highlights and how good they felt. Imagine what more you would like tomorrow."
        sessionId={currentHlSess}
        accentColour={btnColours.highlights}
      />

      <StandaloneScreen
        isActive={activeScreen === 'physical'} onBack={() => setActiveScreen(null)}
        entries={physicalEntries} setEntries={setPhysicalEntries} refreshQuote={refreshQuote}
        title="Physical" historyTitle="Physical History"
        placeholder="What did you do to move your body today…" icon="🏃"
        headerBg="linear-gradient(135deg,var(--btn-physical),var(--btn-physical-dk))"
        historyBtnStyle={{ background: 'rgba(192,96,64,0.12)', color: 'rgba(144,64,32,0.9)', border: '1.5px solid rgba(192,96,64,0.25)' }}
        message="Your body carries you through every moment. Every step, stretch, and movement is worth noticing and celebrating."
        sessionId={currentPhysSess}
        entryType="Physical"
        accentColour={btnColours.physical}
      />

      <StandaloneScreen
        isActive={activeScreen === 'plan'} onBack={() => setActiveScreen(null)}
        entries={planEntries} setEntries={setPlanEntries} refreshQuote={refreshQuote}
        title="Planning" historyTitle="My Planning History"
        placeholder="Add a plan or next step…" icon="📋"
        headerBg="linear-gradient(135deg,var(--btn-plan),var(--btn-plan-dk))"
        historyBtnStyle={{ background: 'rgba(200,120,40,0.12)', color: 'rgba(150,80,10,0.9)', border: '1.5px solid rgba(200,120,40,0.25)' }}
        message="You have the power to shape what comes next. Take a moment to imagine what you&apos;d love to happen — picture it, feel it, enjoy it."
        sessionId={currentPlanSess}
        checkable
        accentColour={btnColours.plan}
      />

      {/* Home content */}
      <div className="home-main" style={{
        opacity: activeScreen ? 0 : 1,
        transition: 'opacity 0.35s',
        pointerEvents: activeScreen ? 'none' : 'all',
      }}>
        {/* Hero */}
        <div className="home-hero">
          <div className="hero-top-row">
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.58rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.65)',
            }}>Your most important hour</span>
          </div>
          <div className="hero-stat-bar">
            <div className="hero-stat-side">
              <span className="hero-stat-num-sm">{allTimeTotal.toLocaleString()}</span>
              <span className="hero-stat-label">All&#8209;time</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-centre">
              {grandTotal > 0
                ? <span className="hero-stat-num-lg">{grandTotal}</span>
                : <span className="hero-stat-dot">·</span>}
              <span className="hero-stat-label">Good things today</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-side">
              <span className="hero-stat-num-sm">{allTimeStreak}</span>
              <span className="hero-stat-label">Day streak</span>
            </div>
          </div>
          <div key={quoteKey} className="hero-quote animating">{quote}</div>
        </div>

        {/* Scrollable body */}
        <div className="home-scroll">
          <div className="today-header-row">
            <span className="today-label">Today</span>
            <button className="today-gear-btn" onClick={onOpenSettings} aria-label="Settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" width="20" height="20">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>

          <div className="today-input-wrap">
            <span className="today-input-icon">✦</span>
            <input
              className="today-input"
              value={todayDraft}
              onChange={e => setTodayDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && todayDraft.trim()) {
                  logToday(todayDraft, e); setTodayDraft('')
                }
              }}
              placeholder="A moment worth remembering…"
            />
            <CameraButton
              entryType="today"
              style={{ color: 'var(--accent)' }}
              onSave={() => setRecentPhotos(loadPhotos())}
            />
          </div>

          {todayTimeline.length === 0
            ? <div className="timeline-empty">Your day unfolds here — one good moment at a time</div>
            : todayTimeline.map((ev, i) => renderRow(ev, i, todayTimeline))
          }
        </div>

        {/* Footer buttons */}
        <div className="home-footer">
          <button className="now-btn btn-now"       onClick={() => openEnjoyNow('now')}>Enjoy Now</button>
          <button className="now-btn btn-plan" onClick={() => openStandalone('plan')}>Planning</button>
          <button className="now-btn btn-physical"   onClick={() => openStandalone('physical')}>Physical</button>
          <button className="now-btn btn-insp"       onClick={() => openStandalone('insp')}>Achievement &amp; Progress</button>
          <button className="now-btn btn-highlights" onClick={() => openStandalone('highlights')}>Highlights</button>
        </div>
      </div>
    </div>
  )
}
