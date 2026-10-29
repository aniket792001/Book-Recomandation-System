import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active?: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User, refreshToken?: string) => Promise<void>;
  setTokens: (token: string, refreshToken?: string) => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  loadAuthFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,

  setAuth: async (token: string, user: User, refreshToken?: string) => {
    await AsyncStorage.setItem('access_token', token);
    if (refreshToken) {
      await AsyncStorage.setItem('refresh_token', refreshToken);
    }
    await AsyncStorage.setItem('user_profile', JSON.stringify(user));
    set({
      token,
      refreshToken: refreshToken || get().refreshToken,
      user,
      isAuthenticated: true,
    });
  },

  setTokens: async (token: string, refreshToken?: string) => {
    await AsyncStorage.setItem('access_token', token);
    if (refreshToken) {
      await AsyncStorage.setItem('refresh_token', refreshToken);
    }
    set({
      token,
      refreshToken: refreshToken || get().refreshToken,
      isAuthenticated: true,
    });
  },

  updateUser: async (updated: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const merged = { ...current, ...updated };
    await AsyncStorage.setItem('user_profile', JSON.stringify(merged));
    set({ user: merged });
  },

  logout: async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user_profile');
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  loadAuthFromStorage: async () => {
    try {
      const [token, refreshToken, userStr] = await Promise.all([
        AsyncStorage.getItem('access_token'),
        AsyncStorage.getItem('refresh_token'),
        AsyncStorage.getItem('user_profile'),
      ]);
      if (token && userStr) {
        set({
          token,
          refreshToken,
          user: JSON.parse(userStr),
          isAuthenticated: true,
        });
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
    }
  },
}));
