import { useState, useRef, useEffect } from 'react'
import { uid } from '../../hooks/utils.js'
import { createPortal } from 'react-dom'

// ── Exercise library ──────────────────────────────────────────────────────────
const EXERCISES = [
  { id: 'press-up',        label: 'Press ups',       weighted: false },
  { id: 'sit-up',          label: 'Sit ups',          weighted: false },
  { id: 'chin-up',         label: 'Chin up',          weighted: true  },
  { id: 'dip',             label: 'Dip',              weighted: true  },
  { id: 'shoulder-press',  label: 'Shoulder press',   weighted: true  },
  { id: 'stretching',      label: 'Stretching',       weighted: false },
  { id: 'squat',           label: 'Squats',           weighted: false },
  { id: 'plank',           label: 'Plank',            weighted: false },
  { id: 'lunge',           label: 'Lunges',           weighted: false },
  { id: 'deadlift',        label: 'Deadlift',         weighted: true  },
  { id: 'bench-press',     label: 'Bench press',      weighted: true  },
  { id: 'row',             label: 'Bent-over row',    weighted: true  },
]

const REPS_OPTIONS   = [1,2,3,4,5,6,7,8,9,10,12,15,20,25,30]
const WEIGHT_OPTIONS = [5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]

// ── Bottom sheet ──────────────────────────────────────────────────────────────
function BottomSheet({ onClose, children }) {
  return createPortal(
    <div
      className="wk-sheet-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.38)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      <div
        className="wk-sheet"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-a, #fff)',
          borderRadius: '20px 20px 0 0',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
          maxHeight: '78vh',
          overflowY: 'auto',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.13)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '10px 0 4px', position: 'sticky', top: 0, background: 'var(--bg-a, #fff)', zIndex: 1 }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--border, #ddd)', display: 'inline-block' }} />
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

// ── Exercise picker ───────────────────────────────────────────────────────────
function ExercisePicker({ onSelect, onClose }) {
  return (
    <BottomSheet onClose={onClose}>
      <div className="list-label" style={{ textAlign: 'center', marginBottom: 6, paddingTop: 2 }}>
        Choose exercise
      </div>
      {EXERCISES.map(ex => (
        <button
          key={ex.id}
          className="wk-ex-pick-row"
          onClick={() => { onSelect(ex); onClose() }}
          style={{
            width: '100%', padding: '13px 20px', border: 'none',
            borderBottom: '1px solid var(--border, #f0f0f0)',
            background: 'transparent', textAlign: 'left', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-hi)' }}>
            {ex.label}
          </span>
          <span className="list-label" style={{ margin: 0, opacity: 0.55 }}>
            {ex.weighted ? 'weighted' : 'bodyweight'}
          </span>
        </button>
      ))}
      <div style={{ height: 8 }} />
    </BottomSheet>
  )
}

// ── Value picker (reps or weight) ─────────────────────────────────────────────
function ValuePicker({ options, value, onChange, suffix, placeholder, onClose }) {
  const [customMode, setCustomMode] = useState(false)
  const [customVal,  setCustomVal]  = useState('')
  const inputRef = useRef(null)

  useEffect(() => { if (customMode) setTimeout(() => inputRef.current?.focus(), 80) }, [customMode])

  const commit = v => {
    const n = parseFloat(v)
    if (!isNaN(n) && n > 0) { onChange(n); onClose() }
  }

  return (
    <BottomSheet onClose={onClose}>
      {customMode ? (
        <div style={{ padding: '14px 20px 18px' }}>
          <div className="list-label" style={{ marginBottom: 10 }}>Type a custom value</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="number"
              value={customVal}
              onChange={e => setCustomVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commit(customVal)}
              placeholder={placeholder}
              style={{
                flex: 1, height: 48, borderRadius: 12,
                border: '1.5px solid var(--border, #ddd)',
                padding: '0 14px', fontSize: '1.1rem',
                fontFamily: 'var(--font-display)', color: 'var(--text-hi)',
                background: 'var(--bg-a, #fff)', outline: 'none',
              }}
            />
            {suffix && <span style={{ color: 'var(--text-lo)', fontSize: '0.9rem' }}>{suffix}</span>}
            <button
              onClick={() => commit(customVal)}
              style={{
                height: 48, padding: '0 18px', borderRadius: 12, border: 'none',
                background: 'var(--btn-physical, #C06040)', color: '#fff',
                fontFamily: 'var(--font-display)', fontSize: '1rem', cursor: 'pointer',
              }}
            >OK</button>
          </div>
          <button
            onClick={() => setCustomMode(false)}
            style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--text-lo)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
          >← back to list</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '10px 16px 12px', scrollbarWidth: 'none' }}>
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); onClose() }}
                style={{
                  flexShrink: 0, height: 48, minWidth: 56, borderRadius: 12,
                  border: value === opt
                    ? '2px solid var(--btn-physical, #C06040)'
                    : '1.5px solid var(--border, #e5e5e5)',
                  background: value === opt ? 'rgba(192,96,64,0.08)' : 'var(--bg-b, #fafafa)',
                  color: value === opt ? 'var(--btn-physical, #C06040)' : 'var(--text-hi)',
                  fontFamily: 'var(--font-display)', fontSize: '1rem',
                  fontWeight: value === opt ? 600 : 400, cursor: 'pointer',
                }}
              >
                {opt}{suffix}
              </button>
            ))}
          </div>
          <div style={{ padding: '0 16px 14px' }}>
            <button
              onClick={() => setCustomMode(true)}
              style={{
                width: '100%', height: 42, borderRadius: 12,
                border: '1.5px dashed var(--border, #ddd)',
                background: 'var(--bg-b, #fafafa)',
                color: 'var(--text-lo)', fontSize: '0.85rem', cursor: 'pointer',
              }}
            >Type a custom number…</button>
          </div>
        </>
      )}
    </BottomSheet>
  )
}

// ── Single exercise row ───────────────────────────────────────────────────────
function ExerciseRow({ row, onUpdate, onLog, onRemove, isFlashing }) {
  const [picker, setPicker] = useState(null) // 'exercise'|'reps'|'weight'
  const ex = row.exercise

  const pillStyle = (active) => ({
    flexShrink: 0, height: 34, minWidth: 52, borderRadius: 9,
    border: `1.5px solid ${active ? 'var(--btn-physical, #C06040)' : 'var(--border, #ddd)'}`,
    background: active ? 'rgba(192,96,64,0.08)' : 'var(--bg-b, #f7f7f7)',
    color: active ? 'var(--btn-physical, #C06040)' : 'var(--text-lo)',
    fontFamily: 'var(--font-display)', fontSize: '0.9rem',
    cursor: 'pointer', padding: '0 10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })

  return (
    <>
      <div className={`wk-row${isFlashing ? ' wk-row-flash' : ''}`}>
        {/* Exercise name button */}
        <button
          className="wk-ex-name"
          onClick={() => setPicker('exercise')}
        >
          {ex
            ? <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-hi)', fontWeight: 500 }}>{ex.label}</span>
            : <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--btn-physical, #C06040)', fontStyle: 'italic', opacity: 0.75 }}>Choose exercise…</span>
          }
        </button>

        {/* Weight pill — weighted exercises only */}
        {ex?.weighted && (
          <button style={pillStyle(!!row.weight)} onClick={() => setPicker('weight')}>
            {row.weight ? `${row.weight}kg` : 'kg'}
          </button>
        )}

        {/* Reps pill */}
        {ex && (
          <button style={pillStyle(!!row.reps)} onClick={() => setPicker('reps')}>
            {row.reps ? `${row.reps}×` : 'reps'}
          </button>
        )}

        {/* Log button */}
        {ex && (
          <button className="wk-log-btn" onClick={() => { onLog(row); setPicker(null) }}>
            Log
          </button>
        )}

        {/* Remove row */}
        <button className="t-del" onClick={onRemove}>&#10005;</button>
      </div>

      {/* Logged sets beneath this row */}
      {row.sets.length > 0 && (
        <div className="wk-sets">
          {row.sets.map(s => (
            <div key={s.id} className="t-row" style={{ background: 'rgba(192,96,64,0.06)' }}>
              <span className="t-time" style={{ color: 'var(--btn-physical, #C06040)' }}>
                {s.timeLabel}
              </span>
              <span className="t-text">
                {ex.label}{s.reps ? ` · ${s.reps} reps` : ''}{s.weight ? ` · ${s.weight}kg` : ''}
              </span>
              <button
                className="t-del"
                onClick={() => onUpdate({ ...row, sets: row.sets.filter(x => x.id !== s.id) })}
              >&#10005;</button>
            </div>
          ))}
        </div>
      )}

      {/* Pickers */}
      {picker === 'exercise' && (
        <ExercisePicker
          onSelect={ex => onUpdate({ ...row, exercise: ex, weight: null, reps: null })}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'reps' && (
        <ValuePicker
          options={REPS_OPTIONS} value={row.reps}
          onChange={v => onUpdate({ ...row, reps: v })}
          suffix="" placeholder="e.g. 8"
          onClose={() => setPicker(null)}
        />
      )}
      {picker === 'weight' && (
        <ValuePicker
          options={WEIGHT_OPTIONS} value={row.weight}
          onChange={v => onUpdate({ ...row, weight: v })}
          suffix="kg" placeholder="e.g. 37"
          onClose={() => setPicker(null)}
        />
      )}
    </>
  )
}

// ── WorkoutScreen — the full workout view ─────────────────────────────────────
export default function WorkoutScreen({ isActive, onBack, onLogEntry, headerBg, savedWorkouts, setSavedWorkouts }) {
  const [rows,        setRows]        = useState([])
  const [flashId,     setFlashId]     = useState(null)
  const [showPicker,  setShowPicker]  = useState(false)
  const [showSaveSheet, setShowSaveSheet] = useState(false)
  const [saveNameVal,   setSaveNameVal]   = useState('')
  const workoutSessId = useRef(uid()) // stable session ID for the whole workout — groups all sets in History

  // Open the exercise picker as soon as the screen becomes active (first open)
  const prevActive = useRef(false)
  useEffect(() => {
    if (isActive && !prevActive.current) {
      setRows([])
      setShowPicker(true)
      workoutSessId.current = uid() // fresh session ID each time workout is opened
    }
    prevActive.current = isActive
  }, [isActive])

  const saveNameRef = useRef(null)
  useEffect(() => { if (showSaveSheet) setTimeout(() => saveNameRef.current?.focus(), 80) }, [showSaveSheet])

  const addRow = ex => {
    setRows(prev => [...prev, { id: uid(), exercise: ex, reps: null, weight: null, sets: [] }])
  }

  // Load a saved workout — replaces current rows
  const loadWorkout = (workout) => {
    setRows(workout.exercises.map(ex => ({ id: uid(), exercise: ex, reps: null, weight: null, sets: [] })))
  }

  // Save current exercises as a named workout
  const saveWorkout = () => {
    const name = saveNameVal.trim() || 'My workout'
    const exercises = rows.filter(r => r.exercise).map(r => r.exercise)
    if (!exercises.length) { setShowSaveSheet(false); return }
    const workout = { id: uid(), name, exercises, createdAt: new Date().toISOString() }
    setSavedWorkouts([workout, ...(savedWorkouts || [])])
    setSaveNameVal('')
    setShowSaveSheet(false)
  }

  const deleteWorkout = (id) => {
    setSavedWorkouts((savedWorkouts || []).filter(w => w.id !== id))
  }

  const updateRow = updated => setRows(prev => prev.map(r => r.id === updated.id ? updated : r))
  const removeRow = id      => setRows(prev => prev.filter(r => r.id !== id))

  const logRow = row => {
    // Build text in the same format as a manually typed physical entry
    const ex = row.exercise
    let text = ex.label
    if (row.reps)   text += ` · ${row.reps} reps`
    if (row.weight) text += ` · ${row.weight}kg`

    // Write to the shared Physical entries store — appears in History automatically
    // All sets from this workout share workoutSessId.current so they group as one session
    onLogEntry(text, workoutSessId.current)

    // Track the set locally for display under this row
    const now = new Date()
    const timeLabel = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const set = { id: uid(), ts: now.toISOString(), timeLabel, reps: row.reps, weight: row.weight }
    updateRow({ ...row, sets: [set, ...row.sets] })

    // Flash the row briefly
    setFlashId(row.id)
    setTimeout(() => setFlashId(null), 500)
  }

  const totalSets = rows.reduce((n, r) => n + r.sets.length, 0)

  return (
    <div className={'detail-screen' + (isActive ? ' active' : '')}>
      {/* Header — matches other StandaloneScreens exactly */}
      <div className="ds-header" style={{ background: headerBg }}>
        <button className="ds-back" onClick={onBack}>&#8249;</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div className="ds-title">Workout</div>
          <div className="ds-subtitle">
            {totalSets === 0 ? 'Add exercises below' : `${totalSets} set${totalSets !== 1 ? 's' : ''} logged`}
          </div>
        </div>
        <div style={{ width: 36 }} /> {/* spacer to balance back button */}
      </div>

      {/* Body */}
      <div className="ds-body" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}>

        {/* Saved workouts — shown at top if any exist */}
        {(savedWorkouts || []).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="list-label">Saved workouts — tap to load</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {(savedWorkouts || []).map(w => (
                <div key={w.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0 }}>
                  <button
                    onClick={() => loadWorkout(w)}
                    style={{
                      height: 36, padding: '0 12px', borderRadius: '10px 0 0 10px',
                      border: '1.5px solid var(--btn-physical, #C06040)', borderRight: 'none',
                      background: 'rgba(192,96,64,0.08)',
                      color: 'var(--btn-physical, #C06040)',
                      fontFamily: 'var(--font-display)', fontSize: '0.88rem',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >{w.name}</button>
                  <button
                    onClick={() => deleteWorkout(w.id)}
                    style={{
                      height: 36, width: 28, borderRadius: '0 10px 10px 0',
                      border: '1.5px solid var(--btn-physical, #C06040)',
                      background: 'rgba(192,96,64,0.08)',
                      color: 'rgba(192,96,64,0.55)',
                      fontFamily: 'var(--font-body)', fontSize: '0.65rem',
                      cursor: 'pointer',
                    }}
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {rows.length === 0 && !showPicker && (
          <div className="ds-empty">Tap + to add your first exercise</div>
        )}

        {rows.map(row => (
          <ExerciseRow
            key={row.id}
            row={row}
            onUpdate={updateRow}
            onLog={logRow}
            onRemove={() => removeRow(row.id)}
            isFlashing={flashId === row.id}
          />
        ))}

        {/* Add exercise */}
        <button className="wk-add-btn" onClick={() => setShowPicker(true)}>
          <span style={{ fontSize: '1.25rem', lineHeight: 1, marginTop: -1 }}>+</span>
          Add exercise
        </button>

        {/* Save as workout — only show if there are exercises */}
        {rows.some(r => r.exercise) && (
          <button
            onClick={() => { setSaveNameVal(''); setShowSaveSheet(true) }}
            style={{
              width: '100%', height: 40, borderRadius: 14, marginTop: 8,
              border: '1.5px solid rgba(192,96,64,0.3)',
              background: 'transparent',
              color: 'var(--btn-physical, #C06040)',
              fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            💾 Save as workout
          </button>
        )}
      </div>

      {/* Exercise picker — opens on mount and when + is tapped */}
      {showPicker && isActive && (
        <ExercisePicker
          onSelect={ex => { addRow(ex); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Save workout sheet */}
      {showSaveSheet && (
        <BottomSheet onClose={() => setShowSaveSheet(false)}>
          <div style={{ padding: '8px 20px 20px' }}>
            <div className="list-label" style={{ marginBottom: 10 }}>Name this workout</div>
            <div style={{ marginBottom: 8, fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--text-lo)' }}>
              {rows.filter(r => r.exercise).map(r => r.exercise.label).join(', ')}
            </div>
            <input
              ref={saveNameRef}
              value={saveNameVal}
              onChange={e => setSaveNameVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveWorkout()}
              placeholder="e.g. Morning routine, Chest day…"
              style={{
                width: '100%', height: 48, borderRadius: 12,
                border: '1.5px solid var(--border, #ddd)',
                padding: '0 14px', fontSize: '1rem',
                fontFamily: 'var(--font-display)', color: 'var(--text-hi)',
                background: 'var(--bg-a, #fff)', outline: 'none', marginBottom: 12,
              }}
            />
            <button
              onClick={saveWorkout}
              style={{
                width: '100%', height: 48, borderRadius: 12, border: 'none',
                background: 'var(--btn-physical, #C06040)', color: '#fff',
                fontFamily: 'var(--font-display)', fontSize: '1rem', cursor: 'pointer',
              }}
            >Save workout</button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
