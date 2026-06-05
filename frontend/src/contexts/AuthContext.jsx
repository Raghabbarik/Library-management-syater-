import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../config/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Listen to firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
          localStorage.setItem('token', idToken);
          setToken(idToken);

          // Get profile details from our backend
          const res = await axios.get('/api/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            handleLogout();
          }
        } catch (err) {
          console.error("Error verifying Firebase Auth state:", err);
          handleLogout();
        }
      } else {
        handleLogout();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const login = async (email, password) => {
    try {
      // Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      // Temporarily set axios auth header for profile check
      axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
      
      const res = await axios.get('/api/auth/me');
      if (res.data.success) {
        setToken(idToken);
        localStorage.setItem('token', idToken);
        setUser(res.data.user);
        return { success: true };
      } else {
        await signOut(auth);
        handleLogout();
        return { success: false, error: 'Login failed' };
      }
    } catch (error) {
      await signOut(auth);
      handleLogout();
      let message = 'Login failed';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email format';
      } else {
        message = error.response?.data?.message || error.message;
      }
      return { success: false, error: message };
    }
  };

  const loginWithGoogle = async (institutionId = '') => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

      // Verify if they have a profile
      let profileRes;
      try {
        profileRes = await axios.get('/api/auth/me');
      } catch (err) {
        if (err.response && err.response.status === 401 && err.response.data?.message === 'User profile not found in database') {
          // Profile not found, let's create a default student profile!
          const defaultProfile = {
            name: firebaseUser.displayName || 'Google User',
            email: firebaseUser.email,
            role: 'student',
            studentId: 'STU_' + firebaseUser.uid.substring(0, 6).toUpperCase(),
            department: 'General',
            phone: firebaseUser.phoneNumber || '',
            avatar: firebaseUser.photoURL || '',
            institutionId: institutionId || ''
          };
          profileRes = await axios.post('/api/auth/register', defaultProfile);
        } else {
          throw new Error(err.response?.data?.message || 'Authentication failed');
        }
      }

      if (profileRes.data.success) {
        setToken(idToken);
        localStorage.setItem('token', idToken);
        setUser(profileRes.data.user);
        return { success: true };
      }
      return { success: false, error: 'Failed to sync user profile' };
    } catch (error) {
      await signOut(auth);
      handleLogout();
      console.error("Google login error:", error);
      let msg = 'Google authentication failed';
      if (error.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup closed before completion';
      } else {
        msg = error.message;
      }
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    try {
      // Handle both raw JSON objects and FormData objects
      const isFormData = userData instanceof FormData;
      const email = isFormData ? userData.get('email') : userData.email;
      const password = isFormData ? userData.get('password') : userData.password;

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      // Temporarily set axios auth header for registration request
      axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

      // Set explicit header if it's FormData, else rely on axios default application/json
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

      // Call our backend to save the user profile in Firestore
      const res = await axios.post('/api/auth/register', userData, config);
      
      // Sign out immediately after creating profile, so user remains pending admin approval
      await signOut(auth);
      handleLogout();

      if (res.data.success) {
        return { success: true, message: res.data.message };
      } else {
        // Rollback Firebase auth if profile creation fails
        await firebaseUser.delete();
        return { success: false, error: res.data.message || 'Profile registration failed' };
      }
    } catch (error) {
      await signOut(auth);
      handleLogout();
      let message = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email already registered';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters';
      } else {
        message = error.response?.data?.message || error.message;
      }
      return { success: false, error: message };
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent successfully. Please check your inbox.' };
    } catch (error) {
      let message = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else {
        message = error.message;
      }
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error logging out from Firebase:', err);
    } finally {
      handleLogout();
    }
  };

  if (loading) {
    return <div className="flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, loginWithGoogle, register, logout, resetPassword, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
