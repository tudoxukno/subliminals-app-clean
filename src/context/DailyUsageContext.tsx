import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscription } from './SubscriptionContext';

interface DailyUsageContextType {
  dailyUsage: number;
  dailyLimit: number;
  isLimitReached: boolean;
  canGenerate: boolean;
  incrementUsage: () => Promise<void>;
  resetIfNewDay: () => Promise<void>;
  getDaysUntilReset: () => number;
  showBanner: boolean;
  bannerDismissed: boolean;
  dismissBanner: () => void;
  resetBannerDismissal: () => void;
  getBannerConfig: () => BannerConfig;
  resetDailyUsageForTesting: () => Promise<void>;
}

interface BannerConfig {
  level: 'low' | 'medium' | 'high';
  message: string;
  showUpgrade: boolean;
  autoHideDelay: number | null; // null means no auto-hide
}

interface DailyUsageData {
  date: string;
  count: number;
  entries: string[]; // Store entry IDs or timestamps
}

const DailyUsageContext = createContext<DailyUsageContextType | undefined>(undefined);

export const DailyUsageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dailyUsage, setDailyUsage] = useState(0);
  const [dailyLimit] = useState(3); // From FREEMIUM_CONFIG
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [lastDismissedLevel, setLastDismissedLevel] = useState<string | null>(null);
  
  // Get subscription info from context with error handling
  let subscriptionData;
  try {
    subscriptionData = useSubscription();
  } catch (error) {
    console.error('DailyUsageProvider: SubscriptionProvider not found, using defaults');
    subscriptionData = {
      isPremiumUser: false,
      isSubscriptionLoaded: false,
      subscriptionInfo: { isActive: false, tier: 'free' as const, willRenew: false }
    };
  }
  const { isPremiumUser, isSubscriptionLoaded, subscriptionInfo } = subscriptionData;

  useEffect(() => {
    loadDailyUsage();
  }, []);

  const getTodayKey = (): string => {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const loadDailyUsage = async (): Promise<void> => {
    try {
      const todayKey = getTodayKey();
      const usageJson = await AsyncStorage.getItem(`dailyUsage_${todayKey}`);
      
      if (usageJson) {
        const usageData: DailyUsageData = JSON.parse(usageJson);
        setDailyUsage(usageData.count);
      } else {
        // New day, reset usage
        setDailyUsage(0);
        setBannerDismissed(false);
        setLastDismissedLevel(null);
      }
    } catch (error) {
      console.error('Error loading daily usage:', error);
      setDailyUsage(0);
    }
  };

  const saveDailyUsage = async (count: number): Promise<void> => {
    try {
      const todayKey = getTodayKey();
      const usageData: DailyUsageData = {
        date: todayKey,
        count,
        entries: [] // Could store entry IDs for more detailed tracking
      };
      
      await AsyncStorage.setItem(`dailyUsage_${todayKey}`, JSON.stringify(usageData));
    } catch (error) {
      console.error('Error saving daily usage:', error);
    }
  };

  const incrementUsage = async (): Promise<void> => {
    console.log('📊 INCREMENT USAGE DEBUG:', {
      currentUsage: dailyUsage,
      subscriptionInfo: subscriptionInfo,
      willIncrement: subscriptionInfo.tier === 'free' && !subscriptionInfo.isActive
    });
    
    // Only increment for free users
    if (subscriptionInfo.tier === 'free' && !subscriptionInfo.isActive) {
      const newCount = dailyUsage + 1;
      setDailyUsage(newCount);
      await saveDailyUsage(newCount);
      
      console.log('📊 USAGE INCREMENTED:', {
        oldCount: dailyUsage,
        newCount: newCount,
        limit: dailyLimit,
        remaining: dailyLimit - newCount
      });
      
      // Reset banner dismissal state if moving to a new level
      const currentLevel = getBannerConfig().level;
      if (lastDismissedLevel !== currentLevel) {
        setBannerDismissed(false);
        setLastDismissedLevel(currentLevel);
      }
    }
  };

  const resetIfNewDay = async (): Promise<void> => {
    await loadDailyUsage();
  };

  const getDaysUntilReset = (): number => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilReset = tomorrow.getTime() - now.getTime();
    return Math.ceil(msUntilReset / (1000 * 60 * 60 * 24));
  };

  const dismissBanner = (): void => {
    setBannerDismissed(true);
    setLastDismissedLevel(getBannerConfig().level);
  };

  const getBannerConfig = (): BannerConfig => {
    const remaining = dailyLimit - dailyUsage;
    
    if (dailyUsage === 0) {
      return {
        level: 'low',
        message: `${dailyLimit} free entries available today`,
        showUpgrade: false,
        autoHideDelay: 3000,
      };
    } else if (remaining === 2) {
      return {
        level: 'low',
        message: `${remaining} entries remaining today`,
        showUpgrade: false,
        autoHideDelay: 4000,
      };
    } else if (remaining === 1) {
      return {
        level: 'medium',
        message: `${remaining} entry remaining today`,
        showUpgrade: true,
        autoHideDelay: 6000,
      };
    } else if (remaining === 0) {
      return {
        level: 'high',
        message: 'Daily limit reached. Upgrade for unlimited entries.',
        showUpgrade: true,
        autoHideDelay: null, // No auto-hide
      };
    }
    
    // Default case (shouldn't happen)
    return {
      level: 'low',
      message: `${remaining} entries remaining`,
      showUpgrade: false,
      autoHideDelay: 3000,
    };
  };

  const isLimitReached = dailyUsage >= dailyLimit;
  const canGenerate = !isLimitReached;
  
  // Determine if banner should show
  const showBanner = useMemo(() => {
    console.log('🏷️ BANNER LOGIC CHECK:', {
      isPremiumUser,
      isSubscriptionLoaded,
      dailyUsage,
      bannerDismissed,
      isLimitReached,
      bannerConfig: getBannerConfig()
    });
    
    // Never show banner for premium users
    if (isPremiumUser && isSubscriptionLoaded) {
      console.log('🏷️ HIDING BANNER: Premium user');
      return false;
    }
    
    // Don't show banner if subscription state isn't loaded yet
    if (!isSubscriptionLoaded) {
      console.log('🏷️ HIDING BANNER: Subscription not loaded');
      return false;
    }
    
    // Allow dismissal even when limit is reached - check if banner was dismissed for current level
    if (bannerDismissed && lastDismissedLevel === getBannerConfig().level) {
      console.log('🏷️ HIDING BANNER: Banner dismissed for current level');
      return false;
    }
    
    // Show banner if user has some usage and hasn't dismissed it for current level
    const shouldShow = dailyUsage > 0;
    console.log('🏷️ BANNER DECISION:', { shouldShow, reason: shouldShow ? 'Has usage and not dismissed for level' : 'No usage' });
    return shouldShow;
  }, [isPremiumUser, isSubscriptionLoaded, dailyUsage, bannerDismissed, isLimitReached, lastDismissedLevel]);

  console.log('🏷️ BANNER DEBUG:', {
    isSubscriptionLoaded,
    isPremiumUser,
    dailyUsage,
    bannerDismissed,
    isLimitReached,
    showBanner,
    bannerConfig: getBannerConfig()
  });

  const resetDailyUsageForTesting = async (): Promise<void> => {
    try {
      // Clear today's usage data from AsyncStorage
      const todayKey = getTodayKey();
      await AsyncStorage.removeItem(`dailyUsage_${todayKey}`);
      
      // Reset all state
      setDailyUsage(0);
      setBannerDismissed(false);
      setLastDismissedLevel(null);
      
      console.log('🧪 TESTING RESET: Daily usage cleared and reset to 0/3');
    } catch (error) {
      console.error('Error resetting daily usage for testing:', error);
    }
  };

  const value: DailyUsageContextType = {
    dailyUsage,
    dailyLimit,
    isLimitReached,
    canGenerate,
    incrementUsage,
    resetIfNewDay,
    getDaysUntilReset,
    showBanner,
    bannerDismissed,
    dismissBanner,
    resetBannerDismissal: () => {
      setBannerDismissed(false);
      setLastDismissedLevel(null);
    },
    getBannerConfig,
    resetDailyUsageForTesting,
  };

  return (
    <DailyUsageContext.Provider value={value}>
      {children}
    </DailyUsageContext.Provider>
  );
};

export const useDailyUsage = (): DailyUsageContextType => {
  const context = useContext(DailyUsageContext);
  if (context === undefined) {
    throw new Error('useDailyUsage must be used within a DailyUsageProvider');
  }
  return context;
}; 