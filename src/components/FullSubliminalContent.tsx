import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
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
  };
};

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

  const { truncated: displayUserInput, needsTruncation } = truncateUserInput(userInput);

  if (!fontsLoaded) {
    return null;
  }

  // Use fullMessage for the complete content
  const fullText = archetypeData.fullMessage || archetypeData.response;

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
        <Text style={styles.messageText}>{fullText}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Quote */}
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>{archetypeData.quote}</Text>
      </View>

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
}); 