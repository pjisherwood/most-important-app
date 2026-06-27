// VoiceBar.jsx — reusable voice recording UI for MIH
// Shows mic button when idle; waveform + Done/Cancel when recording
// Adapted from remember-all.html wave/recbar patterns

export default function VoiceBar({ recording, bars, onStart, onDone, onCancel, compact = false }) {
  if (!recording) {
    return (
      <button
        onClick={onStart}
        title="Voice input"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: compact ? '0 2px' : '0 4px',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-lo)',
          opacity: 0.55,
          flexShrink: 0,
        }}
        aria-label="Start voice input"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
        </svg>
      </button>
    )
  }

  // Recording state — waveform bar + Done/Cancel
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '2px 0',
      flex: 1,
      minWidth: 0,
    }}>
      {/* Waveform bars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
        {bars.map((h, i) => (
          <div key={i} style={{
            width: 3,
            height: h,
            borderRadius: 2,
            background: 'var(--accent)',
            transition: 'height 0.1s',
            flexShrink: 0,
          }} />
        ))}
        <span style={{
          fontSize: '0.68rem',
          color: 'var(--accent)',
          fontWeight: 700,
          marginLeft: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent)',
            animation: 'mih-blink 1s infinite',
            display: 'inline-block',
          }} />
          Listening…
        </span>
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: '0.75rem',
          fontWeight: 700, color: 'var(--text-lo)', padding: '4px 6px',
          flexShrink: 0,
        }}
      >Cancel</button>

      {/* Done */}
      <button
        onClick={onDone}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'var(--text-hi)', border: 'none', borderRadius: 8,
          color: '#fff', fontFamily: 'var(--font-body)',
          fontSize: '0.75rem', fontWeight: 700,
          padding: '5px 10px', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Done
      </button>
    </div>
  )
}
