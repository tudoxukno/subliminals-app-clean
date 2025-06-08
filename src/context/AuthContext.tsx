import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import hybridStorage from '../utils/hybridStorage';
import { getEnvironmentInfo, logEnvironmentInfo } from '../utils/environmentDetection';

// Conditional imports for Firebase
let firebaseService: any = null;

try {
  const firebaseModule = require('../services/firebase');
  firebaseService = firebaseModule.default;
} catch (error) {
  console.log('🔥 Firebase service not available - using mock auth');
}

// Local UserProfile interface (duplicated to avoid import issues)
export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  isAnonymous: boolean;
  createdAt: Date;
  lastActiveAt: Date;
  preferences?: {
    favoriteArchetypes?: string[];
    notificationsEnabled?: boolean;
    theme?: 'dark' | 'light';
  };
}

// Conditional type imports with error handling
let FirebaseAuthTypes: any = null;
const env = getEnvironmentInfo();
if (env.canUseFirebase) {
  try {
    FirebaseAuthTypes = require('@react-native-firebase/auth').FirebaseAuthTypes;
  } catch (error) {
    console.log('🔥 Firebase auth package not found - using mock auth');
    // Firebase package not installed, continue with mock functionality
  }
}

interface AuthContextType {
  user: any; // FirebaseAuthTypes.User when enabled
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAnonymous: boolean;
  isAuthenticated: boolean; // New: determines if user should have access to saved features
  
  // Authentication methods
  signInAnonymously: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  linkAnonymousAccount: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Testing methods
  clearLocalData: () => Promise<void>; // For testing - clears saved subliminals
  
  // Storage info
  getStorageInfo: () => Promise<{
    totalSaved: number;
    storageType: 'local' | 'cloud' | 'hybrid';
    lastSync?: string;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const env = getEnvironmentInfo();

  // Determine authentication status
  // When Firebase is disabled, we start unauthenticated to test the auth UX
  // When Firebase is enabled, we require a non-anonymous user for full features
  const isAuthenticated = env.canUseFirebase ? (user && !user.isAnonymous) : (user !== null);
  const isAnonymous = env.canUseFirebase ? (user?.isAnonymous ?? true) : false;

  useEffect(() => {
    // Log environment info on startup
    logEnvironmentInfo();
    
    if (!env.canUseFirebase) {
      // Start unauthenticated for testing the auth UX
      setUser(null);
      setUserProfile(null);
      setIsLoading(false);
      console.log('🔥 Firebase disabled - starting unauthenticated for testing');
      return;
    }

    // Initialize Firebase auth state listener
    const initializeAuth = async () => {
      try {
        // Auto sign-in anonymously if no user
        const currentUser = firebaseService.getCurrentUser();
        if (!currentUser) {
          await firebaseService.signInAnonymously();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signInAnonymously = async () => {
    if (!env.canUseFirebase) {
      // For local storage, we don't need anonymous sign-in
      return;
    }
    
    try {
      setIsLoading(true);
      await firebaseService.signInAnonymously();
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!env.canUseFirebase) {
      // Simulate successful signup for local storage
      setUser({ uid: 'local-user', email, isAnonymous: false });
      return;
    }
    
    try {
      setIsLoading(true);
      await firebaseService.signUpWithEmail(email, password);
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!env.canUseFirebase) {
      // Simulate successful signin for local storage
      setUser({ uid: 'local-user', email, isAnonymous: false });
      return;
    }
    
    try {
      setIsLoading(true);
      await firebaseService.signInWithEmail(email, password);
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const linkAnonymousAccount = async (email: string, password: string) => {
    if (!env.canUseFirebase) {
      // Simulate successful account linking for local storage
      setUser({ uid: 'local-user', email, isAnonymous: false });
      return;
    }
    
    try {
      setIsLoading(true);
      await firebaseService.linkAnonymousAccount(email, password);
    } catch (error) {
      console.error('Account linking error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    if (!env.canUseFirebase) {
      // For local storage, reset user state and optionally clear saved data
      setUser(null);
      setUserProfile(null);
      console.log('🔥 Signed out - local storage mode');
      return;
    }
    
    try {
      setIsLoading(true);
      await firebaseService.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getStorageInfo = async (): Promise<{
    totalSaved: number;
    storageType: 'local' | 'cloud' | 'hybrid';
    lastSync?: string;
  }> => {
    if (!env.canUseFirebase) {
      const savedSubliminals = await hybridStorage.getSavedSubliminals();
      return {
        totalSaved: savedSubliminals.length,
        storageType: 'local',
      };
    }
    
    // Firebase storage info logic here
    const savedSubliminals = await hybridStorage.getSavedSubliminals();
    return {
      totalSaved: savedSubliminals.length,
      storageType: user?.isAnonymous ? 'local' : 'cloud',
      lastSync: new Date().toISOString(),
    };
  };

  const clearLocalData = async (): Promise<void> => {
    try {
      // Clear all saved subliminals from local storage
      await hybridStorage.clearAllSavedSubliminals();
      console.log('🗑️ Cleared all local saved subliminals for testing');
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    isAnonymous,
    isAuthenticated,
    signInAnonymously,
    signUpWithEmail,
    signInWithEmail,
    linkAnonymousAccount,
    signOut,
    clearLocalData,
    getStorageInfo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 