import { getEnvironmentInfo } from '../utils/environmentDetection';

// Types for subscription management
export interface SubscriptionInfo {
  isActive: boolean;
  tier: 'free' | 'premium';
  willRenew: boolean;
  expirationDate?: string;
  originalPurchaseDate?: string;
}

export interface PurchasePackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: string;
    priceString: string;
    currencyCode: string;
  };
}

// RevenueCat service class
class RevenueCatService {
  private isInitialized = false;
  private mockSubscriptionState: SubscriptionInfo = {
    isActive: false,
    tier: 'free',
    willRenew: false,
  };

  async initialize(): Promise<void> {
    const env = getEnvironmentInfo();
    
    if (!env.canUseRevenueCat) {
      console.log('💰 RevenueCat disabled - using mock subscription service');
      this.isInitialized = true;
      return;
    }

    try {
      // Dynamic import for RevenueCat - only loads in development builds
      const PurchasesModule = require('react-native-purchases');
      const Purchases = PurchasesModule.default || PurchasesModule;
      
      // TODO: Replace with your actual RevenueCat API key
      const apiKey = env.platform === 'ios' 
        ? 'YOUR_IOS_API_KEY_HERE' 
        : 'YOUR_ANDROID_API_KEY_HERE';
      
      await Purchases.configure({ apiKey });
      console.log('💰 RevenueCat initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('💰 RevenueCat initialization failed:', error);
      this.isInitialized = false;
    }
  }

  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    const env = getEnvironmentInfo();
    
    if (!env.canUseRevenueCat) {
      console.log('💰 Mock subscription state:', this.mockSubscriptionState);
      return this.mockSubscriptionState;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const PurchasesModule = require('react-native-purchases');
      const Purchases = PurchasesModule.default || PurchasesModule;
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Check for active subscription
      const isActive = Object.keys(customerInfo.activeSubscriptions).length > 0;
      const tier = isActive ? 'premium' : 'free';
      
      // Get the latest subscription info
      let expirationDate: string | undefined;
      let originalPurchaseDate: string | undefined;
      let willRenew = false;
      
      if (isActive) {
        const entitlements = customerInfo.entitlements.active;
        const premiumEntitlement = entitlements['premium']; // Replace with your entitlement identifier
        
        if (premiumEntitlement) {
          expirationDate = premiumEntitlement.expirationDate;
          originalPurchaseDate = premiumEntitlement.originalPurchaseDate;
          willRenew = premiumEntitlement.willRenew;
        }
      }

      return {
        isActive,
        tier,
        willRenew,
        expirationDate,
        originalPurchaseDate,
      };
    } catch (error) {
      console.error('💰 Error fetching subscription info:', error);
      return this.mockSubscriptionState;
    }
  }

  async getAvailablePackages(): Promise<PurchasePackage[]> {
    const env = getEnvironmentInfo();
    
    if (!env.canUseRevenueCat) {
      // Return mock packages for Expo Go
      return [
        {
          identifier: 'premium_monthly',
          packageType: 'monthly',
          product: {
            identifier: 'premium_monthly',
            description: 'Premium subscription with unlimited access',
            title: 'Premium Monthly',
            price: '4.99',
            priceString: '$4.99',
            currencyCode: 'USD',
          },
        },
        {
          identifier: 'premium_yearly',
          packageType: 'annual',
          product: {
            identifier: 'premium_yearly',
            description: 'Premium subscription with unlimited access (yearly)',
            title: 'Premium Yearly',
            price: '39.99',
            priceString: '$39.99',
            currencyCode: 'USD',
          },
        },
      ];
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const PurchasesModule = require('react-native-purchases');
      const Purchases = PurchasesModule.default || PurchasesModule;
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current) {
        return offerings.current.availablePackages.map((pkg: any) => ({
          identifier: pkg.identifier,
          packageType: pkg.packageType,
          product: {
            identifier: pkg.product.identifier,
            description: pkg.product.description,
            title: pkg.product.title,
            price: pkg.product.price.toString(),
            priceString: pkg.product.priceString,
            currencyCode: pkg.product.currencyCode,
          },
        }));
      }
      
      return [];
    } catch (error) {
      console.error('💰 Error fetching packages:', error);
      return [];
    }
  }

  async purchasePackage(packageToPurchase: PurchasePackage): Promise<boolean> {
    const env = getEnvironmentInfo();
    
    if (!env.canUseRevenueCat) {
      // Simulate successful purchase in Expo Go
      console.log('💰 Mock purchase successful:', packageToPurchase.identifier);
      this.mockSubscriptionState = {
        isActive: true,
        tier: 'premium',
        willRenew: true,
        originalPurchaseDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };
      return true;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const PurchasesModule = require('react-native-purchases');
      const Purchases = PurchasesModule.default || PurchasesModule;
      const purchaseResult = await Purchases.purchasePackage(packageToPurchase);
      
      console.log('💰 Purchase successful:', purchaseResult);
      return true;
    } catch (error) {
      console.error('💰 Purchase failed:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    const env = getEnvironmentInfo();
    
    if (!env.canUseRevenueCat) {
      console.log('💰 Mock restore purchases');
      return true;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const PurchasesModule = require('react-native-purchases');
      const Purchases = PurchasesModule.default || PurchasesModule;
      await Purchases.restorePurchases();
      console.log('💰 Purchases restored successfully');
      return true;
    } catch (error) {
      console.error('💰 Restore purchases failed:', error);
      return false;
    }
  }

  // Mock methods for testing in Expo Go
  setMockSubscriptionState(state: Partial<SubscriptionInfo>): void {
    this.mockSubscriptionState = { ...this.mockSubscriptionState, ...state };
    console.log('💰 Mock subscription state updated:', this.mockSubscriptionState);
  }

  resetMockSubscription(): void {
    this.mockSubscriptionState = {
      isActive: false,
      tier: 'free',
      willRenew: false,
    };
    console.log('💰 Mock subscription reset to free');
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();
export default revenueCatService; 