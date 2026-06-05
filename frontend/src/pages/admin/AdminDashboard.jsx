import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, BookOpen, Users, ArrowLeftRight, HelpCircle, LogOut, Bell, Menu, X, QrCode, ClipboardList, ChevronLeft, ChevronRight, Home, Settings, Building, DollarSign, Award, Shield, LayoutTemplate, AlertCircle
} from 'lucide-react';

import AdminOverview from './AdminOverview';
import AdminBooks from './AdminBooks';
import AdminUsers from './AdminUsers';
import AdminTransactions from './AdminTransactions';
import AdminScanner from './AdminScanner';
import AdminLogs from './AdminLogs';
import AdminSettings from './AdminSettings';
import SuperAdminInstitutions from './SuperAdminInstitutions';
import SuperAdminOverview from './SuperAdminOverview';
import SuperAdminRevenue from './SuperAdminRevenue';
import SuperAdminPlans from './SuperAdminPlans';
import AdminSupport from './AdminSupport';
import SuperAdminSupport from './SuperAdminSupport';
import SuperAdminPayments from './SuperAdminPayments';
import PaymentGateway from '../../components/payment/PaymentGateway';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const socket = useSocket();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(user?.role === 'super_admin' ? 'super-dashboard' : 'overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNavbarMode, setIsNavbarMode] = useState(false);
  const [liveLog, setLiveLog] = useState(null); // Real-time scanner notifications
  
  // Inside Count
  const [currentlyInside, setCurrentlyInside] = useState(0);

  // Fetch Inside Count
  const fetchInsideCount = async () => {
    try {
      const res = await axios.get('/api/scan/today-count');
      if (res.data.success) {
        setCurrentlyInside(res.data.data.currentlyInside);
      }
    } catch (err) {
      console.error('Error fetching inside student count:', err);
    }
  };

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      fetchInsideCount();
    }
  }, [user?.role]);

  // Listen to Socket real-time events for admin
  useEffect(() => {
    if (socket && user?.role !== 'super_admin') {
      const roomName = `admin_room_${user.institutionId || 'default_institution'}`;
      socket.emit('join', roomName);

      // Listen for entry exit gate scans
      socket.on('entry_exit_scan', (data) => {
        setLiveLog(data.log);
        // Refresh inside count
        fetchInsideCount();
        
        // Auto clear live notifications after 5s
        setTimeout(() => setLiveLog(null), 5000);
      });

      // Listen for transaction events
      socket.on('book_issued', (data) => {
        setLiveLog({
          type: 'issue',
          message: `Book "${data.transaction.book?.title}" issued to ${data.transaction.user?.name}`,
          timestamp: new Date()
        });
        setTimeout(() => setLiveLog(null), 5000);
      });

      socket.on('book_returned', (data) => {
        setLiveLog({
          type: 'return',
          message: `Book "${data.transaction.book?.title}" returned by ${data.transaction.user?.name}`,
          timestamp: new Date()
        });
        setTimeout(() => setLiveLog(null), 5000);
      });

      return () => {
        socket.off('entry_exit_scan');
        socket.off('book_issued');
        socket.off('book_returned');
      };
    }
  }, [socket, user?.role, user?.institutionId]);

  const handleTabChange = (tabId) => {
    if (tabId === 'home') {
      navigate('/');
      return;
    }
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  const menuSections = user?.role === 'super_admin' ? [
    {
      title: 'Global Management',
      items: [
        { id: 'super-dashboard', name: 'Global Overview', icon: LayoutDashboard },
        { id: 'institutions', name: 'Institutions', icon: Building },
        { id: 'revenue', name: 'Revenue', icon: DollarSign },
        { id: 'plans', name: 'Plans', icon: Award },
        { id: 'payments', name: 'Payment Issues', icon: AlertCircle },
        { id: 'support', name: 'Support Tickets', icon: HelpCircle },
      ]
    },
    {
      title: 'General',
      items: [
        { id: 'home', name: 'Back to Home', icon: Home }
      ]
    }
  ] : [
    {
      title: 'Library Operations',
      items: [
        { id: 'overview', name: 'Overview', icon: LayoutDashboard },
        { id: 'books', name: 'Book Catalog', icon: BookOpen },
        { id: 'students', name: 'Student Registry', icon: Users },
        { id: 'staff', name: 'Staff Registry', icon: Users },
        { id: 'transactions', name: 'Lending Desk', icon: ClipboardList },
        { id: 'scanner', name: 'QR Scan Desk', icon: QrCode },
        { id: 'gate-logs', name: 'Gate Access Logs', icon: ArrowLeftRight },
      ]
    },
    {
      title: 'System Settings',
      items: [
        { id: 'settings', name: 'Settings', icon: Settings },
        { id: 'support', name: 'Support', icon: HelpCircle },
        { id: 'home', name: 'Back to Home', icon: Home }
      ]
    }
  ];

  const allMenuItems = menuSections.flatMap(s => s.items);

  const renderContent = () => {
    switch (activeTab) {
      case 'super-dashboard':
        return <SuperAdminOverview />;
      case 'institutions':
        return <SuperAdminInstitutions />;
      case 'revenue':
        return <SuperAdminRevenue />;
      case 'plans':
        return <SuperAdminPlans />;
      case 'payments':
        return <SuperAdminPayments />;
      case 'overview':
        return <AdminOverview setActiveTab={setActiveTab} />;
      case 'books':
        return <AdminBooks />;
      case 'students':
        return <AdminUsers registryType="students" />;
      case 'staff':
        return <AdminUsers registryType="staff" />;
      case 'transactions':
        return <AdminTransactions />;
      case 'scanner':
        return <AdminScanner fetchInsideCount={fetchInsideCount} />;
      case 'gate-logs':
        return <AdminLogs />;
      case 'settings':
        return <AdminSettings />;
      case 'support':
        return user?.role === 'super_admin' ? <SuperAdminSupport /> : <AdminSupport />;
      default:
        return user?.role === 'super_admin' ? <SuperAdminOverview /> : <AdminOverview setActiveTab={setActiveTab} />;
    }
  };

  // Check if admin institution is active
  if (user?.role === 'admin' && user?.institution?.subscriptionStatus !== 'active') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem' }}>
            <Building className="text-gradient" size={28} />
            <span className="text-gradient">{user.institution?.name || 'Your Institution'}</span>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <LogOut size={16} /> Logout
          </button>
        </header>
        <PaymentGateway user={user} onPaymentSuccess={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: isNavbarMode ? 'column' : 'row',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Sidebar / Navbar */}
      <aside className={`glass-panel sidebar-container ${isSidebarOpen ? 'sidebar-active' : ''} ${isSidebarCollapsed && !isNavbarMode ? 'collapsed' : ''} ${isNavbarMode ? 'navbar-mode-container' : ''}`} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        borderRadius: isNavbarMode ? '0 0 var(--radius-lg) var(--radius-lg)' : '0 var(--radius-xl) var(--radius-xl) 0',
        borderLeft: 'none',
        position: isNavbarMode ? 'sticky' : 'fixed',
        top: 0,
        bottom: isNavbarMode ? 'auto' : 0,
        left: 0,
        width: isNavbarMode ? '100%' : undefined,
        zIndex: 999,
      }}>
        {/* Logo and Collapse Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', fontWeight: 700, fontSize: '1.25rem', position: 'relative' }}>
          {user?.role === 'super_admin' ? (
            <Shield className="text-gradient animate-pulse" size={28} style={{ flexShrink: 0, color: 'var(--accent-cyan)' }} />
          ) : settings.logo ? (
            <img src={settings.logo} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
          ) : (
            <BookOpen className="text-gradient" size={28} style={{ flexShrink: 0 }} />
          )}
          {!isSidebarCollapsed && (
            <span className="text-gradient" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {user?.role === 'super_admin' ? 'Root Console' : (settings.institutionName || 'SmartLib')}
            </span>
          )}
          
          {/* Collapse Toggle for Desktop */}
          {!isNavbarMode && (
            <button className="desktop-only" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} style={{
              background: 'var(--bg-surface-hover)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer',
              borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: isSidebarCollapsed ? '0' : 'auto'
            }}>
              {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}

          {/* Close for Mobile */}
          <button className="mobile-only" onClick={() => setIsSidebarOpen(false)} style={{
            background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', marginLeft: 'auto'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className={isNavbarMode ? 'user-card-hidden' : ''} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: isSidebarCollapsed ? '0.5rem' : '0.75rem',
          background: 'var(--bg-surface-hover)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--glass-border)',
          justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!isSidebarCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name}</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {user?.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, overflowY: 'auto' }}>
          {menuSections.map((section, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {!isSidebarCollapsed && (
                <div className="nav-section-title" style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: 'var(--text-secondary)',
                  opacity: 0.6,
                  paddingLeft: '0.75rem',
                  marginBottom: '0.25rem',
                  fontFamily: 'Outfit, sans-serif'
                }}>
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className="nav-item-btn"
                    onClick={() => handleTabChange(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isSidebarCollapsed ? '0' : '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                      border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: isActive ? 600 : 400,
                      justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                      transition: 'all var(--transition-fast)'
                    }}
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="nav-logout-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isSidebarCollapsed && !isNavbarMode ? '0' : '0.75rem',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            cursor: 'pointer',
            fontWeight: 500,
            justifyContent: isSidebarCollapsed && !isNavbarMode ? 'center' : 'flex-start',
            marginTop: isNavbarMode ? '0' : 'auto'
          }}
          title={(isSidebarCollapsed || isNavbarMode) ? 'Sign Out' : undefined}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!(isSidebarCollapsed && !isNavbarMode) && !isNavbarMode && <span>Sign Out</span>}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className={`main-content-layout ${isSidebarCollapsed && !isNavbarMode ? 'collapsed' : ''} ${isNavbarMode ? 'navbar-mode-active' : ''}`}>

        
        {/* Header Bar */}
        <header className="glass-panel dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-only" onClick={() => setIsSidebarOpen(true)} style={{
               background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer'
             }}>
               <Menu size={24} />
             </button>
             <h2 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
               {allMenuItems.find(m => m.id === activeTab)?.name}
             </h2>
           </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
            
            {/* Inside Student Count Counter */}
            {user?.role !== 'super_admin' && (
              <div className="desktop-only" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                <Users size={14} />
                <span>Students Inside: {currentlyInside}</span>
              </div>
            )}

            {/* Layout Toggle Button */}
            <button 
              onClick={() => setIsNavbarMode(!isNavbarMode)} 
              className="desktop-only" 
              style={{ 
                background: 'var(--bg-surface-hover)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', 
                cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}
              title={isNavbarMode ? "Switch to Sidebar" : "Switch to Top Navbar"}
            >
              {isNavbarMode ? <LayoutDashboard size={18} /> : <LayoutTemplate size={18} />}
            </button>

            <div className="desktop-only" style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500 }}>{user?.name}</span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {user?.role === 'super_admin' ? 'System Owner' : 'Library Staff'}
              </span>
            </div>
          </div>
        </header>

        {/* Live scanner ticker notifications */}
        {liveLog && (
          <div className="glass-panel animate-fade-in" style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 1000,
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            border: liveLog.type === 'exit' ? '1px solid var(--warning)' : '1px solid var(--success)',
            background: 'var(--bg-surface-hover)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: liveLog.type === 'exit' ? 'var(--warning)' : 'var(--success)'
            }} className="animate-pulse" />
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>
                LIVE SCAN ACTIVITY
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {liveLog.message || `${liveLog.type === 'exit' ? 'Exit' : 'Entry'} recorded for ${liveLog.user?.name}`}
              </span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="dashboard-main">
          {renderContent()}
        </main>
      </div>

      <style>{`
        .sidebar-container {
          width: 260px;
          padding: 2rem 1.5rem;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-out;
        }
        .sidebar-container.collapsed {
          width: 80px;
          padding: 2rem 0.5rem;
        }
        
        /* Navbar Mode Styles */
        .navbar-mode-container {
          position: sticky !important;
          top: 0;
          left: 0;
          width: 100% !important;
          height: 70px !important;
          flex-direction: row !important;
          align-items: center;
          padding: 0 1.5rem !important;
          z-index: 1000;
          border-radius: 0 0 var(--radius-lg) var(--radius-lg) !important;
          overflow: visible !important;
          gap: 1.5rem !important;
        }
        .navbar-mode-container nav {
          flex-direction: row !important;
          align-items: center;
          gap: 0.5rem !important;
          overflow-x: auto !important;
          flex: 1;
        }
        .navbar-mode-container nav > div {
          flex-direction: row !important;
          align-items: center;
          gap: 0.5rem !important;
        }
        .navbar-mode-container .nav-item-btn {
          padding: 0.5rem 0.75rem !important;
          white-space: nowrap;
        }
        .navbar-mode-container .user-card-hidden {
          display: none !important;
        }
        .navbar-mode-container .nav-section-title {
          display: none !important;
        }
        .navbar-mode-container .nav-logout-btn {
          padding: 0.5rem !important;
        }
        .main-content-layout.navbar-mode-active {
          padding-left: 0 !important;
        }

        @media (max-width: 767px) {
          .sidebar-container {
            width: 260px !important;
            padding: 2rem 1.5rem !important;
            transform: translateX(-100%) !important;
            height: 100vh !important;
            flex-direction: column !important;
            position: fixed !important;
          }
          .sidebar-container.sidebar-active {
            transform: translateX(0) !important;
          }
        }
        @media (min-width: 768px) {
          .sidebar-container:not(.navbar-mode-container) {
            transform: translateX(0) !important;
          }
        }
        .sidebar-active {
          transform: translateX(0) !important;
        }
      `}</style>
    </div>
  );
}
