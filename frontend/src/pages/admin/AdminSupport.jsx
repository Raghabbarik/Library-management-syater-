import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PhoneCall, Send, AlertCircle, Clock, CheckCircle, RefreshCw } from 'lucide-react';

export default function AdminSupport() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await axios.get('/api/support');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
    setLoadingTickets(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Please provide both a subject and a message.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await axios.post('/api/support', { subject, message });
      if (res.data.success) {
        setSuccess('Your message has been sent successfully. Support will contact you shortly.');
        setSubject('');
        setMessage('');
        fetchTickets();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
      
      {/* Support Header */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }} className="text-gradient">Institution Support</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Need help with your library system? Contact our super admin team directly.</p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'var(--bg-surface-hover)',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--glass-border)',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#3b82f6'
          }}>
            <PhoneCall size={20} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toll-Free Support Line</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>1-800-SMARTLIB</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Contact Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} className="text-gradient" />
            Send a Direct Message
          </h3>

          {error && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {success && (
            <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Subject</label>
              <input
                type="text"
                placeholder="Briefly describe the issue..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Message</label>
              <textarea
                placeholder="Provide more details about your request or problem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                style={{ resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ alignSelf: 'flex-start' }}>
              {isLoading ? 'Sending...' : 'Submit Ticket'}
            </button>
          </form>
        </div>

        {/* Ticket History */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} className="text-gradient" />
              Recent Support Tickets
            </h3>
            <button onClick={fetchTickets} className="btn btn-secondary" style={{ padding: '0.4rem' }} title="Refresh Tickets">
              <RefreshCw size={14} className={loadingTickets ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loadingTickets ? (
              <div className="flex-center" style={{ height: '100px', color: 'var(--text-muted)' }}>Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="flex-center" style={{ height: '100px', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                No support tickets history.
              </div>
            ) : (
              tickets.map(ticket => (
                <div key={ticket._id} style={{ 
                  background: 'var(--bg-surface-hover)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ticket.subject}</h4>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    {ticket.message}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Submitted on: {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
