import './Avatar.css';

const LEVEL_THRESHOLDS = [0, 20, 50, 100, 200, 350, 500];

function getLevel(total) {
  let lvl = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (total >= LEVEL_THRESHOLDS[i]) lvl = i;
  }
  return lvl;
}

function StatBar({ label, value, color }) {
  return (
    <div className="stat-bar-row">
      <span className="stat-bar-label">{label}</span>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
      </div>
      <span className="stat-bar-value">{value}</span>
    </div>
  );
}

export default function Avatar({ stats = {}, streak = 0, fatigued = false }) {
  const { stamina = 0, intellect = 0, discipline = 0 } = stats;
  const total = stamina + intellect + discipline;
  const level = getLevel(total);
  const state = fatigued ? 'fatigued' : streak >= 3 ? 'energized' : 'normal';

  // Dominant stat determines avatar color theme
  const dominant =
    stamina >= intellect && stamina >= discipline ? 'stamina' :
    intellect >= discipline ? 'intellect' : 'discipline';

  const COLORS = {
    stamina:    { primary: '#f97316', glow: 'rgba(249,115,22,0.4)' },
    intellect:  { primary: '#60a5fa', glow: 'rgba(96,165,250,0.4)' },
    discipline: { primary: '#a78bfa', glow: 'rgba(167,139,250,0.4)' },
  };
  const theme = COLORS[dominant];

  return (
    <div className={`avatar-card ${state}`}>
      <div className="avatar-header">
        <span className="avatar-title">Your Avatar</span>
        <span className="avatar-level" style={{ color: theme.primary }}>Lv.{level}</span>
      </div>

      {/* SVG Avatar figure */}
      <div className="avatar-figure-wrap" style={{ filter: `drop-shadow(0 0 16px ${theme.glow})` }}>
        <svg className={`avatar-svg ${state}`} viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body glow */}
          <ellipse cx="40" cy="95" rx="22" ry="5" fill={theme.primary} opacity="0.2" />
          {/* Legs */}
          <rect x="28" y="68" width="10" height="24" rx="5" fill={state === 'fatigued' ? '#4b5563' : theme.primary} opacity="0.8" />
          <rect x="42" y="68" width="10" height="24" rx="5" fill={state === 'fatigued' ? '#4b5563' : theme.primary} opacity="0.8" />
          {/* Body */}
          <rect x="22" y="38" width="36" height="34" rx="10"
            fill={state === 'fatigued' ? '#374151' : `url(#bodyGrad)`} />
          {/* Arms */}
          <rect x="8"  y="40" width="14" height="8" rx="4"
            fill={state === 'fatigued' ? '#4b5563' : theme.primary}
            style={{ transformOrigin: '22px 44px' }}
            className={state === 'energized' ? 'arm-wave' : ''} />
          <rect x="58" y="40" width="14" height="8" rx="4"
            fill={state === 'fatigued' ? '#4b5563' : theme.primary}
            style={{ transformOrigin: '58px 44px' }}
            className={state === 'energized' ? 'arm-wave-r' : ''} />
          {/* Head */}
          <circle cx="40" cy="26" r="16"
            fill={state === 'fatigued' ? '#374151' : `url(#headGrad)`} />
          {/* Eyes */}
          {state === 'fatigued' ? (
            <>
              <line x1="33" y1="24" x2="37" y2="28" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
              <line x1="37" y1="24" x2="33" y2="28" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
              <line x1="43" y1="24" x2="47" y2="28" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
              <line x1="47" y1="24" x2="43" y2="28" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="35" cy="26" r="3" fill="#fff" />
              <circle cx="45" cy="26" r="3" fill="#fff" />
              <circle cx="36" cy="26" r="1.5" fill="#1e1b4b" />
              <circle cx="46" cy="26" r="1.5" fill="#1e1b4b" />
            </>
          )}
          {/* Mouth */}
          {state === 'fatigued'
            ? <path d="M35 33 Q40 30 45 33" stroke="#9ca3af" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            : <path d="M35 32 Q40 36 45 32" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          }
          {/* Streak fire badge */}
          {streak >= 3 && state !== 'fatigued' && (
            <text x="54" y="16" fontSize="12">🔥</text>
          )}
          <defs>
            <linearGradient id="bodyGrad" x1="22" y1="38" x2="58" y2="72" gradientUnits="userSpaceOnUse">
              <stop stopColor={theme.primary} />
              <stop offset="1" stopColor={theme.primary} stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="headGrad" x1="24" y1="10" x2="56" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor={theme.primary} stopOpacity="0.9" />
              <stop offset="1" stopColor={theme.primary} stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* State label */}
        <div className={`avatar-state-badge ${state}`}>
          {state === 'energized' ? '⚡ Energized' : state === 'fatigued' ? '😴 Fatigued' : '😐 Normal'}
        </div>
      </div>

      {/* Stat bars */}
      <div className="avatar-stats">
        <StatBar label="💪 Stamina"    value={stamina}    color="#f97316" />
        <StatBar label="🧠 Intellect"  value={intellect}  color="#60a5fa" />
        <StatBar label="🎯 Discipline" value={discipline} color="#a78bfa" />
      </div>
    </div>
  );
}
