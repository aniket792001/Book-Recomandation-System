import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/useAuthStore';

const getBaseUrl = (): string => {
  // If an explicit remote cloud API URL is set in .env (e.g. Render, Railway), use it everywhere!
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.startsWith('https://')) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api/v1';
  }

  // Automatically extract the host machine IP when developing locally in Expo Go
  const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (expoHost) {
    return `http://${expoHost}:8000/api/v1`;
  }

  return process.env.EXPO_PUBLIC_API_URL || 'http://10.214.175.24:8000/api/v1';
};

const API_BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token to requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error reading auth token:', error);
  }
  return config;
});

// Queue for handling concurrent requests during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: automatically refresh expired access token and retry request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/otp/verify');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await AsyncStorage.getItem('refresh_token');
        if (!storedRefreshToken) {
          processQueue(new Error('No refresh token available'), null);
          await useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        const refreshRes = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: storedRefreshToken,
        });

        const { access_token, refresh_token: newRefreshToken, user } = refreshRes.data;

        await useAuthStore.getState().setAuth(access_token, user, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        processQueue(null, access_token);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  download_url?: string;
  format: string;
  avg_rating: number;
  rating_count: number;
  gutenberg_id?: number;
}

export interface BookContentPage {
  page: number;
  title: string;
  content: string;
}

export interface BookContentResponse {
  book_id: string;
  title: string;
  author: string;
  total_pages: number;
  pages: BookContentPage[];
}

export interface ReadingProgress {
  id: string;
  book_id: string;
  current_cfi: string;
  percentage: number;
  updated_at: string;
  book?: Book;
}

export const BookService = {
  getPopular: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<Book[]>(`/books/popular?limit=${limit}`);
    return res.data;
  },

  getAll: async (page = 1, size = 20, search?: string): Promise<{ items: Book[]; total: number }> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const res = await api.get(`/books?page=${page}&size=${size}${searchParam}`);
    return res.data;
  },

  getDetail: async (id: string): Promise<Book> => {
    const res = await api.get<Book>(`/books/${id}`);
    return res.data;
  },

  semanticSearch: async (query: string, limit = 10): Promise<any[]> => {
    const res = await api.post('/recommend/semantic', { query, limit });
    return res.data;
  },

  getSimilar: async (bookId: string, limit = 6): Promise<any[]> => {
    const res = await api.get(`/recommend/similar/${bookId}?limit=${limit}`);
    return res.data;
  },

  getContent: async (bookId: string): Promise<BookContentResponse> => {
    try {
      const res = await api.get<BookContentResponse>(`/books/${bookId}/content`);
      // Cache authentic book content to AsyncStorage for offline reading
      if (res.data && res.data.pages && res.data.pages.length > 0) {
        AsyncStorage.setItem(`book_content_${bookId}`, JSON.stringify(res.data)).catch(() => { });
      }
      return res.data;
    } catch (err) {
      // If network fails or user is offline, check AsyncStorage cached copy
      try {
        const cached = await AsyncStorage.getItem(`book_content_${bookId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (_) { }
      throw err;
    }
  },
};

export const LibraryService = {
  getProgress: async (): Promise<ReadingProgress[]> => {
    const res = await api.get<ReadingProgress[]>('/library/progress');
    return res.data;
  },

  syncProgress: async (bookId: string, currentCfi: string, percentage: number): Promise<ReadingProgress> => {
    const res = await api.post<ReadingProgress>('/library/progress', {
      book_id: bookId,
      current_cfi: currentCfi,
      percentage,
    });
    return res.data;
  },
};

export const AIService = {
  chat: async (bookId: string | undefined, messages: { role: string; content: string }[]) => {
    const res = await api.post('/ai/chat', {
      book_id: bookId,
      messages,
    });
    return res.data;
  },
};

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  is_active?: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export interface SendOtpResponse {
  status: string;
  message: string;
  expires_in_seconds: number;
  demo_code?: string;
}

export const AuthService = {
  sendOtp: async (email: string): Promise<SendOtpResponse> => {
    const res = await api.post<SendOtpResponse>('/auth/otp/send', { email });
    return res.data;
  },

  verifyOtp: async (email: string, code: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/otp/verify', { email, code });
    return res.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },

  register: async (email: string, password: string, fullName?: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    return res.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await api.get<AuthUser>('/auth/me');
    return res.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return res.data;
  },

  requestPasswordReset: async (email: string): Promise<SendOtpResponse> => {
    const res = await api.post<SendOtpResponse>('/auth/password-reset/request', { email });
    return res.data;
  },

  confirmPasswordReset: async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/password-reset/confirm', {
      email,
      code,
      new_password: newPassword,
    });
    return res.data;
  },

  updateProfile: async (data: {
    full_name?: string;
    current_password?: string;
    new_password?: string;
  }): Promise<AuthUser> => {
    const res = await api.patch<AuthUser>('/auth/me', data);
    return res.data;
  },
};
