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
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  useFonts,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_500Medium_Italic,
} from '@expo-google-fonts/playfair-display';
import { saveSubliminal, isSubliminalSaved } from '../utils/storage';
import { FullSubliminalContent } from '../components/FullSubliminalContent';
import { BackButton } from '../components/BackButton';
import { ScrollHint } from '../components/ScrollHint';
import { useDailyUsage } from '../context/DailyUsageContext';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 24;
const BUTTON_CONTAINER_HEIGHT = 120;

const CONTENT_PADDING = {
  TOP: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT + 100 : 104,
  BOTTOM: BUTTON_CONTAINER_HEIGHT + 32,
  HORIZONTAL: 20,
};

// Core thresholds for content behavior
const THRESHOLDS = {
  MIN_CONTENT_HEIGHT: 400, // Minimum height for normal content behavior - below this, always show buttons
  SCROLL_HINT_DELAY: 1000, // Delay before showing scroll hint (ms)
  BOTTOM_THRESHOLD: 150, // Distance from bottom to show buttons when scrolling
  TOP_THRESHOLD: 50, // Distance from top to consider "at top" for hint re-appearance
};

type ArchetypeData = {
  icon: string;
  response: string;
  fullMessage: string;
  quote: string;
  tags: string[];
  backgroundImage?: string; // AI-generated background URL
  isHinderingEntry?: boolean; // Indicates if this was a hindering entry requiring extra care
};

type RootStackParamList = {
  Home: undefined;
  ArchetypeSelection: { 
    userInput: string; 
    selectedArchetypeInSession?: string; 
    archetypeResponses?: {[key: string]: ArchetypeData}; // Preserve generated responses
  };
  FullSubliminalView: {
    userInput: string;
    selectedArchetype: string;
    archetypeData: ArchetypeData;
    selectedArchetypeInSession?: string;
    archetypeResponses?: {[key: string]: ArchetypeData}; // Pass all responses for when user goes back
  };
  ShareSuite: {
    userInput: string;
    selectedArchetype: string;
    archetypeData: ArchetypeData;
    selectedArchetypeInSession?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FullSubliminalView'>;
type RoutePropType = RouteProp<RootStackParamList, 'FullSubliminalView'>;

const FullSubliminalView = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { userInput, selectedArchetype, archetypeData, selectedArchetypeInSession, archetypeResponses } = route.params;
  const { incrementUsage } = useDailyUsage();
  const [showButtons, setShowButtons] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const lastScrollY = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [contentFitsScreen, setContentFitsScreen] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [hasIncrementedUsage, setHasIncrementedUsage] = useState(false);
  
  // Single animated value to control the entire transition
  const saveTransitionAnim = useRef(new Animated.Value(0)).current;
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_500Medium_Italic,
  });

  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [hasInteractedWithHint, setHasInteractedWithHint] = useState(false);
  const isAtTop = useRef(true);

  // Calculate content constraints and set initial UI state
  const calculateContentConstraints = (contentHeight: number, layoutHeight: number) => {
    // Calculate the exact space available for content (excluding padding and button area)
    const availableContentHeight = layoutHeight - CONTENT_PADDING.TOP - CONTENT_PADDING.BOTTOM;
    
    // Calculate if content + buttons can fit in the available screen space
    // We need to account for the button container height when determining if scrolling is needed
    const totalRequiredHeight = contentHeight + BUTTON_CONTAINER_HEIGHT;
    const availableScreenHeight = layoutHeight - CONTENT_PADDING.TOP;
    
    // CLEAR RULE: Scrolling is needed if total content + buttons exceeds available screen space
    const needsScrollingToReachButtons = totalRequiredHeight > availableScreenHeight;
    
    // Content fits if it doesn't exceed the available content area
    const contentFitsInViewport = contentHeight <= availableContentHeight;
    
    // Update content fit state
    setContentFitsScreen(!needsScrollingToReachButtons);
    
    // CLEAR RULE: Only show buttons immediately if NO scrolling is needed to reach them
    if (!needsScrollingToReachButtons) {
      setShowButtons(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.bezier(0.2, 0, 0.2, 1),
        useNativeDriver: true,
      }).start();
      setShowScrollHint(false); // No hint needed if buttons are already visible
    } else {
      // CLEAR RULE: Hide buttons initially if scrolling is needed
      setShowButtons(false);
      fadeAnim.setValue(0);
      
      // CLEAR RULE: Show scroll hint if scrolling is needed to reach buttons
      setShowScrollHint(true);
    }
    
    return needsScrollingToReachButtons;
  };

  // Handle ScrollView layout
  const onScrollViewLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setScrollViewHeight(height);
    
    // Add small delay to ensure measurements are stable
    setTimeout(() => {
      if (contentHeight > 0) {
        calculateContentConstraints(contentHeight, height);
      }
    }, 100);
  };

  // Handle content size change
  const onContentSizeChange = (width: number, height: number) => {
    setContentHeight(height);
    
    // Add small delay to ensure measurements are stable
    setTimeout(() => {
      if (scrollViewHeight > 0) {
        calculateContentConstraints(height, scrollViewHeight);
      }
    }, 100);
  };

  // Handle scroll events for button visibility and scroll hint
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // If content fits on screen, no need to handle scroll-based button visibility
    if (contentFitsScreen) return;

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollY = contentOffset.y;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - currentScrollY;
    const isScrollingUp = currentScrollY < lastScrollY.current;
    
    // Check if we're at the top
    const nearTop = currentScrollY <= THRESHOLDS.TOP_THRESHOLD;
    
    // Update top position state if changed
    if (nearTop !== isAtTop.current) {
      isAtTop.current = nearTop;
      
      // If we're back at top and buttons aren't visible, show hint again
      // Only if scrolling is actually needed to reach buttons
      if (nearTop && !showButtons && hasInteractedWithHint) {
        const totalRequiredHeight = contentHeight + BUTTON_CONTAINER_HEIGHT;
        const availableScreenHeight = scrollViewHeight - CONTENT_PADDING.TOP;
        const stillNeedsScrolling = totalRequiredHeight > availableScreenHeight;
        
        if (stillNeedsScrolling) {
          setShowScrollHint(true);
        }
      }
    }
    
    // Show buttons if:
    // 1. User is scrolling up, or
    // 2. User is near bottom (close to action buttons)
    const shouldShowButtons = isScrollingUp || distanceFromBottom < THRESHOLDS.BOTTOM_THRESHOLD;
    
    if (shouldShowButtons !== showButtons) {
      setShowButtons(shouldShowButtons);
      Animated.timing(fadeAnim, {
        toValue: shouldShowButtons ? 1 : 0,
        duration: shouldShowButtons ? 400 : 300,
        easing: Easing.bezier(shouldShowButtons ? 0.2 : 0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }).start();
      
      // Hide scroll hint when buttons appear
      if (shouldShowButtons && showScrollHint) {
        setShowScrollHint(false);
      }
    }
    
    lastScrollY.current = currentScrollY;
  };

  // Handle scroll hint tap
  const handleScrollHintTap = () => {
    // Only function if content actually requires scrolling to reach buttons
    if (!scrollViewRef.current || contentFitsScreen) return;
    
    // Double-check that scrolling is still needed
    const totalRequiredHeight = contentHeight + BUTTON_CONTAINER_HEIGHT;
    const availableScreenHeight = scrollViewHeight - CONTENT_PADDING.TOP;
    const needsScrolling = totalRequiredHeight > availableScreenHeight;
    
    if (!needsScrolling) return;
    
    setHasInteractedWithHint(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Show buttons
    setShowButtons(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.bezier(0.2, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();

    // Hide scroll hint
    setShowScrollHint(false);

    // Scroll to show the action buttons
    // Calculate the exact scroll position needed to show buttons
    const targetScrollY = Math.max(0, contentHeight - (scrollViewHeight - CONTENT_PADDING.TOP - BUTTON_CONTAINER_HEIGHT));
    
    scrollViewRef.current.scrollTo({ 
      y: targetScrollY, 
      animated: true 
    });
  };

  // Check if subliminal is saved on mount
  useEffect(() => {
    const checkSavedStatus = async () => {
      const saved = await isSubliminalSaved(userInput, selectedArchetype);
      setIsSaved(saved);
      saveTransitionAnim.setValue(saved ? 1 : 0);
    };
    checkSavedStatus();
  }, [userInput, selectedArchetype]);

  // Increment usage when user actually views the full subliminal (only once per session)
  // Only increment for NEW entries, not for viewing saved subliminals
  useEffect(() => {
    const trackUsage = async () => {
      // Only increment usage if this is a new entry (has session indicators)
      // Saved subliminals won't have selectedArchetypeInSession or archetypeResponses
      const isNewEntry = !!(selectedArchetypeInSession || archetypeResponses);
      
      if (isNewEntry && !hasIncrementedUsage) {
        await incrementUsage();
        setHasIncrementedUsage(true);
        console.log('📊 Daily usage incremented in FullSubliminalView - user actually viewed the subliminal');
      } else if (!isNewEntry) {
        console.log('🔍 Viewing saved subliminal - no usage increment needed');
      }
    };
    trackUsage();
  }, []);

  const handleSave = async () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    try {
      if (!isSaved) {
        // Save the subliminal
        await saveSubliminal({
          userInput,
          selectedArchetype,
          archetypeData,
        });
      }
      // Note: We'll implement unsave functionality later

      // Animate the transition
      Animated.timing(saveTransitionAnim, {
        toValue: isSaved ? 0 : 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.bezier(0.2, 0, 0.2, 1),
      }).start(() => {
        setIsSaved(!isSaved);
        setIsTransitioning(false);
      });
    } catch (error) {
      console.error('Error saving subliminal:', error);
      setIsTransitioning(false);
    }
  };

  const handleShare = () => {
    navigation.navigate('ShareSuite', {
      userInput,
      selectedArchetype,
      archetypeData,
      selectedArchetypeInSession,
    });
  };

  // Custom back handler to navigate back appropriately
  const handleGoBack = () => {
    // If we have selectedArchetypeInSession or archetypeResponses, we came from a new entry flow
    // Otherwise, we came from saved subliminals and should go back to previous screen
    if (selectedArchetypeInSession || archetypeResponses) {
      // Navigate back to ArchetypeSelection for new entry flow
      navigation.navigate('ArchetypeSelection', {
        userInput,
        selectedArchetypeInSession,
        archetypeResponses, // Pass back the archetype responses to preserve them
      });
    } else {
      // Navigate back to previous screen (likely Saved tab)
      navigation.goBack();
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
        <BackButton withGradient onPress={handleGoBack} />

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          contentContainerStyle={[
            styles.scrollContent,
            contentHeight < THRESHOLDS.MIN_CONTENT_HEIGHT && styles.centerShortContent
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={onContentSizeChange}
          onLayout={onScrollViewLayout}
        >
          <FullSubliminalContent
            userInput={userInput}
            selectedArchetype={selectedArchetype}
            archetypeData={archetypeData}
          />
        </ScrollView>

        <ScrollHint
          visible={showScrollHint}
          onPress={handleScrollHintTap}
          bottomOffset={BUTTON_CONTAINER_HEIGHT + 16}
          hasInteracted={hasInteractedWithHint}
          delay={THRESHOLDS.SCROLL_HINT_DELAY}
        />

        <Animated.View 
          style={[
            styles.buttonContainer,
            { 
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [BUTTON_CONTAINER_HEIGHT/2, 0],
                  extrapolate: 'clamp',
                })
              }]
            }
          ]}
          pointerEvents={showButtons ? "auto" : "none"}
        >
          <LinearGradient
            colors={['rgba(10, 10, 10, 0)', 'rgba(10, 10, 10, 0.95)', '#0A0A0A']}
            style={styles.buttonBackground}
            pointerEvents="none"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleSave}
              disabled={isTransitioning}
            >
              <Animated.View style={{
                position: 'relative',
                width: 24,
                height: 24,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {/* Outline Icon */}
                <Animated.View style={{
                  position: 'absolute',
                  opacity: saveTransitionAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 0, 0],
                  }),
                  transform: [{
                    scale: saveTransitionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.8],
                    }),
                  }],
                }}>
                  <Ionicons 
                    name="bookmark-outline" 
                    size={24} 
                    color="#fff" 
                  />
                </Animated.View>
                
                {/* Filled Icon */}
                <Animated.View style={{
                  position: 'absolute',
                  opacity: saveTransitionAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 1],
                  }),
                  transform: [{
                    scale: saveTransitionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  }],
                }}>
                  <Ionicons 
                    name="bookmark" 
                    size={24} 
                    color="#fff" 
                  />
                </Animated.View>
              </Animated.View>

              <Animated.View style={{
                overflow: 'hidden',
                position: 'relative',
                marginLeft: 8,
              }}>
                {/* "Save" Text */}
                <Animated.Text style={[
                  styles.buttonText,
                  {
                    position: 'absolute',
                    opacity: saveTransitionAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 0, 0],
                    }),
                    transform: [{
                      translateY: saveTransitionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 10],
                      }),
                    }],
                  }
                ]}>
                  Save
                </Animated.Text>

                {/* "Saved" Text */}
                <Animated.Text style={[
                  styles.buttonText,
                  {
                    opacity: saveTransitionAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0, 1],
                    }),
                    transform: [{
                      translateY: saveTransitionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                      }),
                    }],
                  }
                ]}>
                  Saved
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: CONTENT_PADDING.TOP,
    paddingBottom: CONTENT_PADDING.BOTTOM,
    paddingHorizontal: CONTENT_PADDING.HORIZONTAL,
  },
  centerShortContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 38,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#2B2B2B',
    marginVertical: 16,
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  archetypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  archetypeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tag: {
    color: '#666',
    fontSize: 13,
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  tagSeparator: {
    color: '#666',
    marginHorizontal: 8,
    fontSize: 13,
  },
  message: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 16,
  },
  quote: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'PlayfairDisplay_500Medium_Italic',
    marginTop: 16,
  },
  bottomPadding: {
    height: BUTTON_CONTAINER_HEIGHT + 32,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BUTTON_CONTAINER_HEIGHT + 40,
  },
  buttonBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    gap: 12,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    borderRadius: 12,
    minWidth: 100,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default FullSubliminalView; 