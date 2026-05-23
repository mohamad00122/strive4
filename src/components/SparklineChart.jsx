import { useState, useRef } from 'react'

function smooth(points) {
  if (points.length < 2) return points.map(p => `${p.x},${p.y}`).join(' ')
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx = (prev.x + curr.x) / 2
    d += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`
  }
  return d
}

export default function SparklineChart({ data = [], height = 120, formatValue, formatDate }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  if (data.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
        Not enough data to show chart
      </div>
    )
  }

  const PAD = { top: 12, right: 8, bottom: 8, left: 8 }
  const values = data.map(d => d.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1

  const mapY = (v) => PAD.top + ((maxV - v) / range) * (height - PAD.top - PAD.bottom)

  const points = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * (100 - PAD.left - PAD.right) + '%',
    xNum: PAD.left + (i / (data.length - 1)) * (100 - PAD.left - PAD.right),
    y: mapY(d.value),
    ...d
  }))

  const pathD = smooth(points.map(p => ({ x: `${p.xNum}%`, y: p.y })))
    .replace(/%/g, '')

  const areaD = smooth(points.map(p => ({ x: p.xNum, y: p.y })))
    + ` L ${points[points.length - 1].xNum} ${height - PAD.bottom} L ${points[0].xNum} ${height - PAD.bottom} Z`

  const handleMouseMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX = (e.clientX - rect.left) / rect.width * 100
    let closest = points[0], minDist = Infinity
    for (const p of points) {
      const dist = Math.abs(p.xNum - relX)
      if (dist < minDist) { minDist = dist; closest = p }
    }
    setTooltip({ x: (closest.xNum / 100) * rect.width, y: closest.y, data: closest })
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ display: 'block', cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sparkGrad)" />
        <path d={smooth(points.map(p => ({ x: p.xNum, y: p.y })))} fill="none" stroke="var(--amber)" strokeWidth="0.8" />
        {tooltip && (
          <line x1={`${tooltip.data.xNum}%`} y1={PAD.top} x2={`${tooltip.data.xNum}%`} y2={height - PAD.bottom}
            stroke="var(--border2)" strokeWidth="0.5" />
        )}
        {tooltip && (
          <circle cx={`${tooltip.data.xNum}%`} cy={tooltip.data.y} r="1.5" fill="var(--amber)" />
        )}
      </svg>
      {tooltip && (
        <div style={{
          position: 'absolute',
          top: Math.max(0, tooltip.y - 36),
          left: Math.min(tooltip.x, 200),
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          borderRadius: 7,
          padding: '5px 9px',
          fontSize: 11,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10
        }}>
          <div style={{ color: 'var(--amber)', fontWeight: 700 }}>
            {formatValue ? formatValue(tooltip.data.value) : tooltip.data.value}
          </div>
          <div style={{ color: 'var(--text3)' }}>
            {formatDate ? formatDate(tooltip.data.date) : tooltip.data.date}
          </div>
        </div>
      )}
    </div>
  )
}
