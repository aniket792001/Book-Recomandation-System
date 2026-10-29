import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
};

