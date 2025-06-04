import { Platform, Linking } from 'react-native';

// Mock subscription data for testing in Expo Go
// This will be replaced with RevenueCat integration in production
const MOCK_ENABLED = true; // Set to false when RevenueCat is integrated

// Freemium configuration
export const FREEMIUM_CONFIG = {
  dailyLimit: 3, // Free users get 3 subliminals per day
  premiumArchetypes: ['Best Friend'], // Archetypes requiring premium
  premiumFeatures: [
    'unlimited_daily_subliminals',
    'all_archetypes',
    'archetype_switching',
    'ai_backgrounds',
    'unlimited_saves',
    'premium_models', // GPT-4o instead of GPT-3.5/Gemini
    'cloud_sync',
  ]
};

export interface SubscriptionTier {
  id: string;
  name: string;
  price: string;
  duration: string;
  features: string[];
  isPopular?: boolean;
}

export interface UserSubscription {
  tier: 'free' | 'monthly' | 'annual';
  isActive: boolean;
  renewalDate?: string;
  price?: string;
  originalPurchaseDate?: string;
  willRenew: boolean;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    duration: 'Forever',
    features: [
      '3 subliminals per day',
      '4 basic archetypes',
      'Contextual backgrounds',
      'Local storage only'
    ]
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$4.99',
    duration: 'per month',
    features: [
      'Unlimited subliminals',
      'All 5 archetypes including Best Friend',
      'Switch between archetypes freely',
      'AI-generated backgrounds',
      'Unlimited saves with cloud sync',
      'Premium AI models (GPT-4o)',
      'Priority support'
    ],
    isPopular: true
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$29.99',
    duration: 'per year',
    features: [
      'Everything in Monthly',
      'Save 50% vs monthly',
      'Early access to new features',
      'Priority customer support',
      'Advanced analytics (coming soon)'
    ]
  }
];

class SubscriptionService {
  private currentSubscription: UserSubscription = {
    tier: 'free',
    isActive: false,
    willRenew: false
  };

  // Mock data for testing - replace with RevenueCat calls in production
  async getCurrentSubscription(): Promise<UserSubscription> {
    if (MOCK_ENABLED) {
      // Always return the current subscription state (don't cycle based on time)
      console.log('🔄 Mock subscription state:', this.currentSubscription);
      return this.currentSubscription;
    }

    // TODO: Replace with RevenueCat integration
    // const customerInfo = await Purchases.getCustomerInfo();
    // return this.parseRevenueCatSubscription(customerInfo);
    
    return this.currentSubscription;
  }

  async getAvailableProducts(): Promise<SubscriptionTier[]> {
    if (MOCK_ENABLED) {
      return SUBSCRIPTION_TIERS;
    }

    // TODO: Replace with RevenueCat integration
    // const offerings = await Purchases.getOfferings();
    // return this.parseRevenueCatOfferings(offerings);
    
    return SUBSCRIPTION_TIERS;
  }

  async purchaseSubscription(tierId: string): Promise<{ success: boolean; error?: string }> {
    if (MOCK_ENABLED) {
      console.log('🛒 Mock purchase for tier:', tierId);
      
      // Simulate purchase flow
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock successful purchase
          const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId);
          if (tier) {
            const currentDate = new Date().toISOString().split('T')[0];
            const renewalDate = tierId === 'annual' 
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            this.currentSubscription = {
              tier: tierId as 'free' | 'monthly' | 'annual',
              isActive: true,
              renewalDate: renewalDate,
              price: tier.price,
              originalPurchaseDate: currentDate,
              willRenew: true
            };
            
            console.log('✅ Updated subscription after purchase:', this.currentSubscription);
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'Product not found' });
          }
        }, 1000); // Reduced delay for better UX
      });
    }

    // TODO: Replace with RevenueCat integration
    // try {
    //   const purchaseResult = await Purchases.purchaseProduct(tierId);
    //   return { success: true };
    // } catch (error) {
    //   return { success: false, error: error.message };
    // }

    return { success: false, error: 'Not implemented' };
  }

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    if (MOCK_ENABLED) {
      console.log('🔄 Mock restore purchases');
      return { success: true };
    }

    // TODO: Replace with RevenueCat integration
    // try {
    //   await Purchases.restorePurchases();
    //   return { success: true };
    // } catch (error) {
    //   return { success: false, error: error.message };
    // }

    return { success: false, error: 'Not implemented' };
  }

  async openSubscriptionManagement(): Promise<void> {
    if (Platform.OS === 'ios') {
      // Open iOS App Store subscription management
      const url = 'https://apps.apple.com/account/subscriptions';
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open App Store subscription management');
      }
    } else if (Platform.OS === 'android') {
      // Open Google Play subscription management
      const url = 'https://play.google.com/store/account/subscriptions';
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open Play Store subscription management');
      }
    }
  }

  // Freemium Gating Logic

  // Check if user has unlimited access (premium subscription)
  hasUnlimitedAccess(): boolean {
    return this.currentSubscription.tier !== 'free' && this.currentSubscription.isActive;
  }

  // Check if user can access a specific feature
  canAccessFeature(feature: string): boolean {
    if (!this.currentSubscription.isActive) {
      return !FREEMIUM_CONFIG.premiumFeatures.includes(feature);
    }

    switch (this.currentSubscription.tier) {
      case 'monthly':
      case 'annual':
        return true;
      default:
        return !FREEMIUM_CONFIG.premiumFeatures.includes(feature);
    }
  }

  // Check if an archetype is premium
  isArchetypePremium(archetypeName: string): boolean {
    return FREEMIUM_CONFIG.premiumArchetypes.includes(archetypeName);
  }

  // Check if user can access a specific archetype
  canAccessArchetype(archetypeName: string): boolean {
    // Premium users can access all archetypes
    if (this.hasUnlimitedAccess()) {
      return true;
    }

    // Free users can only access non-premium archetypes
    return !this.isArchetypePremium(archetypeName);
  }

  // Get the appropriate AI model based on subscription
  getPreferredAIModel(): 'gpt-4o' | 'gpt-3.5' | 'gemini' {
    if (this.hasUnlimitedAccess()) {
      return 'gpt-4o'; // Premium users get GPT-4o
    }
    
    // Free users get GPT-3.5 or Gemini (configurable)
    return 'gpt-3.5'; // or 'gemini' - can be made configurable
  }

  // Get freemium status for display
  getFreemiumStatus(): {
    isFreemium: boolean;
    dailyLimit: number;
    premiumArchetypes: string[];
    upgradeRequired: string[];
  } {
    const isFreemium = !this.hasUnlimitedAccess();
    
    return {
      isFreemium,
      dailyLimit: FREEMIUM_CONFIG.dailyLimit,
      premiumArchetypes: FREEMIUM_CONFIG.premiumArchetypes,
      upgradeRequired: isFreemium ? FREEMIUM_CONFIG.premiumFeatures : [],
    };
  }

  // Helper method to format renewal date
  formatRenewalDate(dateString?: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  // Get subscription summary text
  getSubscriptionSummary(): string {
    const subscription = this.currentSubscription;
    
    if (!subscription.isActive) {
      return "You're on the Free plan";
    }

    const tierName = SUBSCRIPTION_TIERS.find(t => t.id === subscription.tier)?.name || 'Unknown';
    const renewalText = subscription.renewalDate 
      ? `Renews ${this.formatRenewalDate(subscription.renewalDate)}`
      : '';

    return `You're on the ${tierName} Plan — ${subscription.price}${subscription.tier === 'monthly' ? '/mo' : '/year'}. ${renewalText}`;
  }

  // Method to reset subscription to free tier (useful for testing)
  resetToFree(): void {
    this.currentSubscription = {
      tier: 'free',
      isActive: false,
      willRenew: false
    };
    console.log('🔄 Reset subscription to free tier');
  }

  // Method to simulate premium subscription (useful for testing)
  simulatePremium(tier: 'monthly' | 'annual' = 'monthly'): void {
    const plan = SUBSCRIPTION_TIERS.find(t => t.id === tier);
    if (plan) {
      const currentDate = new Date().toISOString().split('T')[0];
      const renewalDate = tier === 'annual' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      this.currentSubscription = {
        tier,
        isActive: true,
        renewalDate: renewalDate,
        price: plan.price,
        originalPurchaseDate: currentDate,
        willRenew: true
      };
      
      console.log(`🧪 Simulated ${tier} subscription for testing:`, this.currentSubscription);
    }
  }
}

export default new SubscriptionService(); 