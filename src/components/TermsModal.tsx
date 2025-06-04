import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Terms of Use</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.effectiveDate}>Effective Date: June 2, 2025</Text>
            
            <Text style={styles.paragraph}>
              Welcome to Subliminals. These Terms of Use ("Terms") govern your use of the Subliminals mobile application (the "App") and any related services provided by us ("we", "our", or "us").
            </Text>
            
            <Text style={styles.paragraph}>
              By using the App, you agree to be bound by these Terms. If you do not agree, please do not use the App.
            </Text>

            <Text style={styles.sectionTitle}>1. Use of the App</Text>
            <Text style={styles.paragraph}>
              Subliminals is intended for personal, non-commercial use to support mental and emotional wellness. You agree to use the App only for lawful purposes and in accordance with these Terms.
            </Text>
            <Text style={styles.paragraph}>
              You must be at least 13 years old to use the App.
            </Text>

            <Text style={styles.sectionTitle}>2. User Content</Text>
            <Text style={styles.paragraph}>
              You may input personal thoughts or reflections into the App. This content remains yours. We do not claim ownership over anything you write.
            </Text>
            <Text style={styles.paragraph}>
              By using the App, you agree not to input or share any content that:
            </Text>
            <Text style={styles.bulletPoint}>• Is unlawful, abusive, or harmful</Text>
            <Text style={styles.bulletPoint}>• Violates the rights of others</Text>
            <Text style={styles.bulletPoint}>• Contains viruses or malicious code</Text>
            <Text style={styles.paragraph}>
              We reserve the right to remove access to the App for anyone misusing the service.
            </Text>

            <Text style={styles.sectionTitle}>3. Subscriptions and Payments</Text>
            <Text style={styles.paragraph}>
              Subliminals offers in-app purchases for premium features via Apple's App Store. All billing is handled by Apple, and you are responsible for managing your subscription through your Apple account.
            </Text>
            <Text style={styles.paragraph}>
              We do not offer refunds for subscriptions purchased through Apple. Please refer to Apple's support site for refund and billing questions.
            </Text>

            <Text style={styles.sectionTitle}>4. Intellectual Property</Text>
            <Text style={styles.paragraph}>
              All content, branding, features, and design within the App — excluding user-submitted text — are the property of Subliminals and may not be copied, modified, or used without permission.
            </Text>

            <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
            <Text style={styles.paragraph}>
              The App uses third-party services including:
            </Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>OpenAI</Text> – To generate reflective responses</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Firebase</Text> – For authentication and infrastructure</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>RevenueCat</Text> – For subscription management</Text>
            <Text style={styles.paragraph}>
              Your use of the App is also subject to the terms and privacy policies of these services.
            </Text>

            <Text style={styles.sectionTitle}>6. No Medical Advice</Text>
            <Text style={styles.importantNotice}>
              <Text style={styles.bold}>IMPORTANT:</Text> Subliminals is a self-reflection tool intended to support mental and emotional wellness. It does <Text style={styles.bold}>not</Text> provide medical, therapeutic, or psychiatric advice and should not be used as a substitute for professional help.
            </Text>
            <Text style={styles.paragraph}>
              If you are experiencing a mental health crisis, please seek help from a licensed professional or contact emergency services.
            </Text>

            <Text style={styles.sectionTitle}>7. Termination</Text>
            <Text style={styles.paragraph}>
              We reserve the right to suspend or terminate your access to the App at any time, without notice, if we believe you have violated these Terms or misused the service.
            </Text>

            <Text style={styles.sectionTitle}>8. Changes to These Terms</Text>
            <Text style={styles.paragraph}>
              We may update these Terms from time to time. If we make material changes, we will notify users through the App or update the effective date above.
            </Text>
            <Text style={styles.paragraph}>
              Your continued use of the App after any changes means you accept the updated Terms.
            </Text>

            <Text style={styles.sectionTitle}>9. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions about these Terms, please contact the Subliminals Team:
            </Text>
            <Text style={styles.contactInfo}>
              <Text style={styles.bold}>Email:</Text> subliminalsapp@gmail.com
            </Text>

            <Text style={styles.footer}>
              By using Subliminals, you acknowledge that you have read and understood these Terms of Use and agree to be bound by them.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  effectiveDate: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  bulletPoint: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 8,
  },
  bold: {
    fontWeight: '600',
    color: '#fff',
  },
  importantNotice: {
    backgroundColor: '#2B2B2B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    color: '#fff',
  },
  contactInfo: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  footer: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2B2B2B',
  },
}); 