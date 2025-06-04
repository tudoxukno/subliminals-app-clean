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
  ArchetypeSelection: { userInput: string };
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ArchetypeSelection'>;
type RoutePropType = RouteProp<RootStackParamList, 'ArchetypeSelection'>;

const ArchetypeSelectionScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { userInput } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);
  const [loadingArchetype, setLoadingArchetype] = useState<string | null>(null);
  const [archetypeResponses, setArchetypeResponses] = useState<{[key: string]: ArchetypeData}>({});
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(true);
  const [showUserInputModal, setShowUserInputModal] = useState(false);
  const [backgroundsLoading, setBackgroundsLoading] = useState<{[key: string]: boolean}>({});

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
      const responses: {[key: string]: ArchetypeData} = {};
      
      // Use Promise.all for parallel text generation (much faster)
      const archetypePromises = Object.entries(ARCHETYPES).map(async ([archetype, config]) => {
        try {
          const generatedContent = await generateSubliminalContentFast(userInput, archetype);
          return { archetype, data: parseOpenAIResponse(generatedContent, archetype) };
        } catch (error) {
          console.error(`Error generating preview for ${archetype}:`, error);
          // Fallback preview
          return {
            archetype,
            data: {
              icon: config.icon,
              response: `Let me reflect on "${userInput}" with you...`,
              fullMessage: `Your feelings about "${userInput}" deserve attention and understanding.`,
              quote: "Every feeling has wisdom to offer.",
              tags: config.tags
            }
          };
        }
      });

      // Wait for all text content to be generated in parallel
      const results = await Promise.all(archetypePromises);
      
      // Set all responses at once
      results.forEach(({ archetype, data }) => {
        responses[archetype] = data;
      });
      
      setArchetypeResponses(responses);
      setIsGeneratingPreviews(false);

      // Start generating backgrounds progressively (non-blocking)
      setTimeout(() => {
        Object.entries(responses).forEach(([archetype, data], index) => {
          // Stagger background generation to avoid rate limits
          setTimeout(() => {
            generateArchetypeBackground(archetype, data);
          }, index * 2000); // 2 second delay between each background generation
        });
      }, 500); // Start after a short delay
    };

    generatePreviews();
  }, [userInput]);

  const handleGoBack = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }]
    });
  };

  const handleArchetypeSelect = (archetype: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Use the already generated content
    const archetypeData = archetypeResponses[archetype];
    
    if (archetypeData) {
    navigation.navigate('FullSubliminalView', {
      userInput,
      selectedArchetype: archetype,
        archetypeData,
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
              return (
                <TouchableOpacity
                  key={archetype}
                  style={styles.archetypeCard}
                  onPress={() => handleArchetypeSelect(archetype)}
                  disabled={!responseData}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardIcon}>{config.icon}</Text>
                      <View style={styles.titleContainer}>
                        <Text style={styles.cardTitle}>{archetype}</Text>
                      </View>
                    </View>
                    <View style={styles.quoteContainer}>
                      <View style={styles.quoteLine} />
                      <Text style={styles.cardResponse}>
                        {createResponsePreview(responseData?.fullMessage || "")}
                      </Text>
                    </View>
                    <View style={styles.bottomContainer}>
                      <View style={styles.toneContainer}>
                        {config.tags.map((tag, index) => (
                          <View key={index} style={styles.tonePill}>
                            <Text style={styles.toneText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.arrowContainer}>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                      </View>
                    </View>
                  </View>
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
  userInputSection: {
    marginBottom: 8,
  },
});

export default ArchetypeSelectionScreen; 