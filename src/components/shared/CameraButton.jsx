import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { savePhoto, resizePhoto, deletePhoto, loadPhotos, describePhotoAsync } from '../../hooks/usePhoto.js'

// ─────────────────────────────────────────────
// LIGHTBOX — full-width tap-to-dismiss preview
// ─────────────────────────────────────────────
export function PhotoLightbox({ src, onClose }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <img
        src={src}
        alt="memory"
        style={{
          width: '100%', maxWidth: 480,
          aspectRatio: '16/9',
          objectFit: 'cover',
          borderRadius: 14,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}
      />
      <div style={{
        position: 'absolute', bottom: '2rem', left: 0, right: 0,
        textAlign: 'center', fontSize: '0.65rem',
        color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em',
      }}>
        Tap anywhere to close
      </div>
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────
// PHOTO THUMBNAIL — tap to lightbox, ✕ to delete
// ─────────────────────────────────────────────
export function PhotoThumb({ photo, onDelete, style = {} }) {
  const [lightbox, setLightbox] = useState(false)

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block', ...style }}>
        <img
          src={photo.dataUrl}
          alt="memory"
          onClick={() => setLightbox(true)}
          style={{
            height: 96, aspectRatio: '16/9',
            objectFit: 'cover', borderRadius: 8, display: 'block',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            cursor: 'pointer',
          }}
        />
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(photo.id) }}
            style={{
              position: 'absolute', top: 4, right: 4,
              background: 'rgba(0,0,0,0.55)', border: 'none',
              borderRadius: '50%', color: '#fff',
              width: 20, height: 20, fontSize: '0.55rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', lineHeight: 1, padding: 0,
            }}
          >✕</button>
        )}
      </div>
      {lightbox && <PhotoLightbox src={photo.dataUrl} onClose={() => setLightbox(false)} />}
    </>
  )
}

// ─────────────────────────────────────────────
// CAMERA SCREEN — live viewfinder, 16:9 crop, pinch zoom
// ─────────────────────────────────────────────
function CameraScreen({ onClose, onSave, entryType }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const containerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [zoom, setZoom] = useState(0.85)
  const zoomRef = useRef(0.85)
  const lastDistRef = useRef(null)
  const fileRef = useRef(null)

  // Start camera — stop stream when closed to avoid iOS red indicator
  useEffect(() => {
    let cancelled = false
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setReady(true)
        }
      } catch {
        setError('Camera not available. Please allow camera access in Settings.')
      }
    }
    start()
    return () => {
      cancelled = true
      // Always stop tracks on unmount — prevents iOS red camera indicator
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  // Pinch to zoom handlers
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      lastDistRef.current = getDistance(e.touches)
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && lastDistRef.current !== null) {
      e.preventDefault()
      const dist = getDistance(e.touches)
      const delta = dist / lastDistRef.current
      lastDistRef.current = dist
      const newZoom = Math.min(4, Math.max(0.5, zoomRef.current * delta))
      zoomRef.current = newZoom
      setZoom(newZoom)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    lastDistRef.current = null
  }, [])

  // Capture with zoom crop
  const capture = useCallback(() => {
    if (!videoRef.current || !ready) return
    setCapturing(true)
    const video = videoRef.current
    const vw = video.videoWidth
    const vh = video.videoHeight
    const z = zoomRef.current

    // Apply zoom: shrink the source crop area by zoom factor (centred)
    const targetRatio = 16 / 9
    const srcRatio = vw / vh
    let sx, sy, sw, sh
    if (srcRatio > targetRatio) {
      sh = vh / z; sw = sh * targetRatio
      sx = (vw - sw) / 2; sy = (vh - sh) / 2
    } else {
      sw = vw / z; sh = sw / targetRatio
      sx = (vw - sw) / 2; sy = (vh - sh) * 0.5
    }

    const canvas = document.createElement('canvas')
    canvas.width = 480; canvas.height = 270
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 480, 270)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.65)
    streamRef.current?.getTracks().forEach(t => t.stop())
    const entry = savePhoto(dataUrl, { entryType })
    describePhotoAsync(entry.id, dataUrl) // fire and forget
    setCapturing(false)
    onSave(entry)
    onClose()
  }, [ready, entryType, onSave, onClose])

  // Library fallback
  const handleLibraryFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizePhoto(file)
      streamRef.current?.getTracks().forEach(t => t.stop())
      const entry = savePhoto(dataUrl, { entryType })
      describePhotoAsync(entry.id, dataUrl) // fire and forget
      onSave(entry)
      onClose()
    } catch {}
    e.target.value = ''
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', zIndex: 2000 }}>

      {/* Camera feed with pinch zoom */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <video
          ref={videoRef}
          playsInline muted
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.05s',
          }}
        />

        {/* 16:9 crop overlay */}
        {ready && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: '100%', background: 'rgba(0,0,0,0.52)', flex: 1 }} />
            <div style={{ display: 'flex', width: '100%', aspectRatio: '16/9' }}>
              <div style={{ background: 'rgba(0,0,0,0.52)', width: '3%' }} />
              <div style={{ flex: 1, border: '2px solid rgba(255,255,255,0.85)', borderRadius: 6, position: 'relative', boxSizing: 'border-box' }}>
                {[
                  { top:'0px', left:'0px', borderTop:'3px solid #fff', borderLeft:'3px solid #fff' },
                  { top:'0px', right:'0px', borderTop:'3px solid #fff', borderRight:'3px solid #fff' },
                  { bottom:'0px', left:'0px', borderBottom:'3px solid #fff', borderLeft:'3px solid #fff' },
                  { bottom:'0px', right:'0px', borderBottom:'3px solid #fff', borderRight:'3px solid #fff' },
                ].map((s, i) => <div key={i} style={{ position:'absolute', width:22, height:22, ...s }} />)}
                <div style={{ position:'absolute', bottom:6, right:8, fontSize:'0.58rem', color:'rgba(255,255,255,0.7)', fontWeight:700, letterSpacing:'0.1em' }}>
                  {zoom > 1.05 ? `${zoom.toFixed(1)}×` : '16:9'}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.52)', width: '3%' }} />
            </div>
            <div style={{ width: '100%', background: 'rgba(0,0,0,0.52)', flex: 1 }} />
          </div>
        )}

        {/* Top hints */}
        {ready && (
          <div style={{ position: 'absolute', top: 20, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: '0.3rem 0.9rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.75)' }}>
              Frame inside the box · Pinch to zoom
            </div>
          </div>
        )}

        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ color: '#fff', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.8 }}>{error}</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ background: '#111', padding: '1.25rem 2rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', cursor: 'pointer', padding: '0.5rem', minWidth: 64 }}>
          Cancel
        </button>
        <button
          onClick={capture}
          disabled={!ready || capturing}
          style={{
            width: 68, height: 68, borderRadius: '50%',
            background: ready ? '#fff' : 'rgba(255,255,255,0.3)',
            border: '4px solid rgba(255,255,255,0.25)',
            cursor: ready ? 'pointer' : 'default',
            boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
            transform: capturing ? 'scale(0.9)' : 'scale(1)',
            transition: 'transform 0.1s', flexShrink: 0,
          }}
        />
        <button onClick={() => fileRef.current?.click()} style={{
          background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10,
          padding: '0.5rem 0.75rem', color: 'rgba(255,255,255,0.7)',
          fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600, minWidth: 64,
        }}>Library</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleLibraryFile} style={{ display: 'none' }} />
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────
// CAMERA BUTTON — the small icon that triggers everything
// ─────────────────────────────────────────────
export default function CameraButton({ onSave, entryType, style = {} }) {
  const [showCamera, setShowCamera] = useState(false)

  const handleSave = (entry) => {
    if (entry && onSave) onSave(entry)
  }

  return (
    <>
      <button
        onClick={() => setShowCamera(true)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '2px 4px', display: 'flex', alignItems: 'center',
          opacity: 0.65, flexShrink: 0, color: 'inherit', ...style,
        }}
        aria-label="Add photo"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>
      {showCamera && (
        <CameraScreen
          entryType={entryType}
          onClose={() => setShowCamera(false)}
          onSave={handleSave}
        />
      )}
    </>
  )
}
