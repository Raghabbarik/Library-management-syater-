import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ClipboardList, Search, BookOpen, AlertTriangle, ArrowRightLeft, CreditCard, CheckCircle, RefreshCw, X 
} from 'lucide-react';

export default function AdminTransactions() {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'issue', 'overdue'
  
  // Lists
  const [borrowings, setBorrowings] = useState([]);
  const [overdues, setOverdues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Autocomplete data
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);

  // Issue Form State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [isStudentDropdown, setIsStudentDropdown] = useState(false);
  const [isBookDropdown, setIsBookDropdown] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);

  // Return Book Results Modal
  const [returnSummary, setReturnSummary] = useState(null);

  // Fine Payment Modal
  const [payingFineTx, setPayingFineTx] = useState(null);
  const [fineAmount, setFineAmount] = useState(0);
  const [payLoading, setPayLoading] = useState(false);

  // Alerts
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  const fetchBorrowings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/transactions?status=active`);
      if (res.data.success) {
        setBorrowings(res.data.data);
      }
    } catch (err) {
      console.error('Error borrowings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdues = async () => {
    try {
      const res = await axios.get('/api/transactions/overdue');
      if (res.data.success) {
        setOverdues(res.data.data);
      }
    } catch (err) {
      console.error('Error overdues:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchBorrowings();
    } else if (activeTab === 'overdue') {
      fetchOverdues();
    }
  }, [activeTab]);

  // Load students and books for issue autocompletes
  useEffect(() => {
    if (activeTab === 'issue') {
      axios.get('/api/users?role=student&limit=50').then(res => {
        if (res.data.success) setStudents(res.data.data);
      });
      axios.get('/api/books?limit=50').then(res => {
        if (res.data.success) setBooks(res.data.data);
      });
    }
  }, [activeTab]);

  const handleIssueBook = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedBook) {
      return setAlertMsg({ type: 'error', text: 'Please select both a student and a book.' });
    }

    setIssueLoading(true);
    setAlertMsg({ type: '', text: '' });

    try {
      const res = await axios.post('/api/transactions/issue', {
        userId: selectedStudent._id,
        bookId: selectedBook._id
      });
      if (res.data.success) {
        setAlertMsg({ type: 'success', text: `Successfully issued "${selectedBook.title}" to ${selectedStudent.name}!` });
        setSelectedStudent(null);
        setSelectedBook(null);
        setStudentSearch('');
        setBookSearch('');
      }
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to issue book.'
      });
    } finally {
      setIssueLoading(false);
    }
  };

  const handleReturnBook = async (transactionId) => {
    if (!window.confirm('Record return for this book?')) return;
    try {
      const res = await axios.post('/api/transactions/return', { transactionId });
      if (res.data.success) {
        setReturnSummary(res.data);
        fetchBorrowings();
        fetchOverdues();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Return failed.');
    }
  };

  const handlePayFineSubmit = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    try {
      const res = await axios.post('/api/transactions/pay-fine', {
        transactionId: payingFineTx._id,
        amount: fineAmount
      });
      if (res.data.success) {
        setPayingFineTx(null);
        fetchOverdues();
        fetchBorrowings();
        alert('Fine payment received!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed.');
    } finally {
      setPayLoading(false);
    }
  };

  const filteredBorrowings = borrowings.filter(tx => {
    const query = searchQuery.toLowerCase();
    return (
      tx.book?.title.toLowerCase().includes(query) ||
      tx.user?.name.toLowerCase().includes(query) ||
      tx.user?.studentId?.toLowerCase().includes(query)
    );
  });

  const getDaysRemaining = (dueDateStr) => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Sub Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('list')}
          className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
        >
          Active Borrows
        </button>
        <button 
          onClick={() => setActiveTab('issue')}
          className={`btn ${activeTab === 'issue' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
        >
          Issue Book
        </button>
        <button 
          onClick={() => setActiveTab('overdue')}
          className={`btn ${activeTab === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
        >
          Overdue Books ({overdues.length})
        </button>
      </div>

      {/* Main Tab Renderings */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Search Table Filters */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search active borrowings by book title, student name, ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Active Borrowings Table */}
          <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
            {loading ? (
              <div>Loading lending records...</div>
            ) : filteredBorrowings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                <ClipboardList size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>No active borrowings found.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Book</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Issued To</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Issue Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Due Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBorrowings.map((tx) => {
                    const days = getDaysRemaining(tx.dueDate);
                    const isOver = days < 0;
                    return (
                      <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ display: 'block', fontWeight: 600 }}>{tx.book?.title}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ISBN: {tx.book?.isbn}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ display: 'block', fontWeight: 500 }}>{tx.user?.name}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {tx.user?.studentId}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {new Date(tx.dueDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {isOver ? (
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Overdue ({Math.abs(days)} days)</span>
                          ) : (
                            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{days} days left</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => handleReturnBook(tx._id)}
                          >
                            Return Book
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'issue' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>Issue Book Console</h3>

          {alertMsg.text && (
            <div style={{
              background: alertMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
              border: alertMsg.type === 'success' ? '1px solid var(--success)' : '1px solid var(--danger)',
              color: alertMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem'
            }}>
              {alertMsg.text}
            </div>
          )}

          <form onSubmit={handleIssueBook} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Student Autocomplete Selector */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Select Student Card
              </label>
              {selectedStudent ? (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem',
                  background: 'rgba(0, 242, 254, 0.08)', border: '1px solid var(--accent-cyan)', borderRadius: 'var(--radius-md)'
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{selectedStudent.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>ID: {selectedStudent.studentId}</span>
                  </div>
                  <button type="button" onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <input 
                    type="text" 
                    placeholder="Search by student name or student ID..."
                    value={studentSearch}
                    onChange={(e) => { setStudentSearch(e.target.value); setIsStudentDropdown(true); }}
                    onFocus={() => setIsStudentDropdown(true)}
                  />
                  {isStudentDropdown && studentSearch && (
                    <div className="glass-panel" style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                      maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', marginTop: '0.25rem'
                    }}>
                      {students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.studentId?.toLowerCase().includes(studentSearch.toLowerCase())).map(s => (
                        <div 
                          key={s._id}
                          onClick={() => { setSelectedStudent(s); setIsStudentDropdown(false); }}
                          style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                          className="table-row-hover"
                        >
                          <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {s.studentId} | Dept: {s.department || 'General'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Book Autocomplete Selector */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Select Book Item
              </label>
              {selectedBook ? (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem',
                  background: 'rgba(79, 172, 254, 0.08)', border: '1px solid var(--accent-blue)', borderRadius: 'var(--radius-md)'
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{selectedBook.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>ISBN: {selectedBook.isbn}</span>
                  </div>
                  <button type="button" onClick={() => setSelectedBook(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <input 
                    type="text" 
                    placeholder="Search by book title or ISBN..."
                    value={bookSearch}
                    onChange={(e) => { setBookSearch(e.target.value); setIsBookDropdown(true); }}
                    onFocus={() => setIsBookDropdown(true)}
                  />
                  {isBookDropdown && bookSearch && (
                    <div className="glass-panel" style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                      maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', marginTop: '0.25rem'
                    }}>
                      {books.filter(b => b.title.toLowerCase().includes(bookSearch.toLowerCase()) || b.isbn.toLowerCase().includes(bookSearch.toLowerCase())).map(b => (
                        <div 
                          key={b._id}
                          onClick={() => { setSelectedBook(b); setIsBookDropdown(false); }}
                          style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                          className="table-row-hover"
                        >
                          <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>{b.title}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>by {b.author} | Avail: {b.availableCopies}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={issueLoading} style={{ marginTop: '1rem' }}>
              {issueLoading ? <RefreshCw size={16} className="animate-spin" /> : 'Issue Book'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'overdue' && (
        <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>Overdue Borrowing Records</h3>

          {overdues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              <CheckCircle size={48} style={{ marginBottom: '1rem', color: 'var(--success)', opacity: 0.8 }} />
              <p>Excellent! There are no overdue books at the moment.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Book Details</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Student ID / Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Due Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Fine Amount</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overdues.map((tx) => (
                  <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ display: 'block', fontWeight: 600 }}>{tx.book?.title}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Author: {tx.book?.author}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ display: 'block', fontWeight: 500 }}>{tx.user?.name}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {tx.user?.studentId}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--danger)', fontWeight: 600 }}>
                      {new Date(tx.dueDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--danger)', fontWeight: 'bold' }}>
                      ₹{tx.calculatedFine}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleReturnBook(tx._id)}
                        >
                          Return
                        </button>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', background: 'var(--success)', border: 'none' }}
                          onClick={() => { setPayingFineTx(tx); setFineAmount(tx.calculatedFine); }}
                        >
                          Collect Fine
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Book Return Summary Modal */}
      {returnSummary && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem'
        }} onClick={() => setReturnSummary(null)}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setReturnSummary(null)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
            }}>
              <X size={24} />
            </button>

            <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>Return Recorded</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              The book return has been successfully logged into the library database.
            </p>

            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.45)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {returnSummary.fine > 0 ? (
                <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                  Overdue Fine Owed: ₹{returnSummary.fine}
                </div>
              ) : (
                <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                  Returned on time. No fine.
                </div>
              )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setReturnSummary(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Pay Fine Dialog Modal */}
      {payingFineTx && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem'
        }} onClick={() => setPayingFineTx(null)}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setPayingFineTx(null)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
            }}>
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>Collect Outstanding Fine</h3>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              <div>Student: <strong>{payingFineTx.user?.name}</strong></div>
              <div>Book: <strong>{payingFineTx.book?.title}</strong></div>
              <div>Accumulated Fine: <strong style={{ color: 'var(--danger)' }}>₹{payingFineTx.calculatedFine}</strong></div>
            </div>

            <form onSubmit={handlePayFineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem' }}>Amount Paid (₹)</label>
                <input 
                  type="number" 
                  min={1} 
                  max={payingFineTx.calculatedFine}
                  value={fineAmount}
                  onChange={(e) => setFineAmount(Number(e.target.value))}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPayingFineTx(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--success)', border: 'none' }} disabled={payLoading}>
                  {payLoading ? 'Processing...' : 'Confirm Paid'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      <style>{`
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.015);
        }
      `}</style>

    </div>
  );
}
