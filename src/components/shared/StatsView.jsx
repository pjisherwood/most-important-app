import { useState, useMemo } from 'react'

// ── Helpers ───────────────────────────────────

function getWeekDates() {
  // Returns 7 dates Sat→Fri for the current week
  const today = new Date()
  const dow = today.getDay()
  const sat = new Date(today)
  sat.setDate(today.getDate() - ((dow + 1) % 7))
  sat.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sat)
    d.setDate(sat.getDate() + i)
    return d
  })
}

const DAY_SHORT = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function countByDateKey(entries) {
  const map = {}
  entries.forEach(e => {
    const dk = new Date(e.ts).toDateString()
    map[dk] = (map[dk] || 0) + 1
  })
  return map
}

// ── SVG Line Graph ────────────────────────────

function LineGraph({ points, labels, colour, showPointLabels, height = 140, bottomPad = 24 }) {
  if (!points.length) return null

  const W = 300
  const H = height
  const PAD_LEFT = 28
  const PAD_RIGHT = 12
  const PAD_TOP = 24
  const PAD_BOT = bottomPad

  const maxVal = Math.max(...points, 1)
  const innerW = W - PAD_LEFT - PAD_RIGHT
  const innerH = H - PAD_TOP - PAD_BOT
  const n = points.length

  const xOf = i => PAD_LEFT + (i / (n - 1 || 1)) * innerW
  const yOf = v => PAD_TOP + innerH - (v / maxVal) * innerH

  // Build path
  const pathD = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`)
    .join(' ')

  // Y axis ticks — up to 4
  const yTicks = []
  const step = maxVal <= 4 ? 1 : maxVal <= 10 ? 2 : Math.ceil(maxVal / 4)
  for (let v = 0; v <= maxVal; v += step) yTicks.push(v)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: H, overflow: 'visible' }}
    >
      {/* Y grid lines */}
      {yTicks.map(v => (
        <g key={v}>
          <line
            x1={PAD_LEFT} y1={yOf(v)}
            x2={W - PAD_RIGHT} y2={yOf(v)}
            stroke="rgba(0,0,0,0.07)" strokeWidth="1"
          />
          <text
            x={PAD_LEFT - 4} y={yOf(v) + 4}
            textAnchor="end"
            fontSize="8"
            fill="rgba(0,0,0,0.35)"
            fontFamily="sans-serif"
          >{v}</text>
        </g>
      ))}

      {/* Area fill */}
      <path
        d={`${pathD} L ${xOf(n - 1).toFixed(1)} ${H - PAD_BOT} L ${xOf(0).toFixed(1)} ${H - PAD_BOT} Z`}
        fill={colour}
        opacity="0.1"
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={colour}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points + labels */}
      {points.map((v, i) => (
        <g key={i}>
          <circle
            cx={xOf(i)} cy={yOf(v)} r="3.5"
            fill="#fff" stroke={colour} strokeWidth="2"
          />
          {showPointLabels && v > 0 && (
            <text
              x={xOf(i)} y={yOf(v) - 8}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill={colour}
              fontFamily="sans-serif"
            >{v}</text>
          )}
          {/* X label */}
          {labels[i] && (
            <text
              x={xOf(i)} y={H - PAD_BOT + 14}
              textAnchor="middle"
              fontSize="8"
              fill="rgba(0,0,0,0.45)"
              fontFamily="sans-serif"
            >{labels[i]}</text>
          )}
        </g>
      ))}
    </svg>
  )
}

// ── Stats View ────────────────────────────────

export default function StatsView({ entries, colour, title }) {
  const [period, setPeriod] = useState('week')

  const today = new Date()
  const todayStr = today.toDateString()

  const byDate = useMemo(() => countByDateKey(entries), [entries])

  // ── Week data ────────────────────────
  const weekData = useMemo(() => {
    const dates = getWeekDates()
    return {
      points: dates.map(d => byDate[d.toDateString()] || 0),
      labels: DAY_SHORT,
      dates,
    }
  }, [byDate])

  // ── Month data ───────────────────────
  const monthData = useMemo(() => {
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const points = []
    const labels = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(today.getFullYear(), today.getMonth(), d)
      points.push(byDate[date.toDateString()] || 0)
      // Label every 5th day + last day
      labels.push(d === 1 || d % 5 === 0 || d === daysInMonth ? String(d) : '')
    }
    return { points, labels }
  }, [byDate, today.getMonth()])

  // ── Year data ────────────────────────
  const yearData = useMemo(() => {
    const points = []
    const labels = MONTH_SHORT
    for (let m = 0; m < 12; m++) {
      const daysInM = new Date(today.getFullYear(), m + 1, 0).getDate()
      let total = 0
      for (let d = 1; d <= daysInM; d++) {
        const date = new Date(today.getFullYear(), m, d)
        total += byDate[date.toDateString()] || 0
      }
      points.push(total)
    }
    return { points, labels }
  }, [byDate])

  // ── Summary numbers ──────────────────
  const totals = useMemo(() => {
    const weekTotal = weekData.points.reduce((a, b) => a + b, 0)
    const monthTotal = monthData.points.reduce((a, b) => a + b, 0)
    const yearTotal = yearData.points.reduce((a, b) => a + b, 0)
    const todayTotal = byDate[todayStr] || 0
    return { week: weekTotal, month: monthTotal, year: yearTotal, today: todayTotal }
  }, [weekData, monthData, yearData, byDate])

  const currentData = period === 'week' ? weekData : period === 'month' ? monthData : yearData
  const currentLabel = period === 'week' ? 'This week' : period === 'month'
    ? MONTH_SHORT[today.getMonth()] + ' ' + today.getFullYear()
    : String(today.getFullYear())
  const currentTotal = period === 'week' ? totals.week : period === 'month' ? totals.month : totals.year

  return (
    <div style={{ padding: '0 1rem 2rem' }}>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
        {[
          { val: totals.today, lbl: 'Today' },
          { val: totals.week,  lbl: 'This week' },
          { val: totals.month, lbl: 'This month' },
        ].map(s => (
          <div key={s.lbl} style={{
            flex: 1, background: 'rgba(255,255,255,0.7)',
            borderRadius: 14, padding: '0.6rem 0.5rem',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.6rem', fontWeight: 300,
              color: colour, lineHeight: 1,
            }}>{s.val}</div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.52rem', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--text-lo)', marginTop: 4,
            }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Period toggle */}
      <div style={{
        display: 'flex', gap: '0.4rem',
        background: 'rgba(0,0,0,0.06)',
        borderRadius: 12, padding: 3,
        marginBottom: '1rem',
      }}>
        {['week', 'month', 'year'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            flex: 1, padding: '0.42rem 0',
            border: 'none', borderRadius: 9,
            background: period === p ? '#fff' : 'transparent',
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: period === p ? colour : 'var(--text-lo)',
            cursor: 'pointer',
            boxShadow: period === p ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.18s',
          }}>{p}</button>
        ))}
      </div>

      {/* Graph card */}
      <div style={{
        background: 'rgba(255,255,255,0.72)',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: '1rem 0.75rem 0.75rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem', fontWeight: 500,
            color: 'var(--text-hi)',
          }}>{currentLabel}</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem', fontWeight: 300,
            color: colour,
          }}>
            {currentTotal}
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', color: 'var(--text-lo)', marginLeft: 4 }}>
              {period === 'year' ? 'this year' : 'entries'}
            </span>
          </span>
        </div>

        <LineGraph
          points={currentData.points}
          labels={currentData.labels}
          colour={colour}
          showPointLabels={period === 'week'}
          height={period === 'month' ? 150 : 140}
          bottomPad={28}
        />
      </div>

      {/* All-time total */}
      <div style={{
        textAlign: 'center', marginTop: '1rem',
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: '0.88rem',
        color: 'var(--text-lo)',
      }}>
        {entries.length} {title.toLowerCase()} entries in total
      </div>

    </div>
  )
}
