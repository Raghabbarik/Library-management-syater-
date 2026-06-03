import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  History, Calendar, DollarSign, CheckCircle2, AlertCircle, CreditCard, RefreshCw 
} from 'lucide-react';

export default function StudentHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/transactions?page=${page}&limit=10`);
      if (res.data.success) {
        setTransactions(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching transactions history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const handlePayFine = async (transactionId, fineAmount) => {
    setPayingId(transactionId);
    setMessage({ type: '', text: '' });
    try {
      // Send payment endpoint request
      const res = await axios.post('/api/transactions/pay-fine', { transactionId, amount: fineAmount });
      if (res.data.success) {
        setMessage({ type: 'success', text: `Payment of ₹${fineAmount} recorded successfully!` });
        // Refresh logs and user state
        fetchHistory();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Fine payment failed.'
      });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Overview Fines Banner */}
      <div className="glass-panel" style={{
        padding: '1.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundImage: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(142, 45, 226, 0.05) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)'
          }}>
            <DollarSign size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' }}>Fines & Charges Statement</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>View overdue books fines and clear outstanding balances.</p>
          </div>
        </div>
      </div>

      {message.text && (
        <div style={{
          background: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
          border: message.type === 'success' ? '1px solid var(--success)' : '1px solid var(--danger)',
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.9rem'
        }}>
          {message.text}
        </div>
      )}

      {/* Transactions Table */}
      <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
          Borrowing History Logs
        </h3>

        {loading ? (
          <div>Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            <History size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No transactions recorded yet.</p>
          </div>
        ) : (
          <div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.9rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Book Cover & Title</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Issued Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Due Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Returned Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Fine Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const hasFine = t.fine && t.fine.amount > 0;
                  const isPaid = t.fine && t.fine.paid;
                  
                  return (
                    <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                      {/* Book Cover and Title */}
                      <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '56px',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          background: 'rgba(255,255,255,0.05)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {t.book?.coverImage ? (
                            <img src={t.book.coverImage} alt={t.book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Calendar size={18} color="var(--text-muted)" />
                          )}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <span style={{ display: 'block', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {t.book?.title}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>by {t.book?.author}</span>
                        </div>
                      </td>

                      {/* Issued Date */}
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {new Date(t.dueDate).toLocaleDateString()}
                      </td>

                      {/* Returned Date */}
                      <td style={{ padding: '1rem' }}>
                        {t.returnDate ? (
                          <span style={{ color: 'var(--text-secondary)' }}>{new Date(t.returnDate).toLocaleDateString()}</span>
                        ) : (
                          <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Active issue</span>
                        )}
                      </td>

                      {/* Fine Amount / Paid Status */}
                      <td style={{ padding: '1rem' }}>
                        {hasFine ? (
                          isPaid ? (
                            <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                              <CheckCircle2 size={14} />
                              Paid (₹{t.fine.amount})
                            </span>
                          ) : (
                            <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                              <AlertCircle size={14} />
                              Unpaid (₹{t.fine.amount})
                            </span>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem' }}>
                        {hasFine && !isPaid ? (
                          <button
                            className="btn btn-primary"
                            disabled={payingId === t._id}
                            onClick={() => handlePayFine(t._id, t.fine.amount)}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            {payingId === t._id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <CreditCard size={12} />
                            )}
                            <span>Pay fine</span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex-center" style={{ gap: '0.5rem', marginTop: '1.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.015);
        }
      `}</style>

    </div>
  );
}
