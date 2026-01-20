import { useState } from 'react'
import './Login.css'

function Login({ onLogin, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      setLoading(true);
      try {
        const response = await fetch('https://habittrack-back-n2krw2ze7-adiths-projects-6dd5238c.vercel.app/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.success) {
          onLogin(data.username, data.userId);
        } else {
          alert('Login failed: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your connection and try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p>
          Don't have an account? 
          <button onClick={onSwitchToRegister} className="switch-btn">Register</button>
        </p>
      </div>
    </div>
  )
}

export default Login