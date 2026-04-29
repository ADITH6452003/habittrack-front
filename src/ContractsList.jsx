import { useState, useEffect } from 'react';
import './ContractsList.css';

export default function ContractsList({ userId, API_BASE }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, [userId]);

  const loadContracts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/contracts/${userId}`);
      const data = await res.json();
      if (data.success) setContracts(data.contracts);
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (contractId) => {
    try {
      const res = await fetch(`${API_BASE}/api/contracts/${contractId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) loadContracts();
    } catch (err) {
      console.error('Failed to complete contract:', err);
    }
  };

  if (loading) return <div className="contracts-loading">Loading contracts...</div>;
  if (!contracts.length) return <div className="contracts-empty">No contracts yet. Create one to get started!</div>;

  return (
    <div className="contracts-list">
      {contracts.map((c) => {
        const isPast = new Date(c.deadline) < new Date();
        const statusColor = c.status === 'completed' ? '#34d399' : c.status === 'failed' ? '#f87171' : '#a78bfa';
        return (
          <div key={c._id} className={`contract-card ${c.status}`}>
            <div className="contract-header">
              <span className="contract-habit">{c.habitName}</span>
              <span className="contract-status" style={{ color: statusColor }}>
                {c.status === 'active' ? '⏳ Active' : c.status === 'completed' ? '✅ Done' : '❌ Failed'}
              </span>
            </div>
            <div className="contract-details">
              <span>👤 {c.friendUsername}</span>
              <span>💰 {c.stakePoints} pts</span>
              <span>📅 {new Date(c.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            {c.status === 'active' && !isPast && (
              <button className="contract-complete-btn" onClick={() => markComplete(c._id)}>
                Mark Complete
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
