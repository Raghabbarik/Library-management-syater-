import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Clock, Search, RefreshCw, Mail, Phone, DollarSign } from 'lucide-react';

export default function SuperAdminPayments() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/payments/issues');
      if (res.data.success) {
        setIssues(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleMarkRefunded = async (id) => {
    if (!window.confirm('Are you sure you want to mark this as refunded? Make sure you have actually processed the refund via the payment gateway console.')) return;
    
    setProcessingId(id);
    try {
      const res = await axios.patch(`/api/payments/issues/${id}/refund`);
      if (res.data.success) {
        setIssues(prev => prev.map(issue => issue._id === id ? { ...issue, status: 'refunded', refundedAt: new Date().toISOString() } : issue));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as refunded');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = issues.filter(i => i.status === 'pending_refund').length;

  return (
    <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Payment Issues & Refunds</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage orphaned payments where gateway succeeded but account activation failed.
          </p>
        </div>
        <button onClick={fetchIssues} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>{pendingCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pending Refunds</div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading issues...</div>
        ) : issues.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <CheckCircle size={48} style={{ color: 'var(--success)', margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>All Clear!</h3>
            <p style={{ color: 'var(--text-secondary)' }}>There are no payment issues or refund requests at the moment.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Contact Info</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Amount & Plan</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => (
                  <tr key={issue._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {new Date(issue.reportedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{issue.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{issue.phone}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>₹{issue.amount}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'capitalize' }}>{issue.planSelected}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'monospace' }}>{issue.transactionId}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {issue.status === 'refunded' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--success-bg)', color: 'var(--success)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600 }}>
                          <CheckCircle size={14} />
                          Refunded
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600 }}>
                          <Clock size={14} />
                          Pending Refund
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {issue.status === 'pending_refund' && (
                        <button 
                          onClick={() => handleMarkRefunded(issue._id)}
                          disabled={processingId === issue._id}
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                          {processingId === issue._id ? 'Processing...' : 'Mark Refunded'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
