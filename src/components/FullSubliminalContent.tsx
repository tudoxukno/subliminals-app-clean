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
        {archetypeData.isHinderingEntry && (
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