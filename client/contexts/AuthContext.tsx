import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  User,
  updateProfile,
  AuthError,
  AuthErrorCodes,
} from 'firebase/auth';
import { auth } from '../constants/Firebase';

// Auth context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  error: string | null;
  clearError: () => void;
};

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  logOut: async () => {},
  resetPassword: async () => {},
  sendVerificationEmail: async () => {},
  error: null,
  clearError: () => {},
});

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (error: any): string => {
  const errorCode = error?.code;
  switch (errorCode) {
    case AuthErrorCodes.EMAIL_EXISTS:
      return 'This email is already in use. Please use a different email or login instead.';
    case AuthErrorCodes.INVALID_EMAIL:
      return 'The email address is not valid. Please check and try again.';
    case AuthErrorCodes.WEAK_PASSWORD:
      return 'Password is too weak. Please use at least 6 characters.';
    case AuthErrorCodes.USER_DELETED:
      return 'No account exists with this email. Please sign up.';
    case AuthErrorCodes.INVALID_PASSWORD:
      return 'Incorrect password. Please try again or reset your password.';
    case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
      return 'Too many failed attempts. Please try again later or reset your password.';
    case AuthErrorCodes.USER_DISABLED:
      return 'This account has been disabled. Please contact support.';
    case AuthErrorCodes.OPERATION_NOT_ALLOWED:
      return 'Operation not allowed. Please contact support.';
    default:
      return error?.message || 'An unknown error occurred. Please try again.';
  }
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = () => setError(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        
        // Send email verification
        await sendEmailVerification(userCredential.user);
      }
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sign out
  const logOut = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Send verification email
  const sendVerificationEmail = async () => {
    try {
      setError(null);
      if (user) {
        await sendEmailVerification(user);
      } else {
        throw new Error('No user is signed in');
      }
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signUp, 
      signIn, 
      logOut, 
      resetPassword, 
      sendVerificationEmail, 
      error, 
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth
export const useAuth = () => useContext(AuthContext); 