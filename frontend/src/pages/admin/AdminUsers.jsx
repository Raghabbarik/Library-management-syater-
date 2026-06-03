import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Users, ToggleLeft, ToggleRight, X,
  BookOpen, CheckCircle, Calendar, Phone, Mail, Hash,
  Building2, GraduationCap, IndianRupee, BookMarked, History, ArrowLeft, Clock,
  Download
} from 'lucide-react';
import { downloadLibraryCard } from '../../utils/cardDownloader';
import { useSettings } from '../../contexts/SettingsContext';

const departments = [
  'Computer Science', 'Electronics', 'Electrical', 'Mechanical', 'Civil',
  'Information Technology', 'Chemical', 'Biotechnology', 'Mathematics',
  'Physics', 'Chemistry', 'Commerce', 'Arts', 'Management', 'Other',
];
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

/* ─── small helper ─── */
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const isOverdue = (d) => new Date(d) < new Date();
const daysOverdue = (d) => Math.ceil((new Date() - new Date(d)) / 86400000);

/* ════════════════════════════════════════════════
   STUDENT DETAIL PAGE  (full-width content view)
════════════════════════════════════════════════ */
function StudentDetailPage({ data, onBack, settings }) {
  const { user: u, activeTransactions: active = [], pastTransactions: past = [] } = data;
  const [histPage, setHistPage] = useState(1);
  const PER = 8;
  const totalHPages = Math.ceil(past.length / PER);
  const histSlice = past.slice((histPage - 1) * PER, histPage * PER);

  const stat = (icon, value, label, color = 'var(--accent-cyan)', topColor) => (
    <div style={{
      flex: '1 1 180px', background: 'var(--bg-surface)',
      border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
      borderTop: `4px solid ${topColor || color}`,
      padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem'
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Lora, serif', color }}>{value}</span>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">

      {/* ── Back bar ── */}
      <button onClick={onBack} className="btn btn-secondary"
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', padding: '0.55rem 1.1rem' }}>
        <ArrowLeft size={16} /> Back to Student Registry
      </button>

      {/* ── Profile Card ── */}
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Avatar */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '2.5rem', color: '#fff', flexShrink: 0,
            boxShadow: '0 6px 24px rgba(63,82,60,0.25)'
          }}>
            {u.name?.charAt(0).toUpperCase()}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h2 style={{ fontSize: '2rem', fontFamily: 'Lora, serif', marginBottom: '0.5rem' }}>{u.name}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <span style={{
                textTransform: 'capitalize', fontSize: '0.78rem', fontWeight: 700,
                padding: '0.25rem 0.7rem', borderRadius: '999px',
                background: 'rgba(63,82,60,0.12)', color: 'var(--accent-cyan)'
              }}>{u.role}</span>
              <span style={{
                fontSize: '0.78rem', fontWeight: 700,
                padding: '0.25rem 0.7rem', borderRadius: '999px',
                background: u.isActive ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: u.isActive ? 'var(--success)' : 'var(--danger)'
              }}>{u.isActive ? 'Active' : 'Inactive'}</span>
              <button 
                onClick={() => downloadLibraryCard(u, settings)}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.85rem',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <Download size={13} />
                <span>Download Library Card</span>
              </button>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {[
                { icon: <Mail size={15} />, label: 'Email', val: u.email },
                { icon: <Hash size={15} />, label: 'Student / Staff ID', val: u.studentId || '—' },
                { icon: <Building2 size={15} />, label: 'Department', val: u.department || '—' },
                { icon: <GraduationCap size={15} />, label: 'Year', val: u.year || '—' },
                { icon: <Phone size={15} />, label: 'Phone', val: u.phone || '—' },
                { icon: <Calendar size={15} />, label: 'Registered On', val: fmt(u.createdAt) },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: 'var(--bg-surface)', border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem'
                }}>
                  <span style={{ color: 'var(--accent-cyan)', flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, wordBreak: 'break-all' }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        {stat(<BookOpen size={26} />, active.length, 'Currently Borrowed', 'var(--accent-cyan)')}
        {stat(<BookMarked size={26} />, u.totalBooksIssued || 0, 'Total Books Issued', 'var(--accent-violet)')}
        {stat(
          <IndianRupee size={26} />,
          `₹${u.pendingFines || 0}`,
          'Pending Fines',
          (u.pendingFines || 0) > 0 ? 'var(--danger)' : 'var(--success)'
        )}
        {stat(<CheckCircle size={26} />, `₹${u.totalFinesPaid || 0}`, 'Total Fines Paid', 'var(--accent-blue)')}
      </div>

      {/* ── Currently Borrowed ── */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <BookOpen size={20} style={{ color: 'var(--accent-cyan)' }} />
          <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.2rem', margin: 0 }}>Currently Borrowed Books</h3>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, background: 'var(--accent-cyan)',
            color: '#fff', padding: '0.15rem 0.55rem', borderRadius: '999px'
          }}>{active.length}</span>
        </div>

        {active.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-secondary)' }}>
            <BookOpen size={44} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem' }}>No active borrowings.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {['Book Title', 'Author', 'Issue Date', 'Due Date', 'Status'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map(tx => {
                  const over = isOverdue(tx.dueDate);
                  const d = daysOverdue(tx.dueDate);
                  return (
                    <tr key={tx._id} style={{ borderBottom: '1px solid rgba(161,188,152,0.12)' }} className="trow-hover">
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <BookOpen size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                          {tx.book?.title || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{tx.book?.author || '—'}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{fmt(tx.issueDate)}</td>
                      <td style={{ padding: '0.85rem 1rem', color: over ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: over ? 700 : 400 }}>{fmt(tx.dueDate)}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {over
                          ? <span style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>Overdue {d}d</span>
                          : <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>Active</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Borrowing History ── */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <History size={20} style={{ color: 'var(--accent-violet)' }} />
          <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.2rem', margin: 0 }}>Borrowing History</h3>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, background: 'var(--accent-violet)',
            color: '#fff', padding: '0.15rem 0.55rem', borderRadius: '999px'
          }}>{past.length}</span>
        </div>

        {past.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-secondary)' }}>
            <History size={44} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem' }}>No borrowing history found.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {['Book Title', 'Author', 'Issue Date', 'Return Date', 'Status', 'Fine'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {histSlice.map(tx => (
                    <tr key={tx._id} style={{ borderBottom: '1px solid rgba(161,188,152,0.12)' }} className="trow-hover">
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <BookOpen size={14} style={{ color: 'var(--accent-violet)', flexShrink: 0 }} />
                          {tx.book?.title || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{tx.book?.author || '—'}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{fmt(tx.issueDate)}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{fmt(tx.returnDate)}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          textTransform: 'capitalize', fontWeight: 600,
                          padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
                          background: tx.status === 'returned' ? 'var(--success-bg)' : tx.status === 'cancelled' ? 'rgba(0,0,0,0.05)' : 'rgba(245,158,11,0.1)',
                          color: tx.status === 'returned' ? 'var(--success)' : tx.status === 'cancelled' ? 'var(--text-muted)' : 'var(--warning)'
                        }}>{tx.status}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: (tx.fine?.amount || 0) > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: (tx.fine?.amount || 0) > 0 ? 700 : 400 }}>
                        {(tx.fine?.amount || 0) > 0
                          ? <span>₹{tx.fine.amount} {tx.fine?.paid && <CheckCircle size={13} style={{ color: 'var(--success)', verticalAlign: 'middle' }} />}</span>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalHPages > 1 && (
              <div className="flex-center" style={{ gap: '0.5rem', marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setHistPage(p => Math.max(p - 1, 1))} disabled={histPage === 1} style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>Previous</button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {histPage} of {totalHPages}</span>
                <button className="btn btn-secondary" onClick={() => setHistPage(p => Math.min(p + 1, totalHPages))} disabled={histPage === totalHPages} style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .trow-hover:hover { background: rgba(161,188,152,0.07); }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN REGISTRY VIEW
════════════════════════════════════════════════ */
export default function AdminUsers({ registryType = 'all' }) {
  const { settings } = useSettings();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(registryType === 'students' ? 'student' : (registryType === 'staff' ? 'staff' : ''));
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
    setSearchQuery('');
    setSelectedDepartment('');
    setSelectedYear('');
    setSelectedRole(registryType === 'students' ? 'student' : (registryType === 'staff' ? 'staff' : ''));
  }, [registryType]);

  const [detailData, setDetailData] = useState(null);   // null = list view
  const [detailLoading, setDetailLoading] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [roleFormData, setRoleFormData] = useState({ role: '', name: '', studentId: '', department: '', year: '', phone: '' });
  const [editError, setEditError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/api/users?page=${page}&limit=10`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedRole) url += `&role=${encodeURIComponent(selectedRole)}`;
      if (selectedDepartment) url += `&department=${encodeURIComponent(selectedDepartment)}`;
      if (selectedYear) url += `&year=${encodeURIComponent(selectedYear)}`;
      const res = await axios.get(url);
      if (res.data.success) { setUsers(res.data.data); setTotalPages(res.data.pagination.pages); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, selectedRole, selectedDepartment, selectedYear]);

  const handleSearchSubmit = (e) => { e.preventDefault(); setPage(1); fetchUsers(); };

  const handleToggleStatus = async (userId, e) => {
    e.stopPropagation();
    try {
      const res = await axios.patch(`/api/users/${userId}/toggle-status`);
      if (res.data.success) setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: res.data.data.isActive } : u));
    } catch (err) { alert(err.response?.data?.message || 'Toggle failed'); }
  };

  const handleOpenDetails = async (userId, e) => {
    if (e) e.stopPropagation();
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/users/${userId}`);
      if (res.data.success) setDetailData(res.data.data);
    } catch { alert('Failed to retrieve user details.'); }
    finally { setDetailLoading(false); }
  };

  const handleOpenEdit = (user, e) => {
    e.stopPropagation();
    setEditingUser(user);
    setRoleFormData({ role: user.role || 'student', name: user.name || '', studentId: user.studentId || '', department: user.department || '', year: user.year || '', phone: user.phone || '' });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault(); setEditError('');
    try {
      const res = await axios.put(`/api/users/${editingUser._id}`, roleFormData);
      if (res.data.success) { setEditingUser(null); fetchUsers(); }
    } catch (err) { setEditError(err.response?.data?.message || 'Edit failed.'); }
  };

  /* ── If a student is selected, show full-page detail ── */
  if (detailLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: 'var(--text-secondary)', gap: '0.75rem', fontSize: '1rem' }}>
        <Clock size={20} className="animate-pulse" /> Loading student details…
      </div>
    );
  }

  if (detailData) {
    return <StudentDetailPage data={detailData} onBack={() => setDetailData(null)} settings={settings} />;
  }

  /* ── Registry list ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search by name, ID, email…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>Search</button>
        </form>

        {registryType === 'all' && (
          <select value={selectedRole} onChange={e => { setPage(1); setSelectedRole(e.target.value); }} style={{ width: '145px' }}>
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="librarian">Librarians</option>
            <option value="admin">Admins</option>
          </select>
        )}

        {registryType === 'staff' && (
          <select value={selectedRole} onChange={e => { setPage(1); setSelectedRole(e.target.value); }} style={{ width: '145px' }}>
            <option value="staff">All Staff</option>
            <option value="teacher">Teachers</option>
            <option value="librarian">Librarians</option>
            <option value="admin">Admins</option>
          </select>
        )}

        <select value={selectedDepartment} onChange={e => { setPage(1); setSelectedDepartment(e.target.value); }} style={{ width: '180px' }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {registryType !== 'staff' && (
          <select value={selectedYear} onChange={e => { setPage(1); setSelectedYear(e.target.value); }} style={{ width: '135px' }}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading student registry…</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ marginBottom: '1rem', opacity: 0.25 }} />
            <p>No registered users found.</p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {['User', 'ID', 'Department', 'Year', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="registry-row" onClick={() => handleOpenDetails(u._id)} title="Click to view full details">
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.83rem' }}>{u.studentId || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.department || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {u.year
                        ? <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-violet)', background: 'rgba(119,136,115,0.12)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)' }}>{u.year}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textTransform: 'capitalize', fontWeight: 500, color: u.role === 'admin' ? 'var(--accent-cyan)' : u.role === 'librarian' ? 'var(--accent-violet)' : u.role === 'teacher' ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>
                      {u.role}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ color: u.isActive ? 'var(--success)' : 'var(--danger)', background: u.isActive ? 'var(--success-bg)' : 'var(--danger-bg)', padding: '0.22rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 700 }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={e => handleOpenDetails(u._id, e)} className="btn btn-secondary" style={{ padding: '0.32rem 0.65rem', fontSize: '0.75rem' }}>View</button>
                        <button onClick={e => handleOpenEdit(u, e)} className="btn btn-secondary" style={{ padding: '0.32rem 0.65rem', fontSize: '0.75rem' }}>Edit</button>
                        <button onClick={e => handleToggleStatus(u._id, e)} className={`btn ${u.isActive ? 'btn-danger' : 'btn-primary'}`} style={{ padding: '0.32rem 0.5rem', fontSize: '0.75rem' }} title={u.isActive ? 'Deactivate' : 'Activate'}>
                          {u.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex-center" style={{ gap: '0.5rem', marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>Previous</button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000, padding: '1.5rem' }} onClick={() => setEditingUser(null)}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditingUser(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontFamily: 'Lora, serif' }}>Edit User Account</h3>
            {editError && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.6rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>{editError}</div>}
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" value={roleFormData.name} onChange={e => setRoleFormData({ ...roleFormData, name: e.target.value })} required /></div>
              <div><label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>User Role</label>
                <select value={roleFormData.role} onChange={e => setRoleFormData({ ...roleFormData, role: e.target.value })}>
                  <option value="student">Student</option><option value="teacher">Teacher</option>
                  <option value="librarian">Librarian</option><option value="admin">Administrator</option>
                </select></div>
              <div><label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {roleFormData.role === 'teacher' ? 'Teacher ID' : roleFormData.role === 'student' ? 'Student ID' : 'Staff ID'}</label>
                <input type="text" value={roleFormData.studentId} onChange={e => setRoleFormData({ ...roleFormData, studentId: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Department</label>
                  <select value={roleFormData.department} onChange={e => setRoleFormData({ ...roleFormData, department: e.target.value })}>
                    <option value="">Select</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select></div>
                <div><label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Year</label>
                  <select value={roleFormData.year} onChange={e => setRoleFormData({ ...roleFormData, year: e.target.value })}>
                    <option value="">Select</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select></div>
              </div>
              <div><label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Phone</label>
                <input type="text" value={roleFormData.phone} onChange={e => setRoleFormData({ ...roleFormData, phone: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .registry-row { cursor: pointer; }
        .registry-row:hover td { background: rgba(161,188,152,0.08); }
        .registry-row td { border-bottom: 1px solid rgba(161,188,152,0.12); transition: background 0.12s; }
      `}</style>
    </div>
  );
}
