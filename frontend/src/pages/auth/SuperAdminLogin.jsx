import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, LogIn, AlertCircle, Sparkles, Server } from 'lucide-react';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex-center" style={{ 
      minHeight: '100vh', 
      padding: '1.5rem',
      background: 'radial-gradient(circle at center, #110e26 0%, #070510 100%)' 
    }}>
      <div className="glass-panel animate-fade-in" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '2.5rem',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex-center" style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', 
            background: 'rgba(139, 92, 246, 0.1)', 
            margin: '0 auto 1rem',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)'
          }}>
            <Shield size={32} color="#8b5cf6" />
          </div>
          <h2 className="text-gradient" style={{ 
            backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
            fontFamily: 'Outfit, sans-serif'
          }}>
            System Engine
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Root Central Authority Portal
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'var(--danger-bg)', 
            border: '1px solid var(--danger)', 
            color: 'var(--danger)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#c084fc' }}>
              Root Administrator Email
            </label>
            <input 
              type="email" 
              placeholder="root@system" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(139, 92, 246, 0.2)',
                color: '#f3e8ff'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#c084fc' }}>
              Security Passphrase
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(139, 92, 246, 0.2)',
                color: '#f3e8ff'
              }}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading} 
            style={{ 
              marginTop: '1rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
            }}
          >
            {isLoading ? 'Decrypting credentials...' : (
              <>
                <LogIn size={18} />
                Access Console
              </>
            )}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(139, 92, 246, 0.15)' }}></div>
          <span style={{ padding: '0 0.75rem', color: '#c084fc' }}>ROOT SECURE</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(139, 92, 246, 0.15)' }}></div>
        </div>

        <div className="glass-panel" style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed rgba(139, 92, 246, 0.3)',
          background: 'rgba(139, 92, 246, 0.05)',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={14} style={{ color: '#c084fc' }} />
            <span>Master Credentials</span>
          </div>
          <button 
            type="button" 
            onClick={() => { setEmail('prempolai99@gmail.com'); setPassword('Prem@2006'); }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              color: '#f3e8ff',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#c084fc'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'; }}
          >
            <span style={{ fontWeight: 500, color: '#c084fc' }}>Super Admin</span>
            <span style={{ fontSize: '0.75rem', color: '#c084fc', opacity: 0.8 }}>Autofill</span>
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Back to Home Portal</Link>
        </p>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
