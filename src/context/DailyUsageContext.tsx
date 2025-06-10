import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import subscriptionService from '../services/subscriptionService';

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
  checkAndShowBannerOnHomeReturn: () => void;
  resetBannerForLimitAttempt: () => void;
  refreshSubscriptionStatus: () => Promise<void>;
  // AI Background tracking
  aiBackgroundUsage: number;
  aiBackgroundLimit: number;
  canGenerateAIBackground: boolean;
  incrementAIBackgroundUsage: () => Promise<void>;
  resetAIBackgroundUsageForTesting: () => Promise<void>;
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
  const [aiBackgroundUsage, setAiBackgroundUsage] = useState(0);
  const [aiBackgroundLimit] = useState(1); // From FREEMIUM_CONFIG
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [lastDismissedLevel, setLastDismissedLevel] = useState<string | null>(null);
  const [shouldShowBannerOnHomeReturn, setShouldShowBannerOnHomeReturn] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{ isActive: boolean; tier: 'free' | 'monthly' | 'annual'; willRenew: boolean }>({ isActive: false, tier: 'free', willRenew: false });
  const [isSubscriptionLoaded, setIsSubscriptionLoaded] = useState(false);
  
  // Get premium status from subscription service
  const isPremiumUser = subscriptionService.hasUnlimitedAccess();

  useEffect(() => {
    const initialize = async () => {
      // Clean up any legacy usage tracking data on app start
      try {
        await AsyncStorage.removeItem('@subliminals:daily_usage');
      } catch (error) {
        console.error('Error cleaning legacy data:', error);
      }
      
      // Load subscription status
      try {
        const subscription = await subscriptionService.getCurrentSubscription();
        setSubscriptionInfo(subscription);
        setIsSubscriptionLoaded(true);
        console.log('📱 Subscription loaded in DailyUsageContext:', subscription);
      } catch (error) {
        console.error('Error loading subscription:', error);
        setIsSubscriptionLoaded(true); // Still mark as loaded to proceed
      }
      
      await loadDailyUsage();
      await loadAIBackgroundUsage();
    };
    
    initialize();
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
        // HARD CAP: Never load usage above the daily limit
        const cappedUsage = Math.min(usageData.count, dailyLimit);
        setDailyUsage(cappedUsage);
        
        if (usageData.count > dailyLimit) {
          console.log('🚨 CORRUPTED DATA DETECTED: Usage was above limit, capped at', dailyLimit);
          // Save the corrected data back to storage
          await saveDailyUsage(cappedUsage);
        }
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
      // HARD CAP: Never save usage above the daily limit
      const cappedCount = Math.min(count, dailyLimit);
      const usageData: DailyUsageData = {
        date: todayKey,
        count: cappedCount,
        entries: [] // Could store entry IDs for more detailed tracking
      };
      
      if (count > dailyLimit) {
        console.log('🚨 SAVE BLOCKED: Attempted to save usage above limit, capped at', dailyLimit);
      }
      
      await AsyncStorage.setItem(`dailyUsage_${todayKey}`, JSON.stringify(usageData));
    } catch (error) {
      console.error('Error saving daily usage:', error);
    }
  };

  const incrementUsage = async (): Promise<void> => {
    console.log('📊 INCREMENT USAGE DEBUG:', {
      currentUsage: dailyUsage,
      dailyLimit: dailyLimit,
      isLimitReached: dailyUsage >= dailyLimit,
      isPremiumUser: isPremiumUser,
      subscriptionInfo: subscriptionInfo,
      willIncrement: !isPremiumUser && subscriptionInfo.tier === 'free' && !subscriptionInfo.isActive && dailyUsage < dailyLimit
    });
    
    // Premium users have unlimited access - don't track usage
    if (isPremiumUser) {
      console.log('📊 PREMIUM USER: Usage tracking skipped for unlimited access');
      return;
    }
    
    // HARD CAP: Never allow usage to exceed the limit
    if (dailyUsage >= dailyLimit) {
      console.log('📊 USAGE INCREMENT BLOCKED: Daily limit already reached or exceeded');
      return;
    }
    
    // Only increment for free users and only if under the daily limit
    if (subscriptionInfo.tier === 'free' && !subscriptionInfo.isActive && dailyUsage < dailyLimit) {
      const newCount = Math.min(dailyUsage + 1, dailyLimit); // Hard cap at dailyLimit
      setDailyUsage(newCount);
      await saveDailyUsage(newCount);
      
      console.log('📊 USAGE INCREMENTED:', {
        oldCount: dailyUsage,
        newCount: newCount,
        limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - newCount)
      });
      
      // Always reset banner dismissal state on new usage increment
      // This ensures the banner shows for each completed entry when returning to home
      setBannerDismissed(false);
      setLastDismissedLevel(null);
      setShouldShowBannerOnHomeReturn(true);
      
      console.log('🎯 BANNER RESET: Banner dismissal state cleared for new usage increment, flagged to show on home return');
    } else if (dailyUsage >= dailyLimit) {
      console.log('📊 USAGE INCREMENT SKIPPED: Daily limit already reached');
    }
  };

  const loadAIBackgroundUsage = async (): Promise<void> => {
    try {
      const todayKey = getTodayKey();
      const usageJson = await AsyncStorage.getItem(`aiBackgroundUsage_${todayKey}`);
      
      if (usageJson) {
        const usageData: DailyUsageData = JSON.parse(usageJson);
        // HARD CAP: Never load usage above the AI background limit
        const cappedUsage = Math.min(usageData.count, aiBackgroundLimit);
        setAiBackgroundUsage(cappedUsage);
        
        if (usageData.count > aiBackgroundLimit) {
          console.log('🚨 CORRUPTED AI BACKGROUND DATA DETECTED: Usage was above limit, capped at', aiBackgroundLimit);
          // Save the corrected data back to storage
          await saveAIBackgroundUsage(cappedUsage);
        }
      } else {
        // New day, reset usage
        setAiBackgroundUsage(0);
      }
    } catch (error) {
      console.error('Error loading AI background usage:', error);
      setAiBackgroundUsage(0);
    }
  };

  const saveAIBackgroundUsage = async (count: number): Promise<void> => {
    try {
      const todayKey = getTodayKey();
      // HARD CAP: Never save usage above the AI background limit
      const cappedCount = Math.min(count, aiBackgroundLimit);
      const usageData: DailyUsageData = {
        date: todayKey,
        count: cappedCount,
        entries: [] // Could store entry IDs for more detailed tracking
      };
      
      if (count > aiBackgroundLimit) {
        console.log('🚨 AI BACKGROUND SAVE BLOCKED: Attempted to save usage above limit, capped at', aiBackgroundLimit);
      }
      
      await AsyncStorage.setItem(`aiBackgroundUsage_${todayKey}`, JSON.stringify(usageData));
    } catch (error) {
      console.error('Error saving AI background usage:', error);
    }
  };

  const incrementAIBackgroundUsage = async (): Promise<void> => {
    console.log('🎨 INCREMENT AI BACKGROUND USAGE DEBUG:', {
      currentUsage: aiBackgroundUsage,
      aiBackgroundLimit: aiBackgroundLimit,
      isLimitReached: aiBackgroundUsage >= aiBackgroundLimit,
      isPremiumUser: isPremiumUser,
      subscriptionInfo: subscriptionInfo,
      willIncrement: !isPremiumUser && subscriptionInfo.tier === 'free' && !subscriptionInfo.isActive && aiBackgroundUsage < aiBackgroundLimit
    });
    
    // Premium users have unlimited AI backgrounds - don't track usage
    if (isPremiumUser) {
      console.log('🎨 PREMIUM USER: AI background usage tracking skipped for unlimited access');
      return;
    }
    
    // HARD CAP: Never allow usage to exceed the limit
    if (aiBackgroundUsage >= aiBackgroundLimit) {
      console.log('🎨 AI BACKGROUND INCREMENT BLOCKED: Daily limit already reached or exceeded');
      return;
    }
    
    // Only increment for free users and only if under the AI background limit
    if (subscriptionInfo.tier === 'free' && !subscriptionInfo.isActive && aiBackgroundUsage < aiBackgroundLimit) {
      const newCount = Math.min(aiBackgroundUsage + 1, aiBackgroundLimit); // Hard cap at aiBackgroundLimit
      setAiBackgroundUsage(newCount);
      await saveAIBackgroundUsage(newCount);
      
      console.log('🎨 AI BACKGROUND USAGE INCREMENTED:', {
        oldCount: aiBackgroundUsage,
        newCount: newCount,
        limit: aiBackgroundLimit,
        remaining: Math.max(0, aiBackgroundLimit - newCount)
      });
    } else if (aiBackgroundUsage >= aiBackgroundLimit) {
      console.log('🎨 AI BACKGROUND INCREMENT SKIPPED: Daily limit already reached');
    }
  };

  const resetAIBackgroundUsageForTesting = async (): Promise<void> => {
    try {
      // Clear today's AI background usage data from AsyncStorage
      const todayKey = getTodayKey();
      await AsyncStorage.removeItem(`aiBackgroundUsage_${todayKey}`);
      
      // Reset state
      setAiBackgroundUsage(0);
      
      console.log('🧪 TESTING RESET: AI background usage cleared and reset to 0/1');
    } catch (error) {
      console.error('Error resetting AI background usage for testing:', error);
    }
  };

  const resetIfNewDay = async (): Promise<void> => {
    await loadDailyUsage();
    await loadAIBackgroundUsage();
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
        autoHideDelay: 7000,
      };
    } else if (remaining === 2) {
      return {
        level: 'low',
        message: `${remaining} entries remaining today`,
        showUpgrade: false,
        autoHideDelay: 7000,
      };
    } else if (remaining === 1) {
      return {
        level: 'medium',
        message: `${remaining} entry remaining today`,
        showUpgrade: true,
        autoHideDelay: 7000,
      };
    } else if (remaining <= 0) {
      // Handle both exactly 0 and negative values (in case of bugs)
      return {
        level: 'high',
        message: 'Daily limit reached. Upgrade for unlimited entries.',
        showUpgrade: true,
        autoHideDelay: 7000, // Changed from null to 7000 for auto-hide
      };
    }
    
    // Default case for other positive remaining values
    return {
      level: 'low',
      message: `${remaining} entries remaining`,
      showUpgrade: false,
      autoHideDelay: 7000,
    };
  };

  const isLimitReached = !isPremiumUser && dailyUsage >= dailyLimit;
  const canGenerate = isPremiumUser || !isLimitReached;
  const canGenerateAIBackground = isPremiumUser || aiBackgroundUsage < aiBackgroundLimit;
  
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
      await AsyncStorage.removeItem(`aiBackgroundUsage_${todayKey}`);
      
      // Also clear any legacy usage tracking data that might interfere
      await AsyncStorage.removeItem('@subliminals:daily_usage');
      
      // Reset all state
      setDailyUsage(0);
      setAiBackgroundUsage(0);
      setBannerDismissed(false);
      setLastDismissedLevel(null);
      
      console.log('🧪 TESTING RESET: Daily usage cleared and reset to 0/3, AI backgrounds reset to 0/1, legacy data cleaned');
    } catch (error) {
      console.error('Error resetting daily usage for testing:', error);
    }
  };

  const checkAndShowBannerOnHomeReturn = (): void => {
    if (shouldShowBannerOnHomeReturn && dailyUsage > 0) {
      console.log('🏠 FORCING BANNER SHOW: User returned to home after new usage increment');
      setBannerDismissed(false);
      setLastDismissedLevel(null);
      setShouldShowBannerOnHomeReturn(false);
    }
  };

  const resetBannerForLimitAttempt = (): void => {
    if (isLimitReached) {
      console.log('🚫 LIMIT ATTEMPT: User tried to access content after hitting daily limit, resetting banner');
      setBannerDismissed(false);
      setLastDismissedLevel(null);
      setShouldShowBannerOnHomeReturn(true);
    }
  };

  const refreshSubscriptionStatus = async (): Promise<void> => {
    try {
      const subscription = await subscriptionService.getCurrentSubscription();
      setSubscriptionInfo(subscription);
      console.log('🔄 Subscription status refreshed:', subscription);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
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
    checkAndShowBannerOnHomeReturn,
    resetBannerForLimitAttempt,
    refreshSubscriptionStatus,
    // AI Background tracking
    aiBackgroundUsage,
    aiBackgroundLimit,
    canGenerateAIBackground,
    incrementAIBackgroundUsage,
    resetAIBackgroundUsageForTesting,
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