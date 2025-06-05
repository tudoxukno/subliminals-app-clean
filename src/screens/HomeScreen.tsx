import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
  Image,
  Dimensions,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BottomNav } from '../components/BottomNav';
import TextInputField from '../components/TextInputField';
import { DailyLimitBanner } from '../components/DailyLimitBanner';
import { DailyUsageTicker } from '../components/DailyUsageTicker';
import { useDailyUsage } from '../context/DailyUsageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Home: undefined;
  Saved: undefined;
  Settings: undefined;
  ActiveTextInput: { initialText?: string };
  ArchetypeSelection: { userInput: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// Smart Quickstart System
const QUICKSTART_PROMPTS = {
  morning: [
    "I'm ready for a fresh start.",
    "I need some motivation today.",
    "How do I make today count?",
    "I want to feel more confident.",
    "I'm nervous about today.",
    "I need clarity on my goals.",
    "I feel stuck in my routine.",
    "I want to try something new.",
    "I'm feeling really optimistic today.",
    "I accomplished something yesterday.",
    "I'm excited about what's ahead.",
    "I feel energized and ready.",
  ],
  afternoon: [
    "I'm feeling overwhelmed.",
    "I need to make a decision.",
    "I'm doubting myself.",
    "I feel like I'm behind.",
    "I need to refocus.",
    "I'm losing momentum.",
    "I feel scattered.",
    "I need some perspective.",
    "I'm proud of what I did today.",
    "I feel really productive right now.",
    "Something clicked for me today.",
    "I'm grateful for this moment.",
  ],
  evening: [
    "I can't stop replaying it.",
    "I feel invisible.",
    "I'm worried about tomorrow.",
    "I need to process today.",
    "I feel disconnected.",
    "I'm questioning everything.",
    "I feel misunderstood.",
    "I need some peace.",
    "I feel content with today.",
    "I'm appreciating the small things.",
    "I feel connected to myself.",
    "Today was a good day.",
  ],
  lateNight: [
    "I can't turn my mind off.",
    "I feel anxious about everything.",
    "I'm spiraling again.",
    "I feel so alone right now.",
    "I can't sleep.",
    "I'm overthinking everything.",
    "I feel restless.",
    "I need to calm down.",
    "I'm feeling peaceful tonight.",
    "I'm reflecting on my growth.",
    "I feel grateful for today.",
    "I'm excited about tomorrow.",
  ],
  universal: [
    "Is it too late to fix things?",
    "Maybe I should call...",
    "When will it get better?",
    "I feel like giving up.",
    "I'm trying too hard.",
    "I need some hope.",
    "I feel lost.",
    "I'm tired of pretending.",
    "I'm really happy right now.",
    "I feel like I'm growing.",
    "I'm proud of how far I've come.",
    "I feel hopeful about the future.",
    "I'm learning to love myself.",
    "I feel supported and seen.",
    "I'm embracing who I am.",
    "I feel creative and inspired.",
  ]
};

// Get time-based prompt category
const getTimeCategory = (): keyof typeof QUICKSTART_PROMPTS => {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'lateNight';
};

// Smart prompt selection with anti-repetition
const getSmartQuickstarts = async (): Promise<string[][]> => {
  try {
    // Get recent prompts to avoid repetition
    const recentPromptsJson = await AsyncStorage.getItem('recentQuickstarts');
    const recentPrompts: string[] = recentPromptsJson ? JSON.parse(recentPromptsJson) : [];
    
    // Get time-based category
    const timeCategory = getTimeCategory();
    const timePrompts = QUICKSTART_PROMPTS[timeCategory];
    const universalPrompts = QUICKSTART_PROMPTS.universal;
    
    // Add day-of-week and seasonal context
    const contextualPrompts = getContextualPrompts();
    
    // Combine all available prompts
    const allAvailablePrompts = [...timePrompts, ...universalPrompts, ...contextualPrompts];
    
    // Filter out recently used prompts (last 10)
    const availablePrompts = allAvailablePrompts.filter(
      prompt => !recentPrompts.includes(prompt)
    );
    
    // If we've used too many prompts, reset and use all
    const promptsToUse = availablePrompts.length >= 6 ? availablePrompts : allAvailablePrompts;
    
    // Shuffle and select 6 prompts
    const shuffled = promptsToUse.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 6);
    
    // Arrange in 3 rows of 2
    return [
      [selected[0], selected[1]],
      [selected[2], selected[3]],
      [selected[4], selected[5]]
    ];
  } catch (error) {
    console.log('Error getting smart quickstarts:', error);
    // Fallback to default prompts
    return [
      ["I can't stop replaying it.", "I feel invisible."],
      ["I need some clarity...", "When will it get better?"],
      ["Is it too late to fix things?", "Maybe I should call..."]
    ];
  }
};

// Get contextual prompts based on day of week and season
const getContextualPrompts = (): string[] => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const month = now.getMonth(); // 0 = January, 11 = December
  
  const contextualPrompts: string[] = [];
  
  // Day of week prompts
  if (dayOfWeek === 1) { // Monday
    contextualPrompts.push("I'm dreading this week.", "I need Monday motivation.", "I'm excited for a new week.", "I feel ready to tackle this week.");
  } else if (dayOfWeek === 5) { // Friday
    contextualPrompts.push("I'm exhausted from this week.", "I need to decompress.", "I'm proud of what I accomplished this week.", "I'm excited for the weekend.");
  } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
    contextualPrompts.push("I feel guilty for resting.", "I'm lonely on weekends.", "I'm enjoying this downtime.", "I feel recharged and peaceful.");
  }
  
  // Seasonal prompts
  if (month >= 2 && month <= 4) { // Spring
    contextualPrompts.push("I want to start fresh.", "I'm ready for change.", "I feel renewed and hopeful.", "I'm blooming into who I'm meant to be.");
  } else if (month >= 5 && month <= 7) { // Summer
    contextualPrompts.push("I feel pressure to be happy.", "Everyone seems to be having fun but me.", "I'm embracing the warmth and light.", "I feel alive and vibrant.");
  } else if (month >= 8 && month <= 10) { // Fall
    contextualPrompts.push("I'm feeling nostalgic.", "I'm anxious about the future.", "I'm grateful for this season of change.", "I'm embracing transformation.");
  } else { // Winter
    contextualPrompts.push("I feel isolated.", "I'm struggling with the darkness.", "I'm finding peace in the quiet.", "I'm appreciating the stillness.");
  }
  
  return contextualPrompts;
};

// Track used quickstarts
const trackQuickstartUsage = async (prompt: string) => {
  try {
    const recentPromptsJson = await AsyncStorage.getItem('recentQuickstarts');
    const recentPrompts: string[] = recentPromptsJson ? JSON.parse(recentPromptsJson) : [];
    
    // Add new prompt to beginning, keep last 15
    const updatedPrompts = [prompt, ...recentPrompts.filter(p => p !== prompt)].slice(0, 15);
    
    await AsyncStorage.setItem('recentQuickstarts', JSON.stringify(updatedPrompts));
  } catch (error) {
    console.log('Error tracking quickstart usage:', error);
  }
};

const { height, width } = Dimensions.get('window');
const INPUT_MIN_HEIGHT = 50;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 0;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [userInput, setUserInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
  const [quickstartPrompts, setQuickstartPrompts] = useState<string[][]>([]);
  const textInputRef = useRef<TextInput>(null);
  
  // Animation values
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const contentAnimation = useRef(new Animated.Value(1)).current;
  const inputContainerAnimation = useRef(new Animated.Value(0)).current;
  const { incrementUsage } = useDailyUsage();

  const quickstartOptions = [
    [
      'I feel creative and inspired.',
      'I need some peace.',
      'I feel invisible.',
      'I feel alive and vibrant.',
      'I\'m embracing who I am.',
      'I can\'t stop replaying it.'
    ]
  ];

  useEffect(() => {
    setQuickstartPrompts(quickstartOptions);
  }, []);

  const handleFocus = () => {
    // Navigate to ActiveTextInputScreen instead of showing focused state
    navigation.navigate('ActiveTextInput', { initialText: userInput });
  };

  const handleBlur = () => {
    // Remove the blur logic since we're navigating away
  };

  const handleSubmit = () => {
    if (userInput.trim()) {
      navigation.navigate('ArchetypeSelection', { userInput: userInput.trim() });
    }
  };

  const handleQuickstartPress = (prompt: string) => {
    trackQuickstartUsage(prompt);
    navigation.navigate('ArchetypeSelection', { userInput: prompt });
  };

  const dismissKeyboard = () => {
      Keyboard.dismiss();
    textInputRef.current?.blur();
  };

  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.max(event.nativeEvent.contentSize.height, INPUT_MIN_HEIGHT);
    const maxHeight = isFocused ? height * 0.6 : INPUT_MIN_HEIGHT * 3;
    setInputHeight(Math.min(newHeight, maxHeight));
  };

  const handleLogoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const refreshQuickstarts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Keep the same prompts as shown in the reference image
    setQuickstartPrompts(quickstartOptions);
  };

  const logoTop = logoAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -height * 0.3], // Move logo up when focused
  });

  const logoScale = logoAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6], // Make logo smaller when focused
  });

  const logoLeft = logoAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width * 0.3], // Move logo left when focused
  });

  const handleNewPress = () => {
    navigation.navigate('ActiveTextInput', { initialText: '' });
  };

  const handleUpgradePress = () => {
    // TODO: Navigate to paywall when implemented
    console.log('Upgrade pressed - navigate to paywall');
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <LinearGradient
        colors={['#0A0A0A', '#141414']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
          
          {/* Daily Limit Banner - positioned at the top */}
          <DailyLimitBanner onUpgradePress={handleUpgradePress} />
          
          {/* Daily Usage Ticker - small counter in top-right */}
          <DailyUsageTicker onUpgradePress={handleUpgradePress} />
          
          {/* Main Content - Always show since we removed focused state */}
          <Animated.View style={[styles.mainContent, { opacity: contentAnimation }]}>
            {/* Logo */}
            <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.8}>
              <Image 
                source={require('../../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            {/* App Title */}
            <Text style={styles.appName}>Subliminals</Text>
            
            {/* Subtitle */}
            <Text style={styles.subtitle}>What's on your mind?</Text>
            
            {/* Text Input */}
            <View style={styles.inputSection}>
              <TextInputField
                ref={textInputRef}
                value={userInput}
                onChangeText={setUserInput}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onContentSizeChange={handleContentSizeChange}
                onSubmitEditing={handleSubmit}
                minHeight={INPUT_MIN_HEIGHT}
                inputHeight={inputHeight}
              />
            </View>
            
            {/* Quickstart Section */}
            <View style={styles.quickstartSection}>
              <View style={styles.quickstartHeader}>
                <Text style={styles.quickstartTitle}>Need some ideas to get started?</Text>
                <TouchableOpacity onPress={refreshQuickstarts} style={styles.refreshButton}>
                  <Ionicons name="refresh" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.quickstartGrid}>
                {quickstartPrompts[0]?.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickstartPill}
                    onPress={() => handleQuickstartPress(prompt)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickstartText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Bottom Navigation */}
          <View style={styles.bottomNavContainer}>
            <BottomNav onNewPress={handleNewPress} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom nav
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputSection: {
    width: '100%',
    marginBottom: 40,
  },
  quickstartSection: {
    width: '100%',
    alignItems: 'center',
  },
  quickstartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
    width: '100%',
  },
  quickstartTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'left',
    flex: 1,
  },
  refreshButton: {
    marginLeft: 10,
    padding: 5,
  },
  quickstartGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  quickstartPill: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickstartText: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'left',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default HomeScreen; 