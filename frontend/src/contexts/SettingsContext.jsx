import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [localInstId, setLocalInstId] = useState(localStorage.getItem('selected_institution') || '');
  const [settings, setSettings] = useState({
    institutionId: 'default_institution',
    institutionName: 'Smart Library',
    logo: '',
    plan: 'free'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      let idQuery = localInstId;
      if (user && user.institutionId) {
        idQuery = user.institutionId;
      }

      const url = idQuery ? `/api/settings?institutionId=${idQuery}` : '/api/settings';
      const res = await axios.get(url);
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user, localInstId]);

  // Update browser title & favicon dynamically when settings load or change
  useEffect(() => {
    if (settings.institutionName) {
      document.title = settings.institutionName;
    }
    
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = settings.logo || '/favicon.ico';
  }, [settings]);

  const selectInstitution = (instId) => {
    setLocalInstId(instId);
    if (instId) {
      localStorage.setItem('selected_institution', instId);
    } else {
      localStorage.removeItem('selected_institution');
    }
  };

  const updateSystemSettings = async (newData) => {
    try {
      const res = await axios.put('/api/settings', newData);
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
        return { success: true };
      }
      return { success: false, error: 'Update failed' };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to update settings'
      };
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, selectInstitution, updateSystemSettings, reloadSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
