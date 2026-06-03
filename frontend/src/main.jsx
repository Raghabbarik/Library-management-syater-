import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Set base URL for API requests
axios.defaults.baseURL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </SettingsProvider>
    </AuthProvider>
  </StrictMode>,
);
