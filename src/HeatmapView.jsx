import './HeatmapView.css';

// Build a full-year heatmap from all monthly UserData docs
export default function HeatmapView({ year, allMonthsData = {}, tasks = [] }) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getIntensity = (month, day) => {
    const data = allMonthsData[month];
    if (!data || !tasks.length) return 0;
    const { checkedTasks, tasks: mTasks } = data;
    const t = mTasks || tasks;
    if (!t.length) return 0;
    const completed = t.filter((_, ti) => checkedTasks?.[`${ti}-${day}`]).length;
    return completed / t.length; // 0–1
  };

  const intensityColor = (v) => {
    if (v === 0)   return 'rgba(255,255,255,0.05)';
    if (v < 0.25)  return 'rgba(124,58,237,0.25)';
    if (v < 0.5)   return 'rgba(124,58,237,0.5)';
    if (v < 0.75)  return 'rgba(124,58,237,0.75)';
    return '#7c3aed';
  };

  return (
    <div className="heatmap-card">
      <div className="heatmap-header">
        <span className="heatmap-title">📅 Yearly Heatmap — {year}</span>
        <div className="heatmap-legend">
          <span>Less</span>
          {[0, 0.2, 0.5, 0.8, 1].map((v, i) => (
            <span key={i} className="legend-cell" style={{ background: intensityColor(v) }} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="heatmap-grid">
        {months.map((m) => {
          const daysInMonth = new Date(year, m, 0).getDate();
          const monthName   = new Date(year, m - 1).toLocaleDateString('en-US', { month: 'short' });
          return (
            <div key={m} className="heatmap-month">
              <div className="heatmap-month-label">{monthName}</div>
              <div className="heatmap-days">
                {Array.from({ length: daysInMonth }, (_, di) => {
                  const v = getIntensity(m, di);
                  const date = new Date(year, m - 1, di + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <div
                      key={di}
                      className="heatmap-cell"
                      style={{ background: intensityColor(v) }}
                      title={`${date}: ${Math.round(v * 100)}%`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
