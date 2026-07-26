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

// Request interceptor to add auth token and language
api.interceptors.request.use(
  async (config) => {
    const token = await storage.secureGet('auth_token', null);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add language parameter to GET requests
    const savedLanguage = await storage.secureGet('app_language', null);
    const currentLang = savedLanguage || Localization.locale.split('-')[0] || 'es';
    
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        lang: currentLang,
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