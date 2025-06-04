import AsyncStorage from '@react-native-async-storage/async-storage';

const USAGE_TRACKING_KEY = '@subliminals:daily_usage';
const SESSION_TRACKING_KEY = '@subliminals:session_state';

export interface DailyUsage {
  date: string; // YYYY-MM-DD format
  count: number;
  resetDate: string; // ISO string for exact reset time
}

export interface SessionState {
  userInput: string;
  viewedArchetype: string | null; // Which archetype was fully viewed this session
  sessionId: string; // Unique session identifier
  startTime: string; // ISO string
}

class UsageTrackingService {
  private sessionState: SessionState | null = null;

  // Get current daily usage count
  async getDailyUsage(): Promise<DailyUsage> {
    try {
      const storedUsage = await AsyncStorage.getItem(USAGE_TRACKING_KEY);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (storedUsage) {
        const usage: DailyUsage = JSON.parse(storedUsage);
        
        // Check if it's a new day
        if (usage.date === today) {
          return usage;
        }
      }
      
      // Create new daily usage for today
      const newUsage: DailyUsage = {
        date: today,
        count: 0,
        resetDate: this.getNextResetTime().toISOString()
      };
      
      await AsyncStorage.setItem(USAGE_TRACKING_KEY, JSON.stringify(newUsage));
      return newUsage;
    } catch (error) {
      console.error('Error getting daily usage:', error);
      // Return default usage on error
      return {
        date: new Date().toISOString().split('T')[0],
        count: 0,
        resetDate: this.getNextResetTime().toISOString()
      };
    }
  }

  // Increment usage count (when user starts a new subliminal entry)
  async incrementUsage(): Promise<DailyUsage> {
    try {
      const usage = await this.getDailyUsage();
      const updatedUsage: DailyUsage = {
        ...usage,
        count: usage.count + 1
      };
      
      await AsyncStorage.setItem(USAGE_TRACKING_KEY, JSON.stringify(updatedUsage));
      console.log(`📊 Daily usage incremented to ${updatedUsage.count}`);
      return updatedUsage;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  }

  // Check if user has reached daily limit (freemium only)
  async hasReachedDailyLimit(dailyLimit: number = 3): Promise<boolean> {
    try {
      const usage = await this.getDailyUsage();
      return usage.count >= dailyLimit;
    } catch (error) {
      console.error('Error checking daily limit:', error);
      return false; // Err on the side of allowing usage
    }
  }

  // Get remaining uses for today
  async getRemainingUses(dailyLimit: number = 3): Promise<number> {
    try {
      const usage = await this.getDailyUsage();
      return Math.max(0, dailyLimit - usage.count);
    } catch (error) {
      console.error('Error getting remaining uses:', error);
      return dailyLimit; // Err on the side of allowing usage
    }
  }

  // Session Management
  // Start new session (when user enters text and goes to archetype selection)
  async startSession(userInput: string): Promise<SessionState> {
    const sessionState: SessionState = {
      userInput,
      viewedArchetype: null,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date().toISOString()
    };
    
    this.sessionState = sessionState;
    await AsyncStorage.setItem(SESSION_TRACKING_KEY, JSON.stringify(sessionState));
    console.log(`🎯 New session started: ${sessionState.sessionId}`);
    return sessionState;
  }

  // Mark archetype as viewed in current session
  async markArchetypeViewed(archetype: string): Promise<void> {
    try {
      if (!this.sessionState) {
        const storedSession = await AsyncStorage.getItem(SESSION_TRACKING_KEY);
        if (storedSession) {
          this.sessionState = JSON.parse(storedSession);
        } else {
          throw new Error('No active session found');
        }
      }

      // Additional null check after potential restoration
      if (this.sessionState) {
        this.sessionState.viewedArchetype = archetype;
        await AsyncStorage.setItem(SESSION_TRACKING_KEY, JSON.stringify(this.sessionState));
        console.log(`👁️ Marked ${archetype} as viewed in session ${this.sessionState.sessionId}`);
      }
    } catch (error) {
      console.error('Error marking archetype as viewed:', error);
    }
  }

  // Check if user can view a specific archetype (freemium gating logic)
  async canViewArchetype(archetype: string, isFreemiumUser: boolean = true): Promise<{
    canView: boolean;
    reason?: 'already_viewed' | 'premium_archetype' | 'not_allowed';
  }> {
    try {
      // Premium users can view everything
      if (!isFreemiumUser) {
        return { canView: true };
      }

      // Check if Best Friend is premium (adjust as needed)
      const premiumArchetypes = ['Best Friend'];
      if (premiumArchetypes.includes(archetype)) {
        return { canView: false, reason: 'premium_archetype' };
      }

      // Get current session
      const currentSession = await this.getCurrentSession();
      if (!currentSession) {
        return { canView: true }; // No session restrictions yet
      }

      // Freemium users can only view one archetype per session
      if (currentSession.viewedArchetype && currentSession.viewedArchetype !== archetype) {
        return { canView: false, reason: 'already_viewed' };
      }

      return { canView: true };
    } catch (error) {
      console.error('Error checking archetype access:', error);
      return { canView: true }; // Err on the side of allowing access
    }
  }

  // Get current session
  async getCurrentSession(): Promise<SessionState | null> {
    try {
      if (this.sessionState) {
        return this.sessionState;
      }

      const storedSession = await AsyncStorage.getItem(SESSION_TRACKING_KEY);
      if (storedSession) {
        this.sessionState = JSON.parse(storedSession);
        return this.sessionState;
      }

      return null;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Clear current session (when user goes back to home or starts new entry)
  async clearSession(): Promise<void> {
    try {
      this.sessionState = null;
      await AsyncStorage.removeItem(SESSION_TRACKING_KEY);
      console.log('🔄 Session cleared');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Get next reset time (midnight of next day)
  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  // Get time until next reset
  async getTimeUntilReset(): Promise<{
    hours: number;
    minutes: number;
    totalMinutes: number;
  }> {
    try {
      const usage = await this.getDailyUsage();
      const resetTime = new Date(usage.resetDate);
      const now = new Date();
      const timeDiff = resetTime.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        return { hours: 0, minutes: 0, totalMinutes: 0 };
      }

      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const totalMinutes = Math.floor(timeDiff / (1000 * 60));

      return { hours, minutes, totalMinutes };
    } catch (error) {
      console.error('Error calculating time until reset:', error);
      return { hours: 0, minutes: 0, totalMinutes: 0 };
    }
  }

  // Debug method to reset usage (for testing)
  async resetDailyUsage(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USAGE_TRACKING_KEY);
      console.log('🔄 Daily usage reset for testing');
    } catch (error) {
      console.error('Error resetting daily usage:', error);
    }
  }

  // Debug method to simulate usage (for testing)
  async simulateUsage(count: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const simulatedUsage: DailyUsage = {
        date: today,
        count: count,
        resetDate: this.getNextResetTime().toISOString()
      };
      
      await AsyncStorage.setItem(USAGE_TRACKING_KEY, JSON.stringify(simulatedUsage));
      console.log(`🧪 Simulated ${count} daily uses for testing`);
    } catch (error) {
      console.error('Error simulating usage:', error);
    }
  }
}

export default new UsageTrackingService(); 