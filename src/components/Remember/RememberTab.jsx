// RememberTab.jsx — AI-powered memory search for The Most Important Hour
// Reference implementation: remember-all.html (doAsk, insertCard, updateCard, stripMd)
// iOS PWA compatible: overflow-y:auto, flex:1, min-height:0, flex-shrink:0

import { useState, useRef } from 'react'
import useVoice from '../../hooks/useVoice.js'
import VoiceBar from '../shared/VoiceBar.jsx'

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtDayDateTime(ts) {
  const d = new Date(ts)
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
    + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Adapted from remember-all.html stripMd — removes markdown formatting from AI responses
function stripMd(s) {
  return (s || '')
    .replace(/#{1,6} */g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[\-\*] +/gm, '')
    .replace(/\n\n\n+/g, '\n\n')
    .replace(/^(image description|detailed factual record|setting|objects|text visible|description)\s*\n/gim, '')
    .trim()
}

// ── Context builder — reads all MIH localStorage keys ────────────────────────

function buildContext() {
  const CATEGORY_KEYS = [
    { key: 'ci-now',             label: 'Enjoying Now' },
    { key: 'ci-just',            label: 'Just Done' },
    { key: 'ci-would',           label: 'Would Like To' },
    { key: 'today-entries',      label: 'Today' },
    { key: 'insp-entries',       label: 'Inspiration' },
    { key: 'ideas-entries',      label: 'Ideas' },
    { key: 'plan-entries',       label: 'Planning' },
    { key: 'highlights-entries', label: 'Highlights' },
    { key: 'physical-entries',   label: 'Physical' },
    { key: 'activity-log',       label: 'Activity' },
  ]

  const lines = []

  // Standard entry arrays
  CATEGORY_KEYS.forEach(({ key, label }) => {
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]')
      if (!Array.isArray(arr)) return
      arr.forEach(e => {
        const text = e.text || e.label || e.note || ''
        if (!text.trim()) return
        lines.push(`[${label} — ${fmtDayDateTime(e.ts)}]\n${text.trim()}`)
      })
    } catch {}
  })

  // Photos — only those with AI descriptions
  try {
    const photos = JSON.parse(localStorage.getItem('mih-photos') || '[]')
    photos.forEach(p => {
      if (!p.photoDesc) return
      const category = p.entryType || 'photo'
      lines.push(`[Photo from ${category} — ${fmtDayDateTime(p.ts)}]\n${p.photoDesc.trim()}`)
    })
  } catch {}

  // Notes
  try {
    const notes = JSON.parse(localStorage.getItem('notes-v4') || '[]')
    notes.forEach(n => {
      const title = n.title || 'Untitled'
      const body = n.body || n.text || ''
      if (!body.trim()) return
      lines.push(`[Note: ${title} — ${fmtDayDateTime(n.updatedAt || n.ts || new Date().toISOString())}]\n${body.trim()}`)
    })
  } catch {}

  // Dreams
  try {
    const dreams = JSON.parse(localStorage.getItem('dreams') || '[]')
    dreams.forEach(d => {
      const text = d.text || d.content || ''
      if (!text.trim()) return
      lines.push(`[Dream — ${fmtDayDateTime(d.ts)}]\n${text.trim()}`)
    })
  } catch {}

  // Meditations
  try {
    const meds = JSON.parse(localStorage.getItem('meditations') || '[]')
    meds.forEach(m => {
      lines.push(`[Meditation — ${fmtDayDateTime(m.ts)}]\n${m.duration || '?'} minutes`)
    })
  } catch {}

  // Sort all lines by timestamp (extracted from header)
  // Return as a single joined string, capped for context window
  return lines.join('\n\n').slice(0, 60000)
}

// ── System prompt — use exactly as specified, do not modify ───────────────────

const SYSTEM_PROMPT = `You are a deeply personal memory assistant — a second self for the user. Your job is to help them recall, connect, and reflect on their life using everything they have captured.

WHAT YOU HAVE ACCESS TO:
- Daily notes, voice entries, and written thoughts — often brief, shorthand, or partial. Treat them as a smart human reader would: read between the lines, infer context from surrounding entries, and piece together meaning from fragments.
- Photo entries from mih-photos — AI descriptions of images the user captured. When asked about images or what they saw, look here.
- Enjoying Now, Planning, Highlights, Physical, Ideas, Dreams, Meditation sessions — moments and thoughts from their life.
- Notes — longer written thoughts.

HOW TO THINK AND ANSWER:
- Reason freely and intelligently, exactly as you would in a normal conversation. Connect dots, make inferences, interpret abbreviations and partial notes.
- When you make an inference, say so briefly — e.g. 'I am reading this as…' or 'Based on nearby entries, this seems to be about…'. Be transparent but not laborious.
- Search broadly across all entry types. A short note, a photo description, and a plan entry from the same morning may together answer a question none of them answers alone.
- Never refuse to engage just because the data is imperfect or sparse. Work with what is there and say honestly when you are uncertain.
- Be warm, specific, and conversational — like a trusted friend who has read everything the user has ever written and genuinely wants to help them understand their own life.
- Do not use emojis.`

// ── Component ─────────────────────────────────────────────────────────────────

export default function RememberTab() {
  const [question, setQuestion] = useState('')
  const [cards, setCards] = useState([])     // { id, q, a, ts, loading, open }
  const [asking, setAsking] = useState(false)
  const convoRef = useRef(null)
  const voice = useVoice(setQuestion)

  const doAsk = async () => {
    const q = question.trim()
    if (!q || asking) return
    const apiKey = localStorage.getItem('mih-claude-key')
    if (!apiKey) {
      alert('Please add your Claude API key in Settings first.')
      return
    }
    setQuestion('')
    const cardId = Date.now().toString()
    const newCard = { id: cardId, q, a: null, ts: new Date().toISOString(), loading: true, open: true }
    setCards(prev => [newCard, ...prev])
    setAsking(true)

    // Scroll convo to top so new card is visible
    if (convoRef.current) convoRef.current.scrollTop = 0

    const context = buildContext()
    const userMessage = `Question: ${q}\n\n---\nEVERYTHING THE USER HAS CAPTURED:\n\n${context}`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })
      const data = await res.json()
      const rawAnswer = data.content?.[0]?.text
      if (!rawAnswer) throw new Error(data.error?.message || 'No response from Claude')
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, a: stripMd(rawAnswer), loading: false } : c))
    } catch (e) {
      setCards(prev => prev.map(c => c.id === cardId
        ? { ...c, a: 'Sorry, could not get a response: ' + e.message, loading: false }
        : c
      ))
    } finally {
      setAsking(false)
    }
  }

  const toggleCard = (id) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, open: !c.open } : c))
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-a)',
      fontFamily: 'var(--font-body)',
    }}>

      {/* Ask box — pinned at top, flex-shrink:0 for iOS PWA */}
      <div style={{
        flexShrink: 0,
        padding: '12px 14px 10px',
        background: 'var(--bg-a)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          fontSize: '0.6rem',
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-lo)',
          marginBottom: 8,
        }}>Remember</div>

        {/* Input row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.82)',
          borderRadius: 14,
          padding: '8px 12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          border: '1.5px solid var(--border)',
          minHeight: 44,
        }}>
          {voice.recording ? (
            <VoiceBar recording bars={voice.bars} onDone={voice.done} onCancel={voice.cancel} />
          ) : (
            <>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doAsk() } }}
                placeholder="Ask anything about your life…"
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 400,
                  color: 'var(--text-hi)',
                }}
              />
              <VoiceBar recording={false} bars={voice.bars} onStart={voice.start} compact />
              {/* Send button */}
              <button
                onClick={doAsk}
                disabled={asking || !question.trim()}
                style={{
                  background: asking || !question.trim() ? 'var(--border)' : 'var(--accent)',
                  border: 'none',
                  borderRadius: 10,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: asking || !question.trim() ? 'default' : 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/>
                  <polyline points="5 12 12 5 19 12"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Conversation — scrollable, flex:1, min-height:0 for iOS PWA */}
      <div
        ref={convoRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0,
          padding: '12px 14px 40px',
        }}
      >
        {cards.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-lo)',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            padding: '40px 20px',
          }}>
            Ask anything — what you've been doing, how you've been feeling,<br />
            patterns across your entries, or anything you want to recall.
          </div>
        )}

        {cards.map(card => (
          <div
            key={card.id}
            style={{
              background: 'var(--bg-b)',
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 10,
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
              border: '1px solid var(--border)',
            }}
          >
            {/* Question row — tappable to collapse/expand */}
            <div
              onClick={() => toggleCard(card.id)}
              style={{
                padding: '10px 14px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-hi)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <span style={{ flex: 1 }}>{card.q}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-lo)', flexShrink: 0 }}>
                {card.open ? '▲' : '▼'}
              </span>
            </div>

            {/* Answer — shown when open */}
            {card.open && (
              <div style={{ padding: '0 14px 12px' }}>
                {card.loading ? (
                  /* Animated dots while waiting */
                  <div style={{ display: 'flex', gap: 5, padding: '4px 0' }}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--text-lo)',
                        animation: `mih-dot 0.8s ${delay}s infinite`,
                        opacity: 0.3,
                      }} />
                    ))}
                  </div>
                ) : (
                  <div style={{
                    fontSize: '0.88rem',
                    lineHeight: 1.65,
                    color: 'var(--text-hi)',
                    fontFamily: 'var(--font-body)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {card.a}
                  </div>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div style={{
              padding: '0 14px 8px',
              fontSize: '0.62rem',
              color: 'var(--text-lo)',
              fontFamily: 'var(--font-body)',
            }}>
              {fmtTime(card.ts)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
