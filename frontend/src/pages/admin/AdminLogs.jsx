import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import { 
  ArrowLeftRight, Calendar, ArrowUpRight, ArrowDownLeft, Search, RefreshCw, Clock
} from 'lucide-react';

export default function AdminLogs() {
  const socket = useSocket();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      let url = `/api/scan/sessions?page=${page}&limit=12`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (filterDate) url += `&date=${filterDate}`;

      const res = await axios.get(url);
      if (res.data.success) {
        setSessions(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching admin sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, filterDate]);

  // Live updates from socket to keep current view fresh
  useEffect(() => {
    if (socket) {
      const handleLiveScan = () => {
        fetchSessions();
      };

      socket.on('entry_exit_scan', handleLiveScan);
      return () => {
        socket.off('entry_exit_scan', handleLiveScan);
      };
    }
  }, [socket, page, searchQuery, filterDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSessions();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterDate('');
    setPage(1);
    // Explicitly refetch
    setTimeout(() => {
      fetchSessions();
    }, 0);
  };

  // Helper to format duration
  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} mins`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Filters Header Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by student name or Student ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <button type="submit" className="btn btn-primary">Search</button>

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}>
            <Calendar size={16} color="var(--text-secondary)" />
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => { setPage(1); setFilterDate(e.target.value); }}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Clear Filters */}
          {(searchQuery || filterDate) && (
            <button 
              type="button" 
              onClick={handleClearFilters}
              style={{
                background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
              }}
            >
              Clear Filters
            </button>
          )}
        </form>
      </div>

      {/* Paired Sessions Table */}
      <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
          Student Library Attendance Sessions
        </h3>

        {loading ? (
          <div className="flex-center" style={{ minHeight: '200px', gap: '0.5rem' }}>
            <RefreshCw size={20} className="animate-spin" color="var(--accent-cyan)" />
            <span>Loading attendance logs...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-secondary)' }}>
            <ArrowLeftRight size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No entry/exit attendance sessions found matching filters.</p>
          </div>
        ) : (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Student Details</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ID Number</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Entry Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Exit Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Time Spent</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Method</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const entryDate = new Date(session.entryTime);
                  const exitDate = session.exitTime ? new Date(session.exitTime) : null;
                  
                  return (
                    <tr key={session._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                      {/* Name Details */}
                      <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem'
                        }}>
                          {session.user?.name ? session.user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <span style={{ display: 'block', fontWeight: 600 }}>{session.user?.name || 'Unknown Student'}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{session.user?.email}</span>
                        </div>
                      </td>
                      
                      {/* Student ID */}
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>
                        {session.user?.studentId || 'N/A'}
                      </td>

                      {/* Department */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {session.user?.department || 'General'}
                      </td>

                      {/* Entry Time */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ color: 'var(--success)', display: 'block', fontWeight: 500 }}>
                          {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {entryDate.toLocaleDateString()}
                        </span>
                      </td>

                      {/* Exit Time */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {session.stillInside ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            color: 'var(--success)', background: 'var(--success-bg)',
                            padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)',
                            fontWeight: 600, fontSize: '0.75rem'
                          }}>
                            <span className="pulse-dot" style={{
                              width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor'
                            }}></span>
                            Inside Library
                          </span>
                        ) : (
                          <>
                            <span style={{ color: 'var(--warning)', display: 'block', fontWeight: 500 }}>
                              {exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {exitDate.toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </td>

                      {/* Time Spent */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {session.stillInside ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} />
                            Calculating...
                          </span>
                        ) : (
                          <span style={{ fontWeight: 600 }}>{formatDuration(session.durationMs)}</span>
                        )}
                      </td>

                      {/* Method info */}
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontSize: '0.8rem' }}>
                        {session.method}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
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
        .pulse-dot {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>

    </div>
  );
}
