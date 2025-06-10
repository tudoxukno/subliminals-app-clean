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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BottomNav } from '../components/BottomNav';
import TextInputField from '../components/TextInputField';
import { DailyLimitBanner } from '../components/DailyLimitBanner';
import { UpgradeModal } from '../components/UpgradeModal';
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

// Smart prompt selection with improved anti-repetition
const getSmartQuickstarts = async (): Promise<string[][]> => {
  try {
    console.log('🎯 Starting smart quickstarts generation...');
    
    // Get recent prompts to avoid repetition
    const recentPromptsJson = await AsyncStorage.getItem('recentQuickstarts');
    const recentPrompts: string[] = recentPromptsJson ? JSON.parse(recentPromptsJson) : [];
    console.log('📚 Recent prompts count:', recentPrompts.length);
    
    // Get time-based category
    const timeCategory = getTimeCategory();
    const timePrompts = QUICKSTART_PROMPTS[timeCategory];
    const universalPrompts = QUICKSTART_PROMPTS.universal;
    
    // Add day-of-week and seasonal context
    const contextualPrompts = getContextualPrompts();
    
    // Combine all available prompts
    const allAvailablePrompts = [...timePrompts, ...universalPrompts, ...contextualPrompts];
    console.log('🔢 Total available prompts:', allAvailablePrompts.length);
    
    // Filter out recently used prompts (last 15 instead of 10 for better variety)
    const availablePrompts = allAvailablePrompts.filter(
      prompt => !recentPrompts.includes(prompt)
    );
    console.log('🆕 Available prompts after filtering recent:', availablePrompts.length);
    
    // If we've used too many prompts, keep only the last 8 recent ones and use the rest
    let promptsToUse: string[];
    if (availablePrompts.length >= 6) {
      promptsToUse = availablePrompts;
      console.log('✅ Using filtered prompts');
    } else {
      // Reset recent list but keep the last 8 to still avoid immediate repetition
      const reducedRecent = recentPrompts.slice(0, 8);
      promptsToUse = allAvailablePrompts.filter(
        prompt => !reducedRecent.includes(prompt)
      );
      
      // If still not enough, use all prompts
      if (promptsToUse.length < 6) {
        promptsToUse = allAvailablePrompts;
        console.log('🔄 Using all prompts (not enough unique ones)');
      } else {
        console.log('🔄 Reset recent list, using reduced filter');
      }
      
      // Update recent prompts list to the reduced set
      await AsyncStorage.setItem('recentQuickstarts', JSON.stringify(reducedRecent));
    }
    
    console.log('🎲 Prompts to use count:', promptsToUse.length);
    
    // Enhanced shuffling with Fisher-Yates algorithm for better randomness
    const shuffled = [...promptsToUse];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Select 6 prompts ensuring good variety
    const selected: string[] = [];
    const usedCategories = new Set<string>();
    
    // First pass: try to get variety across emotional categories
    for (const prompt of shuffled) {
      if (selected.length >= 6) break;
      
      const analysis = analyzeUserInput(prompt);
      const hasNewCategory = analysis.categories.some(cat => !usedCategories.has(cat));
      
      if (hasNewCategory || selected.length < 3) {
        selected.push(prompt);
        analysis.categories.forEach(cat => usedCategories.add(cat));
      }
    }
    
    // Second pass: fill remaining slots if needed
    for (const prompt of shuffled) {
      if (selected.length >= 6) break;
      if (!selected.includes(prompt)) {
        selected.push(prompt);
      }
    }
    
    // Ensure we have exactly 6 prompts
    while (selected.length < 6 && shuffled.length > 0) {
      const randomIndex = Math.floor(Math.random() * shuffled.length);
      const prompt = shuffled[randomIndex];
      if (!selected.includes(prompt)) {
        selected.push(prompt);
      }
      shuffled.splice(randomIndex, 1);
    }
    
    console.log('🎯 Final selected prompts:', selected);
    
    // Arrange in 3 rows of 2
    const result = [
      [selected[0], selected[1]],
      [selected[2], selected[3]],
      [selected[4], selected[5]]
    ];
    
    console.log('✅ Smart quickstarts generation completed');
    return result;
  } catch (error) {
    console.log('❌ Error getting smart quickstarts:', error);
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

// User Learning and Personalization System
const PREFERENCE_CATEGORIES = {
  emotional: ['anxious', 'sad', 'happy', 'angry', 'peaceful', 'overwhelmed', 'excited', 'lonely', 'grateful', 'hopeful'],
  temporal: ['morning', 'afternoon', 'evening', 'lateNight'],
  themes: ['creativity', 'relationships', 'work', 'family', 'health', 'spirituality', 'goals', 'past', 'future', 'change'],
  tone: ['optimistic', 'reflective', 'struggling', 'growth-oriented', 'practical', 'poetic']
};

// Analyze user input to extract preferences
const analyzeUserInput = (input: string): { categories: string[], themes: string[], sentiment: string } => {
  const lowerInput = input.toLowerCase();
  const categories: string[] = [];
  const themes: string[] = [];
  let sentiment = 'neutral';
  
  // Emotional analysis
  if (lowerInput.includes('anxious') || lowerInput.includes('worry') || lowerInput.includes('nervous')) {
    categories.push('anxious');
    sentiment = 'negative';
  }
  if (lowerInput.includes('sad') || lowerInput.includes('down') || lowerInput.includes('depressed')) {
    categories.push('sad');
    sentiment = 'negative';
  }
  if (lowerInput.includes('happy') || lowerInput.includes('joy') || lowerInput.includes('excited')) {
    categories.push('happy');
    sentiment = 'positive';
  }
  if (lowerInput.includes('angry') || lowerInput.includes('frustrated') || lowerInput.includes('mad')) {
    categories.push('angry');
    sentiment = 'negative';
  }
  if (lowerInput.includes('peaceful') || lowerInput.includes('calm') || lowerInput.includes('serene')) {
    categories.push('peaceful');
    sentiment = 'positive';
  }
  if (lowerInput.includes('overwhelmed') || lowerInput.includes('too much') || lowerInput.includes('stressed')) {
    categories.push('overwhelmed');
    sentiment = 'negative';
  }
  if (lowerInput.includes('lonely') || lowerInput.includes('alone') || lowerInput.includes('isolated')) {
    categories.push('lonely');
    sentiment = 'negative';
  }
  if (lowerInput.includes('grateful') || lowerInput.includes('thankful') || lowerInput.includes('blessed')) {
    categories.push('grateful');
    sentiment = 'positive';
  }
  if (lowerInput.includes('hopeful') || lowerInput.includes('optimistic') || lowerInput.includes('better')) {
    categories.push('hopeful');
    sentiment = 'positive';
  }
  
  // Theme analysis
  if (lowerInput.includes('creative') || lowerInput.includes('art') || lowerInput.includes('inspire')) {
    themes.push('creativity');
  }
  if (lowerInput.includes('relationship') || lowerInput.includes('love') || lowerInput.includes('partner')) {
    themes.push('relationships');
  }
  if (lowerInput.includes('work') || lowerInput.includes('job') || lowerInput.includes('career')) {
    themes.push('work');
  }
  if (lowerInput.includes('family') || lowerInput.includes('parent') || lowerInput.includes('child')) {
    themes.push('family');
  }
  if (lowerInput.includes('health') || lowerInput.includes('body') || lowerInput.includes('fitness')) {
    themes.push('health');
  }
  if (lowerInput.includes('spiritual') || lowerInput.includes('god') || lowerInput.includes('universe')) {
    themes.push('spirituality');
  }
  if (lowerInput.includes('goal') || lowerInput.includes('achieve') || lowerInput.includes('succeed')) {
    themes.push('goals');
  }
  if (lowerInput.includes('past') || lowerInput.includes('regret') || lowerInput.includes('memory')) {
    themes.push('past');
  }
  if (lowerInput.includes('future') || lowerInput.includes('tomorrow') || lowerInput.includes('plan')) {
    themes.push('future');
  }
  if (lowerInput.includes('change') || lowerInput.includes('different') || lowerInput.includes('transform')) {
    themes.push('change');
  }
  
  return { categories, themes, sentiment };
};

// Track user behavior and build preference profile
const updateUserProfile = async (input: string, isQuickstart: boolean = false) => {
  try {
    const profileKey = 'userLearningProfile';
    const profileJson = await AsyncStorage.getItem(profileKey);
    const profile = profileJson ? JSON.parse(profileJson) : {
      quickstartUsage: {},
      manualInputs: [],
      preferenceWeights: {
        emotional: {},
        temporal: {},
        themes: {},
        tone: {}
      },
      totalInteractions: 0,
      lastUpdated: Date.now()
    };
    
    const analysis = analyzeUserInput(input);
    const hour = new Date().getHours();
    const timeCategory = getTimeCategory();
    
    // Track quickstart selections
    if (isQuickstart) {
      profile.quickstartUsage[input] = (profile.quickstartUsage[input] || 0) + 1;
    } else {
      // Track manual inputs
      profile.manualInputs.push({
        text: input,
        timestamp: Date.now(),
        timeCategory,
        analysis
      });
      
      // Keep only last 50 manual inputs for analysis
      if (profile.manualInputs.length > 50) {
        profile.manualInputs = profile.manualInputs.slice(-50);
      }
    }
    
    // Update preference weights
    analysis.categories.forEach(category => {
      profile.preferenceWeights.emotional[category] = (profile.preferenceWeights.emotional[category] || 0) + 1;
    });
    
    analysis.themes.forEach(theme => {
      profile.preferenceWeights.themes[theme] = (profile.preferenceWeights.themes[theme] || 0) + 1;
    });
    
    profile.preferenceWeights.temporal[timeCategory] = (profile.preferenceWeights.temporal[timeCategory] || 0) + 1;
    
    // Determine tone based on sentiment and input characteristics
    let tone = 'neutral';
    if (analysis.sentiment === 'positive') {
      tone = 'optimistic';
    } else if (analysis.sentiment === 'negative') {
      if (input.includes('grow') || input.includes('learn') || input.includes('better')) {
        tone = 'growth-oriented';
      } else {
        tone = 'struggling';
      }
    } else if (input.includes('think') || input.includes('feel') || input.includes('reflect')) {
      tone = 'reflective';
    }
    
    profile.preferenceWeights.tone[tone] = (profile.preferenceWeights.tone[tone] || 0) + 1;
    profile.totalInteractions += 1;
    profile.lastUpdated = Date.now();
    
    await AsyncStorage.setItem(profileKey, JSON.stringify(profile));
  } catch (error) {
    console.log('Error updating user profile:', error);
  }
};

// Get personalized quickstart suggestions based on learned preferences
const getPersonalizedQuickstarts = async (): Promise<string[][]> => {
  try {
    const profileJson = await AsyncStorage.getItem('userLearningProfile');
    const profile = profileJson ? JSON.parse(profileJson) : null;
    
    if (!profile || profile.totalInteractions < 3) {
      // Not enough data, use smart defaults
      return getSmartQuickstarts();
    }
    
    const timeCategory = getTimeCategory();
    const timePrompts = QUICKSTART_PROMPTS[timeCategory];
    const universalPrompts = QUICKSTART_PROMPTS.universal;
    const contextualPrompts = getContextualPrompts();
    
    // Get recent prompts to avoid repetition
    const recentPromptsJson = await AsyncStorage.getItem('recentQuickstarts');
    const recentPrompts: string[] = recentPromptsJson ? JSON.parse(recentPromptsJson) : [];
    
    // Score all available prompts based on user preferences
    const allPrompts = [...timePrompts, ...universalPrompts, ...contextualPrompts];
    const scoredPrompts = allPrompts.map(prompt => {
      const analysis = analyzeUserInput(prompt);
      let score = 1; // Base score
      
      // Weight based on emotional preferences
      analysis.categories.forEach(category => {
        const weight = profile.preferenceWeights.emotional[category] || 0;
        score += weight * 0.3;
      });
      
      // Weight based on theme preferences
      analysis.themes.forEach(theme => {
        const weight = profile.preferenceWeights.themes[theme] || 0;
        score += weight * 0.25;
      });
      
      // Weight based on time preferences
      const timeWeight = profile.preferenceWeights.temporal[timeCategory] || 0;
      score += timeWeight * 0.2;
      
      // Boost if similar to previously used quickstarts
      const quickstartUsage = profile.quickstartUsage[prompt] || 0;
      if (quickstartUsage > 0) {
        score += quickstartUsage * 0.15;
      }
      
      // Penalize if used recently
      if (recentPrompts.includes(prompt)) {
        score *= 0.3;
      }
      
      // Boost prompts that match user's typical sentiment patterns
      const userSentimentHistory = profile.manualInputs.map((input: any) => input.analysis.sentiment);
      const positiveSentiments = userSentimentHistory.filter((s: string) => s === 'positive').length;
      const negativeSentiments = userSentimentHistory.filter((s: string) => s === 'negative').length;
      
      if (positiveSentiments > negativeSentiments && analysis.sentiment === 'positive') {
        score *= 1.2;
      } else if (negativeSentiments > positiveSentiments && analysis.sentiment === 'negative') {
        score *= 1.2;
      }
      
      return { prompt, score };
    });
    
    // Sort by score and select top 6
    const selectedPrompts = scoredPrompts
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.prompt);
    
    // Arrange in 3 rows of 2
    return [
      [selectedPrompts[0], selectedPrompts[1]],
      [selectedPrompts[2], selectedPrompts[3]],
      [selectedPrompts[4], selectedPrompts[5]]
    ];
    
  } catch (error) {
    console.log('Error getting personalized quickstarts:', error);
    return getSmartQuickstarts();
  }
};

// Enhanced tracking that includes learning
const trackQuickstartUsage = async (prompt: string) => {
  try {
    console.log('📝 Tracking quickstart usage:', prompt);
    
    // Update recent prompts for anti-repetition
    const recentPromptsJson = await AsyncStorage.getItem('recentQuickstarts');
    const recentPrompts: string[] = recentPromptsJson ? JSON.parse(recentPromptsJson) : [];
    const updatedPrompts = [prompt, ...recentPrompts.filter(p => p !== prompt)].slice(0, 15);
    await AsyncStorage.setItem('recentQuickstarts', JSON.stringify(updatedPrompts));
    
    console.log('📚 Updated recent prompts list. New count:', updatedPrompts.length);
    
    // Update user learning profile
    await updateUserProfile(prompt, true);
    
    console.log('✅ Quickstart usage tracking completed');
  } catch (error) {
    console.log('❌ Error tracking quickstart usage:', error);
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<'daily_limit' | 'general_upgrade'>('general_upgrade');
  const textInputRef = useRef<TextInput>(null);
  
  // Animation values
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const contentAnimation = useRef(new Animated.Value(1)).current;
  const inputContainerAnimation = useRef(new Animated.Value(0)).current;
  const { incrementUsage, resetIfNewDay, checkAndShowBannerOnHomeReturn } = useDailyUsage();

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
    loadSmartQuickstarts();
  }, []);

  // Reset daily usage check when home screen gains focus
  // Check if banner should show after completing an entry
  useFocusEffect(
    React.useCallback(() => {
      console.log('🏠 HOME SCREEN FOCUSED: Checking daily usage state');
      resetIfNewDay();
      // Check if we need to show banner after returning from completed entry
      checkAndShowBannerOnHomeReturn();
    }, [resetIfNewDay, checkAndShowBannerOnHomeReturn])
  );

  const loadSmartQuickstarts = async () => {
    try {
      console.log('🔄 Loading quickstarts...');
      const smartPrompts = await getSmartQuickstarts();
      console.log('✅ New quickstarts loaded:', smartPrompts.flat());
      setQuickstartPrompts(smartPrompts);
    } catch (error) {
      console.log('❌ Error loading smart quickstarts:', error);
      // Fallback to default prompts
      setQuickstartPrompts(quickstartOptions);
    }
  };

  const refreshQuickstarts = async () => {
    console.log('🔄 Refresh button pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadSmartQuickstarts();
    console.log('✅ Quickstarts refresh completed');
  };

  const handleFocus = () => {
    // Navigate to ActiveTextInputScreen instead of showing focused state
    navigation.navigate('ActiveTextInput', { initialText: userInput });
  };

  const handleBlur = () => {
    // Remove the blur logic since we're navigating away
  };

  const handleSubmit = async () => {
    if (userInput.trim()) {
      // Track manual user input for learning
      await updateUserProfile(userInput.trim(), false);
      navigation.navigate('ArchetypeSelection', { userInput: userInput.trim() });
    }
  };

  const handleQuickstartPress = (prompt: string) => {
    trackQuickstartUsage(prompt);
    navigation.navigate('ActiveTextInput', { initialText: prompt });
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

  const handleUpgradePress = (level: 'high' | 'medium' | 'low') => {
    console.log('Banner upgrade pressed - level:', level);
    
    // Use daily_limit trigger only when limit is actually reached (high level)
    // Use general_upgrade trigger for promotional banners (medium/low levels)
    const trigger = level === 'high' ? 'daily_limit' : 'general_upgrade';
    setUpgradeModalTrigger(trigger);
    setShowUpgradeModal(true);
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
                {quickstartPrompts.flat().map((prompt, index) => (
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

        {/* Upgrade Modal */}
        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          trigger={upgradeModalTrigger}
        />
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