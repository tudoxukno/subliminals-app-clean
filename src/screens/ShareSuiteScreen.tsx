import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
  Image,
  Pressable,
  Alert,
  Animated,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  useFonts,
  PlayfairDisplay_500Medium_Italic,
} from '@expo-google-fonts/playfair-display';
import ViewShot, { captureRef } from "react-native-view-shot";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { SubliminalCard } from '../components/SubliminalCard';
import { QuoteCard } from '../components/QuoteCard';
import { BackgroundPicker, type Background } from '../components/BackgroundPicker';
import { BackButton } from '../components/BackButton';
import { ScrollHint } from '../components/ScrollHint';
import subscriptionService from '../services/subscriptionService';
import { useDailyUsage } from '../context/DailyUsageContext';
import { UpgradeModal } from '../components/UpgradeModal';
import { getCurrentFeaturedBackgrounds, isBackgroundFeatured, getFeaturedUntilDate } from '../services/featuredBackgrounds';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 24;

// Helper function to clean the main message by removing appended support text
const cleanMainMessage = (message: string): string => {
  // Remove the appended support message if it exists
  const supportMessagePattern = /\s*💬\s*If things feel overwhelming.*$/;
  return message.replace(supportMessagePattern, '').trim();
};

type RootStackParamList = {
  ShareSuite: {
    userInput: string;
    selectedArchetype: string;
    archetypeData: {
      icon: string;
      response: string;
      fullMessage: string;
      quote: string;
      tags: string[];
      backgroundImage?: string;
      styleName?: string;
      styleIndex?: number;
      backgroundType?: string;
    };
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShareSuite'>;
type RoutePropType = RouteProp<RootStackParamList, 'ShareSuite'>;

type ViewMode = 'QUOTE_ONLY' | 'FULL_SUBLIMINAL';

const ShareSuiteScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { userInput, selectedArchetype, archetypeData } = route.params;
  const cardRef = useRef<ViewShot>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<'background_regeneration' | 'premium_backgrounds'>('background_regeneration');

  const { canGenerateAIBackground, incrementAIBackgroundUsage } = useDailyUsage();

  // Create background options with featured rotation system
  const [backgroundOptions, setBackgroundOptions] = useState<Background[]>(() => {
    const featuredRotation = getCurrentFeaturedBackgrounds();
    const featuredUntil = getFeaturedUntilDate();
    const isPremiumUser = subscriptionService.hasUnlimitedAccess();
    
    // Static mapping of all background images (Metro bundler requirement)
    const backgroundSources: { [key: number]: any } = {
      1: require('../../assets/images/background1.png'),
      2: require('../../assets/images/background2.png'),
      3: require('../../assets/images/background3.png'),
      4: require('../../assets/images/background4.png'),
      5: require('../../assets/images/background5.png'),
      6: require('../../assets/images/background6.png'),
      7: require('../../assets/images/background7.png'),
      8: require('../../assets/images/background8.png'),
      9: require('../../assets/images/background9.png'),
      10: require('../../assets/images/background10.png'),
      11: require('../../assets/images/background11.png'),
      12: require('../../assets/images/background12.png'),
      13: require('../../assets/images/background13.png'),
      14: require('../../assets/images/background14.png'),
      15: require('../../assets/images/background15.png'),
      16: require('../../assets/images/background16.png'),
      17: require('../../assets/images/background17.png'),
      18: require('../../assets/images/background18.png'),
    };
    
    // Create array of all premium background IDs (6-18)
    const allPremiumIds = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const featuredIds = featuredRotation.backgroundIds;
    const lockedIds = allPremiumIds.filter(id => !featuredIds.includes(id));
    


    // Base array with None and AI-generated options
    const baseOptions: Background[] = [
      { id: 0, source: null }, // None option
      // Always include AI-generated slot - either with image or loading state
      { 
        id: -1, 
        source: null, 
        url: archetypeData.backgroundImage, 
        label: archetypeData.styleName || 'AI',
        isAIGenerated: true,
        backgroundType: archetypeData.backgroundType || 'ai-generated',
        styleIndex: archetypeData.styleIndex || 0,
        styleName: archetypeData.styleName || 'AI',
        isLoading: !archetypeData.backgroundImage, // Show loading if no background yet
        isPremiumFeature: !isPremiumUser
      },
      // Free static backgrounds 1-5 (always available)
      { id: 1, source: backgroundSources[1] },
      { id: 2, source: backgroundSources[2] },
      { id: 3, source: backgroundSources[3] },
      { id: 4, source: backgroundSources[4] },
      { id: 5, source: backgroundSources[5] },
    ];

    // Add featured backgrounds in slots 6-10 (FREE during rotation)
    featuredIds.forEach((featuredId, index) => {
      const slotId = 6 + index; // Slots 6, 7, 8, 9, 10
      baseOptions.push({
        id: slotId,
        source: backgroundSources[featuredId],
        isFeatured: !isPremiumUser, // Show featured label for freemium users
        featuredUntil: !isPremiumUser ? featuredUntil : undefined,
        isPremiumFeature: false, // Featured backgrounds are FREE to use during rotation
        originalId: featuredId // Track the original background ID for debugging
      });
    });
    
    // Add remaining premium backgrounds that are NOT featured (locked premium)
    lockedIds.forEach((lockedId, index) => {
      const slotId = 11 + index; // Start from slot 11
      baseOptions.push({
        id: slotId,
        source: backgroundSources[lockedId],
        isPremiumFeature: !isPremiumUser,
        originalId: lockedId // Track the original background ID for debugging
      });
    });

    return baseOptions;
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('FULL_SUBLIMINAL');
  const [selectedBackground, setSelectedBackground] = useState<Background | null>(
    // Default to AI-generated background if available, otherwise "None"
    archetypeData.backgroundImage ? backgroundOptions.find(bg => bg.id === -1) || backgroundOptions[0] : backgroundOptions[0]
  );
  const [isSharing, setIsSharing] = useState(false);
  const [cardHeight, setCardHeight] = useState(380); // Dynamic card height
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [hasInteractedWithHint, setHasInteractedWithHint] = useState(false);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium_Italic,
  });

  // Animation setup
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const bottomContentPosition = useRef(new Animated.Value(0)).current;

  // Update AI background when it becomes available
  useEffect(() => {
    if (archetypeData.backgroundImage) {
      setBackgroundOptions(prevOptions => 
        prevOptions.map(bg => 
          bg.id === -1 ? {
            ...bg,
            url: archetypeData.backgroundImage,
            label: archetypeData.styleName || 'AI',
            styleName: archetypeData.styleName || 'AI',
            styleIndex: archetypeData.styleIndex || 0,
            isLoading: false
          } : bg
        )
      );
    }
  }, [archetypeData.backgroundImage, archetypeData.styleName, archetypeData.styleIndex]);

  // Featured backgrounds are initialized on component mount via useState

  const formatShareContent = () => {
    if (viewMode === 'QUOTE_ONLY') {
      return `"${archetypeData.quote}" - ${selectedArchetype} | Subliminals`;
    }
    // Use cleaned message to ensure no support resources appear in shared content
    const cleanedMessage = cleanMainMessage(archetypeData.fullMessage);
    return `"${userInput}"\n\n${cleanedMessage}\n\n"${archetypeData.quote}"\n\n- ${selectedArchetype} | Subliminals`;
  };

  // Calculate if scrolling is needed based on actual screen dimensions
  const calculateScrollNeed = (cardContentHeight: number, screenHeight: number) => {
    if (screenHeight === 0 || cardContentHeight === 0) return false; // Wait for layout
    
    // CLEAR RULE: Calculate actual heights of all elements
    const headerHeight = Platform.OS === 'ios' ? 84 : 64;
    const toggleHeight = 36 + 24; // toggle + margin
    const cardSpacing = 32; // spacing around card
    const backgroundPickerHeight = 120; // approximate height (this is fairly consistent)
    const shareButtonHeight = 48 + 16; // button + spacing
    const bottomPadding = Platform.OS === 'ios' ? 34 : 24;
    
    // Total content height needed
    const totalContentHeight = 
      headerHeight + 
      toggleHeight + 
      cardContentHeight + 
      cardSpacing + 
      backgroundPickerHeight + 
      shareButtonHeight + 
      bottomPadding;
    
    // CLEAR RULE: Scrolling is needed if total content exceeds available screen height
    const needsScrolling = totalContentHeight > screenHeight;
    
    return needsScrolling;
  };

  const handleCardLayout = (height: number) => {
    // Set minimum heights based on view mode, but allow shrinking for short content
    const minHeight = viewMode === 'QUOTE_ONLY' ? 300 : 250;
    // Add some padding to the measured height for safety, but respect the minimum
    const adjustedHeight = Math.max(height + 20, minHeight);
    setCardHeight(adjustedHeight);
    
    // CLEAR RULE: Only show scroll hint if scrolling is actually needed
    // Add small delay to ensure measurements are stable
    setTimeout(() => {
      if (scrollViewHeight > 0) {
        const needsScrolling = calculateScrollNeed(adjustedHeight, scrollViewHeight);
        setShowScrollIndicator(needsScrolling);
      }
    }, 100);
  };

  // Handle ScrollView layout to get actual screen dimensions
  const handleScrollViewLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setScrollViewHeight(height);
    
    // CLEAR RULE: Recalculate scroll need with actual screen dimensions
    // Add small delay to ensure measurements are stable
    setTimeout(() => {
      if (cardHeight > 0) {
        const needsScrolling = calculateScrollNeed(cardHeight, height);
        setShowScrollIndicator(needsScrolling);
      }
    }, 100);
  };

  // Handle scroll indicator state updates
  useEffect(() => {
    if (showScrollIndicator) {
      // Auto-hide after 3 seconds if user hasn't interacted
      const timer = setTimeout(() => {
        if (!hasInteractedWithHint) {
          setShowScrollIndicator(false);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showScrollIndicator, hasInteractedWithHint]);

  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    
    // Hide indicator when user scrolls
    if (showScrollIndicator && contentOffset.y > 50) {
      setShowScrollIndicator(false);
    }
  };

  const handleScrollHintTap = () => {
    if (!scrollViewRef.current) return;
    
    // Only function if scrolling is actually needed
    const needsScrolling = calculateScrollNeed(cardHeight, scrollViewHeight);
    if (!needsScrolling) return;
    
    setHasInteractedWithHint(true);
    setShowScrollIndicator(false);
    
    // Scroll to show the action buttons
    scrollViewRef.current.scrollToEnd({ animated: true });
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    // Check if freemium user is trying to share with premium content
    const isPremiumUser = subscriptionService.hasUnlimitedAccess();
    const hasAIBackground = selectedBackground?.isAIGenerated === true;
    const isPremiumBackground = selectedBackground?.isPremiumFeature === true;
    
    // Only block sharing for truly premium content (not featured backgrounds)
    if (!isPremiumUser && (hasAIBackground || isPremiumBackground)) {
      let backgroundType = 'premium';
      if (hasAIBackground) backgroundType = 'AI-generated';
      else if (isPremiumBackground) backgroundType = 'premium';
      
      // Determine the appropriate upgrade trigger based on background type
      const upgradeModalTrigger = hasAIBackground ? 'background_regeneration' : 'premium_backgrounds';
      
      Alert.alert(
        'Premium Feature',
        `Sharing with ${backgroundType} backgrounds requires a premium subscription. Please select a different background or upgrade to premium.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => {
              setUpgradeModalTrigger(upgradeModalTrigger);
              setShowUpgradeModal(true);
            }
          }
        ]
      );
      return;
    }
    
    try {
      setIsSharing(true);

      // Request permissions if needed
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save photos.');
        return;
      }

      // Generate a meaningful filename
      const filename = `Subliminal - ${selectedArchetype}.png`;
      const tmpDirectory = FileSystem.cacheDirectory;
      const filePath = tmpDirectory + filename;

      // Capture the card view with dynamic height
      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: width - 40,
        height: cardHeight, // Use dynamic height
      });

      if (!uri) return;

      // Copy the temp file to our named file
      await FileSystem.copyAsync({
        from: uri,
        to: filePath
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Share the image
      await Sharing.shareAsync(filePath, {
        mimeType: 'image/png',
        dialogTitle: 'Share your subliminal',
        UTI: 'public.png'
      });

      // Clean up the temporary files
      try {
        await FileSystem.deleteAsync(uri);
        await FileSystem.deleteAsync(filePath);
      } catch (cleanupError) {
        console.log('Cleanup error:', cleanupError);
      }

    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to save or share the image. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const saveToDevice = async (uri: string) => {
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Image saved to your photos!');
    } catch (error) {
      console.error('Error saving to device:', error);
      Alert.alert('Error', 'Failed to save the image. Please try again.');
    }
  };

  const handleViewModeChange = (newMode: ViewMode) => {
    if (newMode === viewMode) return; // Don't transition if already in the target mode
    
    // Start fade out
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Only proceed if the animation completed
      if (finished) {
        // Change the mode
        setViewMode(newMode);
        
        // Reset interaction state for new mode
        setHasInteractedWithHint(false);
        
        // Small delay before fading back in to ensure view update
        setTimeout(() => {
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
          
          // Recalculate scroll need after mode change
          // The card will trigger handleCardLayout which will update scroll indicator
        }, 50);
      }
    });
  };

  const handleRegenerateBackground = async (background: Background) => {
    if (!background.isAIGenerated || isRegenerating) return;
    
    // Check if user has premium access for background regeneration
    const isPremiumUser = subscriptionService.hasUnlimitedAccess();
    
    if (!isPremiumUser) {
      console.log('🎨 Background regeneration requires premium - showing upgrade modal');
      setUpgradeModalTrigger('background_regeneration');
      setShowUpgradeModal(true);
      return;
    }

    // Check if user can generate AI backgrounds
    const canGenerateAI = canGenerateAIBackground;
    
    if (!canGenerateAI) {
      console.log('🎨 AI background limit reached - showing upgrade modal');
      setUpgradeModalTrigger('background_regeneration');
      setShowUpgradeModal(true);
      return;
    }
    
    setIsRegenerating(true);
    
    // Set the background to loading state immediately
    setBackgroundOptions(prevOptions => 
      prevOptions.map(bg => 
        bg.id === background.id ? { ...bg, isLoading: true } : bg
      )
    );
    
    try {
      const response = await fetch('http://192.168.1.35:3000/regenerate-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput,
          archetype: selectedArchetype,
          response: archetypeData.response,
          quote: archetypeData.quote,
          currentStyleIndex: background.styleIndex,
          canGenerateAI: canGenerateAI,
          isPremiumUser: isPremiumUser,
        }),
      });

      const result = await response.json();
      
      if (result.success && result.data.backgroundImage) {
        // Increment AI background usage for the regeneration
        if (result.data.backgroundImage && canGenerateAI) {
          await incrementAIBackgroundUsage();
          console.log('🎨 AI background usage incremented for regeneration');
        }

        // Create updated background
        const updatedBackground: Background = {
          ...background,
          url: result.data.backgroundImage,
          label: result.data.styleName,
          styleIndex: result.data.styleIndex,
          styleName: result.data.styleName,
          isLoading: false,
          backgroundType: 'ai-generated' // Mark as AI-generated
        };
        
        // Update the background options array
        setBackgroundOptions(prevOptions => 
          prevOptions.map(bg => 
            bg.id === background.id ? updatedBackground : bg
          )
        );
        
        // Update the selected background if this was the selected one
        if (selectedBackground?.id === background.id) {
          setSelectedBackground(updatedBackground);
        }
        
        console.log(`🎨 Background regenerated: ${result.data.styleName}`);
      } else {
        // Reset loading state on error
        setBackgroundOptions(prevOptions => 
          prevOptions.map(bg => 
            bg.id === background.id ? { ...bg, isLoading: false } : bg
          )
        );
        Alert.alert('Error', 'Failed to regenerate background. Please try again.');
      }
    } catch (error) {
      console.error('Error regenerating background:', error);
      // Reset loading state on error
      setBackgroundOptions(prevOptions => 
        prevOptions.map(bg => 
          bg.id === background.id ? { ...bg, isLoading: false } : bg
        )
      );
      Alert.alert('Error', 'Failed to regenerate background. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#0A0A0A', '#141414']}
      locations={[0, 1]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Customize & Share</Text>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.mainScroll}
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mainScrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={handleScrollViewLayout}
        >
          {/* View Mode Toggle */}
          <View style={styles.toggleContainer}>
            <Pressable 
              style={[
                styles.toggleButton,
                viewMode === 'QUOTE_ONLY' && styles.toggleButtonActive,
                { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
              ]}
              onPress={() => handleViewModeChange('QUOTE_ONLY')}
            >
              <Text style={[
                styles.toggleText,
                viewMode === 'QUOTE_ONLY' && styles.toggleTextActive
              ]}>QUOTE ONLY</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.toggleButton,
                viewMode === 'FULL_SUBLIMINAL' && styles.toggleButtonActive,
                { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
              ]}
              onPress={() => handleViewModeChange('FULL_SUBLIMINAL')}
            >
              <Text style={[
                styles.toggleText,
                viewMode === 'FULL_SUBLIMINAL' && styles.toggleTextActive
              ]}>FULL SUBLIMINAL</Text>
            </Pressable>
          </View>

          <View style={styles.cardWrapper}>
            <ViewShot
              ref={cardRef}
              options={{
                format: "png",
                quality: 1,
                result: "tmpfile",
              }}
              style={[
                styles.captureContainer,
                {
                  width: width - 40,
                  height: cardHeight,
                }
              ]}
            >
              <ScrollView 
                scrollEnabled={false}
                contentContainerStyle={styles.cardScrollContent}
                style={styles.cardScroll}
              >
                {viewMode === 'QUOTE_ONLY' ? (
                  <QuoteCard
                    selectedArchetype={selectedArchetype}
                    archetypeData={archetypeData}
                    background={selectedBackground}
                    contentFadeAnim={contentFadeAnim}
                    onLayout={handleCardLayout}
                  />
                ) : (
                  <SubliminalCard
                    userInput={userInput}
                    selectedArchetype={selectedArchetype}
                    archetypeData={archetypeData}
                    background={selectedBackground}
                    contentFadeAnim={contentFadeAnim}
                    onLayout={handleCardLayout}
                  />
                )}
              </ScrollView>
            </ViewShot>
          </View>

          {/* Dynamic spacing based on card height */}
          <View style={{ height: 32 }} />

          <View style={styles.bottomContentContainer}>
            <BackgroundPicker
              backgrounds={backgroundOptions}
              selectedBackground={selectedBackground}
              onSelectBackground={setSelectedBackground}
              onRegenerateBackground={handleRegenerateBackground}
              isRegenerating={isRegenerating}
              canRegenerateAI={canGenerateAIBackground}
              isPremiumUser={subscriptionService.hasUnlimitedAccess()}
              onUpgrade={() => {
                setUpgradeModalTrigger('background_regeneration');
                setShowUpgradeModal(true);
              }}
            />

            <TouchableOpacity 
              style={[
                styles.shareButton,
                isSharing && styles.shareButtonDisabled
              ]}
              onPress={handleShare}
              disabled={isSharing}
            >
              <Ionicons name="share-outline" size={24} color="#fff" />
              <Text style={styles.shareButtonText}>
                {isSharing ? 'Preparing...' : 'Share To...'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Scroll Hint - "Tap to see options" */}
        <ScrollHint
          visible={showScrollIndicator}
          text="Tap to see options"
          onPress={handleScrollHintTap}
          bottomOffset={20}
          hasInteracted={hasInteractedWithHint}
        />

        {/* Upgrade Modal */}
        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          trigger={upgradeModalTrigger}
          userInput={userInput}
          archetypeName={selectedArchetype}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT : 16,
    paddingHorizontal: 20,
    height: Platform.OS === 'ios' ? 84 : 64,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    height: 36,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  toggleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2B2B2B',
  },
  toggleText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  cardWrapper: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  captureContainer: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardScroll: {
    width: '100%',
    height: '100%',
  },
  cardScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  previewCard: {
    width: width - 40,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    shadowColor: '#595959',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    marginTop: 24,
  },
  quoteOnlyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 0,
    marginTop: -40,
    backgroundColor: 'transparent',
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  archetypeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  archetypeTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  archetypeSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
  },
  fullQuoteWrapper: {
    paddingHorizontal: 20,
    marginHorizontal: -20,
    alignItems: 'center',
    paddingBottom: 12,
  },
  fullQuote: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'PlayfairDisplay_500Medium_Italic',
    textAlign: 'center',
    maxWidth: 280,
    alignSelf: 'center',
  },
  largeQuote: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 42,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_500Medium_Italic',
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 20,
    marginBottom: 12,
  },
  backgroundPickerContainer: {
    overflow: 'visible',
    marginBottom: 32,
  },
  backgroundPicker: {
    paddingLeft: 20,
  },
  backgroundPickerContent: {
    paddingRight: 20,
    gap: 16,
    paddingVertical: 4,
  },
  backgroundOption: {
    width: 64,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
  },
  backgroundOptionSelected: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  backgroundThumbnail: {
    width: '100%',
    height: '100%',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 'auto',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  bottomContentContainer: {
    paddingTop: 8,
  },
});

export default ShareSuiteScreen; 