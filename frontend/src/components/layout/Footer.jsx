import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Globe, Share2, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass-panel" style={{
      margin: '2rem 1rem 1rem 1rem',
      padding: '2.5rem 1.5rem 1.5rem 1.5rem',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--glass-border)',
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2.5rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem' }}>
            <BookOpen className="text-gradient" size={24} style={{ stroke: 'url(#cyan-blue-gradient)' }} />
            <span className="text-gradient" style={{ fontFamily: 'Outfit, sans-serif' }}>SmartLib</span>
          </Link>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Transforming institutional libraries into real-time, smart, interactive knowledge hubs.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ marginBottom: '1.25rem', fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Quick Links</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Home</Link>
            <Link to="/about" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>About Us</Link>
            <Link to="/plans" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Plans</Link>
            <Link to="/how-to-use" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>How it Works</Link>
          </div>
        </div>

        {/* Support */}
        <div>
          <h4 style={{ marginBottom: '1.25rem', fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Support</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Help Center</a>
            <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Terms of Service</a>
            <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Contact Info</a>
          </div>
        </div>

        {/* Social */}
        <div>
          <h4 style={{ marginBottom: '1.25rem', fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Follow Us</h4>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <a href="#" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)'
            }} className="social-icon">
              <Globe size={18} />
            </a>
            <a href="#" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)'
            }} className="social-icon">
              <Share2 size={18} />
            </a>
            <a href="#" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)'
            }} className="social-icon">
              <Mail size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="flex-between" style={{
        marginTop: '1.5rem',
        paddingTop: '0.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <span>&copy; {new Date().getFullYear()} SmartLib. All rights reserved.</span>
        <span>Designed for Next-Generation Knowledge Centers.</span>
      </div>
    </footer>
  );
}
