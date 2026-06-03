import React from 'react';
import { Target, Users, BookOpen, Layers, Cpu, Award } from 'lucide-react';

export default function About() {
  const stackItems = [
    { name: 'React 19 & Vite', desc: 'High-speed frontend runtime with modular rendering pipeline.' },
    { name: 'Node.js & Express', desc: 'Secure asynchronous API backends powered by Express.' },
    { name: 'MongoDB & Mongoose', desc: 'Elastic document-oriented database models supporting rich search capacities.' },
    { name: 'Socket.io', desc: 'Bi-directional real-time communication pipeline for live library scans.' },
    { name: 'NodeMailer', desc: 'Automated email service for overdue notices and system alerts.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', marginTop: '2rem' }}>
      
      {/* 1. Header Hero */}
      <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800 }}>
          About <span className="text-gradient">SmartLib</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.7' }}>
          We design next-generation administrative tools to empower academic libraries, eliminating complex paperwork and traditional friction.
        </p>
      </section>

      {/* 2. Mission & Vision */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2.5rem'
      }}>
        {/* Mission */}
        <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--glass-border)' }}>
          <div style={{
            width: '45px',
            height: '45px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 242, 254, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)'
          }}>
            <Target size={22} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 600 }}>Our Mission</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7' }}>
            To simplify library transactions by applying state-of-the-art software systems. We bridge the gap between digital administration and physical reading experiences.
          </p>
        </div>

        {/* Vision */}
        <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--glass-border)' }}>
          <div style={{
            width: '45px',
            height: '45px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(142, 45, 226, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-violet)'
          }}>
            <Award size={22} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 600 }}>Our Vision</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7' }}>
            A fully paperless library ecosystem globally where student credentials, borrow transactions, and analytics logs are seamlessly managed in milliseconds.
          </p>
        </div>
      </section>

      {/* 3. Core Tech Stack Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Next-Gen Tech Stack</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
            Built using standard, robust modern paradigms to provide unbeatable performance and data integrity.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {stackItems.map((item, index) => (
            <div key={index} className="glass-card" style={{ padding: '1.75rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Cpu size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{item.name}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Team Focus */}
      <section className="glass-panel" style={{
        padding: '3rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        alignItems: 'center',
        gap: '3rem',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(79, 172, 254, 0.1)',
            color: 'var(--accent-blue)',
            fontSize: '0.8rem',
            fontWeight: 600,
            alignSelf: 'flex-start'
          }}>
            <Users size={14} />
            <span>Developer Driven</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>A Solution Built For Institutions</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7' }}>
            We understand the challenges faced by librarians and administrators. That's why we designed an all-in-one centralized panel featuring live websocket logs and instant scanning parameters to eliminate queue times.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0, 242, 254, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>100% Digital Cataloging</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Instant access, search, and reserve options.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(142, 45, 226, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--accent-violet)' }}>
              <Layers size={18} />
            </div>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Elastic Fine Automation</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Automated, customizable calculations of overdue days.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
