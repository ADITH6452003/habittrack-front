import './App.css'
import { useState, useEffect } from 'react'
import Login from './Login'
import Register from './Register'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [userId, setUserId] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedUserId = localStorage.getItem('userId');
    if (savedUser && savedUserId) {
      setCurrentUser(savedUser);
      setUserId(savedUserId);
      setIsLoggedIn(true);
    }
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [checkedTasks, setCheckedTasks] = useState({});
  const [addingTask, setAddingTask] = useState(false);

  const saveDataToBackend = async () => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/api/savedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tasks, checkedTasks, month: selectedMonth, year: selectedYear })
      });
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const loadDataFromBackend = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_BASE}/api/getdata/${userId}/${selectedMonth}/${selectedYear}`);
      const result = await response.json();
      if (result.success && result.data) {
        setTasks(result.data.tasks || []);
        setCheckedTasks(result.data.checkedTasks || {});
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => { if (userId) loadDataFromBackend(); }, [userId, selectedMonth, selectedYear]);
  useEffect(() => { if (userId) saveDataToBackend(); }, [tasks, checkedTasks]);

  const addTask = () => {
    if (newTask.trim()) {
      setAddingTask(true);
      setTimeout(() => setAddingTask(false), 400);
      setTasks([...tasks, newTask.trim()]);
      setNewTask('');
    }
  };

  const deleteTask = async (taskIndex) => {
    const taskName = tasks[taskIndex];
    const newTasks = tasks.filter((_, i) => i !== taskIndex);
    const newChecked = {};
    Object.keys(checkedTasks).forEach(key => {
      const [ti, di] = key.split('-').map(Number);
      if (ti < taskIndex) newChecked[key] = checkedTasks[key];
      else if (ti > taskIndex) newChecked[`${ti - 1}-${di}`] = checkedTasks[key];
    });
    setTasks(newTasks);
    setCheckedTasks(newChecked);
    try {
      await fetch(`${API_BASE}/api/deletetask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, taskName })
      });
    } catch (error) {
      console.error('Failed to delete task globally:', error);
    }
  };

  const handleCheckboxChange = (taskIndex, dayIndex) => {
    const key = `${taskIndex}-${dayIndex}`;
    setCheckedTasks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateDayProgress = (dayIndex) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((_, ti) => checkedTasks[`${ti}-${dayIndex}`]).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const calculateTotalProgress = () => {
    if (tasks.length === 0) return 0;
    const total = tasks.length * daysInMonth;
    const completed = Object.values(checkedTasks).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  const getTotalCompleted = () => Object.values(checkedTasks).filter(Boolean).length;

  const getStreak = () => {
    const today = new Date();
    if (today.getMonth() + 1 !== selectedMonth || today.getFullYear() !== selectedYear) return 0;
    let streak = 0;
    for (let d = today.getDate() - 1; d >= 0; d--) {
      const prog = calculateDayProgress(d);
      if (prog === 100 && tasks.length > 0) streak++;
      else break;
    }
    return streak;
  };

  const getDayWithMonth = (day) =>
    new Date(selectedYear, selectedMonth - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const goToCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  const handleLogin = (username, userIdFromBackend) => {
    setCurrentUser(username); setUserId(userIdFromBackend); setIsLoggedIn(true);
    localStorage.setItem('currentUser', username);
    localStorage.setItem('userId', userIdFromBackend);
  };

  const handleRegister = (username, userIdFromBackend) => {
    setCurrentUser(username); setUserId(userIdFromBackend); setIsLoggedIn(true);
    localStorage.setItem('currentUser', username);
    localStorage.setItem('userId', userIdFromBackend);
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setCurrentUser(''); setUserId('');
    setTasks([]); setCheckedTasks({});
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
  };

  if (!isLoggedIn) {
    return showRegister
      ? <Register onRegister={handleRegister} onSwitchToLogin={() => setShowRegister(false)} />
      : <Login onLogin={handleLogin} onSwitchToRegister={() => setShowRegister(true)} />;
  }

  const totalProgress = calculateTotalProgress();
  const streak = getStreak();

  return (
    <div className="app">
      {/* Animated background orbs */}
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="bg-orb orb3" />

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
          <div className="user-badge">
            <span className="user-avatar">{currentUser[0]?.toUpperCase()}</span>
            <span className="user-name">{currentUser}</span>
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
        {/* Quote */}
        <div className="quote-banner">
          <span className="quote-icon">"</span>
          <p>If you want to shine like the SUN, be ready to burn like one.</p>
        </div>

        {/* Stat cards */}
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
              <span className="stat-value">{streak}</span>
              <span className="stat-label">Day Streak 🔥</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-banner">
          <div className="progress-banner-header">
            <span>Monthly Completion</span>
            <span className="progress-pct">{totalProgress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${totalProgress}%` }} />
          </div>
        </div>

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

        {/* Table */}
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
                      <th key={ti}>
                        <div className="habit-header-cell">
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
                    const d = new Date(selectedYear, selectedMonth - 1, di + 1);
                    const isToday = d.toDateString() === new Date().toDateString();
                    const pct = calculateDayProgress(di);
                    return (
                      <tr key={di} className={`task-row ${isToday ? 'today-row' : ''}`}>
                        <td className="task-name-cell">
                          <div className="task-name-wrap">
                            {isToday && <span className="today-badge">Today</span>}
                            <span>{getDayWithMonth(di + 1)}</span>
                          </div>
                        </td>
                        {tasks.map((_, ti) => {
                          const checked = checkedTasks[`${ti}-${di}`] || false;
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
      </main>
    </div>
  );
}

export default App;
