import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building, Plus, Trash2, Edit3, Check, X, ShieldAlert, Sparkles, Calendar, Award 
} from 'lucide-react';

export default function SuperAdminInstitutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState('free');
  const [creating, setCreating] = useState(false);

  // Edit modal state
  const [editingInst, setEditingInst] = useState(null);
  const [editPlan, setEditPlan] = useState('free');
  const [updating, setUpdating] = useState(false);

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/institutions');
      if (res.data.success) {
        setInstitutions(res.data.data);
      }
    } catch (err) {
      setError('Failed to fetch institutions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.post('/api/institutions', {
        name: newName,
        plan: newPlan
      });
      if (res.data.success) {
        setSuccess('Institution created successfully!');
        setNewName('');
        setNewPlan('free');
        setShowCreateModal(false);
        fetchInstitutions();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create institution');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!editingInst) return;
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.put(`/api/institutions/${editingInst.id}`, {
        plan: editPlan
      });
      if (res.data.success) {
        setSuccess('Plan updated successfully!');
        setEditingInst(null);
        fetchInstitutions();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update plan');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this institution? This action is permanent.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await axios.delete(`/api/institutions/${id}`);
      if (res.data.success) {
        setSuccess('Institution deleted successfully');
        fetchInstitutions();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete institution');
    }
  };

  const getPlanBadgeStyle = (plan) => {
    switch (plan) {
      case 'pro':
        return {
          background: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid var(--accent-violet)',
          color: 'var(--accent-violet)',
          label: 'Institutional Pro'
        };
      case 'scholar_elite':
        return {
          background: 'rgba(6, 182, 212, 0.15)',
          border: '1px solid var(--accent-cyan)',
          color: 'var(--accent-cyan)',
          label: 'Scholar Elite'
        };
      default:
        return {
          background: 'rgba(156, 163, 175, 0.15)',
          border: '1px solid rgba(156, 163, 175, 0.4)',
          color: 'var(--text-secondary)',
          label: 'Basic (Free)'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif', margin: 0 }}>All Registered Institutions</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage database tenants, custom skins, and subscription license metrics.
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)' }}
        >
          <Plus size={18} />
          <span>Add Institution</span>
        </button>
      </div>

      {/* Message alerts */}
      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger)',
          color: 'var(--danger)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          background: 'var(--success-bg)',
          border: '1px solid var(--success)',
          color: 'var(--success)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex-center" style={{ minHeight: '200px' }}>
          <span>Loading institutions registry...</span>
        </div>
      ) : (
        /* Institutions Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {institutions.map((inst) => {
            const planDetails = getPlanBadgeStyle(inst.plan);
            const isDefault = inst.id === 'default_institution';
            return (
              <div 
                key={inst.id} 
                className="glass-panel" 
                style={{
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  border: isDefault ? '1px dashed var(--accent-cyan)' : '1px solid var(--glass-border)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Glowing decor */}
                {isDefault && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0, 
                    background: 'var(--accent-cyan)', color: '#000',
                    fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.75rem',
                    borderRadius: '0 0 0 var(--radius-md)', textTransform: 'uppercase'
                  }}>
                    Default
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Logo/Icon Container */}
                    <div style={{
                      width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-surface-hover)', border: '1px solid var(--glass-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0
                    }}>
                      {inst.logo ? (
                        <img src={inst.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Building size={22} color="var(--text-muted)" />
                      )}
                    </div>

                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                        {inst.name}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {inst.id}</span>
                    </div>
                  </div>

                  {/* Plan display & Created info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={14} style={{ color: planDetails.color }} />
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        ...planDetails
                      }}>
                        {planDetails.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      <span>Registered: {new Date(inst.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions footer */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '1rem',
                  justifyContent: 'flex-end'
                }}>
                  <button 
                    onClick={() => { setEditingInst(inst); setEditPlan(inst.plan || 'free'); }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Edit3 size={12} />
                    <span>Change Plan</span>
                  </button>

                  <button 
                    onClick={() => handleDelete(inst.id)}
                    disabled={isDefault}
                    className="btn btn-secondary"
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '0.35rem 0.75rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                      color: isDefault ? 'var(--text-muted)' : 'var(--danger)',
                      cursor: isDefault ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Create Institution Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setShowCreateModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h4 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={20} color="var(--accent-cyan)" />
              <span>Add New Institution</span>
            </h4>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Institution / School Name
                </label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  required 
                  placeholder="e.g. Stanford University"
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Subscription plan
                </label>
                <select 
                  value={newPlan} 
                  onChange={(e) => setNewPlan(e.target.value)}
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
                  <option value="free">Basic (Free)</option>
                  <option value="scholar_elite">Scholar Elite</option>
                  <option value="pro">Institutional Pro</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={creating}
                style={{ 
                  marginTop: '0.5rem',
                  background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)'
                }}
              >
                {creating ? 'Creating...' : 'Register Institution'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Plan Modal */}
      {editingInst && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setEditingInst(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h4 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} color="var(--accent-violet)" />
              <span>Modify License Plan</span>
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Update subscription tier for <strong>{editingInst.name}</strong>.
            </p>

            <form onSubmit={handleUpdatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Subscription plan
                </label>
                <select 
                  value={editPlan} 
                  onChange={(e) => setEditPlan(e.target.value)}
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
                  <option value="free">Basic (Free)</option>
                  <option value="scholar_elite">Scholar Elite</option>
                  <option value="pro">Institutional Pro</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={updating}
                style={{ 
                  marginTop: '0.5rem',
                  background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-purple) 100%)'
                }}
              >
                {updating ? 'Saving...' : 'Update Plan Tier'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
