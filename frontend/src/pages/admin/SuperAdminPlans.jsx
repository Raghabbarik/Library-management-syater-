import React, { useState } from 'react';
import { Award, Check, Settings, ShieldAlert, Sparkles, HelpCircle, Save } from 'lucide-react';

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState([
    {
      id: 'free',
      name: 'Basic (Free)',
      price: '₹0',
      period: 'forever',
      desc: 'Essential features for casual readers and standard lookups.',
      features: [
        'Issue up to 2 books concurrently',
        '7-day borrow duration limits',
        'Digital catalog search access',
        'Standard email notifications',
        'Self-service checkout QR logs'
      ],
      isPopular: false,
      color: 'var(--text-secondary)'
    },
    {
      id: 'scholar_elite',
      name: 'Scholar Elite',
      price: '₹299',
      period: 'per month',
      desc: 'Enhanced limits and features designed for serious students and researchers.',
      features: [
        'Issue up to 6 books concurrently',
        '14-day borrow duration limits',
        'Advanced reserving & hold placement',
        'Priority email & SMS notification alerts',
        'Real-time status updates via socket client',
        '24/7 priority support assistance'
      ],
      isPopular: true,
      color: 'var(--accent-cyan)'
    },
    {
      id: 'pro',
      name: 'Institutional Pro',
      price: '₹2,999',
      period: 'per month',
      desc: 'Centralized admin privileges and database scaling parameters for schools.',
      features: [
        'Unlimited active borrow limits',
        'Customizable borrow durations & fine logs',
        'Full administrative analytics panel',
        'Automated SMTP email notifications',
        'Advanced system security parameters',
        'Dedicated server hosting integration'
      ],
      isPopular: false,
      color: 'var(--accent-violet)'
    }
  ]);

  const [editingPlan, setEditingPlan] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [descInput, setDescInput] = useState('');

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setPriceInput(plan.price);
    setDescInput(plan.desc);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editingPlan) return;

    setPlans(prev => prev.map(p => {
      if (p.id === editingPlan.id) {
        return {
          ...p,
          price: priceInput,
          desc: descInput
        };
      }
      return p;
    }));

    setEditingPlan(null);
    alert('Plan parameters updated successfully! In a live environment, these metrics sync immediately to tenant checkout rules.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      
      {/* Header section */}
      <div>
        <h3 style={{ fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif', margin: 0 }}>Configure Subscription Tiers</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Adjust active license pricing and borrow duration thresholds across all partner libraries.
        </p>
      </div>

      {/* Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2.5rem',
        alignItems: 'stretch'
      }}>
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className="glass-panel" 
            style={{
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: 'var(--radius-xl)',
              border: plan.isPopular ? '2px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
              boxShadow: plan.isPopular ? '0 15px 35px rgba(0, 242, 254, 0.15)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              position: 'relative',
            }}
          >
            {plan.isPopular && (
              <div style={{
                position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
                color: '#000', padding: '0.35rem 1rem', borderRadius: 'var(--radius-xl)',
                fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <Sparkles size={12} />
                <span>Best Value</span>
              </div>
            )}

            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>{plan.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', minHeight: '40px' }}>{plan.desc}</p>
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{plan.price}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ {plan.period}</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', paddingLeft: 0 }}>
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                    <Check size={16} style={{ color: plan.isPopular ? 'var(--accent-cyan)' : 'var(--accent-blue)', flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => handleEdit(plan)}
              className={plan.isPopular ? 'btn btn-primary' : 'btn btn-secondary'} 
              style={{ width: '100%', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Settings size={16} />
              <span>Modify Price Tiers</span>
            </button>
          </div>
        ))}
      </div>

      {/* Edit parameter Modal */}
      {editingPlan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setEditingPlan(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              X
            </button>

            <h4 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} color="var(--accent-cyan)" />
              <span>Edit Plan Parameters</span>
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Editing specifications for <strong>{editingPlan.name}</strong>.
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Subscription Price
                </label>
                <input 
                  type="text" 
                  value={priceInput} 
                  onChange={(e) => setPriceInput(e.target.value)}
                  required 
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
                  Plan Description
                </label>
                <textarea 
                  value={descInput} 
                  onChange={(e) => setDescInput(e.target.value)}
                  required 
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    resize: 'none'
                  }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  marginTop: '0.5rem',
                  background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
