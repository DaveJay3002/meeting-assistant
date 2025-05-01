import { Tabs } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { Platform, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Menu from '@/components/Menu';

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Memoize the header to prevent re-renders
  const renderHeader = useCallback(() => {
    return (
      <Appbar.Header
        style={{ 
          backgroundColor: theme.background, 
          elevation: 0, 
          borderBottomWidth: 0,
          height: 60,
        }}
      >
        <Appbar.Action 
          icon="menu" 
          color={theme.text} 
          onPress={toggleMenu}
          style={{ marginLeft: 4 }}
        />
        <Appbar.Content 
          title="Memo"
          titleStyle={{ 
            color: theme.primary, 
            fontWeight: 'bold', 
            fontSize: 24,
            textAlign: 'center',
            alignSelf: 'center',
          }}
        />
        <Appbar.Action 
          icon="account-circle"
          color={theme.text} 
          onPress={toggleMenu}
          style={{ marginRight: 4 }}
        />
      </Appbar.Header>
    );
  }, [theme, toggleMenu]);

  return (
    <>
      <Menu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          headerShown: true,
          header: renderHeader,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {
              backgroundColor: theme.background,
            },
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <MaterialIcons name="home" size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color }) => <MaterialIcons name="collections-bookmark" size={28} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
