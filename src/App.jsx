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

  // Load user session on app start
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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [checkedTasks, setCheckedTasks] = useState({});

  const saveDataToBackend = async () => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/api/savedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tasks,
          checkedTasks,
          month: selectedMonth,
          year: selectedYear
        })
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

  useEffect(() => {
    if (userId) {
      loadDataFromBackend();
    }
  }, [userId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (userId) {
      saveDataToBackend();
    }
  }, [tasks, checkedTasks]);

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, newTask]);
      setNewTask('');
    }
  };

  const deleteTask = async (taskIndex) => {
    const taskName = tasks[taskIndex];
    const newTasks = tasks.filter((_, index) => index !== taskIndex);
    const newCheckedTasks = { ...checkedTasks };
    
    // Remove all checkbox states for this task
    Object.keys(newCheckedTasks).forEach(key => {
      if (key.startsWith(`${taskIndex}-`)) {
        delete newCheckedTasks[key];
      }
    });
    
    // Update indices for remaining tasks
    const updatedCheckedTasks = {};
    Object.keys(newCheckedTasks).forEach(key => {
      const [oldTaskIndex, dayIndex] = key.split('-');
      const oldIndex = parseInt(oldTaskIndex);
      if (oldIndex > taskIndex) {
        updatedCheckedTasks[`${oldIndex - 1}-${dayIndex}`] = newCheckedTasks[key];
      } else {
        updatedCheckedTasks[key] = newCheckedTasks[key];
      }
    });
    
    setTasks(newTasks);
    setCheckedTasks(updatedCheckedTasks);
    
    // Delete from all months globally
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
    setCheckedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const calculateDayProgress = (dayIndex) => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter((_, taskIndex) => 
      checkedTasks[`${taskIndex}-${dayIndex}`]
    ).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const calculateTotalProgress = () => {
    if (tasks.length === 0) return 0;
    const totalPossible = tasks.length * daysInMonth;
    const totalCompleted = Object.values(checkedTasks).filter(Boolean).length;
    return Math.round((totalCompleted / totalPossible) * 100);
  };

  const getDayWithMonth = (day) => {
    const date = new Date(selectedYear, selectedMonth - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  const changeMonth = (direction) => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const handleLogin = (username, userIdFromBackend) => {
    setCurrentUser(username);
    setUserId(userIdFromBackend);
    setIsLoggedIn(true);
    // Save to localStorage for session persistence
    localStorage.setItem('currentUser', username);
    localStorage.setItem('userId', userIdFromBackend);
  };

  const handleRegister = (username, userIdFromBackend) => {
    setCurrentUser(username);
    setUserId(userIdFromBackend);
    setIsLoggedIn(true);
    // Save to localStorage for session persistence
    localStorage.setItem('currentUser', username);
    localStorage.setItem('userId', userIdFromBackend);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setUserId('');
    setTasks([]);
    setCheckedTasks({});
    // Clear localStorage on logout
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
  };

  if (!isLoggedIn) {
    return showRegister ? (
      <Register 
        onRegister={handleRegister}
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <Login 
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <div className="App">
      <header className="motivation-header">
        <blockquote className="discipline-quote">
          "If you want to shine like SUN be ready to burn"
        </blockquote>
        <div className="date-display">{today}</div>
        <div className="user-info">
          Welcome, {currentUser}! 
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>
      <main>
        <div className="month-navigation">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="month-select"
          >
            {Array.from({length: 12}, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="year-select"
          >
            {Array.from({length: 10}, (_, i) => (
              <option key={2020 + i} value={2020 + i}>
                {2020 + i}
              </option>
            ))}
          </select>
          
          <button onClick={goToCurrentMonth} className="current-btn">Current Month</button>
        </div>
        
        <div className="task-input">
          <input 
            type="text" 
            value={newTask} 
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add new task"
          />
          <button onClick={addTask}>Add Task</button>
        </div>
        
        <div className="table-container">
          <table className="habit-table">
            <thead>
              <tr>
                <th>Tasks</th>
                {Array.from({length: daysInMonth}, (_, i) => (
                  <th key={i}>{getDayWithMonth(i + 1)}</th>
                ))}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => (
                <tr key={index}>
                  <td className="task-name">{task}</td>
                  {Array.from({length: daysInMonth}, (_, i) => (
                    <td key={i} className="day-cell">
                      <input 
                        type="checkbox" 
                        checked={checkedTasks[`${index}-${i}`] || false}
                        onChange={() => handleCheckboxChange(index, i)}
                      />
                    </td>
                  ))}
                  <td className="action-cell">
                    <button 
                      onClick={() => deleteTask(index)}
                      className="delete-btn"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="progress-row">
            <div className="progress-label">Progress</div>
            {Array.from({length: daysInMonth}, (_, i) => (
              <div key={i} className="progress-circle">
                {calculateDayProgress(i)}%
              </div>
            ))}
            <div className="progress-spacer"></div>
          </div>
        </div>
        
        <div className="total-progress">
          <h3>Total Progress</h3>
          <div className="total-progress-circle">
            {calculateTotalProgress()}%
          </div>
        </div>
      </main>
    </div>
  )
}

export default App