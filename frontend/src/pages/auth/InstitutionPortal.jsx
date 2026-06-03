import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
  BookOpen, LogIn, AlertCircle, Loader2, Shield, Users, CheckCircle2, Eye, EyeOff, UserPlus
} from 'lucide-react';

export default function InstitutionPortal() {
  const { institutionId, mode } = useParams();
  const navigate = useNavigate();
  const { login, loginWithGoogle, logout, user, isAuthenticated, register } = useAuth();
  const { selectInstitution } = useSettings();

  const [institution, setInstitution] = useState(null);
  const [instLoading, setInstLoading] = useState(true);
  const [instError, setInstError] = useState('');

  const [isLoginMode, setIsLoginMode] = useState(mode !== 'signup');
  
  // Update mode if URL changes
  useEffect(() => {
    if (mode === 'signup') {
      setIsLoginMode(false);
    } else if (mode === 'login') {
      setIsLoginMode(true);
    }
  }, [mode]);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If already logged in as a student of this institution, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      if ((user.role === 'student' || user.role === 'teacher') && user.institutionId === institutionId) {
        navigate('/student/overview');
      }
      // Admins are not redirected so they can preview the portal
    }
  }, [isAuthenticated, user, institutionId, navigate]);

  const isAdminPreview = isAuthenticated && user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'librarian');

  // Fetch institution details
  useEffect(() => {
    const fetchInstitution = async () => {
      setInstLoading(true);
      try {
        const res = await axios.get('/api/institutions');
        if (res.data.success) {
          const found = res.data.data.find(i => i.id === institutionId);
          if (found) {
            setInstitution(found);
            selectInstitution(institutionId);
          } else {
            setInstError('Institution not found. Please check the link you were given.');
          }
        }
      } catch (err) {
        setInstError('Unable to load institution details. Please try again.');
      } finally {
        setInstLoading(false);
      }
    };
    if (institutionId) fetchInstitution();
  }, [institutionId]);

  const validateAndRedirect = async (loggedUser) => {
    const role = loggedUser.role;
    if (role === 'admin' || role === 'super_admin' || role === 'librarian') {
      navigate('/admin/overview');
      return;
    }
    // Student/Teacher: must belong to this institution
    const userInstId = loggedUser.institutionId || 'default_institution';
    if (userInstId !== institutionId) {
      await logout();
      setError('Access denied. Your account does not belong to this institution portal.');
      return;
    }
    navigate('/student/overview');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (isLoginMode) {
      const result = await login(email, password);
      if (result.success) {
        try {
          const meRes = await axios.get('/api/auth/me');
          if (meRes.data.success) {
            await validateAndRedirect(meRes.data.user);
          } else {
            setError('Failed to retrieve your profile. Please try again.');
          }
        } catch {
          setError('Error verifying your account. Please try again.');
        }
      } else {
        setError(result.error);
      }
    } else {
      // Registration Mode
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
      
      const registerData = new FormData();
      registerData.append('name', name);
      registerData.append('email', email);
      registerData.append('password', password);
      registerData.append('role', 'student');
      registerData.append('institutionId', institutionId);
      registerData.append('studentId', studentId);
      registerData.append('department', department);
      registerData.append('year', year);
      registerData.append('phone', '');
      
      if (avatar) {
        registerData.append('avatar', avatar);
      }

      const result = await register(registerData);
      if (result.success) {
        setSuccessMessage('Registration successful! You can now sign in.');
        setIsLoginMode(true);
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error);
      }
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    const result = await loginWithGoogle(institutionId);
    if (result.success) {
      try {
        const meRes = await axios.get('/api/auth/me');
        if (meRes.data.success) {
          await validateAndRedirect(meRes.data.user);
        } else {
          setError('Failed to retrieve your profile. Please try again.');
        }
      } catch {
        setError('Error verifying your account. Please try again.');
      }
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  // ─── Loading State ───────────────────────────────────────────────
  if (instLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)'
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={40} color="var(--accent-cyan)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading institution portal...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────
  if (instError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        padding: '1.5rem'
      }}>
        <div className="glass-panel animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <AlertCircle size={28} color="var(--danger)" />
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', marginBottom: '0.75rem' }}>Portal Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>{instError}</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
            style={{ marginTop: '1.5rem', width: '100%' }}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Portal Page ─────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative blobs */}
      <div style={{
        position: 'fixed', top: '-10%', left: '-5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,172,254,0.07) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-5%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,242,254,0.05) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none'
      }} />

      {/* Admin Preview Banner */}
      {isAdminPreview && (
        <div style={{
          background: 'rgba(79, 172, 254, 0.15)',
          borderBottom: '1px solid var(--accent-cyan)',
          color: 'var(--accent-cyan)',
          padding: '0.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 500,
          fontSize: '0.85rem',
          position: 'relative',
          zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={16} />
            <span>You are viewing this portal in Admin Preview Mode. Form is disabled.</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/admin/overview')}
              style={{
                background: 'var(--accent-cyan)',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-sm)',
                color: '#000',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              Back to Dashboard
            </button>
            <button 
              onClick={logout}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid var(--glass-border)',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              Logout to Test
            </button>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 10
      }}>
        {institution?.logo ? (
          <img
            src={institution.logo}
            alt={institution.name}
            style={{ height: '28px', objectFit: 'contain' }}
          />
        ) : (
          <BookOpen size={22} color="var(--accent-cyan)" />
        )}
        <span style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 600,
          fontSize: '1rem',
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {institution?.name}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}>
          <Shield size={12} />
          Secured Student Portal
        </span>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        gap: '4rem',
        flexWrap: 'wrap'
      }}>

        {/* Left — Branding Panel */}
        <div className="animate-fade-in" style={{
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Institution Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              width: '80px', height: '80px',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
              {institution?.logo ? (
                <img src={institution.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <BookOpen size={36} color="var(--accent-cyan)" />
              )}
            </div>

            <div>
              <h1 style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '2rem',
                fontWeight: 700,
                lineHeight: 1.2,
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                {institution?.name}
              </h1>
              <p style={{
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.6'
              }}>
                Student Library Portal — sign in to access your digital library, manage borrowings, and track your reading history.
              </p>
            </div>
          </div>

          {/* Feature Chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              'Browse & Reserve Books',
              'View Borrowing History',
              'Gate Check-In via QR',
              'Real-time Notifications'
            ].map((f) => (
              <div key={f} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                fontSize: '0.875rem', color: 'var(--text-secondary)'
              }}>
                <CheckCircle2 size={16} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>

          {/* Stats Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(79,172,254,0.08)',
            border: '1px solid rgba(79,172,254,0.2)',
            borderRadius: 'var(--radius-xl)',
            fontSize: '0.8rem',
            color: 'var(--accent-cyan)'
          }}>
            <Users size={14} />
            Exclusive access for {institution?.name} students only
          </div>
        </div>

        {/* Right — Auth Card */}
        <div className="glass-panel animate-fade-in" style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          animationDelay: '0.1s'
        }}>

          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: 0
            }}>
              {isLoginMode ? 'Sign in to portal' : 'Student Sign Up'}
            </h2>
          </div>

          {/* Institutional Badge on Card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.6rem 0.9rem',
            background: 'rgba(79,172,254,0.08)',
            border: '1px dashed rgba(79,172,254,0.35)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            {institution?.logo ? (
              <img src={institution.logo} alt="" style={{ height: '20px', objectFit: 'contain' }} />
            ) : (
              <BookOpen size={16} color="var(--accent-cyan)" />
            )}
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {institution?.name} Portal
            </span>
          </div>

          {/* Success / Error Alerts */}
          {successMessage && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.85rem',
              lineHeight: '1.5'
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              {successMessage}
            </div>
          )}
          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.85rem',
              lineHeight: '1.5'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              {error}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            {/* Registration specific fields */}
            {!isLoginMode && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Profile Photo (Optional)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-surface)', 
                      border: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', overflow: 'hidden', flexShrink: 0
                    }}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Users size={24} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setAvatar(file);
                          setAvatarPreview(URL.createObjectURL(file));
                        } else {
                          setAvatar(null);
                          setAvatarPreview(null);
                        }
                      }}
                      disabled={isLoading || isAdminPreview}
                      style={{ flex: 1, fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLoginMode}
                    disabled={isLoading || isAdminPreview}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Roll Number / Student ID <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Roll No. or Student ID"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required={!isLoginMode}
                      disabled={isLoading || isAdminPreview}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Department <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        required={!isLoginMode}
                        disabled={isLoading || isAdminPreview}
                        style={{ width: '100%' }}
                      >
                        <option value="">Select Dept</option>
                        {['Computer Science', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Information Technology', 'Chemical', 'Biotechnology', 'Mathematics', 'Physics', 'Chemistry', 'Commerce', 'Arts', 'Management', 'Other'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Batch Year <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        required={!isLoginMode}
                        disabled={isLoading || isAdminPreview}
                        style={{ width: '100%' }}
                      >
                        <option value="">Select Year</option>
                        {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Email Address <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || isAdminPreview}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Password <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isLoginMode ? "Enter your password" : "Min 6 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || isAdminPreview}
                  style={{ width: '100%', paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                    padding: '0', display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLoginMode && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Confirm Password <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isLoginMode}
                    disabled={isLoading || isAdminPreview}
                    style={{ width: '100%', paddingRight: '3rem' }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || isAdminPreview}
              style={{
                marginTop: '0.5rem',
                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
                boxShadow: '0 4px 20px rgba(79,172,254,0.3)',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  {isLoginMode ? 'Signing in...' : 'Registering...'}
                </>
              ) : (
                <>
                  {isLoginMode ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {isLoginMode ? 'Sign In to Portal' : 'Sign Up'}
                </>
              )}
            </button>
          </form>

          {/* Mode Toggle */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError('');
                setSuccessMessage('');
              }}
              disabled={isLoading || isAdminPreview}
              style={{ 
                background: 'none', border: 'none', 
                color: 'var(--accent-cyan)', fontWeight: 600, 
                cursor: (isLoading || isAdminPreview) ? 'not-allowed' : 'pointer',
                padding: 0
              }}
            >
              {isLoginMode ? 'Sign up here' : 'Sign in here'}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
            <span style={{ padding: '0 0.75rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isAdminPreview}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Footer Note */}
          <p style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: '1.5'
          }}>
            This portal is exclusively for students of <strong style={{ color: 'var(--text-secondary)' }}>{institution?.name}</strong>.
            Access is restricted to registered members only.
          </p>
        </div>
      </div>

      {/* Bottom Footer */}
      <div style={{
        padding: '1rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--glass-border)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        position: 'relative',
        zIndex: 10
      }}>
        Powered by <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>SmartLib</span> — Library Management System
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
