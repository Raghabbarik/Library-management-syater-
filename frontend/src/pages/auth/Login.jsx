import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { BookOpen, LogIn, AlertCircle, Sparkles, Home } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, loginWithGoogle, logout } = useAuth();
  const { settings, selectInstitution } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const instQueryParam = queryParams.get('inst') || queryParams.get('institutionId');

  const [institutions, setInstitutions] = useState([]);
  
  useEffect(() => {
    const fetchInst = async () => {
      try {
        const res = await axios.get('/api/institutions');
        if (res.data.success) {
          setInstitutions(res.data.data.filter(i => i.id !== 'default_institution'));
        }
      } catch (err) {}
    };
    fetchInst();
  }, []);

  useEffect(() => {
    if (instQueryParam) {
      selectInstitution(instQueryParam);
    }
  }, [instQueryParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      try {
        const meRes = await axios.get('/api/auth/me');
        if (meRes.data.success) {
          const loggedUser = meRes.data.user;
          const role = loggedUser.role;
          
          if (role === 'student' || role === 'teacher') {
            if (!instQueryParam) {
              await logout();
              setError('Students/Teachers must sign in using their institution\'s custom link.');
              setIsLoading(false);
              return;
            }
            
            const portalInstId = instQueryParam;
            const userInstId = loggedUser.institutionId || 'default_institution';
            
            if (userInstId !== portalInstId) {
              await logout();
              setError('Access denied. Your student profile belongs to another institution portal.');
              setIsLoading(false);
              return;
            }
            navigate('/student');
          } else if (role === 'admin' || role === 'librarian' || role === 'super_admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          setError('Failed to retrieve user profile details.');
        }
      } catch (err) {
        setError('Error verifying account credentials.');
      }
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    const result = await loginWithGoogle();
    
    if (result.success) {
      try {
        const meRes = await axios.get('/api/auth/me');
        if (meRes.data.success) {
          const loggedUser = meRes.data.user;
          const role = loggedUser.role;

          if (role === 'student' || role === 'teacher') {
            if (!instQueryParam) {
              await logout();
              setError('Students/Teachers must sign in using their institution\'s custom link.');
              setIsLoading(false);
              return;
            }

            const portalInstId = instQueryParam;
            const userInstId = loggedUser.institutionId || 'default_institution';

            if (userInstId !== portalInstId) {
              await logout();
              setError('Access denied. Your student profile belongs to another institution portal.');
              setIsLoading(false);
              return;
            }
            navigate('/student');
          } else if (role === 'admin' || role === 'librarian' || role === 'super_admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }
      } catch (err) {
        setError('Error verifying account credentials.');
      }
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '1.5rem', position: 'relative' }}>
      <Link to="/" style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
        <Home size={20} />
        <span style={{ fontSize: '0.9rem' }}>Back to Home</span>
      </Link>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex-center" style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', 
            background: 'var(--bg-surface-hover)', 
            margin: '0 auto 1rem',
            border: '1px solid var(--glass-border)',
            overflow: 'hidden'
          }}>
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <BookOpen size={32} color="var(--accent-cyan)" />
            )}
          </div>
          <h2 className="text-gradient">{settings.institutionName || 'Welcome Back'}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Sign in to your library portal</p>
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

        {instQueryParam && (
          <div style={{ 
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-surface-hover)',
            border: '1px dashed var(--accent-cyan)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Portal Link:</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{settings.institutionName}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textDecoration: 'none' }} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>
                Forgot Password?
              </Link>
            </div>
            <input 
              type="password" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: '1rem' }}>
            {isLoading ? 'Signing in...' : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          <span style={{ padding: '0 0.75rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleSignIn} 
          disabled={isLoading}
          className="btn btn-secondary" 
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.9rem'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Want to register your institution? <Link to="/register" style={{ fontWeight: '500' }}>Register here</Link>
        </p>

        <div className="glass-panel" style={{
          marginTop: '1.5rem',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--glass-border)',
          background: 'var(--bg-surface-hover)',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span>Quick Demo Login</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              type="button" 
              onClick={() => { setEmail('admin@smartlib.com'); setPassword('adminpassword123'); }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <span style={{ fontWeight: 500, color: 'var(--accent-cyan)' }}>Admin Portal</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Autofill Admin</span>
            </button>
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Students must use their institution's custom login link provided by their admin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
