// TEMPORARY: Disable Firebase for testing
const FIREBASE_ENABLED = false;

// Conditional imports - only import when Firebase is enabled
let auth: any = null;
let firestore: any = null;
let FirebaseAuthTypes: any = null;
let FirebaseFirestoreTypes: any = null;

if (FIREBASE_ENABLED) {
  try {
    auth = require('@react-native-firebase/auth').default;
    firestore = require('@react-native-firebase/firestore').default;
    FirebaseAuthTypes = require('@react-native-firebase/auth').FirebaseAuthTypes;
    FirebaseFirestoreTypes = require('@react-native-firebase/firestore').FirebaseFirestoreTypes;
  } catch (error) {
    console.log('🔥 Firebase packages not found - disabling Firebase functionality');
    // Firebase packages not installed, continue with mock functionality
  }
}

import { SavedSubliminal } from '../types/subliminal';

// Firebase Collections
const COLLECTIONS = {
  USERS: 'users',
  SAVED_SUBLIMINALS: 'savedSubliminals',
  USER_PREFERENCES: 'userPreferences',
} as const;

// User Profile Interface
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

// Firebase Subliminal Interface (extends local SavedSubliminal)
export interface FirebaseSubliminal extends Omit<SavedSubliminal, 'id' | 'dateSaved'> {
  id?: string;
  userId: string;
  dateSaved: any; // FirebaseFirestoreTypes.Timestamp when enabled
  syncedAt?: any; // FirebaseFirestoreTypes.Timestamp when enabled
  deviceId?: string;
}

class FirebaseService {
  private currentUser: any = null;

  constructor() {
    if (!FIREBASE_ENABLED) {
      console.log('🔥 Firebase disabled for testing');
      return;
    }
    
    this.initializeAuth();
  }

  private initializeAuth(): void {
    if (!FIREBASE_ENABLED || !auth) return;
    
    // Listen for auth state changes
    auth().onAuthStateChanged((user: any) => {
      this.currentUser = user;
      if (user) {
        this.updateUserActivity();
      }
    });
  }

  // Authentication Methods
  async signInAnonymously(): Promise<any> {
    if (!FIREBASE_ENABLED || !auth) {
      throw new Error('Firebase not enabled');
    }
    
    try {
      const result = await auth().signInAnonymously();
      if (result.user) {
        await this.createUserProfile(result.user);
        return result.user;
      }
      throw new Error('Failed to sign in anonymously');
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<any> {
    if (!FIREBASE_ENABLED || !auth) {
      throw new Error('Firebase not enabled');
    }
    
    try {
      const result = await auth().createUserWithEmailAndPassword(email, password);
      if (result.user) {
        await this.createUserProfile(result.user);
        return result.user;
      }
      throw new Error('Failed to create account');
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  }

  async signInWithEmail(email: string, password: string): Promise<any> {
    if (!FIREBASE_ENABLED || !auth) {
      throw new Error('Firebase not enabled');
    }
    
    try {
      const result = await auth().signInWithEmailAndPassword(email, password);
      return result.user;
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  }

  async linkAnonymousAccount(email: string, password: string): Promise<any> {
    if (!FIREBASE_ENABLED || !auth) {
      throw new Error('Firebase not enabled');
    }
    
    try {
      if (!this.currentUser || !this.currentUser.isAnonymous) {
        throw new Error('No anonymous user to link');
      }

      const credential = auth.EmailAuthProvider.credential(email, password);
      const result = await this.currentUser.linkWithCredential(credential);
      
      // Update user profile to reflect non-anonymous status
      await this.updateUserProfile({ 
        email,
        isAnonymous: false 
      });

      return result.user;
    } catch (error) {
      console.error('Account linking error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (!FIREBASE_ENABLED || !auth) {
      return;
    }
    
    try {
      await auth().signOut();
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser(): any {
    return this.currentUser;
  }

  // User Profile Methods
  private async createUserProfile(user: any): Promise<void> {
    if (!FIREBASE_ENABLED || !firestore) {
      return;
    }
    
    try {
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || undefined,
        displayName: user.displayName || undefined,
        isAnonymous: user.isAnonymous,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        preferences: {
          notificationsEnabled: true,
          theme: 'dark',
        },
      };

      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .set(userProfile);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!FIREBASE_ENABLED || !firestore) {
      return;
    }
    
    try {
      if (!this.currentUser) throw new Error('No authenticated user');

      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(this.currentUser.uid)
        .update({
          ...updates,
          lastActiveAt: new Date(),
        });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  private async updateUserActivity(): Promise<void> {
    if (!FIREBASE_ENABLED || !firestore) {
      return;
    }
    
    try {
      if (!this.currentUser) return;

      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(this.currentUser.uid)
        .update({
          lastActiveAt: new Date(),
        });
    } catch (error) {
      console.error('Error updating user activity:', error);
      // Don't throw - this is a background operation
    }
  }

  // Saved Subliminals Methods
  async saveSubliminal(subliminal: Omit<SavedSubliminal, 'id' | 'dateSaved'>): Promise<string> {
    if (!FIREBASE_ENABLED || !firestore) {
      throw new Error('Firebase not enabled');
    }
    
    try {
      if (!this.currentUser) throw new Error('No authenticated user');

      const firebaseSubliminal: Omit<FirebaseSubliminal, 'id'> = {
        ...subliminal,
        userId: this.currentUser.uid,
        dateSaved: firestore.Timestamp.now(),
        syncedAt: firestore.Timestamp.now(),
      };

      const docRef = await firestore()
        .collection(COLLECTIONS.SAVED_SUBLIMINALS)
        .add(firebaseSubliminal);

      return docRef.id;
    } catch (error) {
      console.error('Error saving subliminal to Firebase:', error);
      throw error;
    }
  }

  async getSavedSubliminals(): Promise<SavedSubliminal[]> {
    if (!FIREBASE_ENABLED || !firestore) {
      throw new Error('Firebase not enabled');
    }
    
    try {
      if (!this.currentUser) throw new Error('No authenticated user');

      const snapshot = await firestore()
        .collection(COLLECTIONS.SAVED_SUBLIMINALS)
        .where('userId', '==', this.currentUser.uid)
        .orderBy('dateSaved', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => {
        const data = doc.data() as FirebaseSubliminal;
        return {
          id: doc.id,
          userInput: data.userInput,
          selectedArchetype: data.selectedArchetype,
          archetypeData: data.archetypeData,
          dateSaved: data.dateSaved.toDate().toISOString(),
        };
      });
    } catch (error) {
      console.error('Error getting saved subliminals from Firebase:', error);
      throw error;
    }
  }

  async removeSavedSubliminal(subliminalId: string): Promise<void> {
    if (!FIREBASE_ENABLED || !firestore) {
      throw new Error('Firebase not enabled');
    }
    
    try {
      if (!this.currentUser) throw new Error('No authenticated user');

      // Verify ownership before deletion
      const doc = await firestore()
        .collection(COLLECTIONS.SAVED_SUBLIMINALS)
        .doc(subliminalId)
        .get();

      if (!doc.exists) {
        throw new Error('Subliminal not found');
      }

      const data = doc.data() as FirebaseSubliminal;
      if (data.userId !== this.currentUser.uid) {
        throw new Error('Unauthorized to delete this subliminal');
      }

      await firestore()
        .collection(COLLECTIONS.SAVED_SUBLIMINALS)
        .doc(subliminalId)
        .delete();
    } catch (error) {
      console.error('Error removing subliminal from Firebase:', error);
      throw error;
    }
  }

  async clearAllSavedSubliminals(): Promise<void> {
    if (!FIREBASE_ENABLED || !firestore) {
      throw new Error('Firebase not enabled');
    }
    
    try {
      if (!this.currentUser) throw new Error('No authenticated user');

      const snapshot = await firestore()
        .collection(COLLECTIONS.SAVED_SUBLIMINALS)
        .where('userId', '==', this.currentUser.uid)
        .get();

      const batch = firestore().batch();
      snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error clearing all saved subliminals from Firebase:', error);
      throw error;
    }
  }

  async isSubliminalSaved(userInput: string, selectedArchetype: string): Promise<boolean> {
    if (!FIREBASE_ENABLED || !firestore) {
      return false;
    }
    
    try {
      if (!this.currentUser) return false;

      const snapshot = await firestore()
        .collection(COLLECTIONS.SAVED_SUBLIMINALS)
        .where('userId', '==', this.currentUser.uid)
        .where('userInput', '==', userInput)
        .where('selectedArchetype', '==', selectedArchetype)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking if subliminal is saved:', error);
      return false;
    }
  }

  // Migration Methods (for moving from AsyncStorage to Firebase)
  async migrateSavedSubliminals(localSubliminals: SavedSubliminal[]): Promise<void> {
    if (!FIREBASE_ENABLED || !firestore) {
      throw new Error('Firebase not enabled');
    }
    
    try {
      if (!this.currentUser) throw new Error('No authenticated user');

      const batch = firestore().batch();
      
      for (const subliminal of localSubliminals) {
        const firebaseSubliminal: Omit<FirebaseSubliminal, 'id'> = {
          userInput: subliminal.userInput,
          selectedArchetype: subliminal.selectedArchetype,
          archetypeData: subliminal.archetypeData,
          userId: this.currentUser.uid,
          dateSaved: firestore.Timestamp.fromDate(new Date(subliminal.dateSaved)),
          syncedAt: firestore.Timestamp.now(),
        };

        const docRef = firestore()
          .collection(COLLECTIONS.SAVED_SUBLIMINALS)
          .doc();
        
        batch.set(docRef, firebaseSubliminal);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error migrating saved subliminals:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeSavedSubliminals(callback: (subliminals: SavedSubliminal[]) => void): () => void {
    if (!FIREBASE_ENABLED || !firestore) {
      throw new Error('Firebase not enabled');
    }
    
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    return firestore()
      .collection(COLLECTIONS.SAVED_SUBLIMINALS)
      .where('userId', '==', this.currentUser.uid)
      .orderBy('dateSaved', 'desc')
      .onSnapshot(
        (snapshot: any) => {
          const subliminals = snapshot.docs.map((doc: any) => {
            const data = doc.data() as FirebaseSubliminal;
            return {
              id: doc.id,
              userInput: data.userInput,
              selectedArchetype: data.selectedArchetype,
              archetypeData: data.archetypeData,
              dateSaved: data.dateSaved.toDate().toISOString(),
            };
          });
          callback(subliminals);
        },
        (error: any) => {
          console.error('Error in saved subliminals listener:', error);
        }
      );
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService; 