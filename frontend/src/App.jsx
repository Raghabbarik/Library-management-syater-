import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import PublicLayout from './components/layout/PublicLayout';

// Lazy load Public Pages
const Home = lazy(() => import('./pages/public/Home'));
const About = lazy(() => import('./pages/public/About'));
const Plans = lazy(() => import('./pages/public/Plans'));
const HowToUse = lazy(() => import('./pages/public/HowToUse'));

// Lazy load Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const RemoteScanner = lazy(() => import('./pages/admin/RemoteScanner'));
const SuperAdminLogin = lazy(() => import('./pages/auth/SuperAdminLogin'));
const InstitutionPortal = lazy(() => import('./pages/auth/InstitutionPortal'));

// Lazy load Dashboard Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));

// Loading Fallback Component
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
    <div style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/plans" element={<PublicLayout><Plans /></PublicLayout>} />
          <Route path="/how-to-use" element={<PublicLayout><HowToUse /></PublicLayout>} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/remote-scanner" element={<RemoteScanner />} />
          <Route path="/superadmin" element={<SuperAdminLogin />} />
          
          {/* Institution Student Portal */}
          <Route path="/portal/:institutionId" element={<InstitutionPortal />} />
          <Route path="/portal/:institutionId/:mode" element={<InstitutionPortal />} />
          
          {/* Protected Routes */}
          <Route path="/admin/*" element={
            isAuthenticated && (user?.role === 'admin' || user?.role === 'librarian' || user?.role === 'super_admin') ? 
            <AdminDashboard /> : 
            <Navigate to="/login" />
          } />
          
          <Route path="/student/*" element={
            isAuthenticated && (user?.role === 'student' || user?.role === 'teacher') ? 
            <StudentDashboard /> : 
            <Navigate to="/login" />
          } />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
