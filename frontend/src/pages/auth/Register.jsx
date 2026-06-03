import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Building, AlertCircle, BookOpen, CheckCircle2, UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    institutionName: '',
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    if (!formData.institutionName.trim()) {
      return setError('Institution / Library name is required');
    }

    setIsLoading(true);

    try {
      // Step 1: Register admin user in Firebase Auth + Firestore profile
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: 'admin',
        institutionName: formData.institutionName.trim(),
      };

      const result = await register(registerData);
      
      if (result.success) {
        setSuccessMessage('Your institution has been registered successfully! Your account is pending Super Admin approval. You will be able to log in once approved.');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
    
    setIsLoading(false);
  };

  if (successMessage) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', textAlign: 'center' }}>
          <div className="flex-center" style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', 
            background: 'var(--success-bg)', 
            margin: '0 auto 1.5rem',
            border: '1px solid var(--success)',
            color: 'var(--success)'
          }}>
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-gradient" style={{ marginBottom: '1rem' }}>Institution Registered</h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Your institution <strong>{formData.institutionName}</strong> has been registered successfully.
            <br />
            Your admin account is currently <strong>pending Super Admin approval</strong>. You will be able to log in once approved.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignSelf: 'center', background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-purple) 100%)', textDecoration: 'none' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex-center" style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', 
            background: 'var(--bg-surface-hover)', 
            margin: '0 auto 1rem',
            border: '1px solid var(--glass-border)'
          }}>
            <Building size={32} color="var(--accent-purple)" />
          </div>
          <h2 className="text-gradient-purple">Register Your Institution</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Create a library admin account for your institution
          </p>
        </div>

        {/* Info banner */}
        <div style={{
          background: 'rgba(79, 172, 254, 0.08)',
          border: '1px solid rgba(79, 172, 254, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.5'
        }}>
          <strong style={{ color: 'var(--accent-cyan)' }}>ℹ️ For Institutions Only</strong>
          <br />
          Students & Teachers cannot self-register. Once your institution is approved, you can invite students via a custom login link from your admin dashboard.
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
          
          {/* Institution Name */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Institution / Library Name <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input 
              type="text" 
              name="institutionName"
              placeholder="e.g. City Central Library" 
              value={formData.institutionName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Admin Name & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Admin Full Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input 
                type="text" 
                name="name"
                placeholder="Your full name" 
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Phone (Optional)
              </label>
              <input 
                type="tel" 
                name="phone"
                placeholder="+91 98765 43210" 
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Admin Email Address <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input 
              type="email" 
              name="email"
              placeholder="admin@yourlibrary.com" 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Password <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input 
                type="password" 
                name="password"
                placeholder="Min 6 characters" 
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Confirm Password <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input 
                type="password" 
                name="confirmPassword"
                placeholder="Re-enter password" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: '1rem', background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-purple) 100%)', boxShadow: '0 4px 15px rgba(142, 45, 226, 0.3)' }}>
            {isLoading ? 'Creating institution...' : (
              <>
                <UserPlus size={18} />
                Register Institution
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: '500', color: 'var(--accent-purple)' }}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
