import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  useFonts,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_500Medium_Italic,
} from '@expo-google-fonts/playfair-display';

type FullSubliminalContentProps = {
  userInput: string;
  selectedArchetype: string;
  archetypeData: {
    icon: string;
    response: string;
    fullMessage: string;
    quote: string;
    tags: string[];
    isHinderingEntry?: boolean;
  };
};

const CRISIS_RESOURCES = [
  {
    name: "988 Suicide & Crisis Lifeline",
    number: "988",
    description: "24/7, free and confidential support"
  },
  {
    name: "Crisis Text Line",
    number: "741741",
    description: "Text HOME for 24/7 crisis support"
  },
  {
    name: "SAMHSA National Helpline",
    number: "1-800-662-4357",
    description: "Mental health and substance abuse"
  },
  {
    name: "Mental Health America",
    url: "https://www.mhanational.org/finding-help",
    description: "Find local mental health resources"
  },
  {
    name: "Psychology Today",
    url: "https://www.psychologytoday.com/us/therapists",
    description: "Find therapists and mental health professionals"
  }
];

export const FullSubliminalContent: React.FC<FullSubliminalContentProps> = ({
  userInput,
  selectedArchetype,
  archetypeData,
}) => {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_500Medium_Italic,
  });
  const [showUserInputModal, setShowUserInputModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Helper function to clean the main message by removing appended support text
  const cleanMainMessage = (fullMessage: string): string => {
    // Remove the appended support message to create visual separation
    const supportMessagePattern = /\s*💬 If things feel overwhelming, talking to someone can really help\. You're not alone\./;
    return fullMessage.replace(supportMessagePattern, '').trim();
  };

  // Helper function to truncate user input
  const truncateUserInput = (input: string, maxLines: number = 3): { truncated: string; needsTruncation: boolean } => {
    const words = input.split(' ');
    const wordsPerLine = 6; // Approximate words per line for larger text
    const maxWords = maxLines * wordsPerLine;
    
    if (words.length <= maxWords) {
      return { truncated: input, needsTruncation: false };
    }
    
    const truncated = words.slice(0, maxWords).join(' ') + '...';
    return { truncated, needsTruncation: true };
  };

  const handleSupportResourcePress = async (resource: typeof CRISIS_RESOURCES[0]) => {
    if (resource.number) {
      const phoneUrl = `tel:${resource.number}`;
      try {
        await Linking.openURL(phoneUrl);
      } catch (error) {
        Alert.alert('Unable to make call', 'Please dial ' + resource.number + ' manually.');
      }
    } else if (resource.url) {
      try {
        await Linking.openURL(resource.url);
      } catch (error) {
        Alert.alert('Unable to open link', 'Please visit ' + resource.url + ' in your browser.');
      }
    }
  };

  const { truncated: displayUserInput, needsTruncation } = truncateUserInput(userInput);

  if (!fontsLoaded) {
    return null;
  }

  // Use cleaned fullMessage for the main content
  const cleanedMessage = cleanMainMessage(archetypeData.fullMessage || archetypeData.response);
  
  // Multiple methods to detect hindering entries for maximum reliability
  const detectHinderingEntry = (): boolean => {
    const fullContent = archetypeData.fullMessage || archetypeData.response || '';
    
    // Method 1: Check if backend set the flag
    if (archetypeData.isHinderingEntry === true) {
      return true;
    }
    
    // Method 2: Check for support message in content
    if (fullContent.includes('💬 If things feel overwhelming')) {
      return true;
    }
    
    // Method 3: Enhanced keyword detection from user input (fallback)
    // Normalize input: lowercase, remove extra spaces/punctuation for better matching
    const normalizedInput = userInput
      .toLowerCase()
      .replace(/[.,!?;:\-()[\]{}'"]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    // POSITIVE FILTERING: First check if the message is clearly positive
    // If it contains strong positive indicators, skip hindering detection
    const positivePatterns = [
      // Strong positive emotions
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
      
      // Positive growth & connection
      'feel connected', 'feeling connected', 'feel like im growing', 'feeling like im growing',
      'feel progress', 'feeling progress', 'making progress', 'growing stronger',
      'getting better', 'improving', 'healing', 'recovered', 'recovering',
      'feel centered', 'feeling centered', 'feel balanced', 'feeling balanced',
      'feel at peace', 'feeling at peace', 'feel whole', 'feeling whole',
      
      // Positive activities & states
      'had a good day', 'having a good day', 'great day', 'wonderful day',
      'things are good', 'things are great', 'life is good', 'life is great',
      'things are looking up', 'turning around', 'getting back on track',
      'feeling myself again', 'back to myself', 'like myself again',
      
      // Achievement & accomplishment
      'proud of myself', 'accomplished something', 'achieved', 'succeeded',
      'won', 'victory', 'breakthrough', 'milestone', 'celebration',
      'grateful for', 'thankful for', 'blessed with', 'appreciate',
      
      // Positive relationships
      'love my', 'surrounded by love', 'supported by', 'great friends',
      'wonderful family', 'amazing people', 'feel loved by', 'care about me',
      
      // Forward-looking positivity
      'excited about', 'looking forward', 'cant wait', 'eager to',
      'optimistic about', 'hopeful about', 'confident about', 'ready for',
      'bright future', 'good things coming', 'positive changes'
    ];
    
    // Check if input contains strong positive indicators
    const hasPositiveContent = positivePatterns.some(pattern => 
      normalizedInput.includes(pattern)
    );
    
    // If strongly positive, skip hindering detection entirely
    if (hasPositiveContent) {
      return false;
    }
    
    // COMPREHENSIVE HINDERING PATTERNS - Bulletproof detection system
    const hinderingPatterns = [
      // ═══ CRITICAL: Direct suicidal ideation (HIGH CONFIDENCE) ═══
      'kill myself', 'end my life', 'take my own life', 'commit suicide', 
      'want to die', 'wish i was dead', 'better off dead', 'end it all',
      'suicide', 'suicidal', 'want to disappear forever', 'cease to exist',
      'should just disappear', 'should disappear', 'should just die',
      'should kill myself', 'would be better if i died', 'ready to die',
      'want to be dead', 'wish i could die', 'hope i die', 'need to die',
      'going to kill myself', 'planning to die', 'done with life',
      'thinking about suicide', 'considering suicide', 'want out of this life',
      'dont want to live anymore', 'don\'t want to live anymore', 'dont want to live',
      'feel like ending it all', 'ending it all', 'want to end everything',
      
      // ═══ CRITICAL: All "end it all" variations ═══
      'end it all', 'end everything', 'end this all', 'just end it all',
      'want to end it all', 'i want to end it all', 'want to just end it all',
      'i want to just end it all', 'just want to end it all', 'wanna end it all',
      'gonna end it all', 'going to end it all', 'ready to end it all',
      'need to end it all', 'time to end it all', 'should end it all',
      'have to end it all', 'might end it all', 'could end it all',
      'feel like ending it all', 'thinking about ending it all',
      'considering ending it all', 'planning to end it all',
      
      // ═══ CRITICAL: All "disappear" variations ═══
      'want to disappear', 'wish i could disappear', 'want to just disappear',
      'wish i could just disappear', 'should just disappear', 'need to disappear',
      'going to disappear', 'gonna disappear', 'wanna disappear',
      'feel like disappearing', 'thinking about disappearing',
      'want to disappear forever', 'wish i could disappear forever',
      'should disappear forever', 'vanish forever', 'fade away',
      'invisible forever', 'gone forever', 'erased from existence',
      
      // ═══ CRITICAL: All "don't want to live" variations ═══
      'dont want to live', 'don\'t want to live', 'do not want to live',
      'dont want to live anymore', 'don\'t want to live anymore',
      'do not want to live anymore', 'dont wanna live', 'don\'t wanna live',
      'tired of living', 'sick of living', 'done with living',
      'cant live like this', 'can\'t live like this', 'cannot live like this',
      'dont want to be alive', 'don\'t want to be alive',
      'wish i wasnt alive', 'wish i wasn\'t alive', 'wish i was never alive',
      
      // ═══ CRITICAL: Self-harm expressions (HIGH CONFIDENCE) ═══
      'hurt myself', 'harm myself', 'cut myself', 'cutting myself',
      'self harm', 'self-harm', 'want to cut', 'going to cut',
      'thinking about cutting', 'need to cut', 'deserve to be hurt',
      'should hurt myself', 'want to hurt myself', 'make myself bleed',
      'punish myself', 'deserve pain', 'need to feel pain',
      
      // ═══ CRITICAL: Burden statements (HIGH CONFIDENCE) ═══
      'everyone would be better off without me', 'better off without me',
      'world would be better without me', 'wish i was never born',
      'wish i never existed', 'shouldnt exist', 'regret being born',
      'shouldve never been born', 'should have never been born',
      'never should have been born', 'mistake to be born',
      'shouldnt be here', 'don\'t belong here', 'dont belong here',
      'nobody would miss me', 'no one would miss me', 'wouldnt be missed',
      'nobody would care', 'no one would care', 'nobody cares',
      'burden to everyone', 'waste of space', 'waste of life',
      
      // ═══ HIGH: Severe self-hatred (MEDIUM-HIGH CONFIDENCE) ═══
      'hate myself', 'cant stand myself', 'despise myself', 'loathe myself',
      'im worthless', 'im pathetic', 'im useless', 'waste of space',
      'piece of shit', 'complete failure', 'broken beyond repair',
      'fucking worthless', 'absolutely worthless', 'totally worthless',
      'hate who i am', 'hate everything about myself', 'disgusted with myself',
      'ashamed of myself', 'disappointed in myself', 'failed at everything',
      
      // ═══ HIGH: Severe hopelessness (MEDIUM-HIGH CONFIDENCE) ═══
      'completely hopeless', 'no hope left', 'give up on life', 'giving up on life',
      'cant go on living', 'cant take it anymore', 'had enough of life',
      'done trying to live', 'tired of existing', 'game over for me',
      'lost the battle with life', 'no point in living', 'pointless to live',
      'nothing to live for', 'no reason to live', 'lost all hope',
      'hope is gone', 'gave up hope', 'beyond help', 'cant be helped',
      'no way out', 'trapped forever', 'stuck in hell', 'living hell',
      
      // ═══ HIGH: Crisis states (MEDIUM-HIGH CONFIDENCE) ═══
      'mental breakdown', 'nervous breakdown', 'complete breakdown',
      'falling apart completely', 'losing my mind', 'going insane',
      'cant cope with life', 'drowning in pain', 'suffocating from pain',
      'trapped in hell', 'living nightmare', 'want the pain to stop forever',
      'cant handle this', 'cant take this', 'too much to handle',
      'overwhelmed by life', 'crushed by life', 'destroyed by life',
      'broken inside', 'shattered completely', 'empty inside',
      
      // ═══ MEDIUM: Severe distress requiring careful detection ═══
      'make it all stop', 'stop the pain forever', 'escape this hell',
      'cant handle this anymore', 'too much pain to bear',
      'invisible to everyone', 'completely alone in this world',
      'feel like dying', 'ready to give up', 'giving up on everything',
      'whats the point', 'what\'s the point', 'no point anymore',
      'why bother living', 'why continue living', 'why keep going',
      'cant keep going', 'can\'t keep going', 'done fighting',
      'tired of fighting', 'exhausted from living', 'drained of life'
    ];
    
    // Helper function for typo tolerance
    const getLevenshteinDistance = (str1: string, str2: string): number => {
      const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
      
      for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
      
      for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1, // deletion
            matrix[j - 1][i] + 1, // insertion
            matrix[j - 1][i - 1] + indicator // substitution
          );
        }
      }
      
      return matrix[str2.length][str1.length];
    };

    // MULTI-LAYER DETECTION: Comprehensive matching with typo tolerance
    const hasHinderingContent = hinderingPatterns.some(pattern => {
      // Layer 1: Exact phrase match (most reliable)
      if (normalizedInput.includes(pattern)) {
        return true;
      }
      
      // Layer 2: Typo-tolerant matching for critical patterns
      const criticalKeywords = ['kill', 'suicide', 'die', 'dead', 'end', 'disappear', 'hurt', 'hate'];
      const patternWords = pattern.split(' ');
      const inputWords = normalizedInput.split(' ');
      
      // Check if pattern contains critical keywords
      const hasCriticalWords = patternWords.some(word => 
        criticalKeywords.some(critical => word.includes(critical))
      );
      
      if (hasCriticalWords) {
        let matchCount = 0;
        let typoMatchCount = 0;
        
        patternWords.forEach(patternWord => {
          // Exact word match
          if (inputWords.includes(patternWord)) {
            matchCount++;
            return;
          }
          
          // Common contractions and variations
          const variations = [
            patternWord.replace('cant', 'cannot').replace('can\'t', 'cannot'),
            patternWord.replace('dont', 'do not').replace('don\'t', 'do not'),
            patternWord.replace('im', 'i am').replace('i\'m', 'i am'),
            patternWord.replace('wont', 'will not').replace('won\'t', 'will not'),
            patternWord.replace('isnt', 'is not').replace('isn\'t', 'is not'),
            patternWord.replace('wasnt', 'was not').replace('wasn\'t', 'was not'),
            patternWord.replace('shouldnt', 'should not').replace('shouldn\'t', 'should not'),
            patternWord.replace('wouldnt', 'would not').replace('wouldn\'t', 'would not'),
            patternWord.replace('couldnt', 'could not').replace('couldn\'t', 'could not')
          ];
          
          if (variations.some(variation => inputWords.includes(variation))) {
            matchCount++;
            return;
          }
          
          // Typo tolerance: Check for similar words (1-2 character differences)
          inputWords.forEach(inputWord => {
            if (inputWord.length >= 3 && patternWord.length >= 3) {
              const distance = getLevenshteinDistance(patternWord, inputWord);
              const maxDistance = Math.floor(Math.max(patternWord.length, inputWord.length) * 0.25);
              
              if (distance <= maxDistance && distance <= 2) {
                typoMatchCount++;
              }
            }
          });
        });
        
        // For critical patterns: require high word match percentage
        const totalMatches = matchCount + Math.floor(typoMatchCount * 0.5); // Typos count as half
        const matchPercentage = totalMatches / patternWords.length;
        
        if (matchPercentage >= 0.75) { // 75% word match required
          return true;
        }
      }
      
      // Layer 3: Contextual detection for implied meanings
      const contextualPatterns = [
        // "end it" + "all" variations
        { keywords: ['end', 'all'], weight: 0.8 },
        { keywords: ['want', 'die'], weight: 0.9 },
        { keywords: ['kill', 'myself'], weight: 1.0 },
        { keywords: ['hate', 'myself'], weight: 0.7 },
        { keywords: ['disappear', 'forever'], weight: 0.8 },
        { keywords: ['better', 'without', 'me'], weight: 0.8 },
        { keywords: ['tired', 'living'], weight: 0.7 },
        { keywords: ['done', 'life'], weight: 0.8 },
        { keywords: ['give', 'up'], weight: 0.6 },
        { keywords: ['no', 'hope'], weight: 0.7 },
        { keywords: ['cant', 'anymore'], weight: 0.7 },
        { keywords: ['pain', 'stop'], weight: 0.6 }
      ];
      
      for (const contextPattern of contextualPatterns) {
        const foundKeywords = contextPattern.keywords.filter(keyword => 
          inputWords.some(word => 
            word.includes(keyword) || 
            getLevenshteinDistance(keyword, word) <= 1
          )
        );
        
        const keywordMatchRatio = foundKeywords.length / contextPattern.keywords.length;
        if (keywordMatchRatio >= contextPattern.weight) {
          return true;
        }
      }
      
      return false;
    });
    
    return hasHinderingContent;
  };
  
  const isHinderingEntry = detectHinderingEntry();

  return (
    <View style={styles.content}>
      {/* Original User Prompt */}
      <View style={styles.promptContainer}>
        <Text style={styles.promptLabel}>YOUR PROMPT</Text>
        <TouchableOpacity 
          onPress={() => needsTruncation && setShowUserInputModal(true)}
          disabled={!needsTruncation}
          activeOpacity={needsTruncation ? 0.7 : 1}
        >
          <Text style={[styles.promptText, needsTruncation && styles.tappablePrompt]}>
            "{displayUserInput}"
          </Text>
          {needsTruncation && (
            <Text style={styles.tapHint}>Tap to see full message</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Archetype Header */}
      <View style={styles.archetypeHeader}>
        <Text style={styles.archetypeIcon}>{archetypeData.icon}</Text>
        <View style={styles.archetypeTitleContainer}>
          <Text style={styles.archetypeTitle}>{selectedArchetype}</Text>
          <Text style={styles.archetypeSubtitle}>{archetypeData.tags.join(' • ')}</Text>
        </View>
      </View>

      {/* Main Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{cleanedMessage}</Text>
        
        {/* Support Resources for Hindering Entries */}
        {isHinderingEntry && (
          <View style={styles.supportContainer}>
            <View style={styles.supportDivider} />
            <Text style={styles.supportEmoji}>❤️‍🩹</Text>
            <View style={styles.supportHeader}>
              <Text style={styles.supportTitle}>You Don't Have to Face This Alone</Text>
            </View>
            <Text style={styles.supportMessage}>
              Professional support can make a real difference. Here are some resources available 24/7:
            </Text>
            <TouchableOpacity 
              style={styles.supportButton}
              onPress={() => setShowSupportModal(true)}
            >
              <Ionicons name="call" size={16} color="#7B9BFF" />
              <Text style={styles.supportButtonText}>Crisis Support & Resources</Text>
              <Ionicons name="chevron-forward" size={16} color="#7B9BFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

            {/* Quote */}
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>{archetypeData.quote}</Text>
      </View>

      {/* Support Resources Modal */}
      <Modal
        visible={showSupportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.supportModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crisis Support & Resources</Text>
              <TouchableOpacity 
                onPress={() => setShowSupportModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalSubtitle}>
                If you're in immediate danger, please call 911 or go to your nearest emergency room.
              </Text>
              
              {CRISIS_RESOURCES.map((resource, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.resourceItem}
                  onPress={() => handleSupportResourcePress(resource)}
                >
                  <View style={styles.resourceContent}>
                    <View style={styles.resourceHeader}>
                      <Ionicons 
                        name={resource.number ? "call" : "open"} 
                        size={20} 
                        color="#7B9BFF" 
                      />
                      <Text style={styles.resourceName}>{resource.name}</Text>
                    </View>
                    <Text style={styles.resourceDescription}>{resource.description}</Text>
                    {resource.number && (
                      <Text style={styles.resourceNumber}>{resource.number}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
              
              <Text style={styles.modalFooter}>
                Remember: Seeking help is a sign of strength, not weakness. You deserve support and care.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  content: {
    paddingHorizontal: 20,
  },
  promptContainer: {
    marginTop: 32,
    marginBottom: 32,
  },
  promptLabel: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  promptText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  divider: {
    height: 1,
    backgroundColor: '#2B2B2B',
    marginVertical: 32,
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  archetypeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  archetypeTitleContainer: {
    flex: 1,
  },
  archetypeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  archetypeSubtitle: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageContainer: {
    marginBottom: 32,
  },
  messageText: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 24,
  },
  quoteContainer: {
    marginBottom: 32,
  },
  quoteText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'PlayfairDisplay_500Medium_Italic',
    textAlign: 'center',
  },
  tappablePrompt: {
    opacity: 0.8,
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
    marginTop: 8,
    textAlign: 'left',
  },
  supportContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  supportDivider: {
    height: 1,
    backgroundColor: '#2B2B2B',
    marginVertical: 16,
  },
  supportHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  supportEmoji: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  supportMessage: {
    color: '#666',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#7B9BFF',
  },
  supportButtonText: {
    color: '#7B9BFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  supportModalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  modalSubtitle: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  resourceContent: {
    flex: 1,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  resourceDescription: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  resourceNumber: {
    color: '#7B9BFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
}); 