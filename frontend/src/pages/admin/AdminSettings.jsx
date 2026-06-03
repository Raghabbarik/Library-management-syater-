import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Settings, Upload, Check, AlertTriangle, Image as ImageIcon, Sparkles, Building, ExternalLink } from 'lucide-react';

export default function AdminSettings() {
  const { settings, updateSystemSettings } = useSettings();
  const [institutionName, setInstitutionName] = useState(settings.institutionName);
  const [logo, setLogo] = useState(settings.logo);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setInstitutionName(settings.institutionName);
    setLogo(settings.logo);
  }, [settings]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setMsg({ type: 'error', text: 'Please select an image file (PNG/JPG)' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Image size should be less than 2MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogo(e.target.result);
      setMsg({ type: 'info', text: 'Logo loaded. Click Save changes below.' });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const result = await updateSystemSettings({
      institutionName,
      logo
    });

    if (result.success) {
      setMsg({ type: 'success', text: 'Settings updated successfully!' });
    } else {
      setMsg({ type: 'error', text: result.error || 'Failed to update settings.' });
    }
    setLoading(false);
  };

  const resetLogo = () => {
    setLogo('');
    setMsg({ type: 'info', text: 'Logo reset. Click Save changes to apply.' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }} className="animate-fade-in">
      
      {/* Settings Form Card */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Settings size={22} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', margin: 0 }}>Institution Customization</h3>
        </div>

        {msg.text && (
          <div style={{
            background: msg.type === 'success' ? 'var(--success-bg)' : msg.type === 'error' ? 'var(--danger-bg)' : 'rgba(79, 172, 254, 0.1)',
            border: msg.type === 'success' ? '1px solid var(--success)' : msg.type === 'error' ? '1px solid var(--danger)' : '1px solid var(--accent-blue)',
            color: msg.type === 'success' ? 'var(--success)' : msg.type === 'error' ? 'var(--danger)' : 'var(--accent-blue)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {msg.type === 'error' && <AlertTriangle size={15} />}
            {msg.type === 'success' && <Check size={15} />}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Institution / Library Name
            </label>
            <input 
              type="text" 
              value={institutionName} 
              onChange={(e) => setInstitutionName(e.target.value)}
              required
              placeholder="e.g. Smart Library"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Institution Logo
            </label>

            {/* Drag & Drop Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: dragOver ? '2px dashed var(--accent-cyan)' : '2px dashed var(--glass-border)',
                background: dragOver ? 'rgba(79, 172, 254, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
              onClick={() => document.getElementById('logo-upload-input').click()}
            >
              <input 
                id="logo-upload-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {logo ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <img 
                    src={logo} 
                    alt="Institution Logo Preview" 
                    style={{ 
                      maxHeight: '80px', 
                      maxWidth: '100%',
                      objectFit: 'contain',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '0.5rem',
                      border: '1px solid var(--glass-border)'
                    }} 
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click or drag to replace logo</span>
                </div>
              ) : (
                <>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                  }}>
                    <Upload size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                      Upload logo image
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Supports PNG, JPG (Max 2MB)
                    </span>
                  </div>
                </>
              )}
            </div>

            {logo && (
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); resetLogo(); }}
                className="btn btn-secondary"
                style={{ 
                  marginTop: '0.75rem', 
                  fontSize: '0.75rem', 
                  padding: '0.35rem 0.75rem', 
                  width: '100%',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  color: 'var(--danger)'
                }}
              >
                Reset to Default Logo
              </button>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              marginTop: '0.5rem', 
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.2)'
            }}
          >
            {loading ? 'Saving settings...' : 'Save Customizations'}
          </button>
        </form>
      </div>

      {/* Preview Card Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} style={{ color: '#fbbf24' }} />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>
            Live Preview on Digital Library Card
          </h4>
        </div>

        {/* Digital Card Preview */}
        <div className="glass-panel" style={{
          padding: '1.75rem',
          backgroundImage: 'linear-gradient(135deg, rgba(20, 20, 35, 0.95) 0%, rgba(35, 20, 60, 0.95) 100%)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '260px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Card Decorator Blobs */}
          <div style={{
            position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(162, 203, 139, 0.25) 0%, transparent 70%)', filter: 'blur(30px)'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Institution Logo */}
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {logo ? (
                  <img src={logo} alt="Preview Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <ImageIcon size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.6rem', letterSpacing: '1.5px', color: '#c7eabb', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {institutionName || 'SMART LIBRARY'} MEMBER PASS
                </span>
                <h3 style={{ fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif', marginTop: '0.1rem', color: '#ffffff', fontWeight: 600 }}>
                  SmartLib Card
                </h3>
              </div>
            </div>

            <div style={{
              background: 'rgba(199, 234, 187, 0.2)', color: '#c7eabb', fontSize: '0.65rem', padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)', fontWeight: 600, border: '1px solid rgba(199, 234, 187, 0.3)'
            }}>
              ACTIVE
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '1.25rem 0 0.5rem 0' }}>
            {/* Fake QR Frame */}
            <div style={{
              background: 'white', padding: '0.35rem', borderRadius: 'var(--radius-md)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ width: '80px', height: '80px', border: '1px dashed #333', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#666', fontWeight: 600 }}>
                QR CODE
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)' }}>CARD HOLDER</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>John Doe</span>
              
              <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.4rem' }}>MEMBER ID</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem', color: '#e8f5bd' }}>STU_D19A82</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.6rem', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            <span>DEP: Computer Science | YEAR: 3rd Year</span>
            <span>EXPIRES: 27/05/2030</span>
          </div>
        </div>
      </div>

      {/* Share Student Login Link Card */}
      <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Building size={22} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', margin: 0 }}>Student Access Portal</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: '1.6' }}>
          Share this branded portal link with your students. When they open it, they'll see a customised login page with your institution's name and logo — and can only access your library's data.
        </p>

        {/* Branded Portal Links */}
        <div style={{
          background: 'rgba(79,172,254,0.06)',
          border: '1px solid rgba(79,172,254,0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={15} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recommended — Branded Portal Links
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '-0.5rem', lineHeight: '1.5', marginTop: '-0.5rem' }}>
            Students land on a fully branded page showing your institution's name and logo.
          </p>

          {/* Login Link */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              1. Student Login Link
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                id="portal-login-link-input"
                type="text"
                readOnly
                value={`${window.location.origin}/portal/${settings.institutionId}/login`}
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid rgba(79,172,254,0.3)',
                  color: 'var(--accent-cyan)',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  minWidth: '240px'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const val = `${window.location.origin}/portal/${settings.institutionId}/login`;
                  navigator.clipboard.writeText(val);
                  alert('Login link copied to clipboard!');
                }}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
                  padding: '0.7rem 1.25rem',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 15px rgba(79,172,254,0.25)'
                }}
              >
                <ExternalLink size={15} />
                Copy
              </button>
              <button
                type="button"
                onClick={() => window.open(`/portal/${settings.institutionId}/login`, '_blank')}
                className="btn btn-secondary"
                style={{ padding: '0.7rem 1.25rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <ExternalLink size={15} />
                Preview
              </button>
            </div>
          </div>

          {/* Registration Link */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              2. Student Registration / Sign Up Link
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                id="portal-signup-link-input"
                type="text"
                readOnly
                value={`${window.location.origin}/portal/${settings.institutionId}/signup`}
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px dashed rgba(79,172,254,0.3)',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  minWidth: '240px'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const val = `${window.location.origin}/portal/${settings.institutionId}/signup`;
                  navigator.clipboard.writeText(val);
                  alert('Sign Up link copied to clipboard!');
                }}
                className="btn btn-secondary"
                style={{ padding: '0.7rem 1.25rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <ExternalLink size={15} />
                Copy
              </button>
              <button
                type="button"
                onClick={() => window.open(`/portal/${settings.institutionId}/signup`, '_blank')}
                className="btn btn-secondary"
                style={{ padding: '0.7rem 1.25rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <ExternalLink size={15} />
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Fallback — Generic Login Link */}
        <div style={{
          background: 'var(--bg-surface-hover)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem'
        }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            ↩ Fallback — Generic Login with Institution Pre-selected
          </p>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              id="student-login-link-input"
              type="text"
              readOnly
              value={`${window.location.origin}/login?inst=${settings.institutionId}`}
              style={{
                flex: 1,
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                minWidth: '200px'
              }}
            />
            <button
              type="button"
              onClick={() => {
                const val = `${window.location.origin}/login?inst=${settings.institutionId}`;
                navigator.clipboard.writeText(val);
                alert('Fallback link copied!');
              }}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ExternalLink size={14} />
              Copy
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
