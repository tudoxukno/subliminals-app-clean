import { SavedSubliminal } from '../types/subliminal';
import hybridStorage from './hybridStorage';

// Re-export hybrid storage methods for backward compatibility
export const saveSubliminal = async (subliminal: Omit<SavedSubliminal, 'id' | 'dateSaved'>) => {
  return await hybridStorage.saveSubliminal(subliminal);
};

export const getSavedSubliminals = async (): Promise<SavedSubliminal[]> => {
  return await hybridStorage.getSavedSubliminals();
};

export const removeSavedSubliminal = async (id: string) => {
  return await hybridStorage.removeSavedSubliminal(id);
};

export const isSubliminalSaved = async (userInput: string, selectedArchetype: string): Promise<boolean> => {
  return await hybridStorage.isSubliminalSaved(userInput, selectedArchetype);
};

export const clearAllSavedSubliminals = async () => {
  return await hybridStorage.clearAllSavedSubliminals();
};

// Additional hybrid storage methods
export const getStorageInfo = async () => {
  return await hybridStorage.getStorageInfo();
};

export const forceMigration = async () => {
  return await hybridStorage.forceMigration();
};

export const subscribeSavedSubliminals = (callback: (subliminals: SavedSubliminal[]) => void) => {
  return hybridStorage.subscribeSavedSubliminals(callback);
}; 