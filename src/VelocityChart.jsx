import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './VelocityChart.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="velocity-tooltip">
      <p className="vt-label">{label}</p>
      <p className="vt-value">{payload[0].value}% done</p>
      {payload[1] && <p className="vt-velocity" style={{ color: payload[1].value >= 0 ? '#34d399' : '#f87171' }}>
        {payload[1].value >= 0 ? '▲' : '▼'} {Math.abs(payload[1].value)}% velocity
      </p>}
    </div>
  );
};

export default function VelocityChart({ checkedTasks, tasks, daysInMonth, selectedMonth, selectedYear }) {
  const data = Array.from({ length: daysInMonth }, (_, di) => {
    const date  = new Date(selectedYear, selectedMonth - 1, di + 1);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const pct   = tasks.length === 0 ? 0
      : Math.round((tasks.filter((_, ti) => checkedTasks[`${ti}-${di}`]).length / tasks.length) * 100);
    return { label, pct, day: di };
  });

  // Compute velocity = derivative (change from previous day)
  const dataWithVelocity = data.map((d, i) => ({
    ...d,
    velocity: i === 0 ? 0 : d.pct - data[i - 1].pct,
  }));

  const avg = Math.round(data.reduce((s, d) => s + d.pct, 0) / daysInMonth);

  return (
    <div className="velocity-card">
      <div className="velocity-header">
        <span className="velocity-title">📈 Habit Velocity</span>
        <span className="velocity-avg">Avg: {avg}%</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={dataWithVelocity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
            interval={4}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={avg} stroke="rgba(167,139,250,0.3)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="pct"
            stroke="url(#lineGrad)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#a78bfa' }}
          />
          <Line
            type="monotone"
            dataKey="velocity"
            stroke="rgba(52,211,153,0.5)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
      <div className="velocity-legend">
        <span><span className="vl-dot" style={{ background: '#7c3aed' }} /> Completion %</span>
        <span><span className="vl-dot" style={{ background: '#34d399', opacity: 0.6 }} /> Velocity</span>
        <span><span className="vl-dot" style={{ background: 'rgba(167,139,250,0.4)', borderRadius: 0, height: 2 }} /> Avg</span>
      </div>
    </div>
  );
}
