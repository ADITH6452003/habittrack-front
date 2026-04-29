import { useState } from 'react';
import './ContractModal.css';

export default function ContractModal({ userId, userPoints, onClose, onContractCreated, API_BASE }) {
  const [friendUsername, setFriendUsername] = useState('');
  const [habitName, setHabitName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [stakePoints, setStakePoints] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!friendUsername.trim() || !habitName.trim() || !deadline || stakePoints < 1) {
      setError('All fields required');
      return;
    }
    if (stakePoints > userPoints) {
      setError('Insufficient points');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, friendUsername, habitName, deadline, stakePoints }),
      });
      const data = await res.json();
      if (data.success) {
        onContractCreated(data.contract, data.remainingPoints);
        onClose();
      } else {
        setError(data.error || 'Failed to create contract');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Accountability Contract</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label>Friend's Username</label>
            <input
              type="text"
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="form-field">
            <label>Habit to Track</label>
            <input
              type="text"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="e.g. Morning workout"
              required
            />
          </div>
          <div className="form-field">
            <label>Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="form-field">
            <label>Stake Points (you have {userPoints})</label>
            <input
              type="number"
              value={stakePoints}
              onChange={(e) => setStakePoints(parseInt(e.target.value) || 0)}
              min="1"
              max={userPoints}
              required
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="modal-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Contract'}
          </button>
        </form>
      </div>
    </div>
  );
}
