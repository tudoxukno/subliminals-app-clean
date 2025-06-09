import React, { useState, useEffect } from 'react';
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
import { CrisisLevel, getCrisisResourcesByRegion } from '../utils/crisisResources';
import CrisisModal from './CrisisModal';

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
  // ═══ ALL HOOKS MUST BE AT THE TOP - NO CONDITIONAL LOGIC BEFORE HOOKS ═══
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_500Medium_Italic,
  });
  const [showUserInputModal, setShowUserInputModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  // Crisis detection logic (moved up to ensure hooks are called consistently)
  const cleanMainMessage = (fullMessage: string): string => {
    const supportMessagePattern = /\s*💬 If things feel overwhelming, talking to someone can really help\. You're not alone\./;
    return fullMessage.replace(supportMessagePattern, '').trim();
  };

  const cleanedMessage = cleanMainMessage(archetypeData.fullMessage || archetypeData.response);
  
  const detectHinderingEntry = (): boolean => {
    const fullContent = archetypeData.fullMessage || archetypeData.response || '';
    
    if (archetypeData.isHinderingEntry === true) {
      return true;
    }
    
    if (fullContent.includes('💬 If things feel overwhelming')) {
      return true;
    }
    
    const normalizedInput = userInput
      .toLowerCase()
      .replace(/[.,!?;:\-()[\]{}'"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const positivePatterns = [
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
      'had a good day', 'having a good day', 'great day', 'wonderful day',
      'things are good', 'things are great', 'life is good', 'life is great',
      'things are looking up', 'turning around', 'getting back on track',
      'feeling myself again', 'back to myself', 'like myself again',
      'proud of myself', 'accomplished something', 'achieved', 'succeeded',
      'won', 'victory', 'breakthrough', 'milestone', 'celebration',
      'grateful for', 'thankful for', 'blessed with', 'appreciate',
      'love my', 'surrounded by love', 'supported by', 'great friends',
      'wonderful family', 'amazing people', 'feel loved by', 'care about me',
      'excited about', 'looking forward', 'cant wait', 'eager to',
      'optimistic about', 'hopeful about', 'confident about', 'ready for',
      'bright future', 'good things coming', 'positive changes'
    ];
    
    const hasPositiveContent = positivePatterns.some(pattern => 
      normalizedInput.includes(pattern)
    );
    
    if (hasPositiveContent) {
      return false;
    }
    
    const hinderingPatterns = [
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
      'end it all', 'end everything', 'end this all', 'just end it all',
      'want to end it all', 'i want to end it all', 'want to just end it all',
      'i want to just end it all', 'just want to end it all', 'wanna end it all',
      'gonna end it all', 'going to end it all', 'ready to end it all',
      'need to end it all', 'time to end it all', 'should end it all',
      'have to end it all', 'might end it all', 'could end it all',
      'feel like ending it all', 'thinking about ending it all',
      'considering ending it all', 'planning to end it all',
      'want to disappear', 'wish i could disappear', 'want to just disappear',
      'wish i could just disappear', 'should just disappear', 'need to disappear',
      'going to disappear', 'gonna disappear', 'wanna disappear',
      'feel like disappearing', 'thinking about disappearing',
      'want to disappear forever', 'wish i could disappear forever',
      'should disappear forever', 'vanish forever', 'fade away',
      'invisible forever', 'gone forever', 'erased from existence',
      'dont want to live', 'don\'t want to live', 'do not want to live',
      'dont want to live anymore', 'don\'t want to live anymore',
      'do not want to live anymore', 'dont wanna live', 'don\'t wanna live',
      'tired of living', 'sick of living', 'done with living',
      'cant live like this', 'can\'t live like this', 'cannot live like this',
      'dont want to be alive', 'don\'t want to be alive',
      'wish i wasnt alive', 'wish i wasn\'t alive', 'wish i was never alive',
      'hurt myself', 'harm myself', 'cut myself', 'cutting myself',
      'self harm', 'self-harm', 'want to cut', 'going to cut',
      'thinking about cutting', 'need to cut', 'deserve to be hurt',
      'should hurt myself', 'want to hurt myself', 'make myself bleed',
      'punish myself', 'deserve pain', 'need to feel pain',
      'everyone would be better off without me', 'better off without me',
      'world would be better without me', 'wish i was never born',
      'wish i never existed', 'shouldnt exist', 'regret being born',
      'shouldve never been born', 'should have never been born',
      'never should have been born', 'mistake to be born',
      'shouldnt be here', 'don\'t belong here', 'dont belong here',
      'nobody would miss me', 'no one would miss me', 'wouldnt be missed',
      'nobody would care', 'no one would care', 'nobody cares',
      'hate myself', 'hate my life', 'disgusted with myself',
      'worthless', 'useless', 'pathetic', 'failure',
      'cant do anything right', 'mess everything up', 'ruin everything',
      'lost cause', 'hopeless case', 'beyond help',
      'mental breakdown', 'losing my mind', 'going crazy',
      'cant cope', 'cant handle', 'overwhelmed completely',
      'drowning', 'suffocating', 'trapped forever'
    ];

    const getLevenshteinDistance = (str1: string, str2: string): number => {
      const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
      
      for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
      
      for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1,
            matrix[j - 1][i - 1] + indicator
          );
        }
      }
      
      return matrix[str2.length][str1.length];
    };

    const hasHinderingContent = hinderingPatterns.some(pattern => {
      if (normalizedInput.includes(pattern)) {
        return true;
      }
      
      if (pattern.includes('kill myself') || pattern.includes('end my life') || 
          pattern.includes('suicide') || pattern.includes('want to die')) {
        const patternWords = pattern.split(' ');
        const inputWords = normalizedInput.split(' ');
        let matchCount = 0;
        
        patternWords.forEach(word => {
          if (inputWords.includes(word) || 
              inputWords.includes(word.replace('cant', 'cannot')) ||
              inputWords.includes(word.replace('im', 'i am'))) {
            matchCount++;
          }
        });
        
        if (matchCount >= Math.max(2, Math.ceil(patternWords.length * 0.7))) {
          return true;
        }
      }
      
      const words = pattern.split(' ');
      if (words.length <= 3) {
        for (const word of normalizedInput.split(' ')) {
          if (getLevenshteinDistance(word, pattern) <= 2 && word.length >= 4) {
            return true;
          }
        }
      }
      
      return false;
    });

    return hasHinderingContent;
  };

  const detectCrisisLevel = (): CrisisLevel => {
    const fullContent = archetypeData.fullMessage || archetypeData.response || '';
    
    if (archetypeData.isHinderingEntry === true) {
      return 'hindering';
    }
    
    if (fullContent.includes('💬 If things feel overwhelming')) {
      return 'hindering';
    }
    
    const normalizedInput = userInput
      .toLowerCase()
      .replace(/[.,!?;:\-()[\]{}'"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const crisisPatterns = [
      'going to kill myself tonight', 'im going to kill myself', 'planning to kill myself',
      'have a plan to', 'going to do it tonight', 'ready to do it',
      'tonight is the night', 'this is it', 'goodbye world',
      'cant take another day', 'done with everything', 'no way out',
      'nobody can stop me', 'made up my mind', 'final decision',
      'writing my note', 'said my goodbyes', 'ready to go'
    ];
    
    const hasCrisisContent = crisisPatterns.some(pattern => 
      normalizedInput.includes(pattern)
    );
    
    if (hasCrisisContent) {
      return 'crisis';
    }
    
    const elevatedConcernPatterns = [
      'want to end it all', 'feel like ending it all', 'want to end everything',
      'want to disappear', 'wish i could disappear', 'want to just disappear',
      'cant take this anymore', 'cant go on', 'cant handle this',
      'want to give up', 'ready to give up', 'giving up on everything',
      'no point anymore', 'whats the point', 'why bother',
      'tired of living', 'exhausted from living', 'done with life',
      'want out', 'need to escape', 'trapped forever',
      'cant keep going', 'done fighting', 'tired of fighting'
    ];
    
    const hasElevatedConcern = elevatedConcernPatterns.some(pattern => 
      normalizedInput.includes(pattern)
    );
    
    if (hasElevatedConcern) {
      return 'elevated';
    }
    
    if (detectHinderingEntry()) {
      return 'hindering';
    }
    
    return 'normal';
  };

  const crisisLevel = detectCrisisLevel();
  const isHinderingEntry = crisisLevel === 'hindering' || detectHinderingEntry();
  
  // TIER 3: Active Crisis - Show full-screen modal immediately (useEffect MUST be called consistently)
  useEffect(() => {
    if (crisisLevel === 'crisis') {
      setShowCrisisModal(true);
    }
  }, [crisisLevel]);

  // Helper functions
  const truncateUserInput = (input: string, maxLines: number = 3): { truncated: string; needsTruncation: boolean } => {
    const words = input.split(' ');
    const wordsPerLine = 6;
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

  // DEBUG: Log crisis detection results
  console.log('🚨 CRISIS DETECTION DEBUG:', {
    userInput: userInput.substring(0, 50) + (userInput.length > 50 ? '...' : ''),
    crisisLevel,
    isHinderingEntry,
    backendFlag: archetypeData.isHinderingEntry
  });

  // Early return AFTER all hooks have been called
  if (!fontsLoaded) {
    return null;
  }

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
        {/* TIER 2: Shortened message for elevated concern */}
        {crisisLevel === 'elevated' ? (
          <Text style={styles.messageText}>
            {cleanedMessage.split('.').slice(0, 2).join('.') + (cleanedMessage.split('.').length > 2 ? '.' : '')}
          </Text>
        ) : (
          <Text style={styles.messageText}>{cleanedMessage}</Text>
        )}
        
        {/* TIER 2: Enhanced Crisis Resources for Elevated Concern */}
        {crisisLevel === 'elevated' && (
          <View style={styles.supportContainer}>
            <View style={styles.supportDivider} />
            <Text style={styles.supportEmoji}>🚨</Text>
            <View style={styles.supportHeader}>
              <Text style={styles.supportTitle}>We're here if you need extra support</Text>
            </View>
            <Text style={styles.supportMessage}>
              It sounds like you're going through something really tough right now. That takes courage to share, and you don't have to face this alone.
            </Text>
            <TouchableOpacity 
              style={[styles.supportButton, styles.elevatedSupportButton]}
              onPress={() => setShowSupportModal(true)}
            >
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={[styles.supportButtonText, styles.elevatedSupportButtonText]}>Talk to someone now</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* TIER 1: Support Resources for Hindering Entries */}
        {isHinderingEntry && crisisLevel !== 'elevated' && (
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

      {/* TIER 3: Crisis Intervention Modal */}
      <CrisisModal
        visible={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
        userRegion="US"
      />
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
  elevatedSupportButton: {
    backgroundColor: '#EF5350',
    borderColor: '#EF5350',
  },
  elevatedSupportButtonText: {
    color: '#fff',
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