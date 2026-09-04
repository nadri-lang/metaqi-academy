import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/src/utils/storage';
import api from '@/src/services/api';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  language: string;
  has_active_subscription: boolean;
  temp_access_until: string | null;
  created_at: string;
  last_login: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (sessionId: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Track processed session IDs to prevent duplicate processing
const processedSessionIds = new Set<string>();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForSessionId();
  }, []);

  const checkForSessionId = async () => {
    try {
      // Check for session_id in URL (from Google OAuth redirect)
      let sessionId: string | null = null;

      if (Platform.OS === 'web') {
        // Web: check both hash and query
        const hash = window.location.hash;
        const search = window.location.search;
        
        const hashMatch = hash.match(/[?#&]session_id=([^&#]+)/);
        const searchMatch = search.match(/[?&]session_id=([^&#]+)/);
        
        sessionId = hashMatch?.[1] || searchMatch?.[1] || null;
      } else {
        // Mobile: check initial URL
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const match = initialUrl.match(/[?#&]session_id=([^&#]+)/);
          sessionId = match?.[1] || null;
        }
      }

      if (sessionId && !processedSessionIds.has(sessionId)) {
        // Process Google Auth session
        await loginWithGoogle(sessionId);
        
        // Clean URL on web
        if (Platform.OS === 'web') {
          const newUrl = window.location.pathname;
          window.history.replaceState(window.history.state, '', newUrl);
        }
      } else {
        // No session_id, load existing user
        await loadUser();
      }
    } catch (error) {
      console.error('Error checking for session ID:', error);
      await loadUser();
    }
  };

  const loadUser = async () => {
    try {
      const token = await storage.secureGet('auth_token', null);
      if (token) {
        const response = await api.get('/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      await storage.secureRemove('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      await storage.secureSet('auth_token', access_token);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al iniciar sesión');
    }
  };

  const loginWithGoogle = async (sessionId: string) => {
    if (processedSessionIds.has(sessionId)) {
      console.log('Session ID already processed, skipping');
      return;
    }

    try {
      processedSessionIds.add(sessionId);
      
      const response = await api.post('/auth/session', { session_id: sessionId });
      const { session_token, user: userData } = response.data;
      
      await storage.secureSet('auth_token', session_token);
      setUser(userData);
    } catch (error: any) {
      console.error('Error in Google login:', error);
      throw new Error(error.response?.data?.detail || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await api.post('/auth/register', { name, email, password });
      // Auto login after registration
      await login(email, password);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al registrar');
    }
  };

  const logout = async () => {
    await storage.secureRemove('auth_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};