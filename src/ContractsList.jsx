import { useState, useEffect } from 'react';
import './ContractsList.css';

export default function ContractsList({ userId, currentUsername, API_BASE, onPointsChange }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { loadContracts(); }, [userId]);

  const loadContracts = async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/contracts/${userId}`);
      const data = await res.json();
      if (data.success) setContracts(data.contracts);
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const accept = async (contractId) => {
    try {
      const res  = await fetch(`${API_BASE}/api/contracts/${contractId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        onPointsChange && onPointsChange(data.remainingPoints);
        loadContracts();
      } else {
        alert(data.error);
      }
    } catch (err) { console.error(err); }
  };

  const decline = async (contractId) => {
    try {
      const res  = await fetch(`${API_BASE}/api/contracts/${contractId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) loadContracts();
      else alert(data.error);
    } catch (err) { console.error(err); }
  };

  const markDone = async (contractId) => {
    try {
      const res  = await fetch(`${API_BASE}/api/contracts/${contractId}/done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) loadContracts();
      else alert(data.error);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="contracts-loading">Loading contracts...</div>;

  const pending = contracts.filter(c => c.inviteStatus === 'pending' && c.friendId === userId || (c.friendUsername === currentUsername && c.inviteStatus === 'pending'));
  const active  = contracts.filter(c => c.status === 'active');
  const past    = contracts.filter(c => c.status === 'completed' || c.status === 'failed');

  // Helper: is the current user the creator?
  const isCreator = (c) => c.creatorId === userId || c.creatorUsername === currentUsername;

  // Helper: has current user already marked done?
  const myDone = (c) => isCreator(c) ? c.creatorDone : c.friendDone;
  const theirDone = (c) => isCreator(c) ? c.friendDone : c.creatorDone;
  const theirName = (c) => isCreator(c) ? c.friendUsername : c.creatorUsername;

  if (!contracts.length) return (
    <div className="contracts-empty">
      No challenges yet. Send one to a friend to get started!
    </div>
  );

  return (
    <div className="contracts-sections">

      {/* ── Pending invites (received) ── */}
      {contracts.filter(c => c.inviteStatus === 'pending' && c.friendUsername === currentUsername).length > 0 && (
        <div className="contracts-section">
          <div className="section-label incoming">📬 Incoming Challenges</div>
          {contracts
            .filter(c => c.inviteStatus === 'pending' && c.friendUsername === currentUsername)
            .map(c => (
              <div key={c._id} className="contract-card pending-invite">
                <div className="contract-header">
                  <span className="contract-habit">{c.habitName}</span>
                  <span className="contract-status pending-tag">⏳ Pending</span>
                </div>
                <div className="contract-details">
                  <span>⚔️ From <strong>{c.creatorUsername}</strong></span>
                  <span>💰 {c.stakePoints} pts each</span>
                  <span>📅 {new Date(c.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <p className="contract-invite-note">
                  Accept to stake {c.stakePoints} pts. Both must complete the habit or lose their stake.
                </p>
                <div className="contract-actions">
                  <button className="accept-btn" onClick={() => accept(c._id)}>✅ Accept</button>
                  <button className="decline-btn" onClick={() => decline(c._id)}>❌ Decline</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Sent pending (waiting for friend) ── */}
      {contracts.filter(c => c.inviteStatus === 'pending' && c.creatorUsername === currentUsername).length > 0 && (
        <div className="contracts-section">
          <div className="section-label outgoing">📤 Sent Challenges</div>
          {contracts
            .filter(c => c.inviteStatus === 'pending' && c.creatorUsername === currentUsername)
            .map(c => (
              <div key={c._id} className="contract-card sent-invite">
                <div className="contract-header">
                  <span className="contract-habit">{c.habitName}</span>
                  <span className="contract-status waiting-tag">⌛ Awaiting Response</span>
                </div>
                <div className="contract-details">
                  <span>👤 To <strong>{c.friendUsername}</strong></span>
                  <span>💰 {c.stakePoints} pts each</span>
                  <span>📅 {new Date(c.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Active contracts ── */}
      {active.length > 0 && (
        <div className="contracts-section">
          <div className="section-label active-label">⚡ Active Challenges</div>
          {active.map(c => {
            const iAm      = isCreator(c) ? 'creator' : 'friend';
            const myDoneNow   = myDone(c);
            const theirDoneNow = theirDone(c);
            return (
              <div key={c._id} className="contract-card active">
                <div className="contract-header">
                  <span className="contract-habit">{c.habitName}</span>
                  <span className="contract-status active-tag">⚡ Active</span>
                </div>
                <div className="contract-details">
                  <span>vs <strong>{theirName(c)}</strong></span>
                  <span>💰 {c.stakePoints} pts each at stake</span>
                  <span>📅 {new Date(c.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>

                {/* Progress indicators */}
                <div className="done-status-row">
                  <div className={`done-pill ${myDoneNow ? 'done' : 'pending'}`}>
                    {myDoneNow ? '✅' : '⬜'} You
                  </div>
                  <div className="vs-divider">vs</div>
                  <div className={`done-pill ${theirDoneNow ? 'done' : 'pending'}`}>
                    {theirDoneNow ? '✅' : '⬜'} {theirName(c)}
                  </div>
                </div>

                {!myDoneNow && (
                  <button className="mark-done-btn" onClick={() => markDone(c._id)}>
                    ✅ Mark My Side Done
                  </button>
                )}
                {myDoneNow && !theirDoneNow && (
                  <p className="waiting-note">Waiting for {theirName(c)} to mark done...</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Past contracts ── */}
      {past.length > 0 && (
        <div className="contracts-section">
          <div className="section-label past-label">📜 Past Challenges</div>
          {past.map(c => {
            const won  = c.status === 'completed' || (c.status === 'failed' && myDone(c) && !theirDone(c));
            const lost = c.status === 'failed' && !myDone(c);
            const draw = c.status === 'failed' && !myDone(c) && !theirDone(c);
            return (
              <div key={c._id} className={`contract-card ${c.status}`}>
                <div className="contract-header">
                  <span className="contract-habit">{c.habitName}</span>
                  <span className={`contract-status ${c.status === 'completed' ? 'done-tag' : 'failed-tag'}`}>
                    {c.status === 'completed' ? '🏆 Both Won' : draw ? '💀 Both Lost' : won ? '🏆 You Won' : '💸 You Lost'}
                  </span>
                </div>
                <div className="contract-details">
                  <span>vs <strong>{theirName(c)}</strong></span>
                  <span>💰 {c.stakePoints} pts</span>
                  <span>📅 {new Date(c.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="done-status-row">
                  <div className={`done-pill ${myDone(c) ? 'done' : 'failed'}`}>{myDone(c) ? '✅' : '❌'} You</div>
                  <div className="vs-divider">vs</div>
                  <div className={`done-pill ${theirDone(c) ? 'done' : 'failed'}`}>{theirDone(c) ? '✅' : '❌'} {theirName(c)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
