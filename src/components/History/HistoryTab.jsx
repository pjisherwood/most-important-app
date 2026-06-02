import { useState, useMemo } from 'react'
import { isToday, fmtTime, fmtDateShort, dayKey } from '../../hooks/utils.js'
import { PhotoThumb } from '../shared/CameraButton.jsx'
import { deletePhoto, loadPhotos } from '../../hooks/usePhoto.js'
import './History.css'

// Derive pale tint inline (same logic as utils.paleTint)
function paleTint(hex, strength) {
  strength = strength || 0.15
  if (!hex || !hex.startsWith('#')) return 'rgba(200,200,200,0.15)'
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const ro = Math.round(r + (255 - r) * (1 - strength))
  const go = Math.round(g + (255 - g) * (1 - strength))
  const bo = Math.round(b + (255 - b) * (1 - strength))
  return 'rgba(' + ro + ',' + go + ',' + bo + ',0.55)'
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// ── Week view ─────────────────────────────────
// ── Habit tracker view ────────────────────────
function HabitView({ allEvents }) {
  const COL_MED  = getCssVar('--accent')         || '#2B3E6B'
  const COL_NOW  = getCssVar('--btn-enjoy')       || '#E8A830'
  const COL_PLAN = getCssVar('--btn-plan')        || '#8AAF52'
  const COL_PROG = getCssVar('--btn-achieve')     || '#5A8A6A'
  const COL_HIGH = getCssVar('--btn-highlights')  || '#C88C28'
  const COL_PHYS = getCssVar('--btn-physical')    || '#C06040'

  const COL_DEFS = [
    { key: 'now',  label: 'Enjoy Now',  color: COL_NOW  },
    { key: 'plan', label: 'Planning',   color: COL_PLAN },
    { key: 'phys', label: 'Physical',   color: COL_PHYS },
    { key: 'prog', label: 'Progress',   color: COL_PROG },
    { key: 'high', label: 'Highlights', color: COL_HIGH },
    { key: 'med',  label: 'Meditation', color: COL_MED  },
  ]

  const todayStr = new Date().toDateString()
  const now = new Date(); now.setHours(0, 0, 0, 0)

  // Build a map of all days that have events, plus today
  const { days, completionMap } = useMemo(() => {
    const map = {}

    // Always include today
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0)
    map[todayDate.toDateString()] = { date: new Date(todayDate), med: false, now: false, plan: false, prog: false, high: false, phys: false }

    allEvents.forEach(ev => {
      const d = new Date(ev.ts); d.setHours(0, 0, 0, 0)
      const dk = d.toDateString()
      if (!map[dk]) map[dk] = { date: new Date(d), med: false, now: false, plan: false, prog: false, high: false, phys: false }
      if (ev.type === 'med')        map[dk].med  = true
      if (ev.type === 'pause')      map[dk].now  = true
      if (ev.type === 'plan')       map[dk].plan = true
      if (ev.type === 'insp')       map[dk].prog = true
      if (ev.type === 'highlights') map[dk].high = true
      if (ev.type === 'physical')   map[dk].phys = true
    })

    // Sort descending (most recent first)
    const days = Object.values(map).sort((a, b) => b.date - a.date)
    return { days, completionMap: map }
  }, [allEvents])

  const DAY_NAMES = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat']
  const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6

  return (
    <div style={{ margin: '0 1rem 1rem' }}>
      <div style={{
        background: 'rgba(255,255,255,0.72)',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {/* Column headers — vertical text */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '52px repeat(6,1fr)',
          background: 'linear-gradient(135deg,var(--now),var(--now-dk))',
          height: 108,
          paddingTop: 6,
          paddingBottom: 6,
          boxSizing: 'border-box',
        }}>
          <div />
          {COL_DEFS.map(c => (
            <div key={c.key} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
              <span style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.62rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.95)',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
              }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Day rows */}
        {(() => {
          const rows = []

          days.forEach((entry, i) => {
            const dk = entry.date.toDateString()
            const isToday = dk === todayStr
            const weekend = isWeekend(entry.date)
            const dayName = DAY_NAMES[entry.date.getDay()]
            const dayNum = entry.date.getDate()
            const isSunday = entry.date.getDay() === 0

            rows.push(
              <div key={dk} style={{
                display: 'grid',
                gridTemplateColumns: '52px repeat(6,1fr)',
                alignItems: 'center',
                borderBottom: i < days.length - 1 ? '1px solid var(--border)' : 'none',
                background: isToday
                  ? 'rgba(43,62,107,0.05)'
                  : isSunday
                    ? 'rgba(43,62,107,0.06)'
                    : 'transparent',
                padding: '0 0.5rem',
                minHeight: 46,
              }}>
                {/* Day label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isToday && (
                    <div style={{ width: 3, height: 20, borderRadius: 2, background: 'var(--accent)', flexShrink: 0 }} />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.78rem',
                      fontWeight: isToday ? 700 : 500,
                      color: isToday
                        ? 'var(--accent)'
                        : weekend
                          ? 'var(--btn-enjoy-dk, #B87C10)'
                          : 'var(--text-hi)',
                    }}>{dayName}</span>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.48rem',
                      color: isToday ? 'var(--accent)' : 'var(--text-lo)',
                      opacity: 0.7,
                    }}>{dayNum}</span>
                  </div>
                </div>

                {/* Check cells */}
                {COL_DEFS.map(col => (
                  <div key={col.key} style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', height: 46,
                  }}>
                    {entry[col.key] ? (
                      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <polyline
                          points="4,14 10,20 22,7"
                          stroke={col.color}
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(0,0,0,0.09)' }} />
                    )}
                  </div>
                ))}
              </div>
            )
          })

          return rows
        })()}
      </div>
    </div>
  )
}


// ── Month view ────────────────────────────────
function MonthView({ allEvents }) {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)

  const countsByDay = useMemo(() => {
    const map = {}
    allEvents.forEach(ev => {
      const k = new Date(ev.ts).toDateString()
      if (!map[k]) map[k] = 0
      if (ev.type === 'photo') map[k] = (map[k] || 0) + 1
      else if (ev.type === 'pause') map[k] += ev.entries?.length || 1
      else if (ev.type === 'pause-legacy') map[k] += 1
      else map[k] += 1
    })
    return map
  }, [allEvents])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const monthLabel  = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isTodayCell = d => new Date(viewYear, viewMonth, d).toDateString() === today.toDateString()
  const isFuture    = d => new Date(viewYear, viewMonth, d) > today
  const isSelected  = d => selectedDay?.y === viewYear && selectedDay?.m === viewMonth && selectedDay?.d === d
  const atMax = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  const selEntries = useMemo(() => {
    if (!selectedDay) return []
    const k = new Date(selectedDay.y, selectedDay.m, selectedDay.d).toDateString()
    return allEvents.filter(ev => new Date(ev.ts).toDateString() === k).sort((a, b) => new Date(a.ts) - new Date(b.ts))
  }, [selectedDay, allEvents])

  const selLabel = selectedDay
    ? new Date(selectedDay.y, selectedDay.m, selectedDay.d)
        .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  return (
    <>
      <div className="month-nav">
        <button className="month-nav-btn" onClick={prevMonth}>&#8249;</button>
        <span className="month-nav-label">{monthLabel}</span>
        <button className="month-nav-btn" onClick={nextMonth} disabled={atMax} style={{ opacity: atMax ? 0.3 : 1 }}>&#8250;</button>
      </div>

      <div className="month-grid-wrap">
        <div className="month-dow-row">
          {DOWS.map(d => <div key={d} className="month-dow">{d}</div>)}
        </div>
        <div className="month-days-grid">
          {cells.map((d, i) => {
            if (!d) return <div key={'e' + i} className="month-day empty"><span className="month-day-num" /></div>
            const k = new Date(viewYear, viewMonth, d).toDateString()
            const count = countsByDay[k] || 0
            return (
              <div key={d}
                className={['month-day', count > 0 ? 'has-entries' : '', isTodayCell(d) ? 'is-today' : '', isSelected(d) ? 'selected' : ''].filter(Boolean).join(' ')}
                style={{ opacity: isFuture(d) ? 0.3 : 1, pointerEvents: isFuture(d) || count === 0 ? 'none' : 'auto' }}
                onClick={() => setSelectedDay({ y: viewYear, m: viewMonth, d })}>
                <span className="month-day-num">{d}</span>
                {count > 0 && <span className="month-day-count">{count}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="sheet-overlay" onClick={() => setSelectedDay(null)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">{selLabel}</div>
            <div className="sheet-scroll">
              {selEntries.length === 0 && <div className="hist-empty">Nothing logged</div>}
              {selEntries.map((ev, i) => renderSheetRow(ev, i))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function renderSheetRow(ev, i) {
  const enjoyCol = getCssVar('--btn-enjoy') || '#3D82E0'
  const planCol  = getCssVar('--btn-plan')  || '#E07830'
  const achCol   = getCssVar('--btn-achieve') || '#0AABBB'
  const hlCol    = getCssVar('--btn-highlights') || '#C060A8'
  if (ev.type === 'pause') return (ev.entries || []).map((e, j) => (
    <div key={i + '-' + j} className="hist-row" style={{ background: paleTint(enjoyCol) }}>
      <span className="hist-time">{fmtTime(e.ts)}</span>
      <span className="hist-text">{e.text}</span>
    </div>
  ))
  if (ev.type === 'photo') return (
    <div key={ev.id || i} className="hist-row" style={{ background: 'rgba(61,130,224,0.08)', padding: '0.4rem 0.6rem', alignItems: 'flex-start' }}>
      <span className="hist-time">{fmtTime(ev.ts)}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-lo)', marginBottom: 4 }}>{ev.entryType || 'Photo'}</div>
        <PhotoThumb photo={ev} onDelete={handleDeletePhoto} />
      </div>
    </div>
  )
  if (ev.type === 'today') return (
    <div key={i} className="hist-row" style={{ background: 'rgba(200,180,100,0.15)' }}>
      <span className="hist-time">{fmtTime(ev.ts)}</span>
      <span className="hist-text">{ev.text}</span>
    </div>
  )
  if (ev.type === 'med') return (
    <div key={i} className="hist-row" style={{ background: 'rgba(100,150,214,0.12)' }}>
      <span className="hist-time">{fmtTime(ev.ts)}</span>
      <span className="hist-text">Meditation · {ev.duration} mins</span>
    </div>
  )
  if (ev.type === 'insp') return (
    <div key={i} className="hist-row" style={{ background: paleTint(achCol) }}>
      <span className="hist-time">{fmtTime(ev.ts)}</span>
      <span className="hist-text">Achievement{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
    </div>
  )
  if (ev.type === 'plan') return (
    <div key={i} className="hist-row" style={{ background: paleTint(planCol) }}>
      <span className="hist-time">{fmtTime(ev.ts)}</span>
      <span className="hist-text">Planning{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
    </div>
  )
  if (ev.type === 'highlights') return (
    <div key={i} className="hist-row" style={{ background: paleTint(hlCol) }}>
      <span className="hist-time">{fmtTime(ev.ts)}</span>
      <span className="hist-text">Today&apos;s Highlights{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
    </div>
  )
  if (ev.type === 'physical') return (
    <div key={i} className="hist-row" style={{ background: paleTint(physCol) }}>
      <span className="hist-time">{fmtTime(ev.ts)}</span>
      <span className="hist-text">Physical{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
    </div>
  )
  if (ev.type === 'note') return (
    <div key={i} className="hist-row" style={{ background: 'rgba(107,150,214,0.12)' }}>
      <span className="hist-time">{fmtTime(ev.ts)}</span>
      <span className="hist-text">Note saved{ev.text ? ' · ' + ev.text : ''}</span>
    </div>
  )
  if (ev.type === 'dream') return (
    <div key={i} className="hist-row" style={{ background: 'rgba(100,180,130,0.12)' }}>
      <span className="hist-time">{fmtTime(ev.ts)}</span>
      <span className="hist-text">Dream added{ev.text ? ' · ' + ev.text : ''}</span>
    </div>
  )
  return null
}

// ── Main History component ────────────────────
export default function HistoryTab({ allTimeTotal, allDaySet, allTimeStreak, allEvents }) {
  const [histView, setHistView] = useState('week')
  const [expanded, setExpanded] = useState({})
  const [, setPhotoRefresh] = useState(0)
  const handleDeletePhoto = (id) => { deletePhoto(id); setPhotoRefresh(n => n + 1) }

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }))

  const histDayGroups = useMemo(() => {
    const dayMap = {}
    allEvents.forEach(ev => {
      const k = dayKey(ev.ts)
      if (!dayMap[k]) dayMap[k] = {
        key: k,
        isToday: isToday(ev.ts),
        label: isToday(ev.ts) ? 'Today' : fmtDateShort(ev.ts),
        events: [],
      }
      dayMap[k].events.push(ev)
    })
    return Object.values(dayMap).sort((a, b) => new Date(b.key) - new Date(a.key))
  }, [allEvents])

  const renderHistRow = (ev, i) => {
    const enjoyCol = getCssVar('--btn-enjoy') || '#3D82E0'
    const planCol  = getCssVar('--btn-plan')  || '#E07830'
    const achCol   = getCssVar('--btn-achieve') || '#0AABBB'
    const physCol  = getCssVar('--btn-physical') || '#C06040'
    const hlCol    = getCssVar('--btn-highlights') || '#C060A8'
    const medCol   = getCssVar('--accent') || '#6B96D6'

    if (ev.type === 'pause') return (
      <div key={ev.sessionId || i}>
        <div className="hist-row" style={{ background: paleTint(enjoyCol), cursor: 'pointer' }}
          onClick={() => toggle(ev.sessionId)}>
          <span className="hist-time">{fmtTime(ev.ts)}</span>
          <span className="hist-text">Enjoyed now{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
          {ev.entries?.length > 0 && <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{expanded[ev.sessionId] ? '▲' : '▼'}</span>}
        </div>
        {expanded[ev.sessionId] && ev.entries?.map((e, j) => (
          <div key={j} style={{ padding: '2px 0 2px 44px', fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-hi)', opacity: 0.75 }}>· {e.text}</div>
        ))}
      </div>
    )
    if (ev.type === 'photo') return (
      <div key={ev.id || i} className="hist-row" style={{ background: 'rgba(61,130,224,0.08)', padding: '0.4rem 0.6rem', alignItems: 'flex-start' }}>
        <span className="hist-time">{fmtTime(ev.ts)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-lo)', marginBottom: 4 }}>{ev.entryType || 'Photo'}</div>
          <PhotoThumb photo={ev} onDelete={handleDeletePhoto} />
        </div>
      </div>
    )
    if (ev.type === 'today') return (
      <div key={i} className="hist-row" style={{ background: 'rgba(200,180,100,0.15)' }}>
        <span className="hist-time">{fmtTime(ev.ts)}</span>
        <span className="hist-text">{ev.text}</span>
      </div>
    )
    if (ev.type === 'med') return (
      <div key={i} className="hist-row" style={{ background: paleTint(medCol) }}>
        <span className="hist-time">{fmtTime(ev.ts)}</span>
        <span className="hist-text">Meditation · {ev.duration} mins</span>
      </div>
    )
    if (ev.type === 'insp') return (
      <div key={ev.sessionId || i}>
        <div className="hist-row" style={{ background: paleTint(achCol), cursor: ev.entries?.length > 0 ? 'pointer' : 'default' }}
          onClick={() => ev.entries?.length > 0 && toggle('insp-' + ev.sessionId)}>
          <span className="hist-time">{fmtTime(ev.ts)}</span>
          <span className="hist-text">Achievement{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
          {ev.entries?.length > 0 && <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{expanded['insp-' + ev.sessionId] ? '▲' : '▼'}</span>}
        </div>
        {expanded['insp-' + ev.sessionId] && ev.entries?.map((e, j) => (
          <div key={j} style={{ padding: '2px 0 2px 44px', fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-hi)', opacity: 0.75 }}>· {e.text}</div>
        ))}
      </div>
    )
    if (ev.type === 'plan') return (
      <div key={ev.sessionId || i}>
        <div className="hist-row" style={{ background: paleTint(planCol), cursor: ev.entries?.length > 0 ? 'pointer' : 'default' }}
          onClick={() => ev.entries?.length > 0 && toggle('plan-' + ev.sessionId)}>
          <span className="hist-time">{fmtTime(ev.ts)}</span>
          <span className="hist-text">Planning{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
          {ev.entries?.length > 0 && <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{expanded['plan-' + ev.sessionId] ? '▲' : '▼'}</span>}
        </div>
        {expanded['plan-' + ev.sessionId] && ev.entries?.map((e, j) => (
          <div key={j} style={{ padding: '2px 0 2px 44px', fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-hi)', opacity: 0.75 }}>· {e.text}</div>
        ))}
      </div>
    )
    if (ev.type === 'highlights') return (
      <div key={ev.sessionId || i}>
        <div className="hist-row" style={{ background: paleTint(hlCol), cursor: ev.entries?.length > 0 ? 'pointer' : 'default' }}
          onClick={() => ev.entries?.length > 0 && toggle('hl-' + ev.sessionId)}>
          <span className="hist-time">{fmtTime(ev.ts)}</span>
          <span className="hist-text">Today&apos;s Highlights{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
          {ev.entries?.length > 0 && <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{expanded['hl-' + ev.sessionId] ? '▲' : '▼'}</span>}
        </div>
        {expanded['hl-' + ev.sessionId] && ev.entries?.map((e, j) => (
          <div key={j} style={{ padding: '2px 0 2px 44px', fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-hi)', opacity: 0.75 }}>· {e.text}</div>
        ))}
      </div>
    )
    if (ev.type === 'physical') return (
      <div key={ev.sessionId || i}>
        <div className="hist-row" style={{ background: paleTint(physCol), cursor: ev.entries?.length > 0 ? 'pointer' : 'default' }}
          onClick={() => ev.entries?.length > 0 && toggle('phys-' + ev.sessionId)}>
          <span className="hist-time">{fmtTime(ev.ts)}</span>
          <span className="hist-text">Today&apos;s Physical{ev.entries?.length > 0 ? ' · ' + ev.entries.length + ' things' : ''}</span>
          {ev.entries?.length > 0 && <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{expanded['phys-' + ev.sessionId] ? '▲' : '▼'}</span>}
        </div>
        {expanded['phys-' + ev.sessionId] && ev.entries?.map((e, j) => (
          <div key={j} style={{ padding: '2px 0 2px 44px', fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-hi)', opacity: 0.75 }}>· {e.text}</div>
        ))}
      </div>
    )
    if (ev.type === 'note') return (
      <div key={i} className="hist-row" style={{ background: 'rgba(107,150,214,0.12)' }}>
        <span className="hist-time">{fmtTime(ev.ts)}</span>
        <span className="hist-text">Note saved{ev.text ? ' · ' + ev.text : ''}</span>
      </div>
    )
    if (ev.type === 'dream') return (
      <div key={i} className="hist-row" style={{ background: 'rgba(100,180,130,0.12)' }}>
        <span className="hist-time">{fmtTime(ev.ts)}</span>
        <span className="hist-text">Dream added{ev.text ? ' · ' + ev.text : ''}</span>
      </div>
    )
    return null
  }

  return (
    <div className="tab-screen">
      <div className="hist-header">
        <div className="hist-title">History</div>
        <div className="hist-rule" />
        <div className="hist-sub">Your story, day by day</div>
      </div>

      <div className="hist-stats-banner">
        <div className="hist-stat-col">
          <span className="hist-stat-val">{allTimeTotal.toLocaleString()}</span>
          <span className="hist-stat-lbl">Good things noticed</span>
        </div>
        <div className="hist-stat-col">
          <span className="hist-stat-val">{allDaySet.size}</span>
          <span className="hist-stat-lbl">Days of practice</span>
        </div>
        <div className="hist-stat-col">
          <span className="hist-stat-val">{allTimeStreak}</span>
          <span className="hist-stat-lbl">Day streak</span>
        </div>
      </div>

      <div className="hist-toggles">
        <div className="hist-view-toggle">
          <button className={'hist-view-btn' + (histView === 'week'     ? ' active' : '')} onClick={() => setHistView('week')}>Week</button>
          <button className={'hist-view-btn' + (histView === 'month'    ? ' active' : '')} onClick={() => setHistView('month')}>Month</button>
          <button className={'hist-view-btn' + (histView === 'timeline' ? ' active' : '')} onClick={() => setHistView('timeline')}>Timeline</button>
        </div>
      </div>

      {histView === 'week' ? (
        <div className="hist-scroll">
          <HabitView allEvents={allEvents} />
        </div>
      ) : histView === 'timeline' ? (
        <div className="hist-scroll">
          {histDayGroups.length === 0
            ? <div className="hist-empty">Your story will appear here<br />as you use the app</div>
            : histDayGroups.map(day => (
              <div key={day.key} className="hist-day-group">
                <div className={'hist-day-label' + (day.isToday ? ' is-today' : '')}>{day.label}</div>
                {day.events.map((ev, i) => renderHistRow(ev, i))}
              </div>
            ))
          }
        </div>
      ) : (
        <div className="hist-scroll">
          <MonthView allEvents={allEvents} />
        </div>
      )}
    </div>
  )
}
