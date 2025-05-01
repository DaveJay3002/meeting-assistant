import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Linking,
  Switch
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

// Menu items
const MENU_ITEMS = [
  {
    id: 'about',
    title: 'About Us',
    icon: 'info',
    screen: '/about',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: 'privacy-tip',
    screen: '/privacy',
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    icon: 'description',
    screen: '/terms',
  },
  {
    id: 'contact',
    title: 'Contact Us',
    icon: 'mail',
    action: () => Linking.openURL('mailto:support@memoapp.com'),
  },
  {
    id: 'website',
    title: 'Visit Website',
    icon: 'language',
    action: () => Linking.openURL('https://memoapp.com'),
  },
];

type MenuProps = {
  visible: boolean;
  onClose: () => void;
};

export default function Menu({ visible, onClose }: MenuProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logOut } = useAuth();
  
  if (!visible) return null;
  
  const handleItemPress = (item: typeof MENU_ITEMS[0]) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Close menu
    onClose();
    
    // Handle action or navigation
    if (item.action) {
      item.action();
    } else if (item.screen) {
      router.push(item.screen);
    }
  };
  
  const handleLogout = async () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Close menu
    onClose();
    
    try {
      await logOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.overlay, { pointerEvents: 'auto' }]} 
        onPress={onClose} 
      />
      
      <View style={[styles.menu, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Menu</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        
        {user && (
          <View style={[styles.userSection, { borderBottomColor: theme.border }]}>
            <View style={[styles.userAvatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.userInitial}>
                {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {user.displayName || 'User'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.text }]}>
                {user.email}
              </Text>
            </View>
          </View>
        )}
        
        <ScrollView style={styles.menuItems}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleItemPress(item)}
            >
              <MaterialIcons name={item.icon as any} size={22} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
          
          <View style={[styles.themeToggle, { borderTopColor: theme.border }]}>
            <View style={styles.themeToggleRow}>
              <MaterialIcons 
                name={isDark ? 'dark-mode' : 'light-mode'} 
                size={22} 
                color={theme.text} 
              />
              <Text style={[styles.themeToggleText, { color: theme.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="white"
            />
          </View>
        </ScrollView>
        
        {user && (
          <TouchableOpacity 
            style={[styles.logoutButton, { borderTopColor: theme.border }]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={22} color={theme.error} />
            <Text style={[styles.logoutText, { color: theme.error }]}>
              Log Out
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 320,
    elevation: 5,
    boxShadow: '2px 0px 4px rgba(0, 0, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleText: {
    fontSize: 16,
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: 'bold',
  },
}); 