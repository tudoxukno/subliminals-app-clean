import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CrisisResource, getCrisisResourcesByRegion } from '../utils/crisisResources';

interface CrisisModalProps {
  visible: boolean;
  onClose: () => void;
  userRegion?: string;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({
  visible,
  onClose,
  userRegion = 'US'
}) => {
  const crisisResources = getCrisisResourcesByRegion(userRegion);

  const handleContact = async (resource: CrisisResource) => {
    try {
      let url = '';
      
      switch (resource.type) {
        case 'call':
          url = `tel:${resource.contact}`;
          break;
        case 'text':
          url = `sms:${resource.contact}`;
          break;
        case 'email':
          url = `mailto:${resource.contact}`;
          break;
        case 'chat':
          url = resource.url || resource.contact;
          break;
      }

      if (url) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening crisis resource:', error);
    }
  };

  const ContactButton: React.FC<{ resource: CrisisResource; isPrimary?: boolean }> = ({ 
    resource, 
    isPrimary = false 
  }) => (
    <TouchableOpacity
      style={[styles.contactButton, isPrimary && styles.primaryContactButton]}
      onPress={() => handleContact(resource)}
      activeOpacity={0.8}
    >
      <View style={styles.contactButtonContent}>
        <Ionicons 
          name={resource.type === 'call' ? 'call' : resource.type === 'text' ? 'chatbubbles' : 
                resource.type === 'email' ? 'mail' : 'globe'} 
          size={20} 
          color={isPrimary ? '#fff' : '#EF5350'} 
        />
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, isPrimary && styles.primaryContactName]}>
            {resource.name}
          </Text>
          <Text style={[styles.contactDetails, isPrimary && styles.primaryContactDetails]}>
            {resource.type === 'call' ? 'Call' : 
             resource.type === 'text' ? 'Text' : 
             resource.type === 'email' ? 'Email' : 'Chat'} {resource.contact}
          </Text>
          {resource.description && (
            <Text style={[styles.contactDescription, isPrimary && styles.primaryContactDescription]}>
              {resource.description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>

          {/* Crisis Support Section */}
          <View style={styles.supportContainer}>
            <View style={styles.supportHeader}>
              <Text style={styles.supportEmoji}>🚨</Text>
              <Text style={styles.supportTitle}>Crisis Support Available</Text>
            </View>
            
            <Text style={styles.supportMessage}>
              You're not alone. Professional help is available 24/7. Please reach out to someone who can support you right now.
            </Text>

            {/* Primary Resource */}
            <TouchableOpacity
              style={[styles.supportButton, styles.primarySupportButton]}
              onPress={() => handleContact(crisisResources.primary)}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={[styles.supportButtonText, styles.primarySupportButtonText]}>
                Call {crisisResources.primary.contact}
              </Text>
            </TouchableOpacity>

            {/* Secondary Resources */}
            {crisisResources.secondary && (
              <ContactButton resource={crisisResources.secondary} />
            )}
            
            {crisisResources.chat && (
              <ContactButton resource={crisisResources.chat} />
            )}
            
            {/* Additional Resources */}
            {crisisResources.additional?.map((resource, index) => (
              <ContactButton key={index} resource={resource} />
            ))}
          </View>

          {/* Encouraging Message */}
          <View style={styles.encouragementSection}>
            <Text style={styles.encouragementText}>
              You matter. Getting help is a sign of strength, not weakness.
            </Text>
          </View>

          {/* Return to App */}
          <TouchableOpacity
            style={styles.returnButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#666" style={{ marginRight: 12 }} />
            <Text style={styles.returnButtonText}>
              Return when you're ready
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2B2B2B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  supportContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  supportHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  supportEmoji: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  supportMessage: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  primarySupportButton: {
    backgroundColor: '#EF5350',
    borderColor: '#EF5350',
  },
  supportButtonText: {
    color: '#EF5350',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  primarySupportButtonText: {
    color: '#fff',
  },
  contactButton: {
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  primaryContactButton: {
    backgroundColor: '#EF5350',
    borderColor: '#EF5350',
  },
  contactButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  primaryContactName: {
    color: '#fff',
  },
  contactDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  primaryContactDetails: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  contactDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  primaryContactDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  encouragementSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  encouragementText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  returnButton: {
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  returnButtonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CrisisModal; 