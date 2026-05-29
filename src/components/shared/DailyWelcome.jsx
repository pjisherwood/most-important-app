import { createPortal } from 'react-dom'

export default function DailyWelcome({ onDismiss }) {
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'linear-gradient(150deg, var(--now), var(--now-dk))',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'calc(env(safe-area-inset-top) + 2rem) 1.75rem calc(env(safe-area-inset-bottom) + 2rem)',
    }}>

      {/* Star */}
      <svg width="48" height="48" viewBox="0 0 100 100" fill="none" style={{ marginBottom: '1.75rem', opacity: 0.7 }}>
        <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
        <line x1="18" y1="18" x2="82" y2="82" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="82" y1="18" x2="18" y2="82" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="4" fill="rgba(255,255,255,0.8)" />
      </svg>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.6rem, 7vw, 2.2rem)',
        fontWeight: 500,
        color: '#fff',
        textAlign: 'center',
        lineHeight: 1.2,
        marginBottom: '1.5rem',
        letterSpacing: '-0.01em',
      }}>
        Making the most<br />of your days
      </div>

      {/* Divider */}
      <div style={{ width: 40, height: 1.5, background: 'rgba(255,255,255,0.35)', borderRadius: 2, marginBottom: '1.5rem' }} />

      {/* Quote */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 'clamp(1rem, 4vw, 1.15rem)',
        color: 'rgba(255,255,255,0.88)',
        textAlign: 'center',
        lineHeight: 1.7,
        marginBottom: '1.75rem',
        maxWidth: 340,
      }}>
        "The most important hour of your life is the time you spend getting more of what you want most — and we get more of what we focus on."
      </div>

      {/* Body */}
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'clamp(0.82rem, 3.5vw, 0.92rem)',
        color: 'rgba(255,255,255,0.72)',
        textAlign: 'center',
        lineHeight: 1.7,
        marginBottom: '2.5rem',
        maxWidth: 320,
      }}>
        That is why these habits matter. Each time you meditate, appreciate, plan, track your progress, and capture your highlights, you are directing your focus toward what matters most to you.
      </div>

      {/* Button */}
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
      }}>
        Let's begin
      </button>

    </div>,
    document.body
  )
}
