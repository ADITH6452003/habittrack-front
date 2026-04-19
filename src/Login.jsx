import { useState, useEffect, useRef } from 'react'
import './Login.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 18 + 6,
  left: Math.random() * 100,
  delay: Math.random() * 8,
  duration: Math.random() * 10 + 12,
}));

function Login({ onLogin, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [shake, setShake] = useState(false);
  const [ripple, setRipple] = useState(null);
  const btnRef = useRef(null);

  const triggerRipple = (e) => {
    const rect = btnRef.current.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      setLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.success) {
          onLogin(data.username, data.userId);
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 500);
          alert('Login failed: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        if (error.name === 'AbortError') {
          alert('Login timed out. Please try again.');
        } else {
          alert('Login failed: ' + error.message);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="particles">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div className={`login-card ${shake ? 'shake' : ''}`}>
        <div className="card-glow" />

        <div className="login-header">
          <div className="logo-ring">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" stroke="url(#g)" strokeWidth="2.5" />
              <path d="M12 20l6 6 10-12" stroke="url(#g)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa" />
                  <stop offset="1" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">Sign in to your habit tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className={`input-group ${focusedField === 'username' ? 'focused' : ''} ${username ? 'has-value' : ''}`}>
            <span className="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              required
              autoComplete="username"
            />
            <label htmlFor="username">Username</label>
            <span className="input-border" />
          </div>

          <div className={`input-group ${focusedField === 'password' ? 'focused' : ''} ${password ? 'has-value' : ''}`}>
            <span className="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              required
              autoComplete="current-password"
            />
            <label htmlFor="password">Password</label>
            <span className="input-border" />
          </div>

          <button
            ref={btnRef}
            type="submit"
            className={`login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
            onClick={triggerRipple}
          >
            {ripple && (
              <span className="ripple" style={{ left: ripple.x, top: ripple.y }} />
            )}
            {loading ? (
              <span className="btn-loader">
                <span /><span /><span />
              </span>
            ) : (
              <span className="btn-text">
                Sign In
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>
        </form>

        <p className="switch-text">
          Don't have an account?
          <button onClick={onSwitchToRegister} className="switch-btn">Create one</button>
        </p>
      </div>
    </div>
  );
}

export default Login;
