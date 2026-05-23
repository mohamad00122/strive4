export default function Spinner({ size = 32, style = {} }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    }}>
      <div style={{
        width: size,
        height: size,
        border: '2px solid var(--bg3)',
        borderTopColor: 'var(--amber)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
