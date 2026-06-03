import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, DollarSign, ArrowUpRight, TrendingUp, Calendar, ShieldAlert 
} from 'lucide-react';

export default function SuperAdminRevenue() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    mrr: 0,
    annualized: 0,
    paidCount: 0
  });

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await axios.get('/api/institutions');
        if (res.data.success) {
          const data = res.data.data;
          
          let totalMrr = 0;
          let paidCount = 0;
          const items = [];

          data.forEach(inst => {
            let amount = 0;
            let billing = 'Free Use';
            
            if (inst.plan === 'scholar_elite') {
              amount = 299;
              billing = '₹299 / Month';
              paidCount++;
            } else if (inst.plan === 'pro') {
              amount = 2999;
              billing = '₹2,999 / Month';
              paidCount++;
            }

            totalMrr += amount;
            
            items.push({
              id: inst.id,
              name: inst.name,
              plan: inst.plan,
              amount,
              billing,
              date: inst.createdAt
            });
          });

          setList(items);
          setMetrics({
            mrr: totalMrr,
            annualized: totalMrr * 12,
            paidCount
          });
        }
      } catch (err) {
        console.error('Error fetching revenue info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  if (loading) {
    return <div className="flex-center" style={{ minHeight: '200px' }}>Loading revenue logs...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e'
          }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monthly Recurring Revenue</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', fontFamily: 'Outfit, sans-serif' }}>
              ₹{metrics.mrr.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-violet)'
          }}>
            <CreditCard size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Annual Run Rate</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', fontFamily: 'Outfit, sans-serif' }}>
              ₹{metrics.annualized.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)'
          }}>
            <ArrowUpRight size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Premium Tenants</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', fontFamily: 'Outfit, sans-serif' }}>
              {metrics.paidCount} / {list.length}
            </h3>
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h4 style={{ fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={18} color="var(--accent-cyan)" />
          <span>Tenant Billing Ledger</span>
        </h4>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Institution Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Subscription Plan</th>
                <th style={{ padding: '0.75rem 1rem' }}>Monthly Rate</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(255, 255, 255, 0.01)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                    {item.plan === 'scholar_elite' ? 'Scholar Elite' : item.plan === 'pro' ? 'Institutional Pro' : 'Basic (Free)'}
                  </td>
                  <td style={{ padding: '1rem', color: item.amount > 0 ? '#22c55e' : 'var(--text-secondary)', fontWeight: item.amount > 0 ? 600 : 400 }}>
                    {item.billing}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: item.amount > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                      color: item.amount > 0 ? '#22c55e' : 'var(--text-secondary)',
                      border: item.amount > 0 ? '1px solid #22c55e' : '1px solid rgba(156, 163, 175, 0.4)'
                    }}>
                      {item.amount > 0 ? 'Active License' : 'Free Use'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
