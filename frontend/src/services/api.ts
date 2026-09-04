import axios from 'axios';
import { storage } from '@/src/utils/storage';
import * as Localization from 'expo-localization';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  // Without this var the baseURL below becomes the literal string
  // "undefined/api", every request resolves relative to whatever origin is
  // serving the app, and (on web) that origin's dev server answers with its
  // own index.html instead of a 404 - so every call "succeeds" with an HTML
  // string as response.data instead of failing loudly. That HTML then gets
  // set as component state and crashes downstream (e.g. "x.map is not a
  // function" or "Cannot read properties of undefined") far from this file.
  // Set EXPO_PUBLIC_BACKEND_URL (e.g. in frontend/.env) to your API's origin.
  console.error(
    '[api] EXPO_PUBLIC_BACKEND_URL is not set - API calls will not reach the backend.'
  );
}

const API_URL = (BACKEND_URL || '') + '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // fail fast with a clear error instead of hanging forever if the sandbox is unreachable
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
        lang: currentLang,
        client_date: getClientDate(), // Always send client's local date
        ...config.params, // Let an explicit param from the caller win over the global default
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
  (response) => {
    // A misconfigured/unreachable backend often still returns 200 with the
    // app's own HTML shell (see the EXPO_PUBLIC_BACKEND_URL check above)
    // instead of a network error. Axios silently hands that back as a raw
    // string when it isn't valid JSON, which then crashes whatever screen
    // tries to use it as an object/array. Reject early instead, so it lands
    // in the same catch blocks a real network error would.
    if (typeof response.data === 'string' && /^\s*<(!doctype|html)/i.test(response.data)) {
      return Promise.reject(
        new Error(
          `[api] Received HTML instead of JSON from ${response.config?.url} - the backend is unreachable or EXPO_PUBLIC_BACKEND_URL is misconfigured.`
        )
      );
    }
    return response;
  },
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