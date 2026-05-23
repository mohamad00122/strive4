export default function StatTile({ number, label, color = 'var(--text)', style = {} }) {
  return (
    <div className="stat-tile" style={style}>
      <div className="stat-tile-number" style={{ color }}>{number}</div>
      <div className="stat-tile-label">{label}</div>
    </div>
  )
}
