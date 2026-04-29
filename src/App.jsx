import './App.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import Login from './Login';
import Register from './Register';
import Avatar from './Avatar';
import HeatmapView from './HeatmapView';
import VelocityChart from './VelocityChart';
import ContractModal from './ContractModal';
import ContractsList from './ContractsList';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const CATEGORIES = ['fitness', 'learning', 'routine', 'other'];
const CATEGORY_ICONS = { fitness: '💪', learning: '🧠', routine: '🎯', other: '⭐' };

function App() {
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [currentUser, setCurrentUser]   = useState('');
  const [userId, setUserId]             = useState('');
  const [showRegister, setShowRegister] = useState(false);

  // Streak & gamification
  const [streakTokens, setStreakTokens]   = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [avatarStats, setAvatarStats]     = useState({ stamina: 0, intellect: 0, discipline: 0 });
  const [userPoints, setUserPoints]       = useState(100);
  const [tokenUsed, setTokenUsed]         = useState(false);

  // Habit data
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(currentDate.getFullYear());
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const [tasks, setTasks]                 = useState([]);
  const [taskCategories, setTaskCategories] = useState([]);
  const [newTask, setNewTask]             = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('other');
  const [checkedTasks, setCheckedTasks]   = useState({});
  const [addingTask, setAddingTask]       = useState(false);

  // All months data for heatmap
  const [allMonthsData, setAllMonthsData] = useState({});

  // UI state
  const [activeTab, setActiveTab]         = useState('tracker'); // tracker | analytics | social
  const [showContractModal, setShowContractModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const prevAllDoneRef = useRef(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── Session restore ──────────────────────────────────────────────────────────
  useEffect(() => {
    const savedUser   = localStorage.getItem('currentUser');
    const savedUserId = localStorage.getItem('userId');
    if (savedUser && savedUserId) {
      setCurrentUser(savedUser);
      setUserId(savedUserId);
      setIsLoggedIn(true);
    }
  }, []);

  // ── Keep backend alive (ping every 5 min) ────────────────────────────────────
  useEffect(() => {
    const ping = () => fetch(`${API_BASE}/api/test`).catch(() => {});
    ping();
    const id = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // ── Load user stats ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/user-stats/${userId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStreakTokens(d.streakTokens);
          setCurrentStreak(d.currentStreak);
          setAvatarStats(d.avatarStats || { stamina: 0, intellect: 0, discipline: 0 });
          setUserPoints(d.points);
        }
      })
      .catch(console.error);
  }, [userId]);

  // ── Load all months for heatmap ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const fetchAll = async () => {
      const results = {};
      await Promise.all(
        Array.from({ length: 12 }, (_, i) => i + 1).map(async (m) => {
          try {
            const res  = await fetch(`${API_BASE}/api/getdata/${userId}/${m}/${selectedYear}`);
            const data = await res.json();
            if (data.success && data.data) results[m] = data.data;
          } catch {}
        })
      );
      setAllMonthsData(results);
    };
    fetchAll();
  }, [userId, selectedYear]);

  // ── Load month data ──────────────────────────────────────────────────────────
  const loadDataFromBackend = useCallback(async () => {
    if (!userId) return;
    try {
      const res    = await fetch(`${API_BASE}/api/getdata/${userId}/${selectedMonth}/${selectedYear}`);
      const result = await res.json();
      if (result.success && result.data) {
        setTasks(result.data.tasks || []);
        setTaskCategories(result.data.taskCategories || []);
        setCheckedTasks(result.data.checkedTasks || {});
      }
    } catch (err) { console.error('Failed to load data:', err); }
  }, [userId, selectedMonth, selectedYear]);

  useEffect(() => { if (userId) loadDataFromBackend(); }, [loadDataFromBackend]);

  // ── Save data ────────────────────────────────────────────────────────────────
  const saveDataToBackend = useCallback(async (t, tc, ct) => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/api/savedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tasks: t, taskCategories: tc, checkedTasks: ct, month: selectedMonth, year: selectedYear }),
      });
      // Refresh user stats after save
      const sr = await fetch(`${API_BASE}/api/user-stats/${userId}`);
      const sd = await sr.json();
      if (sd.success) {
        setStreakTokens(sd.streakTokens);
        setCurrentStreak(sd.currentStreak);
        setAvatarStats(sd.avatarStats || { stamina: 0, intellect: 0, discipline: 0 });
      }
    } catch (err) { console.error('Failed to save data:', err); }
  }, [userId, selectedMonth, selectedYear]);

  // ── Confetti when all today's habits done ────────────────────────────────────
  useEffect(() => {
    const todayIdx = currentDate.getDate() - 1;
    const isCurrentMonth = selectedMonth === currentDate.getMonth() + 1 && selectedYear === currentDate.getFullYear();
    if (!isCurrentMonth || tasks.length === 0) return;
    const allDone = tasks.every((_, ti) => checkedTasks[`${ti}-${todayIdx}`]);
    if (allDone && !prevAllDoneRef.current) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24'] });
    }
    prevAllDoneRef.current = allDone;
  }, [checkedTasks, tasks, selectedMonth, selectedYear]);

  // ── Habit actions ────────────────────────────────────────────────────────────
  const addTask = () => {
    if (!newTask.trim()) return;
    setAddingTask(true);
    setTimeout(() => setAddingTask(false), 400);
    const newTasks = [...tasks, newTask.trim()];
    const newCats  = [...taskCategories, newTaskCategory];
    setTasks(newTasks);
    setTaskCategories(newCats);
    setNewTask('');
    setNewTaskCategory('other');
    saveDataToBackend(newTasks, newCats, checkedTasks);
  };

  const deleteTask = async (taskIndex) => {
    const taskName = tasks[taskIndex];
    const newTasks = tasks.filter((_, i) => i !== taskIndex);
    const newCats  = taskCategories.filter((_, i) => i !== taskIndex);
    const newChecked = {};
    Object.keys(checkedTasks).forEach(key => {
      const [ti, di] = key.split('-').map(Number);
      if (ti < taskIndex)      newChecked[key] = checkedTasks[key];
      else if (ti > taskIndex) newChecked[`${ti - 1}-${di}`] = checkedTasks[key];
    });
    setTasks(newTasks);
    setTaskCategories(newCats);
    setCheckedTasks(newChecked);
    try {
      await fetch(`${API_BASE}/api/deletetask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, taskName }),
      });
    } catch (err) { console.error('Failed to delete task:', err); }
  };

  const handleCheckboxChange = (taskIndex, dayIndex) => {
    const key        = `${taskIndex}-${dayIndex}`;
    const newChecked = { ...checkedTasks, [key]: !checkedTasks[key] };
    setCheckedTasks(newChecked);
    saveDataToBackend(tasks, taskCategories, newChecked);

    // Habit stacking: auto-highlight next unchecked habit
    if (!checkedTasks[key]) {
      const nextUnchecked = tasks.findIndex((_, ti) => ti > taskIndex && !newChecked[`${ti}-${dayIndex}`]);
      if (nextUnchecked !== -1) {
        const el = document.getElementById(`habit-col-${nextUnchecked}`);
        if (el) el.classList.add('stack-highlight');
        setTimeout(() => el?.classList.remove('stack-highlight'), 1500);
      }
    }
  };

  const useStreakToken = async () => {
    if (streakTokens < 1) return;
    try {
      const res  = await fetch(`${API_BASE}/api/use-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        setStreakTokens(data.streakTokens);
        setCurrentStreak(data.currentStreak);
        setTokenUsed(true);
        setTimeout(() => setTokenUsed(false), 3000);
      }
    } catch (err) { console.error('Failed to use token:', err); }
  };

  // ── Progress helpers ─────────────────────────────────────────────────────────
  const calculateDayProgress = (di) => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((_, ti) => checkedTasks[`${ti}-${di}`]).length / tasks.length) * 100);
  };

  const calculateTotalProgress = () => {
    if (!tasks.length) return 0;
    const completed = Object.values(checkedTasks).filter(Boolean).length;
    return Math.round((completed / (tasks.length * daysInMonth)) * 100);
  };

  const getTotalCompleted = () => Object.values(checkedTasks).filter(Boolean).length;

  const getStreak = () => {
    if (selectedMonth !== currentDate.getMonth() + 1 || selectedYear !== currentDate.getFullYear()) return currentStreak;
    let s = 0;
    for (let d = currentDate.getDate() - 2; d >= 0; d--) {
      if (calculateDayProgress(d) === 100 && tasks.length > 0) s++;
      else break;
    }
    return s;
  };

  const getMissedLast7 = () => {
    const todayIdx = currentDate.getDate() - 1;
    let missed = 0;
    for (let d = Math.max(0, todayIdx - 6); d < todayIdx; d++) {
      if (calculateDayProgress(d) < 100 && tasks.length > 0) missed++;
    }
    return missed;
  };

  const getDayWithMonth = (day) =>
    new Date(selectedYear, selectedMonth - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const goToCurrentMonth = () => {
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedYear(currentDate.getFullYear());
  };

  // ── Auth handlers ────────────────────────────────────────────────────────────
  const handleLogin = (username, uid, stats = {}) => {
    setCurrentUser(username); setUserId(uid); setIsLoggedIn(true);
    if (stats.streakTokens  !== undefined) setStreakTokens(stats.streakTokens);
    if (stats.currentStreak !== undefined) setCurrentStreak(stats.currentStreak);
    if (stats.avatarStats)   setAvatarStats(stats.avatarStats);
    if (stats.points        !== undefined) setUserPoints(stats.points);
    localStorage.setItem('currentUser', username);
    localStorage.setItem('userId', uid);
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setCurrentUser(''); setUserId('');
    setTasks([]); setTaskCategories([]); setCheckedTasks({});
    setStreakTokens(0); setCurrentStreak(0);
    setAvatarStats({ stamina: 0, intellect: 0, discipline: 0 });
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
  };

  if (!isLoggedIn) {
    return showRegister
      ? <Register onRegister={(u, id) => handleLogin(u, id)} onSwitchToLogin={() => setShowRegister(false)} />
      : <Login onLogin={(u, id, stats) => handleLogin(u, id, stats)} onSwitchToRegister={() => setShowRegister(true)} />;
  }

  const totalProgress = calculateTotalProgress();
  const streak        = getStreak();
  const missedLast7   = getMissedLast7();
  const todayIdx      = currentDate.getDate() - 1;
  const todayAllDone  = tasks.length > 0 && tasks.every((_, ti) => checkedTasks[`${ti}-${todayIdx}`]);
  const fatigued      = missedLast7 >= 4;

  return (
    <div className="app">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="bg-orb orb3" />

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="header-logo">
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="url(#hg)" strokeWidth="2" />
              <path d="M10 16l4 4 8-8" stroke="url(#hg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa" /><stop offset="1" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="header-title">HabitTrack</h1>
            <p className="header-date">{today}</p>
          </div>
        </div>
        <div className="header-right">
          {/* Streak token badge */}
          {streakTokens > 0 && (
            <button className="token-badge" onClick={useStreakToken} title="Use token to protect streak">
              🛡️ {streakTokens} {tokenUsed && <span className="token-used-flash">Streak Protected!</span>}
            </button>
          )}
          <div className="user-badge">
            <span className="user-avatar">{currentUser[0]?.toUpperCase()}</span>
            <span className="user-name">{currentUser}</span>
            <span className="user-points">⭐ {userPoints}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="main">
        {/* ── Quote ── */}
        <div className="quote-banner">
          <span className="quote-icon">"</span>
          <p>If you want to shine like the SUN, be ready to burn like one.</p>
        </div>

        {/* ── Burnout warning ── */}
        {fatigued && (
          <div className="burnout-warning">
            ⚠️ Burnout Risk: High — you've missed {missedLast7} of the last 7 days. Take it easy or use a streak token!
          </div>
        )}

        {/* ── Token used flash ── */}
        {tokenUsed && (
          <div className="streak-protected-banner">🔥 Streak Protected! Token used successfully.</div>
        )}

        {/* ── Stat cards ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{tasks.length}</span>
              <span className="stat-label">Total Habits</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{getTotalCompleted()}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{totalProgress}%</span>
              <span className="stat-label">Monthly Progress</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{streak} 🔥</span>
              <span className="stat-label">Day Streak</span>
            </div>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="progress-banner">
          <div className="progress-banner-header">
            <span>Monthly Completion</span>
            <span className="progress-pct">{totalProgress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${totalProgress}%` }} />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tabs">
          {['tracker', 'analytics', 'social'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'tracker' ? '📋 Tracker' : tab === 'analytics' ? '📊 Analytics' : '🤝 Social'}
            </button>
          ))}
        </div>

        {/* ══════════════ TRACKER TAB ══════════════ */}
        {activeTab === 'tracker' && (
          <>
            {/* Controls */}
            <div className="controls-row">
              <div className="month-nav">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="dark-select">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="dark-select">
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={2020 + i} value={2020 + i}>{2020 + i}</option>
                  ))}
                </select>
                <button onClick={goToCurrentMonth} className="today-btn">Today</button>
              </div>

              <div className="task-input">
                <select value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value)} className="dark-select cat-select">
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add a new habit..."
                  className="task-input-field"
                />
                <button onClick={addTask} className={`add-btn ${addingTask ? 'pop' : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add
                </button>
              </div>
            </div>

            {/* Today completion banner */}
            {todayAllDone && tasks.length > 0 && (
              <div className="all-done-banner">🎉 All habits done for today! Amazing work!</div>
            )}

            {tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <p>No habits yet. Add your first habit above!</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <div className="table-container">
                  <table className="habit-table">
                    <thead>
                      <tr>
                        <th className="task-col">Day</th>
                        {tasks.map((task, ti) => (
                          <th key={ti} id={`habit-col-${ti}`}>
                            <div className="habit-header-cell">
                              <span className="cat-icon">{CATEGORY_ICONS[taskCategories[ti] || 'other']}</span>
                              <span className="task-dot" style={{ background: `hsl(${(ti * 47) % 360}, 70%, 60%)` }} />
                              <span>{task}</span>
                              <button onClick={() => deleteTask(ti)} className="delete-btn-inline">✕</button>
                            </div>
                            <div className="col-progress-track">
                              <div
                                className="col-progress-fill"
                                style={{
                                  width: `${Math.round((Array.from({ length: daysInMonth }, (_, di) => checkedTasks[`${ti}-${di}`] ? 1 : 0).reduce((a, b) => a + b, 0) / daysInMonth) * 100)}%`,
                                  background: `hsl(${(ti * 47) % 360}, 70%, 55%)`
                                }}
                              />
                            </div>
                          </th>
                        ))}
                        <th className="progress-col">Done %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: daysInMonth }, (_, di) => {
                        const d       = new Date(selectedYear, selectedMonth - 1, di + 1);
                        const isToday = d.toDateString() === new Date().toDateString();
                        const pct     = calculateDayProgress(di);
                        return (
                          <tr key={di} className={`task-row ${isToday ? 'today-row' : ''}`}>
                            <td className="task-name-cell">
                              <div className="task-name-wrap">
                                {isToday && <span className="today-badge">Today</span>}
                                <span>{getDayWithMonth(di + 1)}</span>
                              </div>
                            </td>
                            {tasks.map((_, ti) => {
                              const checked  = checkedTasks[`${ti}-${di}`] || false;
                              const disabled = !isToday;
                              return (
                                <td key={ti} className={`day-cell ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}>
                                  <label className={`custom-checkbox ${disabled ? 'disabled' : ''}`}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => !disabled && handleCheckboxChange(ti, di)}
                                      disabled={disabled}
                                    />
                                    <span className="checkmark">
                                      {checked && (
                                        <svg viewBox="0 0 12 12" fill="none">
                                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      )}
                                    </span>
                                  </label>
                                </td>
                              );
                            })}
                            <td className="progress-cell">
                              <div
                                className="day-progress-pill"
                                style={{
                                  background: pct === 100
                                    ? 'linear-gradient(135deg,#10b981,#059669)'
                                    : pct > 0
                                      ? 'linear-gradient(135deg,#7c3aed,#3b82f6)'
                                      : 'rgba(255,255,255,0.05)'
                                }}
                              >
                                {pct > 0 ? `${pct}%` : '–'}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════ ANALYTICS TAB ══════════════ */}
        {activeTab === 'analytics' && (
          <div className="analytics-layout">
            <div className="analytics-main">
              <HeatmapView year={selectedYear} allMonthsData={allMonthsData} tasks={tasks} />
              <VelocityChart
                checkedTasks={checkedTasks}
                tasks={tasks}
                daysInMonth={daysInMonth}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            </div>
            <div className="analytics-side">
              <Avatar stats={avatarStats} streak={streak} fatigued={fatigued} />
            </div>
          </div>
        )}

        {/* ══════════════ SOCIAL TAB ══════════════ */}
        {activeTab === 'social' && (
          <div className="social-layout">
            <div className="social-header-row">
              <h2 className="social-title">🤝 Accountability Vault</h2>
              <button className="create-contract-btn" onClick={() => setShowContractModal(true)}>
                + New Contract
              </button>
            </div>
            <p className="social-desc">
              Stake your points on a habit. If you fail, your friend gets the points. Loss aversion = motivation.
            </p>
            <ContractsList userId={userId} API_BASE={API_BASE} />
          </div>
        )}
      </main>

      {showContractModal && (
        <ContractModal
          userId={userId}
          userPoints={userPoints}
          API_BASE={API_BASE}
          onClose={() => setShowContractModal(false)}
          onContractCreated={(_, remaining) => setUserPoints(remaining)}
        />
      )}
    </div>
  );
}

export default App;
