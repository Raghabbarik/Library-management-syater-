import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HelpCircle, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function SuperAdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/support');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      const res = await axios.patch(`/api/support/${id}`, { status: newStatus });
      if (res.data.success) {
        setTickets(tickets.map(t => t._id === id ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      alert('Failed to update ticket status.');
    }
    setUpdating(null);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'open':
        return <span style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={12}/> Open</span>;
      case 'in-progress':
        return <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><RefreshCw size={12}/> In Progress</span>;
      case 'resolved':
      case 'closed':
        return <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={12}/> {status === 'resolved' ? 'Resolved' : 'Closed'}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle className="text-gradient" size={24} />
            <span className="text-gradient">Support Desk</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage messages and support requests from institution admins.</p>
        </div>
        <button onClick={fetchTickets} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
            Loading support tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
            No support tickets found. All good!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Date</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Institution ID</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Sender</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Subject & Message</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', verticalAlign: 'top' }}>
                    {new Date(ticket.createdAt).toLocaleDateString()}<br/>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(ticket.createdAt).toLocaleTimeString()}</span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', verticalAlign: 'top' }}>
                    <span style={{ padding: '0.2rem 0.5rem', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--glass-border)', color: 'var(--accent-cyan)' }}>
                      {ticket.institutionId}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 500 }}>{ticket.sender?.name || 'Unknown'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{ticket.sender?.email}</div>
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top', maxWidth: '300px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{ticket.subject}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{ticket.message}</div>
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {ticket.status !== 'open' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                        <button 
                          onClick={() => updateStatus(ticket._id, 'open')}
                          disabled={updating === ticket._id}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          Mark Open
                        </button>
                      )}
                      {ticket.status === 'open' && (
                        <button 
                          onClick={() => updateStatus(ticket._id, 'in-progress')}
                          disabled={updating === ticket._id}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)' }}
                        >
                          In Progress
                        </button>
                      )}
                      {ticket.status !== 'resolved' && (
                        <button 
                          onClick={() => updateStatus(ticket._id, 'resolved')}
                          disabled={updating === ticket._id}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' }}
                        >
                          Resolve
                        </button>
                      )}
                      {ticket.status !== 'closed' && (
                        <button 
                          onClick={() => updateStatus(ticket._id, 'closed')}
                          disabled={updating === ticket._id}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
