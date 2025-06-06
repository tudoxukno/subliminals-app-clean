import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import revenueCatService, { SubscriptionInfo, PurchasePackage } from '../services/revenueCat';
import { getEnvironmentInfo, logEnvironmentInfo } from '../utils/environmentDetection';

interface SubscriptionContextType {
  subscriptionInfo: SubscriptionInfo;
  isLoading: boolean;
  availablePackages: PurchasePackage[];
  
  // Subscription actions
  refreshSubscriptionInfo: () => Promise<void>;
  purchasePackage: (packageToPurchase: PurchasePackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  
  // Computed properties
  isPremiumUser: boolean;
  isSubscriptionLoaded: boolean;
  
  // Mock methods for testing (only available in Expo Go)
  setMockSubscriptionState?: (state: Partial<SubscriptionInfo>) => void;
  resetMockSubscription?: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    isActive: false,
    tier: 'free',
    willRenew: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [availablePackages, setAvailablePackages] = useState<PurchasePackage[]>([]);
  
  const env = getEnvironmentInfo();

  // Initialize RevenueCat and load subscription info
  useEffect(() => {
    const initializeSubscriptions = async () => {
      try {
        setIsLoading(true);
        
        // Initialize RevenueCat service
        await revenueCatService.initialize();
        
        // Load subscription info and packages
        await Promise.all([
          refreshSubscriptionInfo(),
          loadAvailablePackages(),
        ]);
        
        console.log('💰 Subscription service initialized');
      } catch (error) {
        console.error('💰 Subscription initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSubscriptions();
  }, []);

  const refreshSubscriptionInfo = async (): Promise<void> => {
    try {
      const info = await revenueCatService.getSubscriptionInfo();
      setSubscriptionInfo(info);
      console.log('💰 Subscription info refreshed:', info);
    } catch (error) {
      console.error('💰 Failed to refresh subscription info:', error);
    }
  };

  const loadAvailablePackages = async (): Promise<void> => {
    try {
      const packages = await revenueCatService.getAvailablePackages();
      setAvailablePackages(packages);
      console.log('💰 Available packages loaded:', packages.length);
    } catch (error) {
      console.error('💰 Failed to load packages:', error);
    }
  };

  const purchasePackage = async (packageToPurchase: PurchasePackage): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await revenueCatService.purchasePackage(packageToPurchase);
      
      if (success) {
        // Refresh subscription info after successful purchase
        await refreshSubscriptionInfo();
        console.log('💰 Purchase completed successfully');
      }
      
      return success;
    } catch (error) {
      console.error('💰 Purchase failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await revenueCatService.restorePurchases();
      
      if (success) {
        // Refresh subscription info after restore
        await refreshSubscriptionInfo();
        console.log('💰 Purchases restored successfully');
      }
      
      return success;
    } catch (error) {
      console.error('💰 Restore purchases failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock methods for testing in Expo Go
  const setMockSubscriptionState = env.isExpoGo ? (state: Partial<SubscriptionInfo>) => {
    revenueCatService.setMockSubscriptionState(state);
    setSubscriptionInfo(prev => ({ ...prev, ...state }));
  } : undefined;

  const resetMockSubscription = env.isExpoGo ? () => {
    revenueCatService.resetMockSubscription();
    setSubscriptionInfo({
      isActive: false,
      tier: 'free',
      willRenew: false,
    });
  } : undefined;

  const value: SubscriptionContextType = {
    subscriptionInfo,
    isLoading,
    availablePackages,
    refreshSubscriptionInfo,
    purchasePackage,
    restorePurchases,
    isPremiumUser: subscriptionInfo.isActive && subscriptionInfo.tier === 'premium',
    isSubscriptionLoaded: !isLoading,
    setMockSubscriptionState,
    resetMockSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext; 