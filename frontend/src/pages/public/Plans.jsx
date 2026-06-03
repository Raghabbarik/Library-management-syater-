import React from 'react';
import { Check, ShieldAlert, Sparkles, Send } from 'lucide-react';

export default function Plans() {
  const plans = [
    {
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
      name: 'Institutional Pro',
      price: 'Custom',
      period: 'annual license',
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
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', marginTop: '2rem' }}>
      
      {/* 1. Header */}
      <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800 }}>
          Centralized <span className="text-gradient">Membership Plans</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.7' }}>
          Select the perfect administrative scaling parameters or reading limitations for your workflows.
        </p>
      </section>

      {/* 2. Cards Grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2.5rem',
        alignItems: 'stretch'
      }}>
        {plans.map((plan, index) => (
          <div 
            key={index} 
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
              transform: plan.isPopular ? 'scale(1.03)' : 'none',
              transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)'
            }}
          >
            {plan.isPopular && (
              <div style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
                color: '#000',
                padding: '0.35rem 1rem',
                borderRadius: 'var(--radius-xl)',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <Sparkles size={12} />
                <span>Best Value</span>
              </div>
            )}

            <div>
              {/* Header inside Card */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>{plan.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', minHeight: '40px' }}>{plan.desc}</p>
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{plan.price}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ {plan.period}</span>
                </div>
              </div>

              {/* Features List */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                    <Check size={16} style={{ color: plan.isPopular ? 'var(--accent-cyan)' : 'var(--accent-blue)', flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action button inside Card */}
            <button 
              className={plan.isPopular ? 'btn btn-primary' : 'btn btn-secondary'} 
              style={{ width: '100%', padding: '0.85rem 1.5rem' }}
            >
              <span>Get Started</span>
            </button>
          </div>
        ))}
      </section>

      {/* 3. FAQ note */}
      <section className="glass-panel" style={{
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.1)',
            color: 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Looking for custom institutional parameters?</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              We offer bespoke database partitions, Active Directory (LDAP) setups, and automated entry scanner SDK setups.
            </p>
          </div>
        </div>
        
        <button className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Send size={16} />
          <span>Contact Sales</span>
        </button>
      </section>

    </div>
  );
}
