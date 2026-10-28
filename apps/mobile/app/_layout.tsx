import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/useAuthStore';
import { useLibraryStore } from '../src/store/useLibraryStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  const loadAuth = useAuthStore((s) => s.loadAuthFromStorage);
  const loadPreferences = useLibraryStore((s) => s.loadLibraryPreferences);

  useEffect(() => {
    loadAuth();
    loadPreferences();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F172A' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="book/[id]"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="reader/[bookId]"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
