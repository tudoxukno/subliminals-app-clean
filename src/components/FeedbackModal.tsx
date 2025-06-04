import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'general' | 'improvement';

interface FeedbackOption {
  id: FeedbackType;
  title: string;
  description: string;
  icon: string;
}

const feedbackOptions: FeedbackOption[] = [
  {
    id: 'bug',
    title: 'Report a Bug',
    description: 'Something isn\'t working as expected',
    icon: 'bug-outline',
  },
  {
    id: 'feature',
    title: 'Request a Feature',
    description: 'Suggest a new feature or enhancement',
    icon: 'bulb-outline',
  },
  {
    id: 'improvement',
    title: 'Suggest Improvement',
    description: 'Help us make the app better',
    icon: 'trending-up-outline',
  },
  {
    id: 'general',
    title: 'General Feedback',
    description: 'Share your thoughts or questions',
    icon: 'chatbubble-outline',
  },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onClose }) => {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType || !subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (email && !isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement actual feedback submission to your backend
      // For now, we'll simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Feedback Sent!',
        'Thank you for your feedback. We\'ll review it and get back to you if needed.',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setSubject('');
    setMessage('');
    setEmail('');
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Submit Feedback</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Feedback Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What type of feedback is this?</Text>
              <View style={styles.optionsContainer}>
                {feedbackOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionCard,
                      selectedType === option.id && styles.optionCardSelected,
                    ]}
                    onPress={() => setSelectedType(option.id)}
                  >
                    <View style={styles.optionHeader}>
                      <Ionicons 
                        name={option.icon as any} 
                        size={20} 
                        color={selectedType === option.id ? '#fff' : '#666'} 
                      />
                      <Text style={[
                        styles.optionTitle,
                        selectedType === option.id && styles.optionTitleSelected,
                      ]}>
                        {option.title}
                      </Text>
                    </View>
                    <Text style={[
                      styles.optionDescription,
                      selectedType === option.id && styles.optionDescriptionSelected,
                    ]}>
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subject *</Text>
              <TextInput
                style={styles.textInput}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief description of your feedback"
                placeholderTextColor="#666"
                maxLength={100}
              />
              <Text style={styles.characterCount}>{subject.length}/100</Text>
            </View>

            {/* Message Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Message *</Text>
              <TextInput
                style={[styles.textInput, styles.messageInput]}
                value={message}
                onChangeText={setMessage}
                placeholder="Please provide detailed information about your feedback..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.characterCount}>{message.length}/1000</Text>
            </View>

            {/* Email Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Email (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.helperText}>
                We'll only use this to follow up on your feedback if needed
              </Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedType || !subject.trim() || !message.trim() || isSubmitting) && 
                styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedType || !subject.trim() || !message.trim() || isSubmitting}
            >
              <Text style={[
                styles.submitButtonText,
                (!selectedType || !subject.trim() || !message.trim() || isSubmitting) && 
                styles.submitButtonTextDisabled,
              ]}>
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    height: '85%',
    minHeight: 600,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  optionCardSelected: {
    borderColor: '#fff',
    backgroundColor: '#1A1A1A',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  optionTitleSelected: {
    color: '#fff',
  },
  optionDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  optionDescriptionSelected: {
    color: '#ccc',
  },
  textInput: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2B2B2B',
  },
  submitButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#333',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#666',
  },
}); 