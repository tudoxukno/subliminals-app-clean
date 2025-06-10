import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav } from '../components/BottomNav';
import { BackButton } from '../components/BackButton';
import { SubscriptionManager } from '../components/SubscriptionManager';
import { AuthenticationModal } from '../components/AuthenticationModal';
import { FeedbackModal } from '../components/FeedbackModal';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';
import { AboutModal } from '../components/AboutModal';
import { TermsModal } from '../components/TermsModal';
import { clearAllSavedSubliminals, getStorageInfo, forceMigration } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import subscriptionService from '../services/subscriptionService';
import { DailyUsageDebug } from '../components/DailyUsageDebug';
import { useDailyUsage } from '../context/DailyUsageContext';

// TEMPORARY: Import this to check if we're in testing mode
const FIREBASE_ENABLED = false;

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 24;

type RootStackParamList = {
  Home: undefined;
  Saved: undefined;
  Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsItemProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  rightElement?: React.ReactNode;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ 
  title, 
  subtitle, 
  onPress, 
  showChevron = false, 
  destructive = false,
  disabled = false,
  rightElement
}) => (
  <TouchableOpacity 
    style={[styles.settingsItem, disabled && styles.settingsItemDisabled]} 
    onPress={onPress}
    disabled={disabled}
  >
    <View style={styles.settingsItemContent}>
      <Text style={[
        styles.settingsItemTitle, 
        destructive && styles.destructiveText,
        disabled && styles.disabledText
      ]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
      )}
    </View>
    {rightElement || (showChevron && (
      <Ionicons name="chevron-forward" size={20} color="#666" />
    ))}
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { 
    user, 
    userProfile, 
    isAnonymous, 
    signUpWithEmail, 
    signInWithEmail, 
    linkAnonymousAccount, 
    signOut,
    getStorageInfo: getAuthStorageInfo,
    isAuthenticated
  } = useAuth();

  const [storageInfo, setStorageInfo] = useState<{
    totalSaved: number;
    storageType: 'local' | 'cloud' | 'hybrid';
    lastSync?: string;
  } | null>(null);

  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Subscription testing state (only when Firebase disabled)
  const [currentSubscriptionState, setCurrentSubscriptionState] = useState<'free' | 'premium'>('free');
  const [showDebugModal, setShowDebugModal] = useState(false);

  const { resetDailyUsageForTesting, resetAIBackgroundUsageForTesting, dailyUsage, dailyLimit, aiBackgroundUsage, aiBackgroundLimit, canGenerateAIBackground } = useDailyUsage();

  useEffect(() => {
    loadStorageInfo();
    if (!FIREBASE_ENABLED) {
      loadSubscriptionState();
    }
  }, [user]);

  const loadStorageInfo = async () => {
    try {
      const info = await getAuthStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const loadSubscriptionState = async () => {
    try {
      const subscription = await subscriptionService.getCurrentSubscription();
      setCurrentSubscriptionState(subscription.isActive && subscription.tier !== 'free' ? 'premium' : 'free');
    } catch (error) {
      console.error('Error loading subscription state:', error);
    }
  };

  const handleToggleSubscription = async () => {
    try {
      if (currentSubscriptionState === 'free') {
        // Switch to premium
        subscriptionService.simulatePremium('monthly');
        setCurrentSubscriptionState('premium');
        Alert.alert('✅ Premium Activated', 'You now have unlimited daily entries and can test the banner states.');
      } else {
        // Switch to free
        subscriptionService.resetToFree();
        setCurrentSubscriptionState('free');
        Alert.alert('🔄 Free Account', 'You now have 3 daily entries and will see the usage banner.');
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      Alert.alert('Error', 'Failed to toggle subscription state.');
    }
  };

  const handleCreateAccount = async () => {
    // This function is still used for anonymous account linking
    // We'll keep it for the "Create Account" button for anonymous users
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data will remain saved to your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              Alert.alert('Success', 'Signed out successfully.');
              await loadStorageInfo();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleForceMigration = () => {
    Alert.alert(
      'Migrate Data',
      'This will move all your locally saved subliminals to your cloud account. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          onPress: async () => {
            try {
              await forceMigration();
              Alert.alert('Success', 'Data migrated successfully!');
              await loadStorageInfo();
            } catch (error) {
              console.error('Migration error:', error);
              Alert.alert('Error', 'Failed to migrate data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleManageSubscription = () => {
    setShowSubscriptionManager(true);
  };

  const handleRestorePurchases = async () => {
    try {
      const result = await subscriptionService.restorePurchases();
      
      if (result.success) {
        Alert.alert('Success', 'Purchases restored successfully');
      } else {
        Alert.alert('Restore Failed', result.error || 'No purchases found to restore');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases');
    }
  };

  const handleClearAllSaved = () => {
    Alert.alert(
      'Clear All Saved Subliminals',
      'Are you sure you want to delete all saved subliminals? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllSavedSubliminals();
              Alert.alert('Success', 'All saved subliminals have been cleared.');
              await loadStorageInfo();
            } catch (error) {
              console.error('Error clearing saved subliminals:', error);
              Alert.alert('Error', 'Failed to clear saved subliminals. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSubmitFeedback = () => {
    setShowFeedbackModal(true);
  };

  const handleAbout = () => {
    setShowAboutModal(true);
  };

  const handlePrivacyPolicy = () => {
    setShowPrivacyModal(true);
  };

  const handleTermsOfUse = () => {
    setShowTermsModal(true);
  };

  const getAccountStatusText = () => {
    if (!user) return 'Not signed in';
    if (isAnonymous) return 'Anonymous account';
    return user.email || 'Signed in';
  };

  const getStorageStatusText = () => {
    if (!storageInfo) return 'Loading...';
    
    const { totalSaved, storageType, lastSync } = storageInfo;
    
    if (storageType === 'cloud') {
      return `${totalSaved} subliminals in cloud`;
    } else if (storageType === 'local') {
      return `${totalSaved} subliminals stored locally`;
    } else {
      return `${totalSaved} subliminals stored in hybrid mode`;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#141414']}
        locations={[0, 1]}
        style={styles.gradient}
      >
        <View style={styles.mainContent}>
          <SafeAreaView>
            <View style={styles.header}>
              <BackButton />
              <Text style={styles.headerTitle}>Settings</Text>
            </View>
          </SafeAreaView>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <SettingsItem
                title="Account Status"
                subtitle={getAccountStatusText()}
                rightElement={
                  isAnonymous ? (
                    <TouchableOpacity
                      style={styles.createAccountButton}
                      onPress={() => setShowAuthModal(true)}
                    >
                      <Text style={styles.createAccountButtonText}>Create Account</Text>
                    </TouchableOpacity>
                  ) : isAuthenticated ? (
                    <TouchableOpacity onPress={handleSignOut}>
                      <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={handleSignIn}>
                      <Text style={styles.signInText}>Sign In</Text>
                    </TouchableOpacity>
                  )
                }
              />
              
              {isAuthenticated && !isAnonymous && (
                <>
                  <SettingsItem
                    title="Manage Subscription"
                    onPress={handleManageSubscription}
                    showChevron
                  />
                  <SettingsItem
                    title="Restore Purchases"
                    onPress={handleRestorePurchases}
                  />
                </>
              )}
            </View>

            {/* Data Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data</Text>
              <SettingsItem
                title="Storage Status"
                subtitle={getStorageStatusText()}
              />
              
              {storageInfo && storageInfo.storageType === 'local' && (
                <SettingsItem
                  title="Migrate Local Data to Cloud"
                  subtitle="Move your saved subliminals to your account"
                  onPress={handleForceMigration}
                  disabled={isAnonymous}
                />
              )}
              
              <SettingsItem
                title="Clear All Saved Subliminals"
                onPress={handleClearAllSaved}
                destructive
              />
            </View>

            {/* Subscription Testing Section - Only show when Firebase disabled */}
            {!FIREBASE_ENABLED && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧪 Subscription Testing</Text>
                <SettingsItem
                  title="Current State"
                  subtitle={currentSubscriptionState === 'premium' ? 'Premium (Unlimited entries)' : 'Free (3 entries/day)'}
                  rightElement={
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        currentSubscriptionState === 'premium' ? styles.premiumButton : styles.freeButton
                      ]}
                      onPress={handleToggleSubscription}
                    >
                      <Text style={[
                        styles.toggleButtonText,
                        currentSubscriptionState === 'premium' ? styles.premiumButtonText : styles.freeButtonText
                      ]}>
                        {currentSubscriptionState === 'premium' ? 'Switch to Free' : 'Switch to Premium'}
                      </Text>
                    </TouchableOpacity>
                  }
                />
                <Text style={styles.testingNote}>
                  Toggle between subscription states to test the daily usage banner and limits.
                </Text>
                <SettingsItem
                  title="View Daily Usage Debug"
                  subtitle="See detailed usage tracking info"
                  onPress={() => setShowDebugModal(true)}
                />
                <SettingsItem
                  title="AI Background Status"
                  subtitle={`${aiBackgroundUsage}/${aiBackgroundLimit} used today • ${canGenerateAIBackground ? 'Can generate' : 'Limit reached'}`}
                  rightElement={
                    <View style={[
                      styles.statusIndicator,
                      canGenerateAIBackground ? styles.statusGreen : styles.statusRed
                    ]}>
                      <Text style={styles.statusText}>
                        {canGenerateAIBackground ? '✓' : '✗'}
                      </Text>
                    </View>
                  }
                />
                <SettingsItem
                  title="Reset Daily Usage"
                  subtitle="Reset to 0/3 for testing banner states"
                  onPress={async () => {
                    await resetDailyUsageForTesting();
                    Alert.alert('✅ Reset Complete', 'Daily usage reset to 0/3. You can now test the banner behavior from the beginning.');
                  }}
                />
                <SettingsItem
                  title="Reset AI Background Usage"
                  subtitle="Reset AI backgrounds to 0/1 for testing"
                  onPress={async () => {
                    await resetAIBackgroundUsageForTesting();
                    Alert.alert('✅ AI Background Reset Complete', 'AI background usage reset to 0/1. You can now test AI background limits.');
                  }}
                />
              </View>
            )}

            {/* Support Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Support</Text>
              <SettingsItem
                title="Submit Feedback / Report an Issue"
                onPress={handleSubmitFeedback}
              />
            </View>

            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <SettingsItem
                title="About Subliminals"
                onPress={handleAbout}
              />
              <SettingsItem
                title="Privacy Policy"
                onPress={handlePrivacyPolicy}
              />
              <SettingsItem
                title="Terms of Use"
                onPress={handleTermsOfUse}
              />
            </View>
          </ScrollView>

          {/* Authentication Modal */}
          <AuthenticationModal
            visible={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode="signin"
          />

          {/* Feedback Modal */}
          <FeedbackModal
            visible={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
          />

          {/* Privacy Policy Modal */}
          <PrivacyPolicyModal
            visible={showPrivacyModal}
            onClose={() => setShowPrivacyModal(false)}
          />

          {/* About Modal */}
          <AboutModal
            visible={showAboutModal}
            onClose={() => setShowAboutModal(false)}
          />

          {/* Terms Modal */}
          <TermsModal
            visible={showTermsModal}
            onClose={() => setShowTermsModal(false)}
          />

          {/* Debug Modal - Only when Firebase disabled */}
          {!FIREBASE_ENABLED && (
            <Modal
              visible={showDebugModal}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={() => setShowDebugModal(false)}
            >
              <View style={styles.debugModal}>
                <View style={styles.debugHeader}>
                  <Text style={styles.debugTitle}>Daily Usage Debug</Text>
                  <TouchableOpacity onPress={() => setShowDebugModal(false)}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                <DailyUsageDebug />
              </View>
            </Modal>
          )}

          {/* Bottom Nav */}
          <BottomNav 
            currentRoute="Settings" 
            onNewPress={() => navigation.navigate('Home')} 
          />
        </View>

        {/* Subscription Manager Modal */}
        <Modal
          visible={showSubscriptionManager}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSubscriptionManager(false)}
        >
          <SubscriptionManager onClose={() => setShowSubscriptionManager(false)} />
        </Modal>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  gradient: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT : 16,
    paddingHorizontal: 20,
    height: Platform.OS === 'ios' ? 84 : 64,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 8,
  },
  settingsItemDisabled: {
    opacity: 0.5,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  settingsItemSubtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  destructiveText: {
    color: '#FF4444',
  },
  disabledText: {
    color: '#666',
  },
  createAccountButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createAccountButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  signOutText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  input: {
    backgroundColor: '#2B2B2B',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeButton: {
    alignItems: 'center',
  },
  switchModeText: {
    color: '#666',
    fontSize: 14,
  },
  toggleButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  premiumButton: {
    backgroundColor: '#FF4444',
  },
  freeButton: {
    backgroundColor: '#fff',
  },
  toggleButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  premiumButtonText: {
    color: '#fff',
  },
  freeButtonText: {
    color: '#666',
  },
  testingNote: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  debugModal: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  debugTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusGreen: {
    backgroundColor: '#4CAF50',
  },
  statusRed: {
    backgroundColor: '#FF4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen; 