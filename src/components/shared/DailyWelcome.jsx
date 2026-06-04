import { createPortal } from 'react-dom'

const QUOTES = [
  {
    bg: 'linear-gradient(150deg, #2255CC, #1A3A99)',
    render: () => (
      <div style={{ fontFamily: 'var(--font-display)', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)', marginBottom: '0.5rem' }}>Today</div>
        <div style={{ fontSize: '3rem', fontWeight: 300, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>Take</div>
        <div style={{ fontSize: '1.45rem', fontWeight: 400, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontStyle: 'italic' }}>time to get more of<br />what is most important<br />to you.</div>
      </div>
    )
  },
  {
    bg: 'linear-gradient(150deg, #2A6B5A, #1A4A3A)',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
        <div style={{ width: 32, height: 2, background: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 400, color: '#fff', lineHeight: 1.45, textAlign: 'left' }}>
          Take a moment<br />to <span style={{ fontStyle: 'italic', color: '#A8E6C8' }}>notice</span><br />what is good.
        </div>
        <div style={{ width: 32, height: 2, background: 'rgba(255,255,255,0.4)', marginTop: '1.5rem' }} />
      </div>
    )
  },
  {
    bg: 'linear-gradient(150deg, #3A3A5C, #252540)',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '3rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.82)', textAlign: 'center', letterSpacing: '0.02em', lineHeight: 1.7 }}>
          Start your day<br />with a quiet mind.
        </div>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.25)' }} />
      </div>
    )
  },
  {
    bg: 'linear-gradient(150deg, #5A3A7A, #3A2055)',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.82rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', marginBottom: '0.75rem' }}>Today</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 500, color: '#fff', textAlign: 'center', lineHeight: 1.4 }}>Plan for what</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.4 }}>you would like</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 500, color: '#fff', textAlign: 'center', lineHeight: 1.4 }}>to happen.</div>
      </div>
    )
  },
  {
    bg: 'linear-gradient(150deg, #7A4A1A, #4A2A08)',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', textAlign: 'center', lineHeight: 1.5 }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 300, color: 'rgba(255,255,255,0.78)' }}>Plan to </span>
          <span style={{ fontSize: '2.2rem', fontWeight: 600, color: '#fff', display: 'block', margin: '0.25rem 0' }}>notice</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 300, color: 'rgba(255,255,255,0.78)' }}>what feels good.</span>
        </div>
      </div>
    )
  },
  {
    bg: 'linear-gradient(150deg, #1A5A7A, #0A3A55)',
    render: () => (
      <>
        <svg width="28" height="28" viewBox="0 0 100 100" fill="none" style={{ marginBottom: '2rem', opacity: 0.5 }}>
          <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" />
          <line x1="20" y1="20" x2="80" y2="80" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" />
          <line x1="80" y1="20" x2="20" y2="80" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" />
          <circle cx="50" cy="50" r="4.5" fill="rgba(255,255,255,0.9)" />
        </svg>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,0.82)', textAlign: 'center', lineHeight: 1.45, marginBottom: '0.5rem' }}>Take a moment to</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 500, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>remember<br />your dreams.</div>
        </div>
      </>
    )
  },
  {
    bg: 'linear-gradient(150deg, #4A7A3A, #2A5020)',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.52)' }}>A thought for today</div>
        <div style={{ width: 30, height: 1, background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 400, color: '#fff', textAlign: 'center', lineHeight: 1.4 }}>
          Celebrate<br /><span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.82)' }}>simple things.</span>
        </div>
      </div>
    )
  },
  {
    bg: 'linear-gradient(150deg, #7A5A1A, #4A3808)',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', width: '100%', gap: '0.2rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 300, color: 'rgba(255,255,255,0.72)' }}>Keep track of</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 500, color: '#fff', lineHeight: 1 }}>what</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>feels</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 600, color: '#fff', lineHeight: 1 }}>good.</div>
      </div>
    )
  },
  {
    bg: 'linear-gradient(150deg, #5A2A6A, #3A1548)',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.95rem', fontWeight: 300, color: 'rgba(255,255,255,0.82)', fontStyle: 'italic' }}>Make habits</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 500, color: '#fff', lineHeight: 1.2 }}>that feel<br />good.</div>
      </div>
    )
  },
  {
    bg: 'linear-gradient(150deg, #7A2A2A, #4A1515)',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', gap: '0.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 500, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>Find highlights</div>
        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.25)' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,0.78)', textAlign: 'center' }}>in every day.</div>
      </div>
    )
  },
  {
    bg: 'linear-gradient(150deg, #2A5A6A, #153A48)',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 300, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Find lots to</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 500, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>appreciate.</div>
        <div style={{ marginTop: '1.5rem', width: 40, height: 2, background: 'rgba(255,255,255,0.35)', borderRadius: 2 }} />
      </div>
    )
  },
]

function getDailyQuote() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}

export default function DailyWelcome({ onDismiss }) {
  const quote = getDailyQuote()

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: quote.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'calc(env(safe-area-inset-top) + 2.5rem) 1.75rem calc(env(safe-area-inset-bottom) + 2rem)',
    }}>
      {quote.render()}

      <button onClick={onDismiss} style={{
        width: '100%', maxWidth: 340,
        padding: '1rem',
        borderRadius: 14,
        border: '1.5px solid rgba(255,255,255,0.35)',
        background: 'rgba(255,255,255,0.15)',
        color: '#fff',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: '0.95rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        backdropFilter: 'blur(8px)',
        marginTop: '2rem',
        flexShrink: 0,
      }}>
        Let's begin
      </button>
    </div>,
    document.body
  )
}
