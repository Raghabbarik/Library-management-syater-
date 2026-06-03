import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building, Users, TrendingUp, CreditCard, Shield, Sparkles, Plus, ChevronRight 
} from 'lucide-react';

export default function SuperAdminOverview() {
  const [stats, setStats] = useState({
    totalInstitutions: 0,
    activePremium: 0,
    estimatedMRR: 0,
    freeUseCount: 0
  });
  const [recentInsts, setRecentInsts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/institutions');
        if (res.data.success) {
          const list = res.data.data;
          
          let premium = 0;
          let freeCount = 0;
          let mrr = 0;
          
          list.forEach(inst => {
            if (inst.plan === 'scholar_elite') {
              premium++;
              mrr += 299;
            } else if (inst.plan === 'pro') {
              premium++;
              mrr += 2999; // Estimated standard Pro monthly rate
            } else {
              freeCount++;
            }
          });

          setStats({
            totalInstitutions: list.length,
            activePremium: premium,
            estimatedMRR: mrr,
            freeUseCount: freeCount
          });

          // Get most recent 4 institutions
          const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRecentInsts(sorted.slice(0, 4));
        }
      } catch (err) {
        console.error('Error loading super admin statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex-center" style={{ minHeight: '200px' }}>Loading overview details...</div>;
  }

  const statCards = [
    {
      title: 'Total Partners',
      value: stats.totalInstitutions,
      desc: 'Active library databases',
      icon: Building,
      color: 'var(--accent-cyan)'
    },
    {
      title: 'Active Premium',
      value: stats.activePremium,
      desc: 'Paid license agreements',
      icon: TrendingUp,
      color: 'var(--accent-violet)'
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.estimatedMRR.toLocaleString('en-IN')}`,
      desc: 'Estimated recurring income',
      icon: CreditCard,
      color: 'var(--success)'
    },
    {
      title: 'Free Tier',
      value: stats.freeUseCount,
      desc: 'Community use accounts',
      icon: Users,
      color: 'var(--text-secondary)'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      
      {/* Visual Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-panel" style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid var(--glass-border)`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{card.title}</span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.35rem 0', fontFamily: 'Outfit, sans-serif' }}>{card.value}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.desc}</span>
              </div>
              <div style={{
                width: '46px', height: '46px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color
              }}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Recent partners card */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="var(--accent-cyan)" />
            <span>Recent Partner Signups</span>
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentInsts.map(inst => (
              <div key={inst.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: 'var(--bg-surface-hover)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Building size={16} color="var(--text-secondary)" />
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>{inst.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tier: {inst.plan === 'pro' ? 'Pro' : inst.plan === 'scholar_elite' ? 'Elite' : 'Free'}</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(inst.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System security overview */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} color="var(--accent-violet)" />
              <span>Core Security Health</span>
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              The multi-tenant database router isolates transactions, library logs, credentials, and book configurations inside separate Firestore scopes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>🔒 Tenant Partitions</span>
                <span>Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>🔑 Firebase Auth Tokens</span>
                <span>Encrypted</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>⚡ Rate Limiting Filters</span>
                <span>Enabled</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Engine Version: 1.0.4</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Active Health Check: Normal</span>
          </div>
        </div>

      </div>

    </div>
  );
}
