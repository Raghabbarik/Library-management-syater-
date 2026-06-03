import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import { 
  BookOpen, Users, ClipboardList, AlertTriangle, ArrowDownLeft, ArrowUpRight, Award, Compass 
} from 'lucide-react';

export default function AdminOverview({ setActiveTab }) {
  const socket = useSocket();
  const [summary, setSummary] = useState(null);
  const [topBooks, setTopBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [sumRes, topRes, catRes, logsRes] = await Promise.allSettled([
        axios.get('/api/analytics/summary'),
        axios.get('/api/analytics/top-books'),
        axios.get('/api/analytics/categories'),
        axios.get('/api/scan/logs?limit=5')
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value.data.success) setSummary(sumRes.value.data.data);
      if (topRes.status === 'fulfilled' && topRes.value.data.success) setTopBooks(topRes.value.data.data);
      if (catRes.status === 'fulfilled' && catRes.value.data.success) setCategories(catRes.value.data.data);
      if (logsRes.status === 'fulfilled' && logsRes.value.data.success) setRecentLogs(logsRes.value.data.data);

    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Socket live update of entry/exits
  useEffect(() => {
    if (socket) {
      const handleLiveScan = (data) => {
        setRecentLogs((prev) => [data.log, ...prev.slice(0, 4)]);
        // Refetch summary for counts update
        axios.get('/api/analytics/summary').then(res => {
          if (res.data.success) setSummary(res.data.data);
        });
      };

      socket.on('entry_exit_scan', handleLiveScan);
      return () => {
        socket.off('entry_exit_scan', handleLiveScan);
      };
    }
  }, [socket]);

  if (loading) {
    return <div className="flex-center" style={{ minHeight: '300px' }}>Loading analytics...</div>;
  }

  const cards = [
    { name: 'Total Titles', value: summary?.totalBooks || 0, sub: 'Active catalog books', icon: BookOpen, color: 'var(--accent-cyan)', bg: 'rgba(0, 242, 254, 0.1)' },
    { name: 'Registered Students', value: summary?.totalUsers || 0, sub: 'Active memberships', icon: Users, color: 'var(--accent-blue)', bg: 'rgba(79, 172, 254, 0.1)' },
    { name: 'Active Borrows', value: summary?.activeTransactions || 0, sub: `Today: +${summary?.todayIssued || 0} issues`, icon: ClipboardList, color: 'var(--accent-violet)', bg: 'rgba(142, 45, 226, 0.1)' },
    { name: 'Overdue Items', value: summary?.overdueCount || 0, sub: `Pending: ₹${summary?.totalFinesPending || 0}`, icon: AlertTriangle, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
      }}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex-between">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.name}</span>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: c.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color
                }}>
                  <Icon size={20} />
                </div>
              </div>
              <div>
                <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif' }}>{c.value}</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Check-ins & Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Live Scan Ticker Feed */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="flex-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' }}>Recent Access Scans</h3>
            <button className="btn btn-secondary" onClick={() => setActiveTab('scanner')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
              Simulator
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentLogs.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>No recent gate scans.</p>
            ) : (
              recentLogs.map((log) => {
                const isEntry = log.type === 'entry';
                return (
                  <div key={log._id || Math.random()} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.45)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', 
                        background: isEntry ? 'var(--success-bg)' : 'var(--warning-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isEntry ? 'var(--success)' : 'var(--warning)'
                      }}>
                        {isEntry ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>{log.user?.name}</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: {log.user?.studentId}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500 }}>
                        {isEntry ? 'Entry' : 'Exit'}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category distribution visual */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', fontFamily: 'Outfit, sans-serif' }}>
            Category Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categories.slice(0, 5).map((cat, i) => {
              const colors = ['var(--accent-cyan)', 'var(--accent-blue)', 'var(--accent-violet)', 'var(--accent-purple)', 'var(--info)'];
              const maxCount = categories[0]?.count || 1;
              const percent = Math.round((cat.count / maxCount) * 100);

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="flex-between" style={{ fontSize: '0.8rem' }}>
                    <span>{cat._id}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{cat.count} titles ({cat.available} avail)</span>
                  </div>
                  <div style={{
                    width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percent}%`, height: '100%', background: colors[i % colors.length], borderRadius: '4px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Segment: Top Issued Books */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
          Top Issued Books (Popular Demand)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {topBooks.slice(0, 4).map((book) => (
            <div key={book._id} className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                width: '50px',
                height: '75px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <BookOpen size={20} color="var(--text-muted)" />
                )}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <span style={{
                  display: 'block', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
                }} title={book.title}>
                  {book.title}
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>by {book.author}</span>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem',
                  color: 'var(--accent-cyan)', background: 'rgba(0, 242, 254, 0.08)', padding: '0.1rem 0.35rem',
                  borderRadius: 'var(--radius-sm)', marginTop: '0.25rem', fontWeight: 600
                }}>
                  <Award size={12} />
                  Issued {book.totalIssued} times
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
