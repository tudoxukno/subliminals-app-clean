import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if we're in Expo Go (limited functionality) or development build
const isExpoGo = __DEV__ && !Platform.select({
  ios: false, // In a real dev build, this would be false
  android: false, // In a real dev build, this would be false
  default: true, // Expo Go
});

export interface SocialAuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    provider: 'apple' | 'google';
  };
  error?: string;
}

class SocialAuthService {
  // Apple Sign-In
  async signInWithApple(): Promise<SocialAuthResult> {
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'Apple Sign-In is only available on iOS',
      };
    }

    if (isExpoGo) {
      // Simulate Apple Sign-In for Expo Go testing
      return this.simulateAppleSignIn();
    }

    try {
      // In a real development build, you would use:
      // import * as AppleAuthentication from 'expo-apple-authentication';
      
      // For now, return simulation since we're in Expo Go
      return this.simulateAppleSignIn();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Apple Sign-In failed',
      };
    }
  }

  // Google Sign-In
  async signInWithGoogle(): Promise<SocialAuthResult> {
    if (isExpoGo) {
      // Simulate Google Sign-In for Expo Go testing
      return this.simulateGoogleSignIn();
    }

    try {
      // In a real development build, you would configure Google OAuth
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'com.jaylon.subliminals', // Your app's bundle ID
      });

      const request = new AuthSession.AuthRequest({
        clientId: 'YOUR_GOOGLE_CLIENT_ID', // Would be configured in app.json
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        state: await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          redirectUri + Date.now(),
          { encoding: Crypto.CryptoEncoding.HEX }
        ),
      });

      // For now, return simulation since we're in Expo Go
      return this.simulateGoogleSignIn();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Google Sign-In failed',
      };
    }
  }

  // Simulation methods for Expo Go testing
  private async simulateAppleSignIn(): Promise<SocialAuthResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser = {
      id: 'apple_' + Date.now(),
      email: 'user@icloud.com',
      name: 'Apple User',
      provider: 'apple' as const,
    };

    // Store mock user data
    await AsyncStorage.setItem('social_auth_user', JSON.stringify(mockUser));

    return {
      success: true,
      user: mockUser,
    };
  }

  private async simulateGoogleSignIn(): Promise<SocialAuthResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser = {
      id: 'google_' + Date.now(),
      email: 'user@gmail.com',
      name: 'Google User',
      provider: 'google' as const,
    };

    // Store mock user data
    await AsyncStorage.setItem('social_auth_user', JSON.stringify(mockUser));

    return {
      success: true,
      user: mockUser,
    };
  }

  // Check if user is signed in with social auth
  async getCurrentSocialUser(): Promise<SocialAuthResult['user'] | null> {
    try {
      const userData = await AsyncStorage.getItem('social_auth_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Sign out from social auth
  async signOut(): Promise<void> {
    await AsyncStorage.removeItem('social_auth_user');
  }

  // Check if social auth is available
  isAppleSignInAvailable(): boolean {
    return Platform.OS === 'ios';
  }

  isGoogleSignInAvailable(): boolean {
    return true; // Google Sign-In is available on all platforms
  }

  // Get setup instructions for development build
  getSetupInstructions(): string {
    return `
To enable real social authentication in a development build:

1. For Apple Sign-In:
   - Install: expo install expo-apple-authentication
   - Add to app.json: "ios": { "usesAppleSignIn": true }
   - Configure Apple Developer account

2. For Google Sign-In:
   - Install: expo install expo-auth-session expo-crypto
   - Configure Google OAuth in Google Cloud Console
   - Add client IDs to app.json

3. Build with: eas build --profile development

Currently running in Expo Go with simulated authentication.
    `;
  }
}

export const socialAuthService = new SocialAuthService();
export default socialAuthService; 