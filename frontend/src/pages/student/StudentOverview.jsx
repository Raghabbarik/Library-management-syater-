import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import axios from 'axios';
import { 
  BookOpen, Calendar, AlertTriangle, RefreshCw, ChevronRight, Award, Compass, Download 
} from 'lucide-react';
import { downloadLibraryCard } from '../../utils/cardDownloader';

export default function StudentOverview({ setActiveTab }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const activeBorrows = allTransactions.filter(t => t.type === 'issue' && t.status === 'active');
  const pendingRequests = allTransactions.filter(t => t.type === 'request' && t.status === 'pending');

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/api/transactions');
      if (res.data.success) {
        setAllTransactions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleRenew = async (transactionId) => {
    setRenewingId(transactionId);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.post('/api/transactions/renew', { transactionId });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Book renewed successfully!' });
        fetchTransactions();
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to renew book.' 
      });
    } finally {
      setRenewingId(null);
    }
  };

  const handleCancelRequest = async (requestId) => {
    setCancellingId(requestId);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.delete(`/api/transactions/request/${requestId}`);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Request cancelled successfully!' });
        fetchTransactions();
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to cancel request.' 
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getDaysRemaining = (dueDateStr) => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        backgroundImage: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(142, 45, 226, 0.1) 100%)'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome back, <span className="text-gradient">{user?.name}</span>!</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Explore new titles or review your reading activity below.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab('catalog')}>
          <Compass size={18} />
          <span>Browse Library Catalog</span>
        </button>
      </div>

      {/* Grid: Stats Cards & Digital Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Left Side: Stats Counter Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--info-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)'
            }}>
              <BookOpen size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Currently Borrowed</span>
              <h3 style={{ fontSize: '1.5rem' }}>{activeBorrows.length} / 5 Books</h3>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)'
            }}>
              <Award size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Books Read</span>
              <h3 style={{ fontSize: '1.5rem' }}>{user?.totalBooksIssued || 0}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ 
            padding: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            border: user?.pendingFines > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--glass-border)'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-md)', 
              background: user?.pendingFines > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: user?.pendingFines > 0 ? 'var(--danger)' : 'var(--success)'
            }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Fines</span>
              <h3 style={{ fontSize: '1.5rem', color: user?.pendingFines > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                ₹{user?.pendingFines || 0}
              </h3>
            </div>
          </div>

        </div>

        {/* Right Side: Credit Card Style Digital Library Card */}
        <div className="glass-panel" style={{
          padding: '1.75rem',
          backgroundImage: 'linear-gradient(135deg, rgba(20, 20, 35, 0.95) 0%, rgba(35, 20, 60, 0.95) 100%)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '260px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Card Decorator Blobs */}
          <div style={{
            position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(162, 203, 139, 0.25) 0%, transparent 70%)', filter: 'blur(30px)'
          }} />

          <div className="flex-between">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {settings.logo && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <img src={settings.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <div>
                <span style={{ fontSize: '0.6rem', letterSpacing: '1.5px', color: '#c7eabb', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {(settings.institutionName || 'Smart Library').toUpperCase()} MEMBER PASS
                </span>
                <h3 style={{ fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif', marginTop: '0.1rem', color: '#ffffff', fontWeight: 600 }}>
                  {settings.institutionName || 'SmartLib'} Card
                </h3>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => downloadLibraryCard(user, settings)}
                title="Download Digital Library Card"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  padding: 0
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
              >
                <Download size={14} />
              </button>
              <div style={{
                background: user?.isActive ? 'rgba(199, 234, 187, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: user?.isActive ? '#c7eabb' : '#f87171',
                fontSize: '0.7rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                border: user?.isActive ? '1px solid rgba(199, 234, 187, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                {user?.isActive ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '1.5rem 0 0.5rem 0' }}>
            {/* Display user base64 QR Code */}
            {user?.qrCode ? (
              <div style={{
                background: 'white', padding: '0.35rem', borderRadius: 'var(--radius-md)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <img src={user.qrCode} alt="Digital Library Pass QR" style={{ width: '90px', height: '90px' }} />
              </div>
            ) : (
              <div style={{ width: '90px', height: '90px', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '0.5rem' }}>
                Generating QR...
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>CARD HOLDER</span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>{user?.name}</span>
              
              <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.5rem' }}>MEMBER ID</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', color: '#e8f5bd' }}>{user?.studentId || 'N/A'}</span>
            </div>
          </div>

          <div className="flex-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            <span>DEP: {user?.department || 'General'} {user?.year ? `| YEAR: ${user.year}` : ''}</span>
            <span>EXPIRES: {user?.membershipExpiry ? new Date(user.membershipExpiry).toLocaleDateString() : 'Never'}</span>
          </div>
        </div>

      </div>

      {/* Segment: Currently Borrowed Books */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
          Currently Borrowed Books
        </h3>

        {message.text && (
          <div style={{
            background: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: message.type === 'success' ? '1px solid var(--success)' : '1px solid var(--danger)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div>Loading borrowings...</div>
        ) : activeBorrows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>You don't have any borrowed books at the moment.</p>
            <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('catalog')}>
              Search the Catalog
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {activeBorrows.map((borrow) => {
              const daysRemaining = getDaysRemaining(borrow.dueDate);
              const isOverdue = daysRemaining < 0;

              return (
                <div key={borrow._id} className="glass-card" style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--glass-border)'
                }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {/* Book Cover */}
                    <div style={{
                      width: '70px',
                      height: '100px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(45deg, var(--bg-surface-hover), var(--bg-surface))',
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {borrow.book?.coverImage ? (
                        <img 
                          src={borrow.book.coverImage} 
                          alt={borrow.book.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <BookOpen size={24} color="var(--text-muted)" />
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                      <h4 style={{ 
                        fontSize: '0.95rem', 
                        whiteSpace: 'nowrap', 
                        textOverflow: 'ellipsis', 
                        overflow: 'hidden',
                        fontFamily: 'Outfit, sans-serif'
                      }} title={borrow.book?.title}>
                        {borrow.book?.title}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>by {borrow.book?.author}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ISBN: {borrow.book?.isbn}</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.45)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem'
                  }}>
                    <div className="flex-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Issued On:</span>
                      <span>{new Date(borrow.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Due On:</span>
                      <span style={{ fontWeight: 600 }}>{new Date(borrow.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex-between" style={{ marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                      {isOverdue ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={14} />
                          Overdue ({Math.abs(daysRemaining)} days)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={14} />
                          {daysRemaining} days left
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleRenew(borrow._id)}
                      disabled={renewingId !== null || borrow.renewCount >= 2 || isOverdue}
                      style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                    >
                      <RefreshCw size={14} className={renewingId === borrow._id ? 'animate-spin' : ''} />
                      <span>
                        {borrow.renewCount >= 2 
                          ? 'Max Renewed' 
                          : renewingId === borrow._id 
                            ? 'Renewing...' 
                            : `Renew (${borrow.renewCount}/2)`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Segment: Requested / Reserved Books */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
          Requested & Reserved Books
        </h3>

        {loading ? (
          <div>Loading requests...</div>
        ) : pendingRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
            <p>You don't have any pending requests. Books requested from the catalog will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {pendingRequests.map((reqItem) => {
              return (
                <div key={reqItem._id} className="glass-card" style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {/* Book Cover */}
                    <div style={{
                      width: '70px',
                      height: '100px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(45deg, var(--bg-surface-hover), var(--bg-surface))',
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {reqItem.book?.coverImage ? (
                        <img 
                          src={reqItem.book.coverImage} 
                          alt={reqItem.book.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <BookOpen size={24} color="var(--text-muted)" />
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                      <h4 style={{ 
                        fontSize: '0.95rem', 
                        whiteSpace: 'nowrap', 
                        textOverflow: 'ellipsis', 
                        overflow: 'hidden',
                        fontFamily: 'Outfit, sans-serif'
                      }} title={reqItem.book?.title}>
                        {reqItem.book?.title}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>by {reqItem.book?.author}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ISBN: {reqItem.book?.isbn}</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.45)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem'
                  }}>
                    <div className="flex-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Requested On:</span>
                      <span>{new Date(reqItem.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>Pending Admin Scan</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleCancelRequest(reqItem._id)}
                      disabled={cancellingId !== null}
                      style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                    >
                      <span>{cancellingId === reqItem._id ? 'Cancelling...' : 'Cancel Request'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
