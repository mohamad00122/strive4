const SIZES = {
  sm: { width: 24, height: 24, fontSize: 10 },
  md: { width: 32, height: 32, fontSize: 12 },
  lg: { width: 44, height: 44, fontSize: 16 },
  xl: { width: 56, height: 56, fontSize: 20 }
}

export default function Avatar({ name, email, size = 'md', style = {} }) {
  const s = SIZES[size] || SIZES.md
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() ?? '?'

  return (
    <div style={{
      width: s.width,
      height: s.height,
      borderRadius: '50%',
      background: 'var(--amber-dim)',
      border: '1px solid rgba(245,158,11,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: s.fontSize,
      fontWeight: 800,
      color: 'var(--amber)',
      fontFamily: "'Syne', sans-serif",
      flexShrink: 0,
      userSelect: 'none',
      ...style
    }}>
      {initials}
    </div>
  )
}
