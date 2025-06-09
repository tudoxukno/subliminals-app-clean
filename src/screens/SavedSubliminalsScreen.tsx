import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SavedSubliminal, SavedSubliminalWithDisplayDate } from '../types/subliminal';
import { getSavedSubliminals, removeSavedSubliminal } from '../utils/storage';
import { BottomNav } from '../components/BottomNav';
import { BackButton } from '../components/BackButton';
import { SavedArchetypeCard } from '../components/SavedArchetypeCard';
import { AuthenticationModal } from '../components/AuthenticationModal';
import { useAuth } from '../context/AuthContext';
import subscriptionService from '../services/subscriptionService';

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 24;
const BOTTOM_NAV_HEIGHT = Platform.OS === 'ios' ? 90 : 80;

const SHARE_CARD_WIDTH = 1200; // Base width for sharing
const SHARE_CARD_HEIGHT = 630; // 1.91:1 aspect ratio (common for social sharing)

type RootStackParamList = {
  Home: { activateInput?: boolean } | undefined;
  Settings: undefined;
  FullSubliminalView: {
    userInput: string;
    selectedArchetype: string;
    archetypeData: {
      icon: string;
      response: string;
      fullMessage: string;
      quote: string;
      tags: string[];
      backgroundImage?: string; // AI-generated background URL
    };
  };
  ShareSuite: {
    userInput: string;
    selectedArchetype: string;
    archetypeData: {
      icon: string;
      response: string;
      fullMessage: string;
      quote: string;
      tags: string[];
      backgroundImage?: string; // AI-generated background URL
    };
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

// Component for unauthenticated state
const UnauthenticatedView = ({ onSignIn }: { onSignIn: () => void }) => (
  <View style={styles.unauthenticatedContainer}>
    <View style={styles.unauthenticatedContent}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name="bookmark-outline" size={64} color="#666" />
      </View>
      
      {/* Title and Description */}
      <Text style={styles.unauthenticatedTitle}>Save Your Subliminals</Text>
      <Text style={styles.unauthenticatedDescription}>
        Create an account to save your favorite subliminals and access them across all your devices.
      </Text>
      
      {/* Benefits List */}
      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <Ionicons name="cloud-outline" size={20} color="#888" />
          <Text style={styles.benefitText}>Sync across devices</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#888" />
          <Text style={styles.benefitText}>Secure cloud storage</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="infinite-outline" size={20} color="#888" />
          <Text style={styles.benefitText}>Unlimited saves</Text>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.authButtonsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onSignIn}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={onSignIn}>
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// Component for empty authenticated state
const EmptyAuthenticatedView = ({ onCreateFirst }: { onCreateFirst: () => void }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyContent}>
      <View style={styles.iconContainer}>
        <Ionicons name="bookmark" size={64} color="#666" />
      </View>
      
      <Text style={styles.emptyTitle}>No Saved Subliminals Yet</Text>
      <Text style={styles.emptyDescription}>
        Start creating subliminals and save your favorites to access them anytime.
      </Text>
      
      <TouchableOpacity style={styles.primaryButton} onPress={onCreateFirst}>
        <Text style={styles.primaryButtonText}>Create Your First Subliminal</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const SavedSubliminalsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, isLoading, isAuthenticated, signInAnonymously } = useAuth();
  const [savedSubliminals, setSavedSubliminals] = useState<SavedSubliminalWithDisplayDate[]>([]);
  const [isLoadingSubliminals, setIsLoadingSubliminals] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    currentCount: number;
    limit: number;
    isUnlimited: boolean;
    percentUsed: number;
    nearLimit: boolean;
    atLimit: boolean;
  } | null>(null);

  const loadSavedSubliminals = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingSubliminals(true);
      const saved = await getSavedSubliminals();
      const withDisplayDates = saved.map(subliminal => ({
        ...subliminal,
        displayDate: formatDate(subliminal.dateSaved)
      }));
      setSavedSubliminals(withDisplayDates);
      
      // Load save status for counter display
      const status = await subscriptionService.getSaveStatus();
      setSaveStatus(status);
    } catch (error) {
      console.error('Error loading saved subliminals:', error);
    } finally {
      setIsLoadingSubliminals(false);
    }
  };

  // Reload saved subliminals when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedSubliminals();
    }, [isAuthenticated])
  );

  const handleCardPress = (subliminal: SavedSubliminalWithDisplayDate) => {
    navigation.navigate('FullSubliminalView', {
      userInput: subliminal.userInput,
      selectedArchetype: subliminal.selectedArchetype,
      archetypeData: subliminal.archetypeData,
    });
  };

  const handleOptionsPress = (subliminal: SavedSubliminalWithDisplayDate) => {
    Alert.alert(
      'Options',
      '',
      [
        {
          text: 'Customize & Share',
          onPress: () => {
            navigation.navigate('ShareSuite', {
              userInput: subliminal.userInput,
              selectedArchetype: subliminal.selectedArchetype,
              archetypeData: subliminal.archetypeData,
            });
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(subliminal),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          console.log('Alert dismissed');
        }
      }
    );
  };

  const confirmDelete = (subliminal: SavedSubliminal) => {
    Alert.alert(
      'Delete Subliminal',
      'Are you sure you want to delete this subliminal? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSavedSubliminal(subliminal.id);
              loadSavedSubliminals(); // This will also refresh save status
            } catch (error) {
              console.error('Error deleting subliminal:', error);
              Alert.alert('Error', 'Failed to delete subliminal. Please try again.');
            }
          },
        },
      ],
      {
        cancelable: true,
      }
    );
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleCreateFirst = () => {
    navigation.navigate('Home', { activateInput: true });
  };

  const renderContent = () => {
    if (isLoading || isLoadingSubliminals) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (!isAuthenticated) {
      return <UnauthenticatedView onSignIn={handleSignIn} />;
    }

    if (savedSubliminals.length === 0) {
      return <EmptyAuthenticatedView onCreateFirst={handleCreateFirst} />;
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'ios' ? 120 : 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {savedSubliminals.map((subliminal) => (
          <SavedArchetypeCard
            key={subliminal.id}
            subliminal={subliminal}
            onCardPress={handleCardPress}
            onOptionsPress={handleOptionsPress}
          />
        ))}
      </ScrollView>
    );
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
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Saved Subliminals</Text>
                {saveStatus && !saveStatus.isUnlimited && (
                  <Text style={[
                    styles.saveCounter, 
                    saveStatus.nearLimit && styles.saveCounterWarning,
                    saveStatus.atLimit && styles.saveCounterError
                  ]}>
                    {saveStatus.currentCount} / {saveStatus.limit} saves
                  </Text>
                )}
                {saveStatus && saveStatus.isUnlimited && (
                  <Text style={styles.saveCounterUnlimited}>Unlimited saves</Text>
                )}
              </View>
            </View>
          </SafeAreaView>

          {renderContent()}

          {/* Bottom Nav */}
          <BottomNav 
            currentRoute="Saved" 
            onNewPress={() => navigation.navigate('Home')} 
          />
        </View>
      </LinearGradient>

      {/* Authentication Modal */}
      <AuthenticationModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />
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
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveCounter: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  saveCounterWarning: {
    color: '#FFA726', // Orange for near limit
  },
  saveCounterError: {
    color: '#EF5350', // Red for at limit
  },
  saveCounterUnlimited: {
    color: '#4CAF50', // Green for unlimited
    fontSize: 12,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  // Unauthenticated state styles
  unauthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: BOTTOM_NAV_HEIGHT,
  },
  unauthenticatedContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: 24,
  },
  unauthenticatedTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  unauthenticatedDescription: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsList: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    color: '#888',
    fontSize: 16,
    marginLeft: 12,
  },
  authButtonsContainer: {
    alignSelf: 'stretch',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  // Empty authenticated state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: BOTTOM_NAV_HEIGHT,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDescription: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
});

export default SavedSubliminalsScreen; 