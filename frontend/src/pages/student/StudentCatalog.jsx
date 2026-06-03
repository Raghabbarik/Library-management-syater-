import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, BookOpen, Layers, CheckCircle2, AlertCircle, Info, X 
} from 'lucide-react';

export default function StudentCatalog() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Book Details Modal
  const [selectedBook, setSelectedBook] = useState(null);

  const [userTransactions, setUserTransactions] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');

  const fetchUserTransactions = async () => {
    try {
      const res = await axios.get('/api/transactions');
      if (res.data.success) {
        setUserTransactions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching user transactions:', err);
    }
  };

  const handleRequestBook = async (bookId) => {
    setRequestLoading(true);
    setRequestError('');
    try {
      const res = await axios.post('/api/transactions/request', { bookId });
      if (res.data.success) {
        alert('Book requested successfully!');
        fetchUserTransactions();
      }
    } catch (err) {
      setRequestError(err.response?.data?.message || 'Request failed.');
    } finally {
      setRequestLoading(false);
    }
  };

  const getBookUserStatus = (bookId) => {
    const match = userTransactions.find(t => (t.book?._id === bookId || t.book?.id === bookId));
    if (!match) return null;
    if (match.type === 'issue' && match.status === 'active') return 'borrowed';
    if (match.type === 'request' && match.status === 'pending') return 'requested';
    return null;
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/books/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let url = `/api/books?page=${page}&limit=8`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (availableOnly) url += `&available=true`;

      const res = await axios.get(url);
      if (res.data.success) {
        setBooks(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchUserTransactions();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [page, selectedCategory, availableOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search & Filter Header */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'
            }} />
            <input 
              type="text" 
              placeholder="Search by title, author, or keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>

          <button type="submit" className="btn btn-primary">Search</button>

          {/* Available Checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            <input 
              type="checkbox" 
              checked={availableOnly}
              onChange={(e) => { setPage(1); setAvailableOnly(e.target.checked); }}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <span>Show available only</span>
          </label>
        </form>

        {/* Categories Badges */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1.25rem',
          flexWrap: 'wrap',
          overflowX: 'auto',
          paddingBottom: '0.25rem'
        }}>
          <button
            onClick={() => { setPage(1); setSelectedCategory(''); }}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: selectedCategory === '' ? 'var(--accent-cyan)' : 'var(--bg-surface-hover)',
              color: selectedCategory === '' ? '#ffffff' : 'var(--text-secondary)',
              border: selectedCategory === '' ? 'none' : '1px solid var(--glass-border)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => { setPage(1); setSelectedCategory(cat._id); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: selectedCategory === cat._id ? 'var(--accent-cyan)' : 'var(--bg-surface-hover)',
                color: selectedCategory === cat._id ? '#ffffff' : 'var(--text-secondary)',
                border: selectedCategory === cat._id ? 'none' : '1px solid var(--glass-border)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <span>{cat._id}</span>
              <span style={{
                fontSize: '0.65rem',
                background: selectedCategory === cat._id ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                color: selectedCategory === cat._id ? '#ffffff' : 'var(--text-secondary)',
                padding: '0.05rem 0.25rem',
                borderRadius: '50%'
              }}>{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="flex-center" style={{ minHeight: '300px' }}>Loading books...</div>
      ) : books.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>No books match your criteria.</p>
        </div>
      ) : (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {books.map((book) => {
              const isAvailable = book.availableCopies > 0;
              return (
                <div 
                  key={book._id} 
                  className="glass-card" 
                  onClick={() => setSelectedBook(book)}
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    minHeight: '350px'
                  }}
                >
                  {/* Book Cover Image */}
                  <div style={{
                    width: '100%',
                    height: '180px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--bg-surface-hover), var(--bg-surface))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    border: '1px solid var(--glass-border)'
                  }}>
                    {book.coverImage ? (
                      <img 
                        src={book.coverImage} 
                        alt={book.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <BookOpen size={36} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexGrow: 1 }}>
                    <span style={{
                      fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '0.5px'
                    }}>{book.category.toUpperCase()}</span>
                    <h4 style={{
                      fontSize: '0.95rem',
                      fontFamily: 'Outfit, sans-serif',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }} title={book.title}>
                      {book.title}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>by {book.author}</span>
                  </div>

                  <div className="flex-between" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                      {(() => {
                        const status = getBookUserStatus(book._id);
                        if (status === 'borrowed') {
                          return <span style={{ color: 'var(--success)', fontWeight: 600 }}>Borrowed</span>;
                        }
                        if (status === 'requested') {
                          return <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Requested (Pending)</span>;
                        }
                        return isAvailable ? (
                          <>
                            <CheckCircle2 size={14} color="var(--success)" />
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>{book.availableCopies} available</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} color="var(--danger)" />
                            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Out of Stock</span>
                          </>
                        );
                      })()}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: {book.location || 'Rack A1'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex-center" style={{ gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
              <button 
                className="btn btn-secondary" 
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Book Details Modal */}
      {selectedBook && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.5rem'
        }} onClick={() => setSelectedBook(null)}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '600px',
            padding: '2rem',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedBook(null)}
              style={{
                position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none',
                color: 'var(--text-secondary)', cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {/* Cover */}
              <div style={{
                width: '140px',
                height: '200px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, var(--bg-surface-hover), var(--bg-surface))',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {selectedBook.coverImage ? (
                  <img src={selectedBook.coverImage} alt={selectedBook.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <BookOpen size={48} color="var(--text-muted)" />
                )}
              </div>

              {/* Basic Meta */}
              <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '0.5px' }}>
                  {selectedBook.category.toUpperCase()}
                </span>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>{selectedBook.title}</h3>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>by {selectedBook.author}</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>ISBN: <strong style={{ color: 'var(--text-primary)' }}>{selectedBook.isbn}</strong></span>
                  <span>Location: <strong style={{ color: 'var(--text-primary)' }}>{selectedBook.location || 'Rack A1'}</strong></span>
                  <span>Total Copies: <strong style={{ color: 'var(--text-primary)' }}>{selectedBook.totalCopies}</strong></span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>Description</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {selectedBook.description || 'No description available for this book.'}
              </p>
            </div>

            {/* Borrow Advice Banner */}
            <div style={{
              marginTop: '1.5rem',
              background: 'var(--info-bg)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <Info size={20} color="var(--info)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <h5 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>How to borrow?</h5>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem', lineHeight: '1.4' }}>
                  To borrow this book, please visit the library counter. Present your digital library pass to the librarian, then scan the QR code located on the inside cover of the book.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {requestError && (
              <div style={{
                background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)',
                padding: '0.75rem', borderRadius: 'var(--radius-md)', marginTop: '1rem', fontSize: '0.85rem'
              }}>
                {requestError}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => { setSelectedBook(null); setRequestError(''); }}>Close</button>
              {(() => {
                const status = getBookUserStatus(selectedBook._id);
                if (status === 'borrowed') {
                  return (
                    <button className="btn btn-primary" disabled style={{ background: 'var(--success)', opacity: 0.8 }}>
                      Currently Borrowed
                    </button>
                  );
                }
                if (status === 'requested') {
                  return (
                    <button className="btn btn-secondary" disabled style={{ opacity: 0.8 }}>
                      Requested (Pending Scan)
                    </button>
                  );
                }
                return (
                  <button 
                    className="btn btn-primary" 
                    disabled={selectedBook.availableCopies < 1 || requestLoading}
                    onClick={() => handleRequestBook(selectedBook._id)}
                  >
                    {requestLoading ? 'Requesting...' : selectedBook.availableCopies < 1 ? 'Out of Stock' : 'Request Book'}
                  </button>
                );
              })()}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
