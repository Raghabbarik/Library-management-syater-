import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  QrCode, Search, Bell, Activity, Sparkles, BookOpen, ArrowRight, Shield, Zap, 
  HelpCircle, ChevronDown, ChevronUp, Info, X, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  
  // Search & Catalog Preview State
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // FAQ Accordion State
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);

  // Fetch featured books on load
  const fetchFeaturedBooks = async (query = '') => {
    setLoading(true);
    try {
      let url = '/api/books?limit=4';
      if (query) url += `&search=${encodeURIComponent(query)}`;
      const res = await axios.get(url);
      if (res.data.success) {
        setBooks(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching featured books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedBooks();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', marginTop: '2rem' }}>
      
      {/* 1. Hero Section */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        alignItems: 'center',
        gap: '3rem',
        padding: '2rem 0',
      }}>
        {/* Left Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--success-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--accent-cyan)',
            fontSize: '0.85rem',
            fontWeight: 600,
            alignSelf: 'flex-start'
          }}>
            <Sparkles size={14} />
            <span>Next-Gen MERN Stack Solution</span>
          </div>
          
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.15 }}>
            The Smart Way to <br />
            <span className="text-gradient">Manage & Access</span> <br />
            Your Library.
          </h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7', maxWidth: '500px' }}>
            Empower your institution with a high-performance library system. Real-time book issuance, instant QR code access, and automated notification services.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {isAuthenticated ? (
              <Link to={user?.role === 'admin' ? '/admin' : '/student'} className="btn btn-primary">
                <span>Go to Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  <span>Get Started</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/how-to-use" className="btn btn-secondary">
                  <span>How it Works</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right Content - Visual Representation */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {/* Main Visual Glass Card */}
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '2.5rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--glass-border)',
            position: 'relative',
            zIndex: 2,
            boxShadow: '0 20px 50px rgba(28, 40, 26, 0.15)',
            transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
              </div>
              <Activity size={18} style={{ color: 'var(--accent-cyan)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <QrCode size={36} style={{ color: 'var(--accent-cyan)' }} />
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Instant Checkout</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scan QR code to issue books instantly</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <Bell size={36} style={{ color: 'var(--accent-violet)' }} />
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Auto Notifications</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reminders for returns & overdue fines</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <Search size={36} style={{ color: 'var(--accent-blue)' }} />
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Elastic Catalog Search</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Find your favorite books in milliseconds</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floating glowing background element behind the visual card */}
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
            filter: 'blur(60px)',
            opacity: 0.2,
            zIndex: 1,
            top: '10%',
            left: '10%'
          }} />
        </div>
      </section>

      {/* 2. Stats Section */}
      <section className="glass-panel" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2rem',
        padding: '2.5rem',
        textAlign: 'center',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div>
          <h3 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 700 }}>99.9%</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>System Uptime</p>
        </div>
        <div>
          <h3 className="text-gradient-purple" style={{ fontSize: '2.5rem', fontWeight: 700 }}>&lt; 50ms</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Real-time Sync Latency</p>
        </div>
        <div>
          <h3 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 700 }}>10,000+</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Books Digitalized</p>
        </div>
        <div>
          <h3 className="text-gradient-purple" style={{ fontSize: '2.5rem', fontWeight: 700 }}>0 Paper</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>100% Eco-friendly Workflow</p>
        </div>
      </section>

      {/* 2.5 Live Catalog Preview Section */}
      <section className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-xl)', background: 'var(--info-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600, alignSelf: 'center' }}>
            <BookOpen size={14} />
            <span>Public Catalog Preview</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Explore Our Collection</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
            Search or browse through some of our popular titles in real-time.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={(e) => { e.preventDefault(); fetchFeaturedBooks(searchQuery); }} style={{
          display: 'flex',
          gap: '1rem',
          maxWidth: '600px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'
            }} />
            <input 
              type="text" 
              placeholder="Search books by title, author, or keyword..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {/* Book Grid */}
        {loading ? (
          <div className="flex-center" style={{ minHeight: '150px' }}>Loading catalog...</div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
            <p>No books found matching "{searchQuery}".</p>
            <button type="button" className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => { setSearchQuery(''); fetchFeaturedBooks(); }}>
              Clear Search
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.5rem'
          }}>
            {books.slice(0, 4).map((book) => {
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
                    minHeight: '320px'
                  }}
                >
                  {/* Cover */}
                  <div style={{
                    width: '100%',
                    height: '160px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--bg-surface-hover), var(--bg-surface))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    border: '1px solid var(--glass-border)'
                  }}>
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <BookOpen size={30} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexGrow: 1 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '0.5px' }}>
                      {book.category.toUpperCase()}
                    </span>
                    <h4 style={{ fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {book.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>by {book.author}</span>
                  </div>

                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ color: isAvailable ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {isAvailable ? `${book.availableCopies} available` : 'Out of stock'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{book.location || 'Rack A1'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Core Features Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Outstanding Core Features</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Empowered by state-of-the-art technological architectures for unparalleled administrative convenience.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {/* Card 1 */}
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(63, 82, 60, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <QrCode size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Interactive Scanning</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              QR code integration permits quick scanning for book checkouts, returns, and automatic entry/exit system logging.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(119, 136, 115, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-violet)'
            }}>
              <Zap size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Live Websocket Updates</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Built-in Socket.io client syncs the administrator panel automatically on user scans or real-time event status.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(80, 101, 76, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)'
            }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Advanced Security</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Secured with secure token encryption (JWT), route-guards, and strict backend input sanitization parameters.
            </p>
          </div>
        </div>
      </section>

      {/* 3.5 FAQ Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-xl)', background: 'var(--info-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600, alignSelf: 'center' }}>
            <HelpCircle size={14} />
            <span>Support & Help</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
            Find quick answers to general inquiries about registration, borrowing limits, and QR scanning features.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          {[
            {
              q: "How do I register an account in the Smart Library system?",
              a: "You can click on the Register link in the navigation menu. Fill in your name, college email address, password, select your department, and enter a valid Student ID. Once registered, the system will generate a personal digital library pass QR code for you."
            },
            {
              q: "What is my Digital Library Pass and how does it work?",
              a: "Your digital pass contains a personalized QR code loaded with your student credentials. By showing this pass on your phone screen at the entry gate QR scan desk, the system logs your access time, entries, and exits automatically without physical paper."
            },
            {
              q: "How do I borrow a book from the library catalog?",
              a: "First, search the catalog to verify the book is in stock. Take the physical book to the counter and show your Digital Library Pass QR to the staff. The staff will trigger the Laser Scan checkout, recording the borrowing event against your profile."
            },
            {
              q: "What are the borrowing limits and fine policies?",
              a: "Students can borrow up to 5 books concurrently. Each book is issued for 14 days, and you can renew it up to 2 times online if it is not overdue. Overdue books accrue a fine of ₹10 per day, which must be cleared to borrow new titles."
            }
          ].map((item, index) => {
            const isOpen = faqOpenIndex === index;
            return (
              <div 
                key={index} 
                className="glass-panel" 
                style={{
                  borderRadius: 'var(--radius-md)', 
                  overflow: 'hidden', 
                  transition: 'all 0.3s ease',
                  border: isOpen ? '1px solid var(--accent-cyan)' : '1px solid var(--glass-border)'
                }}
              >
                <button
                  onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    background: isOpen ? 'var(--bg-surface-hover)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: 'inherit',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: isOpen ? 'var(--accent-cyan)' : 'var(--text-primary)'
                  }}
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isOpen && (
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    background: 'rgba(255,255,255,0.2)',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    borderTop: '1px solid var(--glass-border)'
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Call to Action */}
      <section className="glass-panel" style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-hover) 100%)',
        border: '1px solid var(--glass-border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(63, 82, 60, 0.05)',
          filter: 'blur(80px)',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)'
        }} />
        
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', position: 'relative', zIndex: 1 }}>
          Ready to Modernize Your Library?
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '1rem', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
          Unlock elite operational efficiencies, automatic fee-management, and dynamic real-time administrative logs.
        </p>
        <div style={{ position: 'relative', zIndex: 1, marginTop: '0.5rem' }}>
          {isAuthenticated ? (
            <Link to={user?.role === 'admin' ? '/admin' : '/student'} className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Access the System Now
            </Link>
          )}
        </div>
      </section>

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
                <h5 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Want to borrow?</h5>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem', lineHeight: '1.4' }}>
                  {isAuthenticated ? (
                    <span>Please visit the library counter and present your digital library pass to checkout this book.</span>
                  ) : (
                    <span>Please <Link to="/login" style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>sign in</Link> or <Link to="/register" style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>register</Link> to obtain your student pass QR and borrow this book.</span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedBook(null)}>Close</button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
