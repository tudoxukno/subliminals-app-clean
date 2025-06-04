import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_PERSISTENCE_KEY = '@subliminals_auth_persistence';
const LAST_SIGN_IN_KEY = '@subliminals_last_signin';

export interface AuthPersistenceData {
  rememberMe: boolean;
  lastSignInDate: string;
  userEmail?: string;
}

export const authPersistence = {
  // Save authentication preferences
  async saveAuthPreferences(data: AuthPersistenceData): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_PERSISTENCE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving auth preferences:', error);
    }
  },

  // Get authentication preferences
  async getAuthPreferences(): Promise<AuthPersistenceData | null> {
    try {
      const data = await AsyncStorage.getItem(AUTH_PERSISTENCE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting auth preferences:', error);
      return null;
    }
  },

  // Update last sign-in timestamp
  async updateLastSignIn(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SIGN_IN_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error updating last sign-in:', error);
    }
  },

  // Check if session should be considered valid
  async isSessionValid(): Promise<boolean> {
    try {
      const preferences = await this.getAuthPreferences();
      if (!preferences?.rememberMe) return false;

      const lastSignIn = await AsyncStorage.getItem(LAST_SIGN_IN_KEY);
      if (!lastSignIn) return false;

      const lastSignInDate = new Date(lastSignIn);
      const now = new Date();
      const daysSinceLastSignIn = (now.getTime() - lastSignInDate.getTime()) / (1000 * 60 * 60 * 24);

      // Consider session valid for 30 days if "remember me" is enabled
      return daysSinceLastSignIn < 30;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  },

  // Clear authentication data
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([AUTH_PERSISTENCE_KEY, LAST_SIGN_IN_KEY]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  // Get session info for display
  async getSessionInfo(): Promise<{
    isRemembered: boolean;
    lastSignIn?: string;
    daysUntilExpiry?: number;
  }> {
    try {
      const preferences = await this.getAuthPreferences();
      const lastSignIn = await AsyncStorage.getItem(LAST_SIGN_IN_KEY);

      if (!preferences?.rememberMe || !lastSignIn) {
        return { isRemembered: false };
      }

      const lastSignInDate = new Date(lastSignIn);
      const now = new Date();
      const daysSinceLastSignIn = (now.getTime() - lastSignInDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysUntilExpiry = Math.max(0, 30 - daysSinceLastSignIn);

      return {
        isRemembered: true,
        lastSignIn: lastSignInDate.toLocaleDateString(),
        daysUntilExpiry: Math.floor(daysUntilExpiry),
      };
    } catch (error) {
      console.error('Error getting session info:', error);
      return { isRemembered: false };
    }
  },
}; 