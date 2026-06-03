import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { 
  User, Shield, Lock, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function StudentProfile() {
  const { user, setUser } = useAuth();

  const departments = [
    'Computer Science',
    'Electronics',
    'Electrical',
    'Mechanical',
    'Civil',
    'Information Technology',
    'Chemical',
    'Biotechnology',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Commerce',
    'Arts',
    'Management',
    'Other',
  ];

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
  
  // Profile Form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    year: user?.year || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const res = await axios.put('/api/auth/me', profileData);
      if (res.data.success) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
        setUser(res.data.user);
      }
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
    }

    setPasswordLoading(true);

    try {
      const res = await axios.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (res.data.success) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password.'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
      
      {/* Update Profile Form */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <User size={22} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>Profile Details</h3>
        </div>

        {profileMsg.text && (
          <div style={{
            background: profileMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: profileMsg.type === 'success' ? '1px solid var(--success)' : '1px solid var(--danger)',
            color: profileMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name</label>
            <input 
              type="text" 
              name="name"
              value={profileData.name} 
              onChange={handleProfileChange}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email (Cannot be modified)</label>
            <input 
              type="email" 
              value={user?.email || ''} 
              disabled
              style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Department</label>
              <select 
                name="department"
                value={profileData.department} 
                onChange={handleProfileChange}
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
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Year</label>
              <select 
                name="year"
                value={profileData.year} 
                onChange={handleProfileChange}
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
              >
                <option value="">Select Year</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              value={profileData.phone} 
              onChange={handleProfileChange}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={profileLoading} style={{ marginTop: '1rem' }}>
            {profileLoading ? <RefreshCw size={16} className="animate-spin" /> : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Lock size={22} color="var(--accent-purple)" />
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>Security settings</h3>
        </div>

        {passwordMsg.text && (
          <div style={{
            background: passwordMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: passwordMsg.type === 'success' ? '1px solid var(--success)' : '1px solid var(--danger)',
            color: passwordMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current Password</label>
            <input 
              type="password" 
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>New Password</label>
            <input 
              type="password" 
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Confirm New Password</label>
            <input 
              type="password" 
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-secondary" disabled={passwordLoading} style={{ marginTop: '1rem', border: '1px solid rgba(142, 45, 226, 0.3)' }}>
            {passwordLoading ? <RefreshCw size={16} className="animate-spin" /> : 'Change Password'}
          </button>
        </form>
      </div>

    </div>
  );
}
