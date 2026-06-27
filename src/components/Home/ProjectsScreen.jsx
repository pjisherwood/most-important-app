import { useState, useRef, useEffect } from 'react'
import { uid, isToday, fmtTime, fmtDateShort, dayKey } from '../../hooks/utils.js'
import './Projects.css'
import useVoice from '../../hooks/useVoice.js'
import VoiceBar from '../shared/VoiceBar.jsx'

// Palette for project colours — uses existing theme vars where possible
const PROJECT_COLOURS = [
  { label: 'Teal',    value: '#0AABBB' },
  { label: 'Blue',    value: '#3D6EDB' },
  { label: 'Purple',  value: '#8B5CF6' },
  { label: 'Rose',    value: '#E0507A' },
  { label: 'Amber',   value: '#D97706' },
  { label: 'Green',   value: '#16A34A' },
  { label: 'Slate',   value: '#475569' },
  { label: 'Coral',   value: '#C06040' },
]

// ── Single project timeline screen ──────────────────────────────────────────
function ProjectScreen({ project, onUpdate, onBack, onAddToday }) {
  const [draft,       setDraft]       = useState('')
  const voice = useVoice(setDraft)
  const [editingName, setEditingName] = useState(false)
  const [nameVal,     setNameVal]     = useState(project.name)
  const [showColours, setShowColours] = useState(false)
  const inputRef = useRef(null)
  const nameRef  = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 350)
  }, [])

  useEffect(() => {
    if (editingName) setTimeout(() => nameRef.current?.select(), 50)
  }, [editingName])

  const submit = () => {
    if (!draft.trim()) return
    const entry = { id: uid(), ts: new Date().toISOString(), text: draft.trim() }
    onUpdate({ ...project, entries: [entry, ...project.entries] })
    // Mirror to home timeline with project colour label
    if (onAddToday) onAddToday(draft.trim(), project)
    setDraft('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const saveName = () => {
    if (nameVal.trim()) onUpdate({ ...project, name: nameVal.trim() })
    setEditingName(false)
  }

  const deleteEntry = (id) => {
    onUpdate({ ...project, entries: project.entries.filter(e => e.id !== id) })
  }

  // Group entries by day
  const groups = {}
  ;[...project.entries].sort((a, b) => new Date(b.ts) - new Date(a.ts)).forEach(e => {
    const k = dayKey(e.ts)
    if (!groups[k]) groups[k] = { label: isToday(e.ts) ? 'Today' : fmtDateShort(e.ts), entries: [] }
    groups[k].entries.push(e)
  })
  const todayCount = project.entries.filter(e => isToday(e.ts)).length

  return (
    <div className="detail-screen active">
      {/* Header */}
      <div className="ds-header" style={{ background: project.colour }}>
        <button className="ds-back" onClick={onBack}>&#8249;</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {editingName ? (
            <input
              ref={nameRef}
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter') saveName() }}
              style={{
                background: 'rgba(255,255,255,0.25)', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.8)',
                color: '#fff', fontFamily: 'var(--font-display)', fontSize: '1.4rem',
                textAlign: 'center', outline: 'none', padding: '2px 8px', borderRadius: 4, width: 220,
              }}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div className="ds-title">{project.name} ✎</div>
            </button>
          )}
          <div className="ds-subtitle">
            {project.entries.length} entr{project.entries.length === 1 ? 'y' : 'ies'} · {todayCount} today
          </div>
        </div>
        {/* Colour dot picker */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowColours(p => !p)}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)', border: '2px solid rgba(255,255,255,0.6)',
              cursor: 'pointer',
            }}
          />
          {showColours && (
            <div style={{
              position: 'absolute', top: 36, right: 0, zIndex: 50,
              background: 'var(--bg-a)', borderRadius: 14, padding: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8,
            }}>
              {PROJECT_COLOURS.map(c => (
                <button
                  key={c.value}
                  onClick={() => { onUpdate({ ...project, colour: c.value }); setShowColours(false) }}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c.value,
                    border: project.colour === c.value ? '3px solid var(--text-hi)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="ds-body">
        {/* Entry input */}
        <div className="ds-input-wrap">
          <span style={{ fontSize: '0.85rem', opacity: 0.45 }}>📌</span>
          {voice.recording ? (
            <VoiceBar recording bars={voice.bars} onDone={voice.done} onCancel={voice.cancel} />
          ) : (
            <>
              <input
                ref={inputRef}
                className="ds-input"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
                placeholder="Log an update, milestone or note…"
              />
              <VoiceBar recording={false} bars={voice.bars} onStart={voice.start} compact />
            </>
          )}
        </div>

        {/* Timeline grouped by day */}
        {Object.keys(groups).length === 0 && (
          <div className="ds-empty">Your project timeline starts here&#8202;—&#8202;<br />log your first update above</div>
        )}
        {Object.entries(groups).map(([k, g]) => (
          <div key={k} style={{ marginBottom: 18 }}>
            <div className="list-label">{g.label}</div>
            {g.entries.map(e => (
              <div key={e.id} className="t-row" style={{ background: 'rgba(255,255,255,0.65)' }}>
                <span className="t-time" style={{ color: project.colour }}>{fmtTime(e.ts)}</span>
                <span className="t-text">{e.text}</span>
                <button className="t-del" onClick={() => deleteEntry(e.id)}>&#10005;</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Projects list screen ─────────────────────────────────────────────────────
export default function ProjectsScreen({ isActive, onBack, projects, setProjects, onAddToday }) {
  // openId persists even when screen goes inactive so returning always reopens last project
  const [openId, setOpenId] = useState(null)
  const lastOpenId = useRef(null)

  // Restore last open project when screen becomes active again
  useEffect(() => {
    if (isActive && lastOpenId.current && !openId) {
      setOpenId(lastOpenId.current)
    }
    // When screen is closed via home nav (isActive → false), reset open project
    if (!isActive) {
      setOpenId(null)
    }
  }, [isActive])

  const handleSetOpenId = (id) => {
    lastOpenId.current = id
    setOpenId(id)
  }

  const openProject = projects.find(p => p.id === openId)

  const addProject = () => {
    const colour = PROJECT_COLOURS[projects.length % PROJECT_COLOURS.length].value
    const p = { id: uid(), name: 'New project', colour, entries: [], createdAt: new Date().toISOString() }
    const updated = [...projects, p]
    setProjects(updated)
    handleSetOpenId(p.id)
  }

  const updateProject = (updated) => {
    setProjects(projects.map(p => p.id === updated.id ? updated : p))
  }

  const deleteProject = (id) => {
    setProjects(projects.filter(p => p.id !== id))
    lastOpenId.current = null
    setOpenId(null)
  }

  // If a project is open, show its screen
  if (openProject) {
    return (
      <ProjectScreen
        project={openProject}
        onUpdate={updateProject}
        onBack={() => { lastOpenId.current = openId; setOpenId(null) }}
        onAddToday={onAddToday}
      />
    )
  }

  return (
    <div className={'detail-screen' + (isActive ? ' active' : '')}>
      {/* Header */}
      <div className="ds-header" style={{ background: 'var(--btn-plan, #E07830)' }}>
        <button className="ds-back" onClick={onBack}>&#8249;</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div className="ds-title">Projects</div>
          <div className="ds-subtitle">
            {projects.length === 0 ? 'Tap + to create your first project' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Body */}
      <div className="ds-body" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}>
        {projects.length === 0 && (
          <div className="ds-empty">Each project has its own<br />timeline of updates &amp; milestones</div>
        )}

        {projects.map(p => {
          const lastEntry = p.entries[0]
          const todayCount = p.entries.filter(e => isToday(e.ts)).length
          return (
            <button
              key={p.id}
              className="proj-card"
              style={{ borderLeft: `4px solid ${p.colour}` }}
              onClick={() => handleSetOpenId(p.id)}
            >
              <div className="proj-card-top">
                <div className="proj-card-name" style={{ color: p.colour }}>{p.name}</div>
                <div className="proj-card-count">{p.entries.length} entr{p.entries.length === 1 ? 'y' : 'ies'}</div>
              </div>
              {lastEntry ? (
                <div className="proj-card-last">
                  <span className="proj-card-time">{isToday(lastEntry.ts) ? fmtTime(lastEntry.ts) : fmtDateShort(lastEntry.ts)}</span>
                  <span className="proj-card-text">{lastEntry.text}</span>
                </div>
              ) : (
                <div className="proj-card-empty">No entries yet — tap to open</div>
              )}
              {todayCount > 0 && (
                <div className="proj-card-today" style={{ background: p.colour }}>
                  {todayCount} today
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="ds-footer">
        <button
          className="ds-q-btn"
          style={{ background: 'var(--btn-plan, #E07830)' }}
          onClick={addProject}
        >
          + New project
        </button>
      </div>
    </div>
  )
}
