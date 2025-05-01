import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ExpoRoot } from 'expo-router';
import { getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Export the app component for registerRootComponent
export default function App() {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    // Ensure Firebase is initialized
    const checkFirebase = async () => {
      try {
        // Verify Firebase app is initialized
        const app = getApps().length > 0 ? getApp() : null;
        if (!app) {
          console.error("Firebase app not initialized");
          return;
        }

        // Verify auth is initialized
        const auth = getAuth(app);
        if (!auth) {
          console.error("Firebase auth not initialized");
          return;
        }

        // Everything is ready
        setIsFirebaseReady(true);
      } catch (error) {
        console.error("Firebase initialization error:", error);
      }
    };

    checkFirebase();
  }, []);

  if (!isFirebaseReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <ExpoRoot context={require.context('./app')} />
      </ThemeProvider>
    </AuthProvider>
  );
} 