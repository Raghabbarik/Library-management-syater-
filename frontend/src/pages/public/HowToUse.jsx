import React from 'react';
import { UserCheck, Search, QrCode, Calendar, ArrowRight, Server, Play, Bell } from 'lucide-react';

export default function HowToUse() {
  const studentSteps = [
    {
      num: '01',
      title: 'Digital Registration',
      desc: 'Register as a Student and automatically receive your cryptographic Digital Member profile card.',
      icon: <UserCheck size={24} />
    },
    {
      num: '02',
      title: 'Browse Catalog',
      desc: 'Browse through thousands of digitalized volumes with real-time stock and status indicators.',
      icon: <Search size={24} />
    },
    {
      num: '03',
      title: 'Instant QR Checkout',
      desc: 'Generate your instant ticket code, show it to the librarian checkout desk, and get verified in 50ms.',
      icon: <QrCode size={24} />
    },
    {
      num: '04',
      title: 'Auto Alerts & Returns',
      desc: 'Track borrowing timelines on your dashboard. Receive automated emails prior to your due date.',
      icon: <Calendar size={24} />
    }
  ];

  const adminSteps = [
    {
      num: '01',
      title: 'Digitalize Catalog',
      desc: 'Log book titles, genres, authors, and allocate unique QR-code labels to catalog shelves.',
      icon: <Server size={24} />
    },
    {
      num: '02',
      title: 'Scan & Dispatch',
      desc: 'Use the central scanner to read student tickets. The system automates log dispatches in real-time.',
      icon: <Play size={24} />
    },
    {
      num: '03',
      title: 'Live Feeds & Updates',
      desc: 'Track checkout, queue status, and library entry/exit logs instantly on a unified monitoring dashboard.',
      icon: <Bell size={24} />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', marginTop: '2rem' }}>
      
      {/* 1. Header */}
      <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800 }}>
          How <span className="text-gradient">SmartLib Works</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.7' }}>
          Explore the streamlined, paperless interactions built specifically for students and administrative coordinators.
        </p>
      </section>

      {/* 2. Student Workflow */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Student Workflow</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>(For Readers and Borrowers)</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2rem'
        }}>
          {studentSteps.map((step, index) => (
            <div key={index} className="glass-panel" style={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              border: '1px solid var(--glass-border)',
              position: 'relative'
            }}>
              {/* Number overlay */}
              <span style={{
                position: 'absolute',
                top: '1rem',
                right: '1.5rem',
                fontSize: '2.5rem',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.03)',
                fontFamily: 'Outfit, sans-serif',
                lineHeight: 1
              }}>{step.num}</span>

              <div style={{
                width: '45px',
                height: '45px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 242, 254, 0.08)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {step.icon}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Admin Workflow */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Administrator Workflow</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>(For Librarians & Officers)</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {adminSteps.map((step, index) => (
            <div key={index} className="glass-panel" style={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              border: '1px solid var(--glass-border)',
              position: 'relative'
            }}>
              {/* Number overlay */}
              <span style={{
                position: 'absolute',
                top: '1rem',
                right: '1.5rem',
                fontSize: '2.5rem',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.03)',
                fontFamily: 'Outfit, sans-serif',
                lineHeight: 1
              }}>{step.num}</span>

              <div style={{
                width: '45px',
                height: '45px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(142, 45, 226, 0.08)',
                color: 'var(--accent-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {step.icon}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
