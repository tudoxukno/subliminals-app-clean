import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import subscriptionService, { SubscriptionTier } from '../services/subscriptionService';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  trigger: 'daily_limit' | 'archetype_switching' | 'premium_archetype' | 'ai_backgrounds' | 'background_regeneration' | 'unlimited_saves' | 'save_limit' | 'general_upgrade';
  userInput?: string; // Context for better messaging
  archetypeName?: string; // Which archetype triggered this
}

const TRIGGER_MESSAGES = {
  daily_limit: {
    title: 'Daily Limit Reached',
    subtitle: 'You\'ve used all 3 free subliminals today',
    description: 'Upgrade to get unlimited subliminals and unlock all premium features.',
    icon: '📊',
  },
  archetype_switching: {
    title: 'Unlock All Archetypes',
    subtitle: 'Compare different perspectives on the same thought',
    description: 'With premium, you can explore all archetypes for any input and switch between them freely.',
    icon: '🔄',
  },
  premium_archetype: {
    title: 'Premium Archetype',
    subtitle: 'Best Friend is a premium archetype',
    description: 'Get access to Best Friend and all future premium archetypes with your subscription.',
    icon: '🫶',
  },
  ai_backgrounds: {
    title: 'Unlimited AI Backgrounds',
    subtitle: 'You\'ve used your 1 free AI background today',
    description: 'Premium subscribers get unlimited AI-generated backgrounds that perfectly match your subliminal\'s mood and energy.',
    icon: '🎨',
  },
  background_regeneration: {
    title: 'Background Regeneration',
    subtitle: 'Refresh and customize your AI backgrounds',
    description: 'Premium subscribers can regenerate AI backgrounds with different styles and variations to find the perfect match.',
    icon: '🔄',
  },
  unlimited_saves: {
    title: 'Unlimited Saves',
    subtitle: 'Save as many subliminals as you want',
    description: 'Never lose your favorite reflections. Premium subscribers get unlimited saves with cloud sync.',
    icon: '☁️',
  },
  save_limit: {
    title: 'Save Limit Reached',
    subtitle: 'You\'ve saved 10 subliminals (free limit)',
    description: 'Upgrade to Premium for unlimited saves with cloud sync, or clear some saves in Settings to continue.',
    icon: '💾',
  },
  general_upgrade: {
    title: 'Unlock Premium Features',
    subtitle: 'Get unlimited access to all subliminals and premium archetypes',
    description: 'Upgrade to Premium for unlimited daily entries, all archetypes, AI backgrounds, and exclusive features.',
    icon: '✨',
  },
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  trigger,
  userInput,
  archetypeName,
}) => {
  const [availablePlans, setAvailablePlans] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadPlans();
    }
  }, [visible]);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const plans = await subscriptionService.getAvailableProducts();
      // Filter out the free plan for upgrade modal
      setAvailablePlans(plans.filter(plan => plan.id !== 'free'));
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      Alert.alert('Error', 'Failed to load subscription options');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    try {
      setIsPurchasing(planId);
      const result = await subscriptionService.purchaseSubscription(planId);
      
      if (result.success) {
        Alert.alert(
          'Welcome to Premium!', 
          'Your subscription is now active. Enjoy unlimited subliminals and all premium features!',
          [
            {
              text: 'Continue',
              onPress: onClose
            }
          ]
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
        onClose();
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

  const getTriggerMessage = () => {
    const message = TRIGGER_MESSAGES[trigger];
    
    // Archetype icon mapping
    const archetypeIcons: { [key: string]: string } = {
      'Best Friend': '🫶',
      'Coach': '🧢',
      'Mirror': '🪞',
      'Therapist': '🫂',
      'Realist': '🪓',
      'Poet': '🌙',
    };
    
    // Customize message based on context
    if (trigger === 'premium_archetype' && archetypeName) {
      const contextualIcon = archetypeIcons[archetypeName] || message.icon;
      return {
        ...message,
        subtitle: `${archetypeName} is a premium archetype`,
        description: `Get access to ${archetypeName} and all future premium archetypes with your subscription.`,
        icon: contextualIcon, // Use the archetype's specific icon
      };
    }
    
    return message;
  };

  const renderPlanCard = (plan: SubscriptionTier) => {
    const isPurchasingThis = isPurchasing === plan.id;
    
    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          plan.isPopular && styles.popularPlanCard,
        ]}
        onPress={() => handlePurchase(plan.id)}
        disabled={isPurchasingThis}
        activeOpacity={0.8}
      >
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
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={[
          styles.upgradeButton,
          plan.isPopular && styles.popularUpgradeButton,
          isPurchasingThis && styles.purchasingButton
        ]}>
          {isPurchasingThis ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <>
              <Text style={[
                styles.upgradeButtonText,
                plan.isPopular && styles.popularUpgradeButtonText
              ]}>
                Start {plan.name}
              </Text>
              <Ionicons 
                name="arrow-forward" 
                size={16} 
                color="#000" 
              />
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const triggerMessage = getTriggerMessage();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#0A0A0A', '#141414']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
              {/* Trigger Message */}
              <View style={styles.triggerSection}>
                <Text style={styles.triggerIcon}>{triggerMessage.icon}</Text>
                <Text style={styles.triggerTitle}>{triggerMessage.title}</Text>
                <Text style={styles.triggerSubtitle}>{triggerMessage.subtitle}</Text>
                <Text style={styles.triggerDescription}>{triggerMessage.description}</Text>
              </View>

              {/* Premium Features Highlight */}
              <View style={styles.featuresHighlight}>
                <Text style={styles.featuresTitle}>Everything in Premium:</Text>
                <View style={styles.highlightGrid}>
                  <View style={styles.highlightItem}>
                    <Ionicons name="infinite" size={20} color="#4CAF50" />
                    <Text style={styles.highlightText}>Unlimited Daily Subliminals</Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <Ionicons name="people" size={20} color="#4CAF50" />
                    <Text style={styles.highlightText}>All 6 Archetypes</Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <Ionicons name="swap-horizontal" size={20} color="#4CAF50" />
                    <Text style={styles.highlightText}>Switch Between Archetypes</Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <Ionicons name="color-palette" size={20} color="#4CAF50" />
                    <Text style={styles.highlightText}>AI-Generated Backgrounds</Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <Ionicons name="cloud" size={20} color="#4CAF50" />
                    <Text style={styles.highlightText}>Unlimited Cloud Saves</Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <Ionicons name="flash" size={20} color="#4CAF50" />
                    <Text style={styles.highlightText}>Premium AI Models</Text>
                  </View>
                </View>
              </View>

              {/* Plans */}
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Loading plans...</Text>
                </View>
              ) : (
                <View style={styles.plansContainer}>
                  {availablePlans.map(renderPlanCard)}
                </View>
              )}

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.restoreButton}
                  onPress={handleRestorePurchases}
                >
                  <Text style={styles.restoreButtonText}>Restore Purchases</Text>
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                  Subscriptions auto-renew unless cancelled. Cancel anytime in your {Platform.OS === 'ios' ? 'App Store' : 'Play Store'} account settings.
                </Text>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 20,
    paddingBottom: 10,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  
  // Trigger message section
  triggerSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  triggerIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  triggerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  triggerSubtitle: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  triggerDescription: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Features highlight
  featuresHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  featuresTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  highlightGrid: {
    gap: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },

  // Plans
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  popularPlanCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  planDuration: {
    color: '#999',
    fontSize: 12,
  },
  featuresContainer: {
    marginBottom: 20,
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  popularUpgradeButton: {
    backgroundColor: '#4CAF50',
  },
  purchasingButton: {
    backgroundColor: '#ccc',
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  popularUpgradeButtonText: {
    color: '#fff',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  restoreButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  restoreButtonText: {
    color: '#666',
    fontSize: 14,
  },
  footerNote: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
}); 