import { useState, useRef } from 'react'
import { uid } from '../../hooks/utils.js'
import { DEFAULT_DREAM_CATS } from '../../constants/index.js'
import './Dreams.css'

// ── Compress image to max 800px wide, jpeg 0.75 quality ──
async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 800
      let { width, height } = img
      if (width > MAX) {
        height = Math.round((height * MAX) / width)
        width = MAX
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.src = url
  })
}

export default function DreamsTab({ dreams, setDreams, dreamCats, setDreamCats, logActivity }) {
  const [activeTab,  setActiveTab]  = useState('All')
  const [showEditor, setShowEditor] = useState(false)
  const [editDream,  setEditDream]  = useState(null)
  const [draftText,  setDraftText]  = useState('')
  const [draftCat,   setDraftCat]   = useState(dreamCats[0] || 'Travel')
  const [draftPhoto, setDraftPhoto] = useState(null)   // base64 string or null
  const [viewDream,  setViewDream]  = useState(null)   // full-screen card view
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef(null)

  const filtered = activeTab === 'All' ? dreams : dreams.filter(d => d.category === activeTab)

  const openNew = () => {
    setEditDream(null)
    setDraftText('')
    setDraftCat('None')
    setDraftPhoto(null)
    setShowEditor(true)
  }

  const openEdit = (d) => {
    setViewDream(null)
    setEditDream(d)
    setDraftText(d.text)
    setDraftCat(d.category)
    setDraftPhoto(d.photo || null)
    setShowEditor(true)
  }

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCompressing(true)
    const compressed = await compressImage(file)
    setDraftPhoto(compressed)
    setCompressing(false)
  }

  const saveDream = () => {
    if (!draftText.trim() && !draftPhoto) return
    if (editDream) {
      setDreams(dreams.map(d => d.id === editDream.id
        ? { ...d, text: draftText.trim(), category: draftCat, photo: draftPhoto }
        : d))
    } else {
      setDreams([{
        id: uid(),
        createdAt: new Date().toISOString(),
        text: draftText.trim(),
        category: draftCat,
        photo: draftPhoto,
      }, ...dreams])
      logActivity?.('dream', draftCat || 'Dream')
    }
    setShowEditor(false)
  }

  const deleteDream = () => {
    if (editDream) setDreams(dreams.filter(d => d.id !== editDream.id))
    setShowEditor(false)
    setViewDream(null)
  }

  return (
    <div className="tab-screen" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="dreams-header">
        <div className="dreams-eyebrow">Enjoy Your</div>
        <div className="dreams-title">Dreams</div>
        <div className="dreams-rule" />
        <div className="dreams-sub">Vision · Aspiration · Intention</div>
      </div>

      {/* Category tabs */}
      <div className="cat-tabs">
        <button className={`cat-tab${activeTab === 'All' ? ' active' : ''}`} onClick={() => setActiveTab('All')}>All</button>
        {dreamCats.map(c => (
          <button key={c} className={`cat-tab${activeTab === c ? ' active' : ''}`} onClick={() => setActiveTab(c)}>{c}</button>
        ))}
      </div>

      {/* Masonry grid */}
      <div className="dream-grid-wrap">
        {filtered.length === 0 ? (
          <div className="dream-empty">
            <div className="dream-empty-icon">✦</div>
            <div className="dream-empty-text">Your dreams live here.<br />Tap + to add your first vision.</div>
          </div>
        ) : (
          <div className="dream-grid">
            {filtered.map(d => (
              <div key={d.id} className="dream-card-outer">
                <div className="dream-card" onClick={() => setViewDream(d)}>
                  {d.photo
                    ? <img src={d.photo} alt="" className="dream-card-img" />
                    : <div className="dream-card-bar" />
                  }
                  <div className="dream-card-body">
                    {d.category && d.category !== 'None' && <div className="dream-card-cat">{d.category}</div>}
                    <div className="dream-card-text">{d.text}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={openNew}>+</button>

      {/* Full card view */}
      {viewDream && (
        <div className="dream-card-view" onClick={() => setViewDream(null)}>
          <div className="dream-card-view-inner" onClick={e => e.stopPropagation()}>
            <button className="dream-view-close" onClick={() => setViewDream(null)}>✕</button>
            {viewDream.photo
              ? <img src={viewDream.photo} alt="" className="dream-view-img" />
              : <div className="dream-view-placeholder" />
            }
            <div className="dream-view-body">
              {viewDream.category && viewDream.category !== 'None' && <div className="dream-card-cat">{viewDream.category}</div>}
              <div className="dream-view-text">{viewDream.text}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="editor-btn-cancel" style={{ flex: 1 }} onClick={() => setViewDream(null)}>Close</button>
                <button className="editor-btn-save"   style={{ flex: 1 }} onClick={() => openEdit(viewDream)}>Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor sheet */}
      {showEditor && (
        <div className="editor-overlay" onClick={() => setShowEditor(false)}>
          <div className="editor-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <span className="sheet-title">{editDream ? 'Edit dream' : 'Add a dream'}</span>
              <button className="close-x" onClick={() => setShowEditor(false)}>✕</button>
            </div>

            {/* Photo zone */}
            <div className="dream-photo-zone" onClick={() => fileInputRef.current?.click()}>
              {compressing ? (
                <div className="dream-photo-hint">
                  <span style={{ fontSize: '1.5rem' }}>⏳</span>
                  <span>Compressing photo…</span>
                </div>
              ) : draftPhoto ? (
                <>
                  <img src={draftPhoto} alt="" className="dream-photo-preview" />
                  <button className="dream-photo-remove"
                    onClick={e => { e.stopPropagation(); setDraftPhoto(null) }}>✕</button>
                </>
              ) : (
                <div className="dream-photo-hint">
                  <span style={{ fontSize: '1.5rem' }}>📷</span>
                  <span>Tap to add a photo</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={handlePhotoSelect} />

            <div className="editor-field">
              <label className="editor-label">Your dream or vision</label>
              <textarea className="editor-textarea" rows={3}
                value={draftText} onChange={e => setDraftText(e.target.value)}
                placeholder="Describe your dream…"
                autoFocus
              />
            </div>

            <div className="editor-field">
              <label className="editor-label">Category</label>
              <div className="cat-chip-row">
                <button
                  className={`cat-chip${draftCat === 'None' ? ' active' : ''}`}
                  onClick={() => setDraftCat('None')}>None</button>
                {dreamCats.map(c => (
                  <button key={c}
                    className={`cat-chip${draftCat === c ? ' active' : ''}`}
                    onClick={() => setDraftCat(c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="editor-actions">
              <button className="editor-btn-cancel" onClick={() => setShowEditor(false)}>Cancel</button>
              <button className="editor-btn-save" onClick={saveDream}>Save</button>
            </div>

            {editDream && (
              <button className="btn-delete" onClick={deleteDream}>Delete dream</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
