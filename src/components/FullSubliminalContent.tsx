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
    
    // Method 3: Robust keyword detection from user input (fallback)
    // Normalize input: lowercase, remove extra spaces/punctuation for better matching
    const normalizedInput = userInput
      .toLowerCase()
      .replace(/[.,!?;:\-()[\]{}'"]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
              // ULTRA-COMPREHENSIVE keyword patterns - covering ALL expressions of distress
     const hinderingPatterns = [
       // ═══ CRITICAL: Direct suicidal ideation ═══
       'kill myself', 'end my life', 'take my own life', 'commit suicide', 
       'want to die', 'wish i was dead', 'better off dead', 'end it all',
       'suicide', 'suicidal', 'dont want to be here', 'want to disappear',
       'cease to exist', 'not exist anymore', 'kill me', 'die', 'dont want to wake up',
       'wish i could just disappear', 'want the pain to stop forever',
       'should just disappear', 'should disappear', 'should just die',
       'should kill myself', 'would be better if i died', 'ready to die',
       'want to be dead', 'wish i could die', 'hope i die', 'need to die',
       'have to die', 'going to kill myself', 'planning to die',
       'thinking about suicide', 'thinking of suicide', 'considering suicide',
       'want out of this life', 'escape this life', 'done with life',
       'finished with life', 'life is over for me', 'my time is up',
       
       // ═══ CRITICAL: Self-harm expressions ═══
       'hurt myself', 'harm myself', 'cut myself', 'cutting myself',
       'self harm', 'self-harm', 'punish myself', 'deserve pain',
       'burn myself', 'blade', 'razor', 'cutting', 'slice myself',
       'should hurt myself', 'want to hurt myself', 'need to cut',
       'want to cut', 'going to cut', 'thinking about cutting',
       'need to self harm', 'want to self harm', 'thinking of hurting myself',
       'deserve to be hurt', 'should be punished', 'need punishment',
       'inflict pain on myself', 'cause myself pain', 'make myself bleed',
       
       // ═══ CRITICAL: Burden & unworthiness statements ═══
       'everyone would be better off without me', 'better off without me',
       'im a burden', 'burden to everyone', 'world would be better without me',
       'shouldnt exist', 'mistake that i exist', 'wish i was never born',
       'wish i never existed', 'wish i didnt exist', 'regret being born',
       'mistake being born', 'shouldnt be alive', 'dont deserve to live',
       'everyone would be happier without me', 'drag everyone down',
       'i shouldve never been born', 'i should have never been born',
       'shouldve never been born', 'should have never been born',
       'shouldnt have been born', 'never should have been born',
       'never shouldve been born', 'wish i could disappear',
       'wish i would disappear', 'shouldve never existed',
       'should have never existed', 'shouldnt have existed',
       
       // ═══ HIGH: Self-hatred & worthlessness ═══
       'hate myself', 'cant stand myself', 'cannot stand myself', 'despise myself',
       'disgust myself', 'loathe myself', 'detest myself', 'abhor myself',
       'im worthless', 'im pathetic', 'im useless', 'im nothing', 'im garbage', 
       'im trash', 'im a failure', 'im disgusting', 'im horrible', 'im awful', 
       'im terrible', 'im repulsive', 'im revolting', 'im hideous',
       'worthless', 'pathetic', 'useless', 'failure', 'waste of space',
       'piece of shit', 'piece of crap', 'good for nothing', 'im such a mess',
       'i ruin everything', 'broken beyond repair', 'damaged goods',
       'complete failure', 'total failure', 'fucking worthless', 'absolutely worthless',
       
       // ═══ HIGH: Disappearing & vanishing desires ═══
       'want to vanish', 'should vanish', 'wish i could vanish',
       'want to fade away', 'fade away', 'dissolve', 'evaporate',
       'melt away', 'just disappear forever', 'want to be erased',
       'erase myself', 'delete myself', 'remove myself from existence',
       'wish i could just vanish', 'want to just disappear',
       'should just vanish', 'need to disappear', 'have to disappear',
       'want to be invisible', 'wish i was invisible', 'become invisible',
       'wish i could fade', 'want to fade out', 'just fade away',
       'want to dissolve', 'should dissolve', 'melt into nothing',
       'cease to be', 'stop existing', 'no longer exist',
       
       // ═══ HIGH: Hopelessness & surrender ═══
       'hopeless', 'no hope', 'no point', 'whats the point', 'why bother',
       'give up', 'giving up', 'cant go on', 'cannot go on', 'cant take it',
       'cant do this', 'its hopeless', 'nothing matters', 'done trying',
       'had enough', 'at my limit', 'cant take anymore', 'im done',
       'cant anymore', 'tired of fighting', 'tired of trying', 'surrender',
       'throw in the towel', 'wave the white flag', 'lost the battle',
       'game over', 'the end for me', 'no more fight left',
       
       // ═══ HIGH: Crisis & breakdown states ═══
       'cant cope', 'cannot cope', 'falling apart', 'breaking down',
       'broken', 'losing it', 'lost it', 'going crazy', 'going insane',
       'cant handle', 'cannot handle', 'too much', 'overwhelmed',
       'drowning', 'suffocating', 'cant breathe', 'trapped', 'stuck',
       'mental breakdown', 'nervous breakdown', 'breakdown', 'crisis',
       'in a dark hole', 'lost at sea', 'feel like im falling',
       'spiraling out of control', 'losing my mind', 'going mad',
       'cracking up', 'coming apart', 'unraveling', 'imploding',
       
       // ═══ MEDIUM: Depression & despair ═══
       'depressed', 'depression', 'severely depressed', 'major depression',
       'anxious', 'anxiety', 'panic', 'panic attack', 'panic attacks', 
       'severely anxious', 'deeply sad', 'extremely sad', 'constantly sad',
       'miserable', 'devastated', 'shattered', 'crushed', 'destroyed',
       'in despair', 'despairing', 'anguish', 'tormented', 'tortured',
       
       // ═══ MEDIUM: Isolation & abandonment ═══
       'all alone', 'completely alone', 'totally alone', 'utterly alone',
       'nobody cares', 'no one cares', 'no one understands', 'isolated',
       'lonely', 'abandoned', 'forgotten', 'invisible', 'nobody loves me', 
       'unloved', 'no one loves me', 'everyone hates me', 'i dont matter',
       'im invisible', 'feel invisible', 'feel forgotten', 'feel abandoned',
       'cut off from everyone', 'disconnected', 'outcast', 'rejected',
       
       // ═══ MEDIUM: Emptiness & numbness ═══
       'empty inside', 'feel nothing', 'numb', 'hollow', 'void',
       'dead inside', 'emotionally dead', 'feel empty', 'empty',
       'emotionally numb', 'feel hollow', 'feel vacant', 'soul is empty',
       'heart is empty', 'nothing inside', 'blank inside', 'barren inside',
       
       // ═══ MEDIUM: Physical distress manifestations ═══
       'chest tight', 'heart racing', 'shaking uncontrollably', 
       'trembling', 'cant sleep', 'cannot sleep', 'exhausted',
       'completely drained', 'physically weak', 'my heart is breaking',
       'feel like im suffocating', 'feel sick all the time',
       'body is giving up', 'physically falling apart',
       
       // ═══ MEDIUM: Cries for help ═══
       'help me', 'save me', 'i need help', 'please help', 'someone help',
       'make it stop', 'somebody help me', 'need help desperately',
       'please make it stop', 'i need someone', 'rescue me',
       'someone save me', 'get me out of this', 'cant do this alone',
       
       // ═══ MEDIUM: Existential crisis ═══
       'life has no meaning', 'meaningless', 'pointless', 'why am i here',
       'whats the point of living', 'why exist', 'no purpose',
       'no reason to live', 'life is meaningless', 'existence is pointless',
       'tired of existing', 'why do i even try', 'nothing i do matters',
       'whats the point of anything', 'why was i born', 'life is empty',
       'regret being alive', 'regret existing', 'hate that i exist',
       'curse the day i was born', 'wish i was never created',
       'sorry i was born', 'apologize for existing', 'burden of existence',
       'existence is a mistake', 'my life is a mistake', 'i am a mistake',
       
       // ═══ MEDIUM: Despair questions ═══
       'will it ever get better', 'when does the pain stop', 'does it get easier',
       'will i ever be happy', 'when will this end', 'how much more can i take',
       'why is life so hard', 'what did i do to deserve this',
       'will the pain ever end', 'is there any hope', 'will i ever heal',
       'does anyone care if i live or die', 'would anyone miss me',
       
       // ═══ MEDIUM: Self-blame & guilt ═══
       'i deserve this pain', 'i deserve to suffer', 'this is what i deserve',
       'im getting what i deserve', 'i brought this on myself',
       'its all my fault', 'everything is my fault', 'i deserve nothing good',
       'i deserve to be punished', 'this is my punishment',
       
       // ═══ MEDIUM: Emotional metaphors ═══
       'drowning in sorrow', 'lost in darkness', 'buried alive',
       'trapped in hell', 'living nightmare', 'walking dead',
       'ghost of myself', 'shadow of who i was', 'shell of a person',
       'hanging by a thread', 'at the edge', 'about to break',
       'crumbling', 'withering away', 'fading away', 'disappearing',
       
       // ═══ LOW: Concerning but less severe ═══
       'so tired', 'exhausted from life', 'worn down', 'beaten down',
       'defeated', 'lost', 'confused', 'scared', 'terrified',
       'cant find my way', 'dont know what to do', 'lost hope',
       'giving up hope', 'losing hope', 'hope is gone'
     ];
    
    // Enhanced matching: Check for any pattern match with flexible word boundaries
    return hinderingPatterns.some(pattern => {
      // Direct substring match (most reliable)
      if (normalizedInput.includes(pattern)) {
        return true;
      }
      
      // Word boundary matching for shorter patterns (to avoid false positives)
      if (pattern.length <= 8) {
        const words = normalizedInput.split(' ');
        return words.some(word => word === pattern || word.includes(pattern));
      }
      
      // Fuzzy matching for variations (handle typos, contractions)
      const patternWords = pattern.split(' ');
      if (patternWords.length > 1) {
        // For multi-word patterns, check if most words are present
        const matchCount = patternWords.filter(word => 
          normalizedInput.includes(word) || 
          normalizedInput.includes(word.replace('cant', 'cannot')) ||
          normalizedInput.includes(word.replace('im', 'i am')) ||
          normalizedInput.includes(word.replace('its', 'it is')) ||
          normalizedInput.includes(word.replace('whats', 'what is')) ||
          normalizedInput.includes(word.replace('dont', 'do not'))
        ).length;
        return matchCount >= Math.ceil(patternWords.length * 0.7); // 70% of words must match
      }
      
      return false;
    });
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