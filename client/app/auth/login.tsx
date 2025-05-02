import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { signIn, resetPassword, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Clear previous errors when auth context error changes
  useEffect(() => {
    if (error) {
      setGeneralError(error);
      clearError();
    }
  }, [error, clearError]);
  
  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };
  
  // Password validation
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };
  
  const handleLogin = async () => {
    // Clear previous errors
    setGeneralError('');
    
    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Starting login process...');
      await signIn(email, password);
      console.log('Login successful!');
      router.replace('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setGeneralError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignUp = () => {
    router.push('/auth/signup');
  };
  
  const handleForgotPassword = () => {
    setResetEmail(email);
    setResetError('');
    setResetSuccess(false);
    setShowResetModal(true);
  };
  
  const handleResetPassword = async () => {
    if (!validateEmail(resetEmail)) {
      setResetError('Please enter a valid email address');
      return;
    }
    
    setResetLoading(true);
    
    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
      setResetError('');
    } catch (error: any) {
      setResetError(error.message);
      setResetSuccess(false);
    } finally {
      setResetLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <ScrollView 
        contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: theme.primary }]}>memo</Text>
          <Text style={[styles.tagline, { color: theme.text }]}>
            Record. Transcribe. Chat.
          </Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Log In</Text>
          
          {generalError ? (
            <View style={[styles.errorContainer, { backgroundColor: 'rgba(255, 0, 0, 0.1)' }]}>
              <MaterialIcons name="error-outline" size={20} color="red" />
              <Text style={[styles.errorText, { color: 'red' }]}>{generalError}</Text>
            </View>
          ) : null}
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={theme.text} style={styles.inputIcon} />
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: theme.card, color: theme.text },
                emailError ? styles.inputError : null
              ]}
              placeholder="Email"
              placeholderTextColor={theme.border}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                validateEmail(text);
              }}
              onBlur={() => validateEmail(email)}
            />
          </View>
          {emailError ? (
            <Text style={styles.errorMessage}>{emailError}</Text>
          ) : null}
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color={theme.text} style={styles.inputIcon} />
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: theme.card, color: theme.text },
                passwordError ? styles.inputError : null
              ]}
              placeholder="Password"
              placeholderTextColor={theme.border}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                validatePassword(text);
              }}
              onBlur={() => validatePassword(password)}
            />
            <TouchableOpacity 
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons 
                name={showPassword ? 'visibility-off' : 'visibility'} 
                size={20} 
                color={theme.text} 
              />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <Text style={styles.errorMessage}>{passwordError}</Text>
          ) : null}
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.text }]}>
            Don't have an account? 
          </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={[styles.signUpText, { color: theme.primary }]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Password Reset Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Reset Password</Text>
              <TouchableOpacity onPress={() => setShowResetModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            {resetSuccess ? (
              <View style={styles.resetSuccessContainer}>
                <MaterialIcons name="check-circle" size={48} color="green" />
                <Text style={[styles.resetSuccessText, { color: theme.text }]}>
                  Password reset email sent! Please check your inbox and follow the instructions.
                </Text>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: theme.primary, marginTop: 16 }]}
                  onPress={() => setShowResetModal(false)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.modalText, { color: theme.text }]}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>
                
                {resetError ? (
                  <View style={[styles.errorContainer, { backgroundColor: 'rgba(255, 0, 0, 0.1)' }]}>
                    <MaterialIcons name="error-outline" size={20} color="red" />
                    <Text style={[styles.errorText, { color: 'red' }]}>{resetError}</Text>
                  </View>
                ) : null}
                
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color={theme.text} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                    placeholder="Email"
                    placeholderTextColor={theme.border}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                  />
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: theme.border }]}
                    onPress={() => setShowResetModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: theme.primary }]}
                    onPress={handleResetPassword}
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.modalButtonText}>Reset Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 16,
    marginTop: 8,
  },
  formContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 48,
  },
  inputError: {
    borderWidth: 1,
    borderColor: 'red',
  },
  errorMessage: {
    color: 'red',
    fontSize: 12,
    marginLeft: 8,
    marginBottom: 12,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginRight: 4,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalText: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resetSuccessContainer: {
    alignItems: 'center',
    padding: 16,
  },
  resetSuccessText: {
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
}); 