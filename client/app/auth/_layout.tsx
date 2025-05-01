import { useEffect } from 'react';
import { Stack, useSegments, useRouter } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Check if the user is logged in
      if (user) {
        // If they're signed in and trying to access auth screens,
        // redirect them to the home page
        if (segments[0] === 'auth') {
          router.replace('/');
        }
      }
    }
  }, [user, loading, segments]);

  // If loading, we don't want to show anything
  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    />
  );
} 