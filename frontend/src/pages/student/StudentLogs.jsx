import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeftRight, Calendar, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

export default function StudentLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/api/scan/logs?page=${page}&limit=15`;
      if (filterDate) {
        url += `&date=${filterDate}`;
      }
      const res = await axios.get(url);
      if (res.data.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filterDate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Filters Header */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ArrowLeftRight size={22} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' }}>Access Gate Scans Log</h3>
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
          <Calendar size={16} color="var(--text-secondary)" />
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => { setPage(1); setFilterDate(e.target.value); }}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          />
          {filterDate && (
            <button 
              onClick={() => { setPage(1); setFilterDate(''); }}
              style={{
                background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
        {loading ? (
          <div>Loading entry logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            <ArrowLeftRight size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No entry or exit logs found.</p>
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
                  <th style={{ padding: '0.75rem 1rem' }}>Event Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Authentication Method</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isEntry = log.type === 'entry';
                  return (
                    <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                      <td style={{ padding: '1rem' }}>
                        {isEntry ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: 'var(--success)',
                            background: 'var(--success-bg)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 600,
                            fontSize: '0.8rem'
                          }}>
                            <ArrowDownLeft size={14} />
                            Library Entry
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: 'var(--warning)',
                            background: 'var(--warning-bg)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 600,
                            fontSize: '0.8rem'
                          }}>
                            <ArrowUpRight size={14} />
                            Library Exit
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {log.method || 'QR Scanner'}
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
