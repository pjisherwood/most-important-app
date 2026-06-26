import { useState, useEffect, useRef, useMemo } from 'react'
import { uid, isToday, fmtTime, fmtDateShort, dayKey } from '../../hooks/utils.js'
import CameraButton, { PhotoThumb } from '../shared/CameraButton.jsx'
import { loadPhotos, deletePhoto } from '../../hooks/usePhoto.js'
import StatsView from '../shared/StatsView.jsx'
import WorkoutScreen from './WorkoutScreen.jsx'

export default function StandaloneScreen({
  isActive, onBack,
  entries, setEntries, refreshQuote,
  title, subtitle, historyTitle, placeholder, icon,
  headerBg, historyBtnStyle, accentColour, message,
  sessionId, checkable,
  savedWorkouts, setSavedWorkouts,
}) {
  const [draft, setDraft] = useState('')
  const [, setPhotoRefresh] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [activeTab, setActiveTab] = useState('entries')
  const [showWorkout, setShowWorkout] = useState(false)
  const inputRef = useRef(null)
  const isPhysical = title === 'Physical'

  useEffect(() => {
    if (isActive) {
      setDraft('')
      setShowHistory(false)
      setActiveTab('entries')
      setTimeout(() => inputRef.current?.focus(), 350)
    }
  }, [isActive])

  const todayItems = entries.filter(i => isToday(i.ts))

  const submit = () => {
    if (!draft.trim()) return
    const entry = { id: uid(), ts: new Date().toISOString(), text: draft.trim(), sessionId: sessionId || null, done: false }
    setEntries([entry, ...entries])
    setDraft('')
    refreshQuote()
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const toggleDone = (id) => {
    setEntries(entries.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  const historyGroups = useMemo(() => {
    const dayMap = {}
    ;[...entries].sort((a, b) => new Date(b.ts) - new Date(a.ts)).forEach(e => {
      const k = dayKey(e.ts)
      if (!dayMap[k]) dayMap[k] = {
        key: k,
        isToday: isToday(e.ts),
        label: isToday(e.ts) ? 'Today' : fmtDateShort(e.ts),
        entries: [],
      }
      dayMap[k].entries.push(e)
    })
    return Object.values(dayMap)
  }, [entries])

  return (
    <div className={'detail-screen' + (isActive ? ' active' : '')}>
      {/* Workout overlay — Physical tab only */}
      {isPhysical && (
        <WorkoutScreen
          isActive={showWorkout}
          onBack={() => setShowWorkout(false)}
          onLogEntry={(text, workoutSessId) => {
            const entry = { id: uid(), ts: new Date().toISOString(), text, sessionId: workoutSessId || sessionId || null, done: false }
            setEntries([entry, ...entries])
            refreshQuote()
          }}
          headerBg={headerBg}
          savedWorkouts={savedWorkouts}
          setSavedWorkouts={setSavedWorkouts}
        />
      )}
      {/* Header */}
      <div className="ds-header" style={{ background: headerBg }}>
        <button className="ds-back" onClick={activeTab !== 'entries' ? () => setActiveTab('entries') : onBack}>&#8249;</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div className="ds-title">{activeTab === 'history' ? historyTitle : activeTab === 'stats' ? title + ' Stats' : title}</div>
          {activeTab === 'entries' && subtitle && (
            <div className="ds-subtitle">{subtitle}</div>
          )}
        </div>
        {activeTab === 'entries' && (
          <div className="ds-stats">
            <div className="ds-stat">
              <span className="ds-stat-num">{todayItems.length}</span>
              <span className="ds-stat-label">Today</span>
            </div>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.3)' }} />
            <div className="ds-stat">
              <span className="ds-stat-num">{entries.length}</span>
              <span className="ds-stat-label">All&#8209;time</span>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'stats' ? (
        <div className="ds-body" style={{ paddingBottom: 20 }}>
          <StatsView entries={entries} colour={accentColour} title={title} />
        </div>
      ) : activeTab === 'history' ? (
        <div className="ds-body" style={{ paddingBottom: 20 }}>
          {historyGroups.length === 0 && (
            <div className="ds-empty">Nothing logged yet&#8202;&#8212;&#8202;<br />start adding entries</div>
          )}
          {historyGroups.map(day => (
            <div key={day.key} style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 500,
                color: day.isToday ? 'var(--accent)' : 'var(--text-hi)',
                padding: '8px 0 6px', borderBottom: '1.5px solid var(--border)', marginBottom: 6,
                display: 'flex', alignItems: 'baseline', gap: 8,
              }}>
                {day.label}
                <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-lo)', opacity: 0.6 }}>
                  {day.entries.length} {day.entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              {day.entries.map(e => (
                <div key={e.id} className="t-row" style={{ background: 'rgba(255,255,255,0.6)' }}>
                  <span className="t-time" style={{ color: 'var(--accent)' }}>{fmtTime(e.ts)}</span>
                  <span className="t-text">{e.text}</span>
                  {e.done && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginRight: 2 }}>
                      <polyline points="3,10 7,14 15,5" stroke="var(--btn-plan, #8AAF52)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <button className="t-del" onClick={() => setEntries(entries.filter(i => i.id !== e.id))}>&#10005;</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="ds-body">
            {message && (
              <div style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontStyle: 'italic', fontSize: '1.1rem', lineHeight: 1.6,
                color: 'var(--text-hi)', opacity: 0.82, textAlign: 'center',
                padding: '0.5rem 0.5rem 1rem',
                borderBottom: '1px solid var(--border)', marginBottom: '0.875rem',
              }}>
                {message}
              </div>
            )}
            <div className="ds-input-wrap">
              <span style={{ fontSize: '0.85rem', opacity: 0.45 }}>{icon}</span>
              <input
                ref={inputRef}
                className="ds-input"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
                placeholder={placeholder}
              />
              <CameraButton
                entryType={title}
                style={{ color: 'var(--accent)' }}
                onSave={() => setPhotoRefresh(n => n + 1)}
              />
            </div>

            {(() => {
              const screenPhotos = loadPhotos().filter(p => isToday(p.ts) && p.entryType === title)
              const textItems = todayItems.map(i => ({ kind: 'text', ts: i.ts, item: i }))
              const photoItems = screenPhotos.map(p => ({ kind: 'photo', ts: p.ts, photo: p }))
              const merged = [...textItems, ...photoItems].sort((a, b) => new Date(b.ts) - new Date(a.ts))
              if (!merged.length) return (
                <div className="ds-empty">Capture your thoughts&#8230;<br />every entry counts</div>
              )
              return (
                <>
                  <div className="list-label">Today</div>
                  {merged.map((m) => m.kind === 'photo' ? (
                    <div key={m.photo.id} style={{ padding: '0.25rem 0' }}>
                      <PhotoThumb photo={m.photo}
                        onDelete={(id) => { deletePhoto(id); setPhotoRefresh(n => n + 1) }} />
                    </div>
                  ) : checkable ? (
                    <div key={m.item.id} className="ds-item" style={{ opacity: m.item.done ? 0.5 : 1 }}>
                      <button
                        onClick={() => toggleDone(m.item.id)}
                        style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          border: m.item.done ? 'none' : '2px solid var(--btn-plan, #8AAF52)',
                          background: m.item.done ? 'var(--btn-plan, #8AAF52)' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 0, transition: 'all 0.18s',
                        }}>
                        {m.item.done && (
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <polyline points="2,7 5,10 11,3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <span className="ds-item-text">{m.item.text}</span>
                      <button className="ds-item-del"
                        onClick={() => setEntries(entries.filter(i => i.id !== m.item.id))}>&#10005;</button>
                    </div>
                  ) : (
                    <div key={m.item.id} className="t-row" style={{ background: 'rgba(255,255,255,0.6)' }}>
                      <span className="t-time" style={{ color: 'var(--accent)' }}>{fmtTime(m.item.ts)}</span>
                      <span className="t-text">{m.item.text}</span>
                      <button className="t-del" style={{ background: 'none', border: 'none', color: 'var(--text-lo)', cursor: 'pointer', fontSize: '0.7rem', opacity: 0.5, padding: 2, flexShrink: 0 }}
                        onClick={() => setEntries(entries.filter(i => i.id !== m.item.id))}>&#10005;</button>
                    </div>
                  ))}
                </>
              )
            })()}
          </div>

          <div className="ds-footer">
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button
                className="ds-q-btn"
                style={activeTab === 'stats'
                  ? { ...historyBtnStyle, flex: 1, fontWeight: 700, opacity: 1 }
                  : { ...historyBtnStyle, flex: 1, opacity: 0.65 }}
                onClick={() => setActiveTab('stats')}>
                Stats
              </button>
              <button
                className="ds-q-btn"
                style={activeTab === 'history'
                  ? { ...historyBtnStyle, flex: 1, fontWeight: 700, opacity: 1 }
                  : { ...historyBtnStyle, flex: 1, opacity: 0.65 }}
                onClick={() => setActiveTab('history')}>
                History
              </button>
              {isPhysical && (
                <button
                  className="ds-q-btn"
                  style={{ background: 'var(--btn-physical)', color: '#fff', flex: 1, fontSize: '1.05rem' }}
                  onClick={() => setShowWorkout(true)}>
                  💪 Workout
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
