const STATE_STYLES = {
  done: {
    background: 'var(--green-dim)',
    color: 'var(--green)',
    border: '1px solid rgba(34,197,94,0.3)'
  },
  today: {
    background: 'var(--amber-dim)',
    color: 'var(--amber)',
    border: '1px solid var(--amber)'
  },
  rest: {
    background: 'var(--bg2)',
    color: 'var(--text3)',
    border: '1px solid var(--border)'
  },
  default: {
    background: 'var(--bg2)',
    color: 'var(--text3)',
    border: '1px solid var(--border)'
  }
}

export default function DayChip({ label, state = 'default', onClick, compact = false }) {
  const size = compact ? 22 : 36
  const s = STATE_STYLES[state] || STATE_STYLES.default

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: compact ? 9 : 11,
        fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'all 0.15s',
        ...s
      }}
    >
      {state === 'done' ? '✓' : label}
    </div>
  )
}
