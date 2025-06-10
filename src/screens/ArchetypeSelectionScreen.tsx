import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Easing,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { generateSubliminalContent, generateSubliminalContentFast, generateBackgroundImage } from '../services/api';
import { ArchetypeCardSkeleton } from '../components/ArchetypeCardSkeleton';
import { useDailyUsage } from '../context/DailyUsageContext';
import { UpgradeModal } from '../components/UpgradeModal';
import subscriptionService from '../services/subscriptionService';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 24;

// Add these types at the top after imports
type ArchetypeData = {
  icon: string;
  response: string;
  fullMessage: string;
  quote: string;
  tags: string[];
  backgroundImage?: string; // AI-generated background URL
  backgroundType?: string; // Type of background (ai-generated, contextual-color, etc.)
  isHinderingEntry?: boolean; // Indicates if this was a hindering entry requiring extra care
};

// Define archetype configurations
const ARCHETYPES = {
  Mirror: {
    icon: '🪞',
    tags: ["STILL", "HONEST", "REFLECTIVE"]
  },
  Therapist: {
    icon: '🫂',
    tags: ["VALIDATING", "GROUNDED", "GENTLE"]
  },
  Realist: {
    icon: '🪓',
    tags: ["BLUNT", "CLARIFYING", "UNFILTERED"]
  },
  Poet: {
    icon: '🌙',
    tags: ["LYRICAL", "VISUAL", "SOULFUL"]
  },
  'Best Friend': {
    icon: '🫶',
    tags: ["LOYAL", "SUPPORTIVE", "FAMILIAR"]
  }
};

// Helper function to parse OpenAI response into structured data
const parseOpenAIResponse = (apiResponse: string, archetype: string): ArchetypeData => {
  try {
    // Parse the JSON response from the API
    const parsedData = JSON.parse(apiResponse);
    
    console.log(`Parsing ${archetype} response:`, parsedData);
    
    // Return the data but preserve the original frontend tags
    return {
      icon: parsedData.icon,
      response: parsedData.response,
      fullMessage: parsedData.fullMessage,
      quote: parsedData.quote,
      tags: ARCHETYPES[archetype as keyof typeof ARCHETYPES].tags, // Always use frontend tags
      backgroundImage: parsedData.backgroundImage, // Include AI-generated background
    };
  } catch (error) {
    console.error(`Error parsing ${archetype} response:`, error);
    
    // Fallback to the old parsing logic if JSON parsing fails
    const cleanResponse = apiResponse.replace(/^["']|["']$/g, '').trim().replace(/\\n/g, '\n');
    
    return {
      icon: ARCHETYPES[archetype as keyof typeof ARCHETYPES].icon,
      response: cleanResponse,
      fullMessage: cleanResponse,
      quote: "Every feeling has wisdom to offer.",
      tags: ARCHETYPES[archetype as keyof typeof ARCHETYPES].tags,
    };
  }
};

// Helper function to create a preview of the response (first 1-2 lines)
const createResponsePreview = (fullMessage: string): string => {
  if (!fullMessage) return "Tap to see full response";
  
  // Remove quotes from the beginning and end
  const cleanMessage = fullMessage.replace(/^["']|["']$/g, '').trim();
  
  // Split into sentences and take the first 1-2 sentences
  const sentences = cleanMessage.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return "Tap to see full response";
  
  // Take first sentence, or first two if the first is very short
  let preview = sentences[0].trim();
  if (preview.length < 50 && sentences.length > 1) {
    preview += '. ' + sentences[1].trim();
  }
  
  // Add ellipsis if there's more content
  if (sentences.length > 1 && preview.length < cleanMessage.length - 20) {
    preview += '...';
  }
  
  return preview;
};



type RootStackParamList = {
  TabNavigator: undefined;
  Home: undefined;
  ArchetypeSelection: { 
    userInput: string; 
    selectedArchetypeInSession?: string; // Track which archetype was selected for freemium locking
    archetypeResponses?: {[key: string]: ArchetypeData}; // Preserve generated responses
  };
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
      isHinderingEntry?: boolean; // Indicates if this was a hindering entry requiring extra care
    };
    selectedArchetypeInSession?: string; // Track selected archetype for freemium locking
    archetypeResponses?: {[key: string]: ArchetypeData}; // Pass all responses for when user goes back
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
      isHinderingEntry?: boolean; // Indicates if this was a hindering entry requiring extra care
    };
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ArchetypeSelection'>;
type RoutePropType = RouteProp<RootStackParamList, 'ArchetypeSelection'>;

const ArchetypeSelectionScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { userInput, selectedArchetypeInSession, archetypeResponses: passedArchetypeResponses } = route.params;
  const { 
    dailyUsage, 
    dailyLimit, 
    isLimitReached, 
    canGenerate, 
    incrementUsage, 
    resetBannerForLimitAttempt,
    checkAndShowBannerOnHomeReturn,
    // AI Background tracking
    aiBackgroundUsage,
    aiBackgroundLimit,
    canGenerateAIBackground,
    incrementAIBackgroundUsage,
  } = useDailyUsage();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loadingArchetype, setLoadingArchetype] = useState<string | null>(null);
  const [archetypeResponses, setArchetypeResponses] = useState<{[key: string]: ArchetypeData}>(passedArchetypeResponses || {});
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(!passedArchetypeResponses || Object.keys(passedArchetypeResponses).length === 0);
  const [showUserInputModal, setShowUserInputModal] = useState(false);
  const [backgroundsLoading, setBackgroundsLoading] = useState<{[key: string]: boolean}>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<'daily_limit' | 'archetype_switching' | 'premium_archetype' | 'ai_backgrounds'>('archetype_switching');
  const [upgradeModalArchetype, setUpgradeModalArchetype] = useState<string | undefined>(undefined);
  const [isGeneratingFullContent, setIsGeneratingFullContent] = useState(false);
  
  // Check premium status at component level
  const isPremiumUser = subscriptionService.hasUnlimitedAccess();

  // Helper function to truncate user input
  const truncateUserInput = (input: string, maxLines: number = 2): { truncated: string; needsTruncation: boolean } => {
    const words = input.split(' ');
    const wordsPerLine = 8; // Approximate words per line based on font size
    const maxWords = maxLines * wordsPerLine;
    
    if (words.length <= maxWords) {
      return { truncated: input, needsTruncation: false };
    }
    
    const truncated = words.slice(0, maxWords).join(' ') + '...';
    return { truncated, needsTruncation: true };
  };

  const { truncated: displayUserInput, needsTruncation } = truncateUserInput(userInput);

  // Generate background image for a specific archetype
  const generateArchetypeBackground = async (archetype: string, archetypeData: ArchetypeData) => {
    if (backgroundsLoading[archetype] || archetypeData.backgroundImage) {
      return; // Already loading or already has background
    }

    setBackgroundsLoading(prev => ({ ...prev, [archetype]: true }));

    try {
      const backgroundResult = await generateBackgroundImage(
        userInput,
        archetype,
        archetypeData.response,
        archetypeData.quote
      );

      if (backgroundResult.backgroundImage) {
        setArchetypeResponses(prev => ({
          ...prev,
          [archetype]: {
            ...prev[archetype],
            backgroundImage: backgroundResult.backgroundImage || undefined
          }
        }));
      }
    } catch (error) {
      console.error(`Error generating background for ${archetype}:`, error);
    } finally {
      setBackgroundsLoading(prev => ({ ...prev, [archetype]: false }));
    }
  };

  // Generate preview content for all archetypes when screen loads (fast text-only)
  useEffect(() => {
    const generatePreviews = async () => {
      // Check if we already have previews for this user input - if so, don't regenerate
      if (Object.keys(archetypeResponses).length > 0) {
        console.log('🔄 Previews already exist for this session, skipping regeneration');
        return;
      }

      // Always generate real previews, regardless of daily limit status
      // The UI will handle the clickability and styling based on limit state

      try {
        console.log('🎯 Starting fast preview generation for user input:', userInput);
        setIsGeneratingPreviews(true);

        // Generate all archetype previews in parallel
        const archetypeNames = Object.keys(ARCHETYPES);
        console.log('🎭 Generating previews for archetypes:', archetypeNames);

        const promises = archetypeNames.map(async (archetype) => {
          try {
            console.log(`⚡ Fast generating ${archetype} preview...`);
            const response = await generateSubliminalContentFast(userInput, archetype);
            console.log(`✅ ${archetype} preview generated successfully`);
            return { archetype, response };
          } catch (error) {
            console.error(`❌ Error generating ${archetype} preview:`, error);
            return { archetype, response: null };
          }
        });

        const results = await Promise.all(promises);
        
        // Do NOT increment usage here - usage should only be incremented when user actually views the full subliminal
        console.log('📊 Previews generated without incrementing usage - usage will be incremented in FullSubliminalView');

        // Process responses
        const newResponses: {[key: string]: ArchetypeData} = {};
        results.forEach(({ archetype, response }) => {
          if (response) {
            newResponses[archetype] = parseOpenAIResponse(response, archetype);
          } else {
            // Create fallback response for failed API calls
            newResponses[archetype] = {
              icon: ARCHETYPES[archetype as keyof typeof ARCHETYPES].icon,
              response: "Unable to generate preview",
              fullMessage: "We're having trouble connecting right now. Please try again or upgrade for unlimited access.",
              quote: "Your personalized response awaits...",
              tags: ARCHETYPES[archetype as keyof typeof ARCHETYPES].tags,
            };
          }
        });

        setArchetypeResponses(newResponses);
        setIsGeneratingPreviews(false);

        console.log('🎉 All previews generated and stored');
      } catch (error) {
        console.error('💥 Error in generatePreviews:', error);
        setIsGeneratingPreviews(false);
      }
    };

    generatePreviews();
  }, [userInput]);

  // Generate full content when user selects an archetype
  const generateFullContentForArchetype = async (archetype: string): Promise<ArchetypeData | null> => {
    try {
      setIsGeneratingFullContent(true);
      console.log(`🎯 Generating full content for ${archetype}...`);

      // Check if user can generate AI backgrounds
      const canGenerateAI = canGenerateAIBackground;
      const isPremiumUser = subscriptionService.hasUnlimitedAccess();

      console.log('🎨 AI Background Permission Check:', {
        canGenerateAI,
        isPremiumUser,
        aiBackgroundUsage,
        aiBackgroundLimit,
        archetype
      });

      // Generate full content with AI background permission
      const response = await generateSubliminalContent(userInput, archetype, canGenerateAI, isPremiumUser);
      const fullData: ArchetypeData = JSON.parse(response);

      console.log(`✅ Full content generated for ${archetype}`);
      console.log('🎨 Background type received:', fullData.backgroundType);

      // Increment AI background usage if this was an AI-generated background
      if (fullData.backgroundType === 'ai-generated' && canGenerateAI) {
        await incrementAIBackgroundUsage();
        console.log('🎨 AI background usage incremented');
      }

      // Check if this is a positive entry - don't show upgrade modals for positive entries
      const isPositiveEntry = checkIfPositiveEntry(userInput);

      // Show upgrade modal if user got a contextual background due to AI limit
      // BUT NOT for positive entries - positive entries should just work gracefully
      if (fullData.backgroundType === 'contextual-color' && !isPremiumUser && !canGenerateAI && !isPositiveEntry) {
        console.log('🎨 Showing AI background upgrade modal (non-positive entry)');
        setUpgradeModalTrigger('ai_backgrounds');
        setUpgradeModalArchetype(archetype);
        setShowUpgradeModal(true);
      } else if (fullData.backgroundType === 'contextual-color' && !isPremiumUser && !canGenerateAI && isPositiveEntry) {
        console.log('🎨 Skipping AI background upgrade modal for positive entry - graceful fallback');
      }

      return fullData;
    } catch (error) {
      console.error(`Error generating full content for ${archetype}:`, error);
      return null;
    } finally {
      setIsGeneratingFullContent(false);
    }
  };

  // Helper function to detect positive entries
  const checkIfPositiveEntry = (input: string): boolean => {
    const normalizedInput = input
      .toLowerCase()
      .replace(/[.,!?;:\-()[\]{}'"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const positivePatterns = [
      // Feeling good patterns
      'feel great', 'feeling great', 'feel amazing', 'feeling amazing', 
      'feel wonderful', 'feeling wonderful', 'feel fantastic', 'feeling fantastic',
      'feel good', 'feeling good', 'feel better', 'feeling better',
      'feel happy', 'feeling happy', 'feel joyful', 'feeling joyful',
      'feel blessed', 'feeling blessed', 'feel grateful', 'feeling grateful',
      'feel thankful', 'feeling thankful', 'feel positive', 'feeling positive',
      'feel optimistic', 'feeling optimistic', 'feel hopeful', 'feeling hopeful',
      'feel confident', 'feeling confident', 'feel strong', 'feeling strong',
      'feel proud', 'feeling proud', 'feel accomplished', 'feeling accomplished',
      'feel successful', 'feeling successful', 'feel fulfilled', 'feeling fulfilled',
      'feel content', 'feeling content', 'feel peaceful', 'feeling peaceful',
      'feel calm', 'feeling calm', 'feel relaxed', 'feeling relaxed',
      'feel energized', 'feeling energized', 'feel motivated', 'feeling motivated',
      'feel inspired', 'feeling inspired', 'feel excited', 'feeling excited',
      'feel ready', 'feeling ready', 'feel prepared', 'feeling prepared',
      'feel supported', 'feeling supported', 'feel loved', 'feeling loved',
      'feel appreciated', 'feeling appreciated', 'feel valued', 'feeling valued',
      'feel connected', 'feeling connected', 'feel like im growing', 'feeling like im growing',
      'feel progress', 'feeling progress', 'making progress', 'growing stronger',
      'getting better', 'improving', 'healing', 'recovered', 'recovering',
      'feel centered', 'feeling centered', 'feel balanced', 'feeling balanced',
      'feel at peace', 'feeling at peace', 'feel whole', 'feeling whole',
      
      // Achievement and pride patterns
      'proud of', 'proud that', 'achieved', 'accomplished', 'succeeded',
      'reached my goal', 'completed', 'finished', 'made it', 'did it',
      'overcame', 'got through', 'survived', 'made progress', 'moved forward',
      'how far ive come', 'how far i have come', 'where i am now', 'come so far',
      'progress ive made', 'progress i have made', 'growth ive had', 'journey ive taken',
      
      // Gratitude patterns  
      'grateful for', 'thankful for', 'blessed with', 'appreciate',
      'love my', 'surrounded by love', 'supported by', 'great friends',
      'wonderful family', 'amazing people', 'feel loved by', 'care about me',
      
      // Positive outlook patterns
      'excited about', 'looking forward', 'cant wait', 'eager to',
      'optimistic about', 'hopeful about', 'confident about', 'ready for',
      'bright future', 'good things coming', 'positive changes',
      'things are good', 'things are great', 'life is good', 'life is great',
      'things are looking up', 'turning around', 'getting back on track',
      'feeling myself again', 'back to myself', 'like myself again',
      
      // Celebration patterns
      'celebrating', 'victory', 'win', 'breakthrough', 'milestone',
      'success', 'triumph', 'achievement', 'accomplishment'
    ];
    
    return positivePatterns.some(pattern => normalizedInput.includes(pattern));
  };

  const handleGoBack = () => {
    // Trigger banner check when returning to home
    checkAndShowBannerOnHomeReturn();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }]
    });
  };

  const handleArchetypeSelect = (archetype: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Check if daily limit is reached - only applies when starting a completely NEW entry (no selectedArchetypeInSession)
    // If user has selectedArchetypeInSession, they're returning from a valid entry (1-3) and can access their selection
    const isDailyLimitReached = isLimitReached && !canGenerate && !selectedArchetypeInSession;
    if (isDailyLimitReached) {
      // Reset banner state so it shows when user returns to home
      resetBannerForLimitAttempt();
      // Show upgrade modal for users who hit daily limit
      setUpgradeModalTrigger('daily_limit');
      setUpgradeModalArchetype(archetype);
      setShowUpgradeModal(true);
      return;
    }
    
    // Check if this is a premium-only archetype
    const isPremiumArchetype = subscriptionService.isArchetypePremium(archetype);
    const canAccessArchetype = subscriptionService.canAccessArchetype(archetype);
    
    if (isPremiumArchetype && !canAccessArchetype) {
      // Show upgrade modal for premium archetype
      setUpgradeModalTrigger('premium_archetype');
      setUpgradeModalArchetype(archetype);
      setShowUpgradeModal(true);
      return;
    }
    
    // Check if this archetype is locked (freemium limitation - doesn't apply to premium users)
    const isLocked = !isPremiumUser && selectedArchetypeInSession && selectedArchetypeInSession !== archetype;
    
    if (isLocked) {
      // Show upgrade modal for freemium users
      setUpgradeModalTrigger('archetype_switching');
      setUpgradeModalArchetype(archetype);
      setShowUpgradeModal(true);
      return;
    }
    
    // Use the already generated content
    const archetypeData = archetypeResponses[archetype];
    
    if (archetypeData) {
      // Check if this was a fallback response due to API failure
      if (archetypeData.response === "Unable to generate preview") {
        // Try to regenerate the content
        console.log(`🔄 Retrying generation for ${archetype} due to previous failure`);
        // For now, show the fallback content - in future could implement retry logic
      }
      
      navigation.navigate('FullSubliminalView', {
        userInput,
        selectedArchetype: archetype,
        archetypeData,
        // Track this archetype as selected for the session
        selectedArchetypeInSession: selectedArchetypeInSession || archetype,
        // Pass all archetype responses so they can be preserved when user goes back
        archetypeResponses,
      });
    }
  };

  return (
    <View style={styles.container}>
    <LinearGradient
      colors={['#0A0A0A', '#141414']}
      locations={[0, 1]}
        style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Back Button (S Logo) */}
        <View style={styles.backButton}>
          <TouchableOpacity 
            onPress={handleGoBack} 
            style={styles.backButtonTouchable}
          >
            <Image 
              source={require('../../assets/images/logo.png')}
              style={styles.sLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContainer}>
          <View style={styles.userInputSection}>
            <TouchableOpacity 
              onPress={() => needsTruncation && setShowUserInputModal(true)}
              disabled={!needsTruncation}
              activeOpacity={needsTruncation ? 0.7 : 1}
            >
              <Text style={[styles.header, needsTruncation && styles.tappableHeader]}>
                "{displayUserInput}"
              </Text>
              {needsTruncation && (
                <Text style={styles.tapHint}>Tap to see full message</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.subheader}>Which voice feels true right now?</Text>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isGeneratingPreviews ? (
            // Show skeleton loading cards while generating previews
            Object.keys(ARCHETYPES).map((archetype) => (
              <ArchetypeCardSkeleton key={`skeleton-${archetype}`} />
            ))
          ) : (
            // Show actual archetype cards with content
            Object.entries(ARCHETYPES).map(([archetype, config]) => {
              const responseData = archetypeResponses[archetype];
              
              // Check if this is a premium archetype and if user can access it
              const isPremiumArchetype = subscriptionService.isArchetypePremium(archetype);
              const canAccessArchetype = subscriptionService.canAccessArchetype(archetype);
              const isPremiumLocked = isPremiumArchetype && !canAccessArchetype;
              
              // Check freemium archetype switching limitation (doesn't apply to premium users)
              const isFreemiumLocked = !isPremiumUser && selectedArchetypeInSession && selectedArchetypeInSession !== archetype;
              const isSelected = !isPremiumUser && selectedArchetypeInSession === archetype;
              
              // Daily limit state should only apply when starting a completely NEW entry (no selectedArchetypeInSession)
              // If user has selectedArchetypeInSession, they're returning from a valid entry (1-3) and can access their selection
              const isDailyLimitReached = isLimitReached && !canGenerate && !selectedArchetypeInSession;
              
              // An archetype is locked if it's premium-locked, freemium-locked, or daily limit reached
              const isLocked = isPremiumLocked || isFreemiumLocked || isDailyLimitReached;
              
              return (
                <TouchableOpacity
                  key={archetype}
                  style={[
                    styles.archetypeCard,
                    isLocked && styles.lockedCard,
                    isSelected && styles.selectedCard,
                    isDailyLimitReached && styles.limitReachedCard
                  ]}
                  onPress={() => handleArchetypeSelect(archetype)}
                  disabled={isLocked}
                  activeOpacity={isLocked ? 1 : 0.7}
                >
                  <View style={styles.cardContent}>
                    {/* Lock icon in top right corner */}
                    {isLocked && (
                      <View style={styles.topRightLockIcon}>
                        <Ionicons name="lock-closed" size={18} color="#666" />
                      </View>
                    )}
                    <View style={styles.cardHeader}>
                      <Text style={[
                        styles.cardIcon, 
                        isLocked && styles.lockedIcon,
                        isDailyLimitReached && styles.limitReachedIcon
                      ]}>
                        {config.icon}
                      </Text>
                      <View style={styles.titleContainer}>
                        <Text style={[
                          styles.cardTitle, 
                          isLocked && styles.lockedTitle,
                          isDailyLimitReached && styles.limitReachedTitle
                        ]}>
                          {archetype}
                        </Text>
                        {isSelected && (
                          <Text style={styles.selectedBadge}>SELECTED</Text>
                        )}
                        {isPremiumLocked && (
                          <Text style={styles.premiumBadge}>PREMIUM</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.quoteContainer}>
                      <View style={[
                        styles.quoteLine, 
                        isLocked && styles.lockedQuoteLine,
                        isDailyLimitReached && styles.limitReachedQuoteLine
                      ]} />
                      <View style={isDailyLimitReached ? styles.blurredTextContainer : undefined}>
                        <Text style={[
                          styles.cardResponse, 
                          isLocked && styles.lockedResponse,
                          isDailyLimitReached && styles.limitReachedResponse
                        ]}>
                          {createResponsePreview(responseData?.fullMessage || "")}
                        </Text>
                        {isDailyLimitReached && <View style={styles.blurOverlay} />}
                      </View>
                    </View>
                    <View style={styles.bottomContainer}>
                      <View style={styles.toneContainer}>
                        {config.tags.map((tag, index) => (
                          <View key={index} style={[
                            styles.tonePill, 
                            isLocked && styles.lockedTonePill,
                            isDailyLimitReached && styles.limitReachedTonePill
                          ]}>
                            <Text style={[
                              styles.toneText, 
                              isLocked && styles.lockedToneText,
                              isDailyLimitReached && styles.limitReachedToneText
                            ]}>
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.arrowContainer}>
                        {!isLocked ? (
                          <Ionicons name="chevron-forward" size={20} color="#666" />
                        ) : null}
                      </View>
                    </View>
                  </View>
                  {isLocked && (
                    <TouchableOpacity 
                      style={styles.lockOverlay}
                      onPress={() => {
                        if (isDailyLimitReached) {
                          resetBannerForLimitAttempt();
                          setUpgradeModalTrigger('daily_limit');
                        } else if (isPremiumLocked) {
                          setUpgradeModalTrigger('premium_archetype');
                        } else {
                          setUpgradeModalTrigger('archetype_switching');
                        }
                        setUpgradeModalArchetype(archetype);
                        setShowUpgradeModal(true);
                      }}
                      activeOpacity={0.8}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Upgrade to unlock ${archetype} archetype`}
                      accessibilityHint={
                        isPremiumLocked 
                          ? "Double tap to view premium upgrade options"
                          : isDailyLimitReached 
                          ? "Double tap to upgrade and continue beyond daily limit"
                          : "Double tap to upgrade and unlock archetype switching"
                      }
                    >
                      <LinearGradient
                        colors={['#4A90E2', '#5BA0F2', '#4A90E2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.lockGradientBackground}
                      >
                        <View style={styles.lockCtaContainer}>
                          <Ionicons name="diamond" size={16} color="#FFFFFF" />
                          <Text style={styles.lockText}>Upgrade to unlock all voices</Text>
                          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Bottom Gradient Overlay */}
        <LinearGradient
          colors={['rgba(20, 20, 20, 0)', '#000000']}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
      </SafeAreaView>
    </LinearGradient>

    {/* User Input Modal */}
    <Modal
      visible={showUserInputModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowUserInputModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Input</Text>
            <TouchableOpacity 
              onPress={() => setShowUserInputModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalText}>"{userInput}"</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>

    {/* Upgrade Modal */}
    <UpgradeModal
      visible={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      trigger={upgradeModalTrigger}
      userInput={userInput}
      archetypeName={upgradeModalArchetype}
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
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT + 48 : 52,
    left: -20,
    zIndex: 3,
  },
  backButtonTouchable: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 32,
  },
  sLogo: {
    width: 110,
    height: 110,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: STATUS_BAR_HEIGHT + 140,
    paddingBottom: 24,
  },
  userInputSection: {
    marginBottom: 8,
  },
  header: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subheader: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    zIndex: 2,
  },
  archetypeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
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
  cardContent: {
    padding: 16,
    position: 'relative',
  },
  topRightLockIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  quoteContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingRight: 8,
  },
  quoteLine: {
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 12,
    borderRadius: 1,
  },
  cardResponse: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  toneContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tonePill: {
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  toneText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arrowContainer: {
    marginLeft: 12,
  },
  tappableHeader: {
    color: '#E0E0E0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  modalScrollView: {
    padding: 20,
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  tapHint: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'left',
  },
  // Freemium locking styles
  lockedCard: {
    opacity: 0.6,
    borderColor: '#333',
  },
  selectedCard: {
    borderColor: '#4A90E2',
    borderWidth: 2,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  lockedTitle: {
    opacity: 0.6,
  },
  selectedBadge: {
    color: '#4A90E2',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  lockedQuoteLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  lockedResponse: {
    opacity: 0.5,
  },
  lockedTonePill: {
    backgroundColor: '#111',
    opacity: 0.5,
  },
  lockedToneText: {
    opacity: 0.6,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    zIndex: 10,
  },
  lockGradientBackground: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  lockCtaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockText: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Daily limit reached styles
  limitReachedCard: {
    opacity: 0.9,
    borderColor: '#2A2A2A',
  },
  limitReachedIcon: {
    opacity: 0.7,
  },
  limitReachedTitle: {
    opacity: 0.8,
  },
  limitReachedQuoteLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  blurredTextContainer: {
    position: 'relative',
    flex: 1,
  },
  limitReachedResponse: {
    opacity: 1, // Keep text visible behind blur
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 4,
  },
  limitReachedTonePill: {
    backgroundColor: '#111',
    opacity: 0.7,
  },
  limitReachedToneText: {
    opacity: 0.7,
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  upgradeButtonText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  premiumBadge: {
    color: '#4A90E2',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

export default ArchetypeSelectionScreen; 