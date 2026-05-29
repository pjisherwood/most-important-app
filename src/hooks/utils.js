// ══════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export const dayKey = (ts) => new Date(ts).toDateString()

export const isToday = (ts) => dayKey(ts) === new Date().toDateString()

export const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export const fmtHour = (ts) => {
  const h = new Date(ts).getHours()
  if (h === 0) return '12 am'
  if (h < 12) return `${h} am`
  if (h === 12) return '12 pm'
  return `${h - 12} pm`
}

export const fmtDateShort = (ts) =>
  new Date(ts).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

export const calcStreak = (timestamps) => {
  if (!timestamps.length) return 0
  const days = [...new Set(timestamps.map(dayKey))].sort((a, b) => new Date(b) - new Date(a))
  const today = new Date().toDateString()
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()
  // Allow streak to stand if most recent day is today OR yesterday
  // (yesterday = streak intact but not yet meditated today)
  if (days[0] !== today && days[0] !== yesterdayStr) return 0
  let s = 0
  for (let i = 0; i < days.length; i++) {
    const exp = new Date()
    // If today not yet meditated, start counting from yesterday
    if (days[0] === yesterdayStr) exp.setDate(exp.getDate() - 1 - i)
    else exp.setDate(exp.getDate() - i)
    if (exp.toDateString() === days[i]) s++; else break
  }
  return s
}

export const qLabel = (q) => ({ now: 'Now', just: 'Before', would: 'Would' }[q] || q)

export const getRandomQuote = () => {
  const QUOTES = [
    "Notice what is good right now",
    "Find one thing to appreciate",
    "Your attention shapes your experience",
    "What you focus on grows",
    "Every moment holds something good",
    "Pause and breathe it in",
    "Joy lives in small moments",
    "You are enough, right now",
    "This moment is enough",
    "Gratitude opens every door",
    "Your thoughts create your feelings",
    "Choose the thought that feels better",
    "Small joys matter most",
    "Savour what is already yours",
    "You deserve kindness, especially from yourself",
    "Begin right where you are",
  ]
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}

// ── Derive a pale tint from a hex colour ──────
// Blends colour toward white at a given strength (0–1)
export const paleTint = (hex, strength = 0.15) => {
  if (!hex || !hex.startsWith('#')) return 'rgba(200,200,200,0.15)'
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const ro = Math.round(r + (255 - r) * (1 - strength))
  const go = Math.round(g + (255 - g) * (1 - strength))
  const bo = Math.round(b + (255 - b) * (1 - strength))
  return `rgba(${ro},${go},${bo},0.55)`
}
