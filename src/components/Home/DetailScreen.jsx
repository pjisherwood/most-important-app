import { useState, useEffect, useRef } from 'react'
import { uid, isToday, fmtTime } from '../../hooks/utils.js'
import CameraButton, { PhotoThumb } from '../shared/CameraButton.jsx'
import { loadPhotos, deletePhoto } from '../../hooks/usePhoto.js'

export default function DetailScreen({
  isActive, q, onBack,
  nowItems, justItems, wouldItems,
  setNowItems, setJustItems, setWouldItems,
  sessionId, refreshQuote, allTimeTotal,
}) {
  const [draft, setDraft] = useState('')
  const [, setPhotoRefresh] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isActive) { setDraft(''); setTimeout(() => inputRef.current?.focus(), 350) }
  }, [isActive, q])

  const getItems = () => nowItems
  const setItems = (items) => setNowItems(items)

  const todayItems = [...nowItems, ...justItems, ...wouldItems].filter(i => isToday(i.ts))
  const todayCount = todayItems.length

  const submit = () => {
    if (!draft.trim()) return
    const entry = { id: uid(), ts: new Date().toISOString(), text: draft.trim(), sessionId, q: 'now' }
    setNowItems([entry, ...nowItems])
    setDraft('')
    refreshQuote()
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const todayNowItems = nowItems.filter(i => isToday(i.ts))

  return (
    <div className={'detail-screen' + (isActive ? ' active' : '')}>
      {/* Header */}
      <div className="ds-header" style={{ background: 'linear-gradient(135deg,var(--btn-enjoy),var(--btn-enjoy-dk))' }}>
        <button className="ds-back" onClick={onBack}>&#8249;</button>
        <div className="ds-title">What is good?</div>
        <div className="ds-stats">
          <div className="ds-stat">
            <span className="ds-stat-num">{todayCount}</span>
            <span className="ds-stat-label">Today</span>
          </div>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.3)' }} />
          <div className="ds-stat">
            <span className="ds-stat-num">{(nowItems.length + justItems.length + wouldItems.length).toLocaleString()}</span>
            <span className="ds-stat-label">All&#8209;time</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="ds-body">
        <div className="ds-input-wrap">
          <span style={{ fontSize: '0.85rem', opacity: 0.45 }}>✦</span>
          <input
            ref={inputRef}
            className="ds-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
            placeholder="Something good right now…"
          />
          <CameraButton
            entryType="Enjoy Now"
            style={{ color: 'var(--accent)' }}
            onSave={() => setPhotoRefresh(n => n + 1)}
          />
        </div>

        {(() => {
          const screenPhotos = loadPhotos().filter(p => isToday(p.ts) && p.entryType === 'Enjoy Now')
          const textItems = todayNowItems.map(i => ({ kind: 'text', ts: i.ts, item: i }))
          const photoItems = screenPhotos.map(p => ({ kind: 'photo', ts: p.ts, photo: p }))
          const merged = [...textItems, ...photoItems].sort((a, b) => new Date(b.ts) - new Date(a.ts))
          if (!merged.length) return (
            <div className="ds-empty">Notice something good&#8230;<br />every small thing counts</div>
          )
          return (
            <>
              <div className="list-label">Today</div>
              {merged.map(m => m.kind === 'photo' ? (
                <div key={m.photo.id} style={{ padding: '0.25rem 0' }}>
                  <PhotoThumb photo={m.photo}
                    onDelete={(id) => { deletePhoto(id); setPhotoRefresh(n => n + 1) }} />
                </div>
              ) : (
                <div key={m.item.id} className="ds-item">
                  <span style={{ fontSize: '0.5rem', marginTop: '0.24rem', opacity: 0.5 }}>&#9670;</span>
                  <span className="ds-item-text">{m.item.text}</span>
                  <button className="ds-item-del"
                    onClick={() => setNowItems(nowItems.filter(i => i.id !== m.item.id))}>&#10005;</button>
                </div>
              ))}
            </>
          )
        })()}
      </div>
    </div>
  )
}
