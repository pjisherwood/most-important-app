import { useState, useEffect, useRef } from 'react'
import { uid } from '../../hooks/utils.js'
import { NOTE_BG_COLORS, NOTE_TEXT_COLORS } from '../../constants/index.js'
import './Notes.css'

// Folder icon colours to choose from
const FOLDER_COLORS = [
  '#6B96D6', '#7AAAE0', '#9898E0', '#DE83CB', '#0aabbb',
  '#76C474', '#FFD850', '#FF8701', '#E8604A', '#A07858',
  '#b06ad4', '#038492', '#1D9642', '#C86000', '#524094',
]

// ── Colour picker ─────────────────────────────
function ColorPicker({ current, label, onChange, onClose }) {
  const colors = label === 'text' ? NOTE_TEXT_COLORS : NOTE_BG_COLORS
  return (
    <div className="nv2-color-overlay" onClick={onClose}>
      <div className="nv2-color-picker" onClick={e => e.stopPropagation()}>
        <div className="nv2-color-picker-head">
          <span className="nv2-color-picker-title">
            {label === 'text' ? 'Text colour' : 'Background colour'}
          </span>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div className="nv2-color-grid">
          {colors.map(c => (
            <div key={c}
              className={`nv2-color-dot${current === c ? ' sel' : ''}`}
              style={{ background: c }}
              onClick={() => { onChange(c); onClose() }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Folder colour picker ──────────────────────
function FolderColorPicker({ current, onChange, onClose }) {
  return (
    <div className="nv2-color-overlay" onClick={onClose}>
      <div className="nv2-color-picker" onClick={e => e.stopPropagation()}>
        <div className="nv2-color-picker-head">
          <span className="nv2-color-picker-title">Folder colour</span>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div className="nv2-color-grid">
          {FOLDER_COLORS.map(c => (
            <div key={c}
              className={`nv2-color-dot${current === c ? ' sel' : ''}`}
              style={{ background: c }}
              onClick={() => { onChange(c); onClose() }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Move-to-folder sheet ──────────────────────
function MoveFolderSheet({ note, noteFolders, onMove, onClose }) {
  return (
    <div className="nv2-color-overlay" onClick={onClose}>
      <div className="nv2-color-picker" style={{ padding: '1rem 1rem 2rem' }} onClick={e => e.stopPropagation()}>
        <div className="nv2-color-picker-head">
          <span className="nv2-color-picker-title">Move to folder</span>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {/* Unfiled option */}
          <button
            onClick={() => onMove(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 11,
              border: '1.5px solid var(--border)',
              background: note.folderId === null ? 'var(--accent-soft)' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer', width: '100%', textAlign: 'left',
            }}>
            <span style={{ fontSize: '1.2rem' }}>📄</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-hi)' }}>
              Unfiled
            </span>
            {note.folderId === null && <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>✓</span>}
          </button>
          {noteFolders.map(f => (
            <button key={f.id}
              onClick={() => onMove(f.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 11,
                border: '1.5px solid var(--border)',
                background: note.folderId === f.id ? 'var(--accent-soft)' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer', width: '100%', textAlign: 'left',
              }}>
              <span style={{ fontSize: '1.2rem', color: f.color || 'var(--accent)' }}>📁</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-hi)' }}>
                {f.name}
              </span>
              {note.folderId === f.id && <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>✓</span>}
            </button>
          ))}
          {noteFolders.length === 0 && (
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--text-lo)', textAlign: 'center', padding: '8px 0' }}>
              No folders yet — create one first
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Note editor ───────────────────────────────
// Paragraphs are stored as an array: { text, fmt: { bold, serif, bigger, bullet } }

// Extract plain text snippet from serialized paragraph body
function bodyPreview(body) {
  if (!body) return ''
  try {
    const paras = JSON.parse(body)
    if (Array.isArray(paras)) {
      return paras.map(p => p.text).filter(Boolean).join(' ')
    }
  } catch {}
  return body
}

function parseParagraphs(body) {
  if (!body) return [{ text: '', fmt: { bold: false, serif: false, bigger: false, bullet: false } }]
  try {
    const parsed = JSON.parse(body)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  // Legacy plain text — convert to single paragraph
  return [{ text: body, fmt: { bold: false, serif: false, bigger: false, bullet: false } }]
}

function serializeParagraphs(paras) {
  return JSON.stringify(paras)
}

function NoteEditor({ note, noteFolders, onSave, onDelete, onCancel, defaultFolderId }) {
  const editorRef = useRef(null)

  useEffect(() => {
    const vp = window.visualViewport
    if (!vp) return
    const update = () => {
      if (editorRef.current) {
        editorRef.current.style.height = vp.height + 'px'
        editorRef.current.style.top = vp.offsetTop + 'px'
      }
    }
    vp.addEventListener('resize', update)
    vp.addEventListener('scroll', update)
    update()
    return () => {
      vp.removeEventListener('resize', update)
      vp.removeEventListener('scroll', update)
    }
  }, [])

  const [title,    setTitle]    = useState(note?.title || '')

  const insertTimestamp = () => {
    const now = new Date()
    const time = now.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
    const day = now.toLocaleDateString('en-GB', { weekday: 'short' })
    const date = now.getDate()
    const month = now.toLocaleDateString('en-GB', { month: 'long' })
    setTitle(time + ' ' + day + ' ' + date + ' ' + month)
    titleRef.current?.focus()
  }

  const [bgColor,  setBgColor]  = useState(note?.color     || '#FFFEF9')
  const [txtColor, setTxtColor] = useState(note?.textColor || '#1a1a1a')
  const [picker,   setPicker]   = useState(null)
  const [showMove, setShowMove] = useState(false)
  const [showMoreTools, setShowMoreTools] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [folderId, setFolderId] = useState(note?.folderId !== undefined ? note.folderId : (defaultFolderId || null))

  // Paragraph-based body
  const [paras, setParas] = useState(() => parseParagraphs(note?.body))
  const [curPara, setCurPara] = useState(0)  // which paragraph is focused

  const titleRef = useRef(null)
  const textRefs = useRef([])

  useEffect(() => { setTimeout(() => textRefs.current[0]?.focus(), 120) }, [])

  const currentFmt = paras[curPara]?.fmt || { bold: false, serif: false, bigger: false, bullet: false }

  // Update a paragraph's text
  const updateParaText = (idx, text) => {
    setParas(prev => prev.map((p, i) => i === idx ? { ...p, text } : p))
  }

  // Toggle a format on the current paragraph
  const toggleFmt = (key) => {
    setParas(prev => prev.map((p, i) =>
      i === curPara ? { ...p, fmt: { ...p.fmt, [key]: !p.fmt[key] } } : p
    ))
  }

  // Handle Enter — new paragraph carrying forward formatting
  const handleKeyDown = (idx, e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const newPara = { text: '', fmt: { ...paras[idx].fmt } }
      setParas(prev => {
        const updated = [...prev]
        updated.splice(idx + 1, 0, newPara)
        return updated
      })
      setCurPara(idx + 1)
      setTimeout(() => textRefs.current[idx + 1]?.focus(), 30)
    }
    // Handle Backspace on empty paragraph — remove it
    if (e.key === 'Backspace' && paras[idx].text === '' && paras.length > 1) {
      e.preventDefault()
      setParas(prev => prev.filter((_, i) => i !== idx))
      const newIdx = Math.max(0, idx - 1)
      setCurPara(newIdx)
      setTimeout(() => textRefs.current[newIdx]?.focus(), 30)
    }
  }

  const handleSave = () => {
    onSave({
      title: title.trim() || 'Untitled',
      body: serializeParagraphs(paras),
      color: bgColor, textColor: txtColor,
      formatting: {},
      folderId,
    })
  }

  const currentFolderName = folderId
    ? noteFolders.find(f => f.id === folderId)?.name || 'Folder'
    : 'Unfiled'

  const BulletChar = '•'  // Large bullet •

  return (
    <div ref={editorRef} className="nv2-editor-screen" style={{ background: bgColor }}>
      {/* Header */}
      <div className="nv2-editor-header" style={{ background: bgColor }}>
        <button className="nv2-editor-cancel" onClick={onCancel}>Cancel</button>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setShowMove(true)} style={{
            fontSize: '0.78rem', fontFamily: 'var(--font-body)', fontWeight: 700,
            letterSpacing: '0.04em', padding: '7px 14px', borderRadius: 20,
            border: '1.5px solid var(--accent)', background: 'var(--accent-soft)',
            color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {currentFolderName === 'Unfiled' ? 'Choose folder' : currentFolderName} ›
          </button>
          {note && <button className="nv2-editor-delete" onClick={() => setConfirmDelete(true)}>🗑</button>}
        </div>
        <button className="nv2-editor-save" onClick={handleSave}>Save</button>
      </div>

      {/* Title row — input + timestamp button */}
      <div style={{ display: 'flex', alignItems: 'center', background: bgColor }}>
        <input ref={titleRef} className="nv2-title-input"
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Title" style={{ background: bgColor, color: txtColor, flex: 1 }}
          inputMode="text" autoCapitalize="sentences" autoComplete="off"
        />
        {!title && (
          <button onClick={insertTimestamp} style={{
            flexShrink: 0, marginRight: '1.1rem',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: '1.4rem', fontWeight: 600,
            color: 'var(--accent)',
            opacity: 0.7,
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            whiteSpace: 'nowrap',
            padding: 0,
          }}>
            or use timestamp
          </button>
        )}
      </div>
      <div className="nv2-title-divider" />

      {/* Paragraph editor */}
      <div className="nv2-body-area">
        {paras.map((para, idx) => {
          const { bold, serif, bigger, bullet } = para.fmt
          const paraStyle = {
            fontFamily: serif ? "'Cormorant Garamond',serif" : "'Raleway',sans-serif",
            fontSize:   bigger ? '1.15rem' : '0.95rem',
            fontWeight: bold ? 700 : 400,
            lineHeight: bigger ? 1.7 : 1.85,
            color: txtColor,
            background: 'transparent',
            border: 'none', outline: 'none', resize: 'none',
            width: bullet ? 'calc(100% - 1.6rem)' : '100%',
            padding: 0, margin: 0,
          }
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: '0.15rem' }}>
              {bullet && (
                <span style={{
                  fontSize: bigger ? '1.15rem' : '0.95rem',
                  lineHeight: bigger ? 1.7 : 1.85,
                  color: txtColor, flexShrink: 0,
                  fontWeight: 400,
                  paddingTop: '0.05em',
                }}>{BulletChar}</span>
              )}
              <textarea
                ref={el => textRefs.current[idx] = el}
                className="nv2-para-input"
                value={para.text}
                onChange={e => updateParaText(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                onFocus={() => setCurPara(idx)}
                placeholder={idx === 0 ? 'Write something good…' : ''}
                rows={1}
                style={paraStyle}
                enterKeyHint="enter"
                inputMode="text"
                autoCapitalize="sentences"
                autoComplete="off"
                autoCorrect="on"
                spellCheck="true"
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Toolbar — in flex flow, always at bottom of editor */}
      <div className="nv2-toolbar nv2-toolbar-single">
        {/* Core format buttons — onMouseDown preventDefault keeps keyboard visible */}
        <button className={`nv2-tb-btn${currentFmt.bold ? ' on' : ''}`} onMouseDown={e => e.preventDefault()} onClick={() => toggleFmt('bold')}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>B</span>
        </button>
        <button className={`nv2-tb-btn${currentFmt.bigger ? ' on' : ''}`} onMouseDown={e => e.preventDefault()} onClick={() => toggleFmt('bigger')}>
          <span style={{ fontSize: '0.55rem' }}>a</span><span style={{ fontSize: '0.9rem' }}>A</span>
        </button>
        <button className={`nv2-tb-btn${currentFmt.serif ? ' on' : ''}`} onMouseDown={e => e.preventDefault()} onClick={() => toggleFmt('serif')}>
          <span style={{ fontFamily: "'Raleway',sans-serif", opacity: currentFmt.serif ? 0.3 : 1, fontSize: '0.82rem' }}>A</span>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', opacity: currentFmt.serif ? 1 : 0.3, fontSize: '0.9rem' }}>A</span>
        </button>
        <button className={`nv2-tb-btn${currentFmt.bullet ? ' on' : ''}`} onMouseDown={e => e.preventDefault()} onClick={() => toggleFmt('bullet')}
          title="Bullet point">
          <span style={{ fontSize: '1.1rem', lineHeight: 1, fontWeight: 700 }}>{BulletChar}</span>
        </button>

        <div className="nv2-tb-sep" />

        {/* Colour swatches with labels */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} onMouseDown={e => e.preventDefault()} onClick={() => setPicker('text')}>
          <span style={{ fontSize: '0.58rem', color: 'rgba(0,0,0,0.4)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Text</span>
          <div className="nv2-tb-swatch" style={{ background: txtColor }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} onMouseDown={e => e.preventDefault()} onClick={() => setPicker('bg')}>
          <span style={{ fontSize: '0.58rem', color: 'rgba(0,0,0,0.4)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Page</span>
          <div className="nv2-tb-swatch" style={{ background: bgColor, border: '1.5px solid rgba(0,0,0,0.15)' }} />
        </div>
      </div>

      {/* Spacer so body content clears the fixed toolbar */}
      <div className="nv2-toolbar-spacer" />

      {picker && (
        <ColorPicker current={picker === 'text' ? txtColor : bgColor} label={picker}
          onChange={picker === 'text' ? setTxtColor : setBgColor}
          onClose={() => setPicker(null)} />
      )}

      {showMove && (
        <MoveFolderSheet
          note={{ folderId }}
          noteFolders={noteFolders}
          onMove={(id) => { setFolderId(id); setShowMove(false) }}
          onClose={() => setShowMove(false)}
        />
      )}

      {confirmDelete && (
        <div className="nv2-confirm-overlay">
          <div className="nv2-confirm-box">
            <div className="nv2-confirm-title">Delete note?</div>
            <div className="nv2-confirm-sub">This cannot be undone.</div>
            <div className="nv2-confirm-row">
              <button className="btn-keep" onClick={() => setConfirmDelete(false)}>Keep</button>
              <button className="btn-del" onClick={onDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Note read view ────────────────────────────
function NoteRead({ note, onBack, onEdit }) {
  const txtColor = note.textColor || '#1a1a1a'
  const BulletChar = '•'

  // Parse paragraphs (supports both new JSON format and legacy plain text)
  const paras = (() => {
    if (!note.body) return []
    try {
      const parsed = JSON.parse(note.body)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    return [{ text: note.body, fmt: { bold: false, serif: false, bigger: false, bullet: false } }]
  })()

  return (
    <div className="nv2-read-screen" style={{ background: note.color || '#fff' }}>
      <div className="nv2-read-header" style={{ background: note.color || '#fff' }}>
        <button className="nv2-read-back" onClick={onBack}>‹ Notes</button>
        <button className="nv2-read-edit-btn" onClick={onEdit}>Edit</button>
      </div>
      <div className="nv2-read-body">
        <div className="nv2-read-title" style={{ color: txtColor }}>
          {note.title || 'Untitled'}
        </div>
        {paras.map((para, i) => {
          const { bold, serif, bigger, bullet } = para.fmt || {}
          const style = {
            fontFamily: serif ? "'Cormorant Garamond',serif" : "'Raleway',sans-serif",
            fontSize:   bigger ? '1.1rem' : '0.95rem',
            fontWeight: bold ? 700 : 400,
            lineHeight: bigger ? 1.7 : 1.85,
            color: txtColor,
            marginBottom: '0.2rem',
            display: 'flex', gap: 6, alignItems: 'flex-start',
          }
          return (
            <div key={i} style={style}>
              {bullet && <span style={{ fontSize: bigger ? '1.3rem' : '1.1rem', fontWeight: 700, flexShrink: 0 }}>{BulletChar}</span>}
              <span>{para.text}</span>
            </div>
          )
        })}
        <div className="nv2-read-meta">
          {new Date(note.timestamp).toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main Notes component ──────────────────────
export default function NotesTab({ notes, setNotes, noteFolders, setNoteFolders, logActivity }) {
  const [viewFolder,      setViewFolder]      = useState(null)
  const [readNote,        setReadNote]        = useState(null)
  const [editingNote,     setEditingNote]     = useState(null)

  const openEditor = (note) => {
    setEditingNote(note)
    if (onEditingChange) onEditingChange(true)
  }

  const [renamingFolder,  setRenamingFolder]  = useState(null)
  const [renameVal,       setRenameVal]       = useState('')
  const [showFolderColor, setShowFolderColor] = useState(false)
  const [pendingColor,    setPendingColor]    = useState(null)

  const unfiledNotes = notes.filter(n => !n.folderId)
  const folderNotes  = (fid) => notes.filter(n => n.folderId === fid)

  const saveNote = (data) => {
    const now = new Date().toISOString()
    if (editingNote && editingNote !== 'new') {
      setNotes(notes.map(n => n.id === editingNote.id ? { ...n, ...data, timestamp: now } : n))
    } else {
      // Default folder = current context: inside a folder → that folder, at root → unfiled
      const defaultFolderId = viewFolder || null
      // Only apply default if user hasn't explicitly chosen a folder in the editor
      const folderId = data.folderId !== undefined ? data.folderId : defaultFolderId
      setNotes([{ id: uid(), timestamp: now, folderId, ...data }, ...notes])
      // Log to activity timeline
      const folderName = noteFolders.find(f => f.id === folderId)?.name || 'Note'
      logActivity?.('note', folderName)
    }
    setEditingNote(null)
    setReadNote(null)
    if (onEditingChange) onEditingChange(false)
  }

  const deleteNote = () => {
    if (editingNote && editingNote !== 'new') {
      setNotes(notes.filter(n => n.id !== editingNote.id))
    }
    setEditingNote(null)
    setReadNote(null)
    if (onEditingChange) onEditingChange(false)
  }

  const addFolder = () => {
    const accentColor = getComputedStyle(document.getElementById('app-root')).getPropertyValue('--accent').trim() || '#6B96D6'; const f = { id: uid(), name: 'New Folder', color: accentColor, timestamp: new Date().toISOString() }
    setNoteFolders([...noteFolders, f])
    setRenamingFolder(f.id)
    setRenameVal(f.name)
    setPendingColor(f.color)
  }

  const saveRename = () => {
    if (renameVal.trim()) {
      setNoteFolders(noteFolders.map(f =>
        f.id === renamingFolder ? { ...f, name: renameVal.trim(), color: pendingColor || f.color } : f
      ))
    }
    setRenamingFolder(null)
    setShowFolderColor(false)
  }

  const deleteFolder = () => {
    setNotes(notes.map(n => n.folderId === renamingFolder ? { ...n, folderId: null } : n))
    setNoteFolders(noteFolders.filter(f => f.id !== renamingFolder))
    setRenamingFolder(null)
    setShowFolderColor(false)
  }

  const displayNotes = viewFolder ? folderNotes(viewFolder) : null

  const NoteStrip = ({ n }) => (
    <div className="nv2-strip" style={{ background: n.color || '#fff' }} onClick={() => setReadNote(n)}>
      <div className="nv2-strip-title" style={{ color: n.textColor || '#1a1a1a' }}>{n.title || 'Untitled'}</div>
      <div className="nv2-strip-body">{bodyPreview(n.body)}</div>
      <div className="nv2-strip-date">
        {new Date(n.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
    </div>
  )

  return (
    <div className="nv2-screen">
      {!viewFolder ? (
        <>
          <div className="nv2-header" style={{flexDirection:'column',alignItems:'center',gap:'0.06rem',paddingBottom:'0.5rem'}}>
            <div style={{display:'flex',width:'100%',alignItems:'center',justifyContent:'center',position:'relative'}}>
              <div className="dreams-eyebrow">A Space For</div>
            </div>
            <div className="med-app-title" style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.8rem,7vw,2.5rem)',fontWeight:500,color:'var(--text-hi)',lineHeight:1}}>Notes</div>
            <div className="dreams-rule" />
            <div className="dreams-sub">Inspiration · Ideas · Reflection</div>
            <button className="nv2-header-btn" style={{position:'absolute',right:'1rem',top:'calc(env(safe-area-inset-top) + 1rem)'}} onClick={() => openEditor('new')}>+</button>
          </div>

          <div className="nv2-list-body">
            <div className="nv2-half">
              <div className="nv2-section-label">Unfiled</div>
              <div className="nv2-unfiled-scroll">
                {unfiledNotes.length === 0
                  ? <div className="nv2-empty-strip">No unfiled notes</div>
                  : unfiledNotes.map(n => <NoteStrip key={n.id} n={n} />)
                }
              </div>
            </div>

            <div className="nv2-divider" />

            <div className="nv2-half">
              <div className="nv2-section-label">Folders</div>
              <div className="nv2-folders-scroll">
            <button className="nv2-add-folder" onClick={addFolder}>+ New Folder</button>
            {noteFolders.map(f => (
              <div key={f.id} className="nv2-folder-row"
                style={{ background: f.color || 'var(--accent)' }}
                onClick={() => setViewFolder(f.id)}>
                <div className="nv2-folder-info">
                  <div className="nv2-folder-name">{f.name}</div>
                  <div className="nv2-folder-count">
                    {folderNotes(f.id).length} {folderNotes(f.id).length === 1 ? 'note' : 'notes'}
                  </div>
                </div>
                <button className="nv2-folder-edit-btn"
                  onClick={e => {
                    e.stopPropagation()
                    setRenamingFolder(f.id)
                    setRenameVal(f.name)
                    setPendingColor(f.color || 'var(--accent)')
                  }}>✎</button>
              </div>
            ))}
            {noteFolders.length === 0 && (
              <div className="nv2-empty-strip">Tap + New Folder to organise your notes</div>
            )}
          </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="nv2-back-header"
            style={{ background: noteFolders.find(f => f.id === viewFolder)?.color || 'var(--accent)' }}>
            <button className="nv2-back-btn" onClick={() => setViewFolder(null)}>‹</button>
            <div className="nv2-folder-screen-name">
              {noteFolders.find(f => f.id === viewFolder)?.name || 'Folder'}
            </div>
            <button className="nv2-folder-edit-btn" style={{ marginRight: 6 }}
              onClick={() => {
                const f = noteFolders.find(f => f.id === viewFolder)
                if (f) { setRenamingFolder(f.id); setRenameVal(f.name); setPendingColor(f.color || 'var(--accent)') }
              }}>✎</button>
            <button className="nv2-header-btn" style={{ background: 'rgba(255,255,255,0.25)', border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff' }} onClick={() => openEditor('new')}>+</button>
          </div>
          <div className="nv2-unfiled-scroll" style={{ maxHeight: '80%', flex: 1 }}>
            {displayNotes?.length === 0
              ? <div className="nv2-empty-strip">No notes in this folder yet</div>
              : displayNotes?.map(n => <NoteStrip key={n.id} n={n} />)
            }
          </div>
        </>
      )}

      {readNote && !editingNote && (
        <NoteRead note={readNote} onBack={() => setReadNote(null)} onEdit={() => openEditor(readNote)} />
      )}

      {editingNote && (
        <NoteEditor
          note={editingNote === 'new' ? null : editingNote}
          noteFolders={noteFolders}
          onSave={saveNote}
          onDelete={deleteNote}
          onCancel={() => { setEditingNote(null); if (onEditingChange) onEditingChange(false) }}
          defaultFolderId={viewFolder || null}
        />
      )}

      {/* Rename / edit folder sheet */}
      {renamingFolder && (
        <div className="nv2-rename-overlay" onClick={() => { setRenamingFolder(null); setShowFolderColor(false) }}>
          <div className="nv2-rename-sheet" onClick={e => e.stopPropagation()}>
            <div className="nv2-rename-title">Edit Folder</div>

            {/* Folder colour */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: 8 }}>
                Folder colour
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FOLDER_COLORS.map(c => (
                  <div key={c}
                    onClick={() => setPendingColor(c)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: c, cursor: 'pointer',
                      border: pendingColor === c ? '3px solid rgba(0,0,0,0.5)' : '2px solid transparent',
                      transform: pendingColor === c ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.15s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                    }}
                  />
                ))}
              </div>
            </div>

            <input className="nv2-rename-input"
              value={renameVal} onChange={e => setRenameVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveRename() }}
              placeholder="Folder name"
              autoFocus
            />
            <div className="nv2-rename-btns">
              <button className="nv2-rename-cancel" onClick={() => { setRenamingFolder(null); setShowFolderColor(false) }}>Cancel</button>
              <button className="nv2-rename-delete" onClick={deleteFolder}>Delete</button>
              <button className="nv2-rename-save" onClick={saveRename}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
