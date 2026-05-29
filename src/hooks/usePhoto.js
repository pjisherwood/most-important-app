// usePhoto.js — capture, resize to 16:9, store and auto-expire photos

const PHOTO_KEY = 'mih-photos'
const MAX_W = 480
const MAX_H = 270 // 16:9 at 480px wide
const JPEG_QUALITY = 0.65
const EXPIRE_DAYS = 30

export function loadPhotos() {
  try {
    const raw = localStorage.getItem(PHOTO_KEY)
    if (!raw) return []
    const all = JSON.parse(raw)
    // Auto-delete photos older than 30 days
    const cutoff = Date.now() - EXPIRE_DAYS * 24 * 60 * 60 * 1000
    const fresh = all.filter(p => new Date(p.ts).getTime() > cutoff)
    if (fresh.length !== all.length) localStorage.setItem(PHOTO_KEY, JSON.stringify(fresh))
    return fresh
  } catch { return [] }
}

export function savePhoto(dataUrl, meta = {}) {
  try {
    const photos = loadPhotos()
    const entry = {
      id: Math.random().toString(36).slice(2),
      ts: new Date().toISOString(),
      dataUrl,
      ...meta, // entryType, sessionId etc
    }
    photos.unshift(entry)
    localStorage.setItem(PHOTO_KEY, JSON.stringify(photos))
    return entry
  } catch (e) {
    console.warn('Photo save failed', e)
    return null
  }
}

export function deletePhoto(id) {
  try {
    const photos = loadPhotos().filter(p => p.id !== id)
    localStorage.setItem(PHOTO_KEY, JSON.stringify(photos))
  } catch {}
}

// Resize a File/Blob to 16:9 (480x270) and return a base64 JPEG string
export function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      // Crop to 16:9 from the centre
      const srcRatio = img.width / img.height
      const targetRatio = 16 / 9
      let sx, sy, sw, sh
      if (srcRatio > targetRatio) {
        // Image is wider — crop sides
        sh = img.height
        sw = sh * targetRatio
        sx = (img.width - sw) / 2
        sy = 0
      } else {
        // Image is taller — crop top/bottom, favour upper portion (more interesting)
        sw = img.width
        sh = sw / targetRatio
        sx = 0
        sy = (img.height - sh) * 0.35 // slightly above centre
      }
      const canvas = document.createElement('canvas')
      canvas.width = MAX_W
      canvas.height = MAX_H
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, MAX_W, MAX_H)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }
    img.onerror = reject
    img.src = url
  })
}
