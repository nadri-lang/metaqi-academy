import axios from 'axios';
import { storage } from '@/src/utils/storage';
import * as Localization from 'expo-localization';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token, language, and client date
api.interceptors.request.use(
  async (config) => {
    const token = await storage.secureGet('auth_token', null);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add language parameter to GET requests
    const savedLanguage = await storage.getItem('app_language', null);
    const currentLang = savedLanguage || Localization.locale?.split('-')[0] || 'es';
    
    // Get client's local date in YYYY-MM-DD format
    const getClientDate = (): string => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        lang: currentLang,
        client_date: getClientDate(), // Always send client's local date
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await storage.secureRemove('auth_token');
      await storage.secureRemove('user_data');
    }
    return Promise.reject(error);
  }
);

export default api;