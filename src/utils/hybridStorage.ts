import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedSubliminal } from '../types/subliminal';
import firebaseService from '../services/firebase';

// TEMPORARY: Disable Firebase for testing
const FIREBASE_ENABLED = false;

const SAVED_SUBLIMINALS_KEY = '@subliminals:saved';
const MIGRATION_STATUS_KEY = '@subliminals:migrated';

export class HybridStorageService {
  private isFirebaseAvailable = false;

  constructor() {
    // Check if Firebase is available and user is authenticated
    this.checkFirebaseAvailability();
  }

  private checkFirebaseAvailability(): void {
    if (!FIREBASE_ENABLED) {
      this.isFirebaseAvailable = false;
      return;
    }
    
    try {
      const user = firebaseService.getCurrentUser();
      this.isFirebaseAvailable = user !== null;
    } catch (error) {
      console.log('Firebase not available, using local storage only');
      this.isFirebaseAvailable = false;
    }
  }

  // Save subliminal - tries Firebase first, falls back to AsyncStorage
  async saveSubliminal(subliminal: Omit<SavedSubliminal, 'id' | 'dateSaved'>): Promise<SavedSubliminal> {
    this.checkFirebaseAvailability();

    if (this.isFirebaseAvailable) {
      try {
        const firebaseId = await firebaseService.saveSubliminal(subliminal);
        return {
          ...subliminal,
          id: firebaseId,
          dateSaved: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Firebase save failed, falling back to local storage:', error);
        // Fall through to AsyncStorage
      }
    }

    // AsyncStorage fallback
    return this.saveToAsyncStorage(subliminal);
  }

  // Get saved subliminals - tries Firebase first, falls back to AsyncStorage
  async getSavedSubliminals(): Promise<SavedSubliminal[]> {
    this.checkFirebaseAvailability();

    if (this.isFirebaseAvailable) {
      try {
        const firebaseSubliminals = await firebaseService.getSavedSubliminals();
        
        // Check if we need to migrate local data
        await this.migrateLocalDataIfNeeded();
        
        return firebaseSubliminals;
      } catch (error) {
        console.error('Firebase get failed, falling back to local storage:', error);
        // Fall through to AsyncStorage
      }
    }

    // AsyncStorage fallback
    return this.getFromAsyncStorage();
  }

  // Remove saved subliminal
  async removeSavedSubliminal(id: string): Promise<void> {
    this.checkFirebaseAvailability();

    if (this.isFirebaseAvailable) {
      try {
        await firebaseService.removeSavedSubliminal(id);
        return;
      } catch (error) {
        console.error('Firebase remove failed, falling back to local storage:', error);
        // Fall through to AsyncStorage
      }
    }

    // AsyncStorage fallback
    return this.removeFromAsyncStorage(id);
  }

  // Check if subliminal is saved
  async isSubliminalSaved(userInput: string, selectedArchetype: string): Promise<boolean> {
    this.checkFirebaseAvailability();

    if (this.isFirebaseAvailable) {
      try {
        return await firebaseService.isSubliminalSaved(userInput, selectedArchetype);
      } catch (error) {
        console.error('Firebase check failed, falling back to local storage:', error);
        // Fall through to AsyncStorage
      }
    }

    // AsyncStorage fallback
    return this.isInAsyncStorage(userInput, selectedArchetype);
  }

  // Clear all saved subliminals
  async clearAllSavedSubliminals(): Promise<void> {
    this.checkFirebaseAvailability();

    if (this.isFirebaseAvailable) {
      try {
        await firebaseService.clearAllSavedSubliminals();
        // Also clear local storage to be safe
        await AsyncStorage.removeItem(SAVED_SUBLIMINALS_KEY);
        return;
      } catch (error) {
        console.error('Firebase clear failed, falling back to local storage:', error);
        // Fall through to AsyncStorage
      }
    }

    // AsyncStorage fallback
    await AsyncStorage.removeItem(SAVED_SUBLIMINALS_KEY);
  }

  // Migration methods
  async migrateLocalDataIfNeeded(): Promise<void> {
    try {
      // Check if migration has already been done for this user
      const migrationStatus = await AsyncStorage.getItem(MIGRATION_STATUS_KEY);
      const currentUser = firebaseService.getCurrentUser();
      
      if (!currentUser || migrationStatus === currentUser.uid) {
        return; // Already migrated for this user
      }

      // Get local data
      const localSubliminals = await this.getFromAsyncStorage();
      
      if (localSubliminals.length > 0) {
        console.log(`Migrating ${localSubliminals.length} local subliminals to Firebase...`);
        
        // Migrate to Firebase
        await firebaseService.migrateSavedSubliminals(localSubliminals);
        
        // Mark as migrated for this user
        await AsyncStorage.setItem(MIGRATION_STATUS_KEY, currentUser.uid);
        
        // Optionally clear local storage after successful migration
        // await AsyncStorage.removeItem(SAVED_SUBLIMINALS_KEY);
        
        console.log('Migration completed successfully');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      // Don't throw - migration failure shouldn't break the app
    }
  }

  // Force migration (for manual triggers)
  async forceMigration(): Promise<void> {
    const currentUser = firebaseService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user for migration');
    }

    const localSubliminals = await this.getFromAsyncStorage();
    
    if (localSubliminals.length > 0) {
      await firebaseService.migrateSavedSubliminals(localSubliminals);
      await AsyncStorage.setItem(MIGRATION_STATUS_KEY, currentUser.uid);
      console.log(`Migrated ${localSubliminals.length} subliminals to Firebase`);
    }
  }

  // Subscribe to real-time updates (Firebase only)
  subscribeSavedSubliminals(callback: (subliminals: SavedSubliminal[]) => void): (() => void) | null {
    this.checkFirebaseAvailability();

    if (this.isFirebaseAvailable) {
      try {
        return firebaseService.subscribeSavedSubliminals(callback);
      } catch (error) {
        console.error('Firebase subscription failed:', error);
      }
    }

    // No real-time updates for AsyncStorage
    return null;
  }

  // AsyncStorage methods (private)
  private async saveToAsyncStorage(subliminal: Omit<SavedSubliminal, 'id' | 'dateSaved'>): Promise<SavedSubliminal> {
    try {
      const existingSaved = await this.getFromAsyncStorage();
      
      const newSubliminal: SavedSubliminal = {
        ...subliminal,
        id: Date.now().toString(),
        dateSaved: new Date().toISOString(),
      };

      const updatedSaved = [newSubliminal, ...existingSaved];
      await AsyncStorage.setItem(SAVED_SUBLIMINALS_KEY, JSON.stringify(updatedSaved));

      return newSubliminal;
    } catch (error) {
      console.error('Error saving to AsyncStorage:', error);
      throw error;
    }
  }

  private async getFromAsyncStorage(): Promise<SavedSubliminal[]> {
    try {
      const saved = await AsyncStorage.getItem(SAVED_SUBLIMINALS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error getting from AsyncStorage:', error);
      return [];
    }
  }

  private async removeFromAsyncStorage(id: string): Promise<void> {
    try {
      const saved = await this.getFromAsyncStorage();
      const updated = saved.filter(s => s.id !== id);
      await AsyncStorage.setItem(SAVED_SUBLIMINALS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing from AsyncStorage:', error);
      throw error;
    }
  }

  private async isInAsyncStorage(userInput: string, selectedArchetype: string): Promise<boolean> {
    try {
      const saved = await this.getFromAsyncStorage();
      return saved.some(s => s.userInput === userInput && s.selectedArchetype === selectedArchetype);
    } catch (error) {
      console.error('Error checking AsyncStorage:', error);
      return false;
    }
  }

  // Utility methods
  async getStorageInfo(): Promise<{
    isFirebaseAvailable: boolean;
    localCount: number;
    firebaseCount: number;
    isMigrated: boolean;
  }> {
    const localSubliminals = await this.getFromAsyncStorage();
    let firebaseCount = 0;
    let isMigrated = false;

    if (this.isFirebaseAvailable) {
      try {
        const firebaseSubliminals = await firebaseService.getSavedSubliminals();
        firebaseCount = firebaseSubliminals.length;
        
        const currentUser = firebaseService.getCurrentUser();
        const migrationStatus = await AsyncStorage.getItem(MIGRATION_STATUS_KEY);
        isMigrated = currentUser ? migrationStatus === currentUser.uid : false;
      } catch (error) {
        console.error('Error getting Firebase info:', error);
      }
    }

    return {
      isFirebaseAvailable: this.isFirebaseAvailable,
      localCount: localSubliminals.length,
      firebaseCount,
      isMigrated,
    };
  }
}

// Export singleton instance
export const hybridStorage = new HybridStorageService();
export default hybridStorage; 