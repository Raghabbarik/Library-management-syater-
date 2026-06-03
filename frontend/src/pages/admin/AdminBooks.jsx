import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Edit, Trash2, QrCode, X, Upload, BookOpen, CheckCircle, AlertTriangle, Printer, Download 
} from 'lucide-react';

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [selectedQR, setSelectedQR] = useState(null);

  // Forms state
  const [formData, setFormData] = useState({
    title: '', author: '', category: '', isbn: '',
    description: '', location: '', totalCopies: 1,
    publisher: '', publicationYear: ''
  });
  const [coverFile, setCoverFile] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/books/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error('Error categories:', err);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let url = `/api/books?page=${page}&limit=8`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;

      const res = await axios.get(url);
      if (res.data.success) {
        setBooks(res.data.data);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [page, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setCoverFile(e.target.files[0]);
  };

  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormData({
      title: '', author: '', category: '', isbn: '',
      description: '', location: 'Rack A1', totalCopies: 1,
      publisher: '', publicationYear: new Date().getFullYear()
    });
    setCoverFile(null);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      category: book.category || '',
      isbn: book.isbn || '',
      description: book.description || '',
      location: book.location || 'Rack A1',
      totalCopies: book.totalCopies || 1,
      publisher: book.publisher || '',
      publicationYear: book.publicationYear || ''
    });
    setCoverFile(null);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setSuccessMsg('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (coverFile) {
      data.append('coverImage', coverFile);
    }

    try {
      let res;
      if (editingBook) {
        res = await axios.put(`/api/books/${editingBook._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post('/api/books', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        setSuccessMsg(editingBook ? 'Book updated!' : 'Book created!');
        setIsFormOpen(false);
        fetchBooks();
        fetchCategories();
        if (!editingBook && res.data.data) {
          setSelectedQR(res.data.data);
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Transaction failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm('Are you sure you want to remove this book from catalog?')) return;
    try {
      const res = await axios.delete(`/api/books/${bookId}`);
      if (res.data.success) {
        fetchBooks();
        fetchCategories();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed.');
    }
  };

  const handlePrintQR = (book) => {
    if (!book || !book.qrCode) return;
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Label - ${book.title}</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif;
              text-align: center;
              padding: 40px 20px;
              color: #1c281a;
              background: white;
              margin: 0;
            }
            .card {
              border: 2px dashed #a1bc98;
              padding: 30px;
              border-radius: 16px;
              display: inline-block;
              max-width: 320px;
              background: #ffffff;
            }
            .qr-img {
              width: 220px;
              height: 220px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 20px;
              font-weight: 700;
              margin: 10px 0 6px 0;
              word-wrap: break-word;
            }
            .author {
              font-size: 15px;
              color: #50654c;
              margin-bottom: 12px;
            }
            .isbn {
              font-family: monospace;
              font-size: 14px;
              background: #f1f3e0;
              padding: 6px 12px;
              border-radius: 6px;
              display: inline-block;
              color: #1c281a;
              font-weight: 600;
            }
            .location {
              margin-top: 10px;
              font-size: 13px;
              color: #50654c;
            }
            @media print {
              body { padding: 0; }
              .card { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <img class="qr-img" src="${book.qrCode}" alt="QR Code" />
            <div class="title">${book.title}</div>
            <div class="author">by ${book.author}</div>
            <div class="isbn">ISBN: ${book.isbn}</div>
            <div class="location">Location: ${book.location || 'Rack A1'}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search & Actions Header */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by title, author, ISBN..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select 
            value={selectedCategory} 
            onChange={(e) => { setPage(1); setSelectedCategory(e.target.value); }}
            style={{ width: '180px' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c._id} ({c.count})</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Main Books Catalog Table */}
      <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
        {loading ? (
          <div>Loading inventory catalog...</div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No titles found in inventory.</p>
          </div>
        ) : (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Title & Author</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ISBN</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Copies (Avail/Total)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                    <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '35px', height: '50px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {book.coverImage ? (
                          <img src={book.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <BookOpen size={16} />
                        )}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <span style={{ display: 'block', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                          {book.title}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>by {book.author}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{book.isbn}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{book.category}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 600, color: book.availableCopies > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {book.availableCopies}
                      </span>
                      <span> / {book.totalCopies}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{book.location || 'Rack A1'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => setSelectedQR(book)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}
                          title="View generated QR label"
                        >
                          <QrCode size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(book)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}
                          title="Edit Book details"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(book._id)}
                          className="btn btn-danger" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}
                          title="Delete Book"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Book Form Modal (Add / Edit) */}
      {isFormOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem'
        }} onClick={() => setIsFormOpen(false)}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '600px', padding: '2rem', position: 'relative',
            maxHeight: '90vh', overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setIsFormOpen(false)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
            }}>
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
              {editingBook ? 'Edit Book Record' : 'Add New Book to Catalog'}
            </h3>

            {formError && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Book Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleFormChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Author Name</label>
                  <input type="text" name="author" value={formData.author} onChange={handleFormChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</label>
                  <select name="category" value={formData.category} onChange={handleFormChange} required>
                    <option value="">-- Select Category --</option>
                    <option value="Fiction">Fiction</option>
                    <option value="Non-Fiction">Non-Fiction</option>
                    <option value="Science">Science</option>
                    <option value="Technology">Technology</option>
                    <option value="History">History</option>
                    <option value="Biography">Biography</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Arts">Arts</option>
                    <option value="Philosophy">Philosophy</option>
                    <option value="Religion">Religion</option>
                    <option value="Law">Law</option>
                    <option value="Medical">Medical</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Literature">Literature</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ISBN Number</label>
                  <input type="text" name="isbn" value={formData.isbn} onChange={handleFormChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rack Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleFormChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Copies</label>
                  <input type="number" name="totalCopies" min={1} value={formData.totalCopies} onChange={handleFormChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pub Year</label>
                  <input type="number" name="publicationYear" value={formData.publicationYear} onChange={handleFormChange} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Publisher</label>
                <input type="text" name="publisher" value={formData.publisher} onChange={handleFormChange} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Book Description</label>
                <textarea name="description" rows={3} value={formData.description} onChange={handleFormChange} />
              </div>

              {/* Cover File Upload */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Book Cover Art</label>
                <div style={{
                  border: '1px dashed var(--glass-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', position: 'relative'
                }}>
                  <Upload size={20} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.85rem' }}>{coverFile ? coverFile.name : 'Select or drop image file'}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Processing...' : 'Save Book'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Book QR Details Modal */}
      {selectedQR && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem'
        }} onClick={() => setSelectedQR(null)}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setSelectedQR(null)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
            }}>
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>Book QR Label</h3>

            <div style={{
              background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'inline-block',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)', border: '1px solid rgba(0,0,0,0.1)', marginBottom: '1.5rem'
            }}>
              {selectedQR.qrCode ? (
                <img src={selectedQR.qrCode} alt="Book QR" style={{ width: '180px', height: '180px' }} />
              ) : (
                <div style={{ width: '180px', height: '180px', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No QR Code</div>
              )}
            </div>

            <h4 style={{ fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' }}>{selectedQR.title}</h4>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>ISBN: {selectedQR.isbn}</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedQR.qrCode && (
                  <button 
                    onClick={() => handlePrintQR(selectedQR)}
                    className="btn btn-secondary"
                    style={{ flex: 1, gap: '0.35rem', padding: '0.6rem 1rem' }}
                  >
                    <Printer size={16} />
                    <span>Print Label</span>
                  </button>
                )}
                {selectedQR.qrCode && (
                  <a 
                    href={selectedQR.qrCode} 
                    download={`QR_${selectedQR.isbn}.png`}
                    className="btn btn-primary"
                    style={{ flex: 1, gap: '0.35rem', padding: '0.6rem 1rem' }}
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </a>
                )}
              </div>
              <button className="btn btn-secondary" style={{ width: '100%', padding: '0.6rem 1rem' }} onClick={() => setSelectedQR(null)}>Close</button>
            </div>

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
