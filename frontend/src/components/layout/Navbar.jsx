import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { BookOpen, LogIn, LayoutDashboard, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { settings, selectInstitution } = useSettings();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [institutions, setInstitutions] = React.useState([]);

  React.useEffect(() => {
    const fetchInst = async () => {
      try {
        const res = await axios.get('/api/institutions');
        if (res.data.success) {
          setInstitutions(res.data.data);
        }
      } catch (err) {}
    };
    fetchInst();
  }, []);

  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Hide when scrolling down past 80px, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Plans', path: '/plans' },
    { name: 'How to Use', path: '/how-to-use' },
  ];

  return (
    <nav className="glass-panel" style={{
      position: 'sticky',
      top: isVisible ? '1rem' : '-100px',
      margin: '0 1rem',
      zIndex: 1000,
      padding: '0.75rem 1.5rem',
      borderRadius: 'var(--radius-xl)',
      transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div className="flex-between" style={{ width: '100%' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem' }}>
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
          ) : (
            <BookOpen className="text-gradient" size={28} style={{ stroke: 'url(#cyan-blue-gradient)' }} />
          )}
          <span className="text-gradient" style={{ fontFamily: 'Outfit, sans-serif' }}>{settings.institutionName || 'SmartLib'}</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="desktop-only" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                style={{ 
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  position: 'relative',
                  padding: '0.25rem 0',
                  transition: 'color var(--transition-fast)'
                }}
              >
                {link.name}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))',
                    borderRadius: '1px'
                  }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Action Button & Select Portal */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated ? (
            <Link 
              to={user?.role === 'admin' || user?.role === 'librarian' || user?.role === 'super_admin' ? '/admin' : '/student'} 
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
            >
              <LogIn size={18} />
              <span>Get Started</span>
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button 
          className="mobile-only" 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SVG Gradient definitions for icons */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="cyan-blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-cyan)" />
            <stop offset="100%" stopColor="var(--accent-blue)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Mobile Drawer (aesthetic dropdown) */}
      {isOpen && (
        <div className="mobile-only animate-fade-in" style={{
          marginTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem 0 0.5rem 0',
          borderTop: '1px solid var(--glass-border)'
        }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsOpen(false)}
                style={{ 
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: 500,
                  padding: '0.5rem 0',
                }}
              >
                {link.name}
              </Link>
            );
          })}
          <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isAuthenticated ? (
              <Link 
                to={user?.role === 'admin' || user?.role === 'librarian' || user?.role === 'super_admin' ? '/admin' : '/student'} 
                className="btn btn-primary"
                onClick={() => setIsOpen(false)}
                style={{ width: '100%' }}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="btn btn-secondary"
                onClick={() => setIsOpen(false)}
                style={{ width: '100%' }}
              >
                <LogIn size={18} />
                <span>Get Started</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
