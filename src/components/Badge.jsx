const VARIANTS = {
  green: { background: 'var(--green-dim)', color: 'var(--green)' },
  amber: { background: 'var(--amber-dim)', color: 'var(--amber)' },
  red:   { background: 'var(--red-dim)',   color: 'var(--red)' },
  gray:  { background: 'var(--bg2)',       color: 'var(--text2)' }
}

export default function Badge({ children, variant = 'gray', style = {} }) {
  const v = VARIANTS[variant] || VARIANTS.gray
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: v.background,
      color: v.color,
      flexShrink: 0,
      ...style
    }}>
      {children}
    </span>
  )
}
