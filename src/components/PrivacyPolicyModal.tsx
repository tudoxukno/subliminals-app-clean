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

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
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
            <Text style={styles.headerTitle}>Privacy Policy</Text>
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
              Subliminals ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use the Subliminals mobile application (the "App").
            </Text>
            
            <Text style={styles.paragraph}>
              By using the App, you agree to the collection and use of information in accordance with this policy.
            </Text>

            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.paragraph}>
              We collect the following types of information:
            </Text>

            <Text style={styles.subSectionTitle}>• Account Information</Text>
            <Text style={styles.paragraph}>
              If you sign in, we may collect your email address or login credentials to manage your account, authentication, and subscription access.
            </Text>

            <Text style={styles.subSectionTitle}>• User Input</Text>
            <Text style={styles.paragraph}>
              The text you enter into the App (your thoughts or reflections) is used to generate supportive responses. This information is stored <Text style={styles.bold}>locally on your device</Text> and is not shared unless you explicitly choose to save or share a reflection.
            </Text>

            <Text style={styles.subSectionTitle}>• Subscription & Purchase Data</Text>
            <Text style={styles.paragraph}>
              We use <Text style={styles.bold}>RevenueCat</Text> to manage in-app purchases. RevenueCat may collect anonymized purchase and device data to ensure your subscription works across devices.
            </Text>

            <Text style={styles.subSectionTitle}>• Usage Data & Crash Logs</Text>
            <Text style={styles.paragraph}>
              We may collect anonymous diagnostic and usage data to help us improve the app experience. This may include crash reports or performance data.
            </Text>

            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.paragraph}>We use your information to:</Text>
            <Text style={styles.bulletPoint}>• Generate personalized reflections based on your input</Text>
            <Text style={styles.bulletPoint}>• Provide access to premium content if you're a subscriber</Text>
            <Text style={styles.bulletPoint}>• Store your saved reflections on your device</Text>
            <Text style={styles.bulletPoint}>• Maintain and improve the app's features and stability</Text>
            <Text style={styles.bulletPoint}>• Respond to support requests or issues you report</Text>
            
            <Text style={styles.paragraph}>
              We do <Text style={styles.bold}>not</Text> sell your personal information or use it for advertising purposes.
            </Text>

            <Text style={styles.sectionTitle}>3. Third-Party Services</Text>
            <Text style={styles.paragraph}>
              We use trusted third-party services to power the app's core features. These services may collect anonymized or device-level data as outlined in their respective privacy policies:
            </Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Firebase</Text> – Authentication and infrastructure</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>RevenueCat</Text> – Subscription and billing management</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>OpenAI</Text> – Generation of reflections from user-submitted text</Text>
            
            <Text style={styles.paragraph}>
              Each third-party provider is responsible for its own data handling practices.
            </Text>

            <Text style={styles.sectionTitle}>4. Data Storage and Security</Text>
            <Text style={styles.bulletPoint}>• Reflections are stored locally on your device unless otherwise stated.</Text>
            <Text style={styles.bulletPoint}>• If you uninstall the app or delete saved reflections via Settings, they will be permanently removed from your device.</Text>
            <Text style={styles.bulletPoint}>• All third-party services we use implement secure data practices and encryption.</Text>

            <Text style={styles.sectionTitle}>5. Your Rights and Choices</Text>
            <Text style={styles.bulletPoint}>• You may clear all saved reflections using the <Text style={styles.bold}>Clear All Saved Subliminals</Text> option in the app settings.</Text>
            <Text style={styles.bulletPoint}>• You may request deletion of your account or any associated data by contacting us.</Text>

            <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
            <Text style={styles.paragraph}>
              Subliminals is not intended for children under the age of 13. We do not knowingly collect personal information from children. If you believe that a child has provided us with personal data, please contact us so we can remove it.
            </Text>

            <Text style={styles.sectionTitle}>7. Changes to This Privacy Policy</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. We will notify users of significant changes either through the App or by updating the effective date above. We encourage you to review this policy periodically.
            </Text>

            <Text style={styles.sectionTitle}>8. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions, feedback, or requests regarding this Privacy Policy or your data, please contact the Subliminals Team:
            </Text>
            <Text style={styles.contactInfo}>
              <Text style={styles.bold}>Email:</Text> subliminalsapp@gmail.com
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
  subSectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
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
  contactInfo: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
}); 