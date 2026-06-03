import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, BookOpen, History, Key, LogOut, Bell, User, Menu, X, ArrowLeftRight, ChevronLeft, ChevronRight, Home, QrCode
} from 'lucide-react';

import StudentOverview from './StudentOverview';
import StudentCatalog from './StudentCatalog';
import StudentHistory from './StudentHistory';
import StudentLogs from './StudentLogs';
import StudentProfile from './StudentProfile';
import StudentGateScan from './StudentGateScan';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const socket = useSocket();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/api/notifications');
        if (res.data.success) {
          setNotifications(res.data.data);
          setUnreadCount(res.data.unreadCount);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
  }, []);

  // Listen to live notifications via Socket.io
  useEffect(() => {
    if (socket) {
      // Join user specific room
      socket.emit('join', `user_${user._id}`);
      
      const handleNewNotification = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };

      socket.on('new_notification', handleNewNotification);
      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [socket, user._id]);

  const markAllRead = async () => {
    try {
      const res = await axios.patch('/api/notifications/mark-read', { all: true });
      if (res.data.success) {
        setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleTabChange = (tabId) => {
    if (tabId === 'home') {
      navigate('/');
      return;
    }
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  const menuItems = [
    { id: 'home', name: 'Back to Home', icon: Home },
    { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'gate-scan', name: 'Gate Check-In', icon: QrCode },
    { id: 'catalog', name: 'Book Catalog', icon: BookOpen },
    { id: 'history', name: 'My Borrowings', icon: History },
    { id: 'logs', name: 'Gate Logs', icon: ArrowLeftRight },
    { id: 'profile', name: 'Profile Settings', icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <StudentOverview setActiveTab={setActiveTab} />;
      case 'gate-scan':
        return <StudentGateScan />;
      case 'catalog':
        return <StudentCatalog />;
      case 'history':
        return <StudentHistory />;
      case 'logs':
        return <StudentLogs />;
      case 'profile':
        return <StudentProfile />;
      default:
        return <StudentOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Sidebar for Desktop */}
      <aside className={`glass-panel sidebar-container ${isSidebarOpen ? 'sidebar-active' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        borderRadius: '0 var(--radius-xl) var(--radius-xl) 0',
        borderLeft: 'none',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 999,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', fontWeight: 700, fontSize: '1.25rem', position: 'relative' }}>
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
          ) : (
            <BookOpen className="text-gradient" size={28} style={{ flexShrink: 0 }} />
          )}
          {!isSidebarCollapsed && <span className="text-gradient" style={{ fontFamily: 'Outfit, sans-serif' }}>{settings.institutionName || 'SmartLib'}</span>}
          
          {/* Collapse Toggle for Desktop */}
          <button className="desktop-only" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} style={{
            background: 'var(--bg-surface-hover)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer',
            borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginLeft: isSidebarCollapsed ? '0' : 'auto'
          }}>
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Close for Mobile */}
          <button className="mobile-only" onClick={() => setIsSidebarOpen(false)} style={{
            background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', marginLeft: 'auto'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div style={{
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.studentId || 'Student'}</span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
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
        </nav>

        {/* Logout Button */}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isSidebarCollapsed ? '0' : '0.75rem',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            cursor: 'pointer',
            fontWeight: 500,
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            marginTop: 'auto'
          }}
          title={isSidebarCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!isSidebarCollapsed && <span>Sign Out</span>}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className={`main-content-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        
        {/* Header Bar */}
        <header className="glass-panel dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-only" onClick={() => setIsSidebarOpen(true)} style={{
               background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer'
             }}>
               <Menu size={24} />
             </button>
             <h2 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
               {menuItems.find(m => m.id === activeTab)?.name}
             </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
            {/* Notification Bell */}
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                position: 'relative',
                padding: '0.25rem'
              }}
            >
              <Bell size={22} className={unreadCount > 0 ? 'animate-pulse' : ''} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotifOpen && (
              <div className="glass-panel" style={{
                position: 'absolute',
                top: '2.5rem',
                right: 0,
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 1000
              }}>
                <div className="flex-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem' }}>Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{
                      background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
                    }}>
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem 0', fontSize: '0.85rem' }}>
                    No notifications
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: notif.isRead ? 'transparent' : 'var(--bg-surface-hover)',
                        borderLeft: notif.isRead ? '2px solid transparent' : '2px solid var(--accent-cyan)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{notif.title}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.2' }}>{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="desktop-only" style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500 }}>{user?.name}</span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Student Portal</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-main">
          {renderContent()}
        </main>
      </div>

      {/* Internal styling for responsive desktop drawer and sidebar spacing */}
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
        @media (max-width: 767px) {
          .sidebar-container {
            width: 260px !important;
            padding: 2rem 1.5rem !important;
            transform: translateX(-100%) !important;
          }
          .sidebar-container.sidebar-active {
            transform: translateX(0) !important;
          }
        }
        @media (min-width: 768px) {
          .sidebar-container {
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
