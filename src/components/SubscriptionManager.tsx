import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import subscriptionService, { UserSubscription, SubscriptionTier } from '../services/subscriptionService';

interface SubscriptionManagerProps {
  onClose?: () => void;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ onClose }) => {
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const [subscription, plans] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getAvailableProducts()
      ]);
      
      setCurrentSubscription(subscription);
      setAvailablePlans(plans);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (tierId: string) => {
    try {
      setIsPurchasing(tierId);
      const result = await subscriptionService.purchaseSubscription(tierId);
      
      if (result.success) {
        await loadSubscriptionData();
        
        Alert.alert(
          'Success!', 
          'Your subscription has been activated. Thank you for supporting the app!'
        );
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to process purchase');
    } finally {
      setIsPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      const result = await subscriptionService.restorePurchases();
      
      if (result.success) {
        Alert.alert('Success', 'Purchases restored successfully');
        await loadSubscriptionData();
      } else {
        Alert.alert('Restore Failed', result.error || 'No purchases found to restore');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await subscriptionService.openSubscriptionManagement();
    } catch (error) {
      console.error('Error opening subscription management:', error);
      Alert.alert('Error', 'Unable to open subscription management');
    }
  };

  const renderCurrentSubscription = () => {
    if (!currentSubscription) return null;

    const isActive = currentSubscription.isActive;
    const summary = subscriptionService.getSubscriptionSummary();

    return (
      <View style={styles.currentSubscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <View style={styles.subscriptionTitleRow}>
            <Text style={styles.subscriptionTitle}>Your Subscription</Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: isActive ? '#4CAF50' : '#666' }
            ]}>
              <Text style={styles.statusText}>
                {isActive ? 'Active' : 'Free'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.subscriptionSummary}>{summary}</Text>

        {isActive && (
          <View style={styles.subscriptionDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {currentSubscription.willRenew ? 'Auto-renews' : 'Expires'} on{' '}
                {subscriptionService.formatRenewalDate(currentSubscription.renewalDate)}
              </Text>
            </View>
            
            {currentSubscription.originalPurchaseDate && (
              <View style={styles.detailRow}>
                <Ionicons name="receipt-outline" size={16} color="#666" />
                <Text style={styles.detailText}>
                  Purchased {subscriptionService.formatRenewalDate(currentSubscription.originalPurchaseDate)}
                </Text>
              </View>
            )}
          </View>
        )}

        {isActive && (
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={handleManageSubscription}
          >
            <Ionicons name="settings-outline" size={18} color="#000" />
            <Text style={styles.manageButtonText}>
              Manage in {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPlanCard = (plan: SubscriptionTier) => {
    const isCurrentPlan = currentSubscription?.tier === plan.id;
    const isPurchasingThis = isPurchasing === plan.id;
    const isUpgrade = currentSubscription?.tier === 'free' || 
                     (currentSubscription?.tier === 'monthly' && plan.id === 'annual');

    // Debug logging for border logic
    console.log(`🔍 Plan Card ${plan.id}:`, {
      currentTier: currentSubscription?.tier,
      planId: plan.id,
      isCurrentPlan,
      isActive: currentSubscription?.isActive,
      willShowWhiteBorder: isCurrentPlan
    });

    if (plan.id === 'free') return null; // Don't show free plan in upgrade options

    return (
      <View key={plan.id} style={[
        styles.planCard,
        plan.isPopular && styles.popularPlanCard,
        isCurrentPlan && styles.currentPlanCard,
      ]}>
        {plan.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>{plan.price}</Text>
            <Text style={styles.planDuration}>{plan.duration}</Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {!isCurrentPlan && (
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              plan.isPopular && styles.popularUpgradeButton,
              isPurchasingThis && styles.purchasingButton
            ]}
            onPress={() => handlePurchase(plan.id)}
            disabled={isPurchasingThis}
          >
            {isPurchasingThis ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Text style={[
                  styles.upgradeButtonText,
                  plan.isPopular && styles.popularUpgradeButtonText
                ]}>
                  {isUpgrade ? 'Upgrade' : 'Switch'} to {plan.name}
                </Text>
                <Ionicons 
                  name="arrow-forward" 
                  size={16} 
                  color="#000" 
                />
              </>
            )}
          </TouchableOpacity>
        )}

        {isCurrentPlan && (
          <View style={styles.currentPlanIndicator}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.currentPlanText}>Current Plan</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading subscription info...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscription</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {renderCurrentSubscription()}

      <View style={styles.plansSection}>
        <Text style={styles.sectionTitle}>Available Plans</Text>
        <Text style={styles.sectionSubtitle}>
          Upgrade to unlock unlimited subliminals and premium features
        </Text>

        {availablePlans.map(renderPlanCard)}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
        >
          <Ionicons name="refresh-outline" size={18} color="#666" />
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Subscriptions auto-renew unless cancelled. Cancel anytime in your {Platform.OS === 'ios' ? 'App Store' : 'Play Store'} account settings.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  currentSubscriptionCard: {
    backgroundColor: '#1A1A1A',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  subscriptionHeader: {
    marginBottom: 12,
  },
  subscriptionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  subscriptionSummary: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  subscriptionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  plansSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  planCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  currentPlanCard: {
    borderColor: '#fff',
    borderWidth: 2,
    backgroundColor: '#1A1A1A',
  },
  popularPlanCard: {
    borderColor: '#2B2B2B',
    backgroundColor: '#1A1A1A',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  planDuration: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fff',
  },
  popularUpgradeButton: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  purchasingButton: {
    opacity: 0.7,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  popularUpgradeButtonText: {
    color: '#000',
  },
  currentPlanIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  currentPlanText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  footerNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  activePill: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
}); 