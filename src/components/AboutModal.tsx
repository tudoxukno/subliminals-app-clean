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

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
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
            <Text style={styles.headerTitle}>About Subliminals</Text>
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
            <View style={styles.versionContainer}>
              <Text style={styles.appName}>Subliminals</Text>
              <Text style={styles.version}>Version 1.0.0</Text>
            </View>
            
            <Text style={styles.description}>
              Subliminals is a space for quiet clarity — a self-reflection tool designed to help you process your thoughts, shift your mindset, and reconnect with yourself.
            </Text>
            
            <Text style={styles.description}>
              Type what's on your mind, and receive a thoughtful response crafted to meet you where you are. Every reflection is intentional — rooted in emotional resonance, not judgment.
            </Text>
            
            <Text style={styles.description}>
              Whether you're checking in daily or just need a moment of grounding, Subliminals is here to help you feel seen, supported, and understood.
            </Text>

            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Features</Text>
              
              <View style={styles.featureItem}>
                <Ionicons name="eye-outline" size={20} color="#667eea" style={styles.featureIcon} />
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Five Unique Archetypes</Text>
                  <Text style={styles.featureDescription}>Mirror, Therapist, Realist, Poet, and Best Friend — each offering a different perspective on your thoughts</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="heart-outline" size={20} color="#667eea" style={styles.featureIcon} />
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Personalized Responses</Text>
                  <Text style={styles.featureDescription}>AI-powered reflections tailored to your unique input and emotional state</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="bookmark-outline" size={20} color="#667eea" style={styles.featureIcon} />
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Save & Revisit</Text>
                  <Text style={styles.featureDescription}>Keep meaningful reflections to revisit whenever you need them</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="image-outline" size={20} color="#667eea" style={styles.featureIcon} />
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Beautiful Backgrounds</Text>
                  <Text style={styles.featureDescription}>Dynamically generated artwork that complements your reflection</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#667eea" style={styles.featureIcon} />
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Privacy First</Text>
                  <Text style={styles.featureDescription}>Your thoughts are stored locally on your device by default</Text>
                </View>
              </View>
            </View>

            <View style={styles.missionSection}>
              <Text style={styles.sectionTitle}>Our Mission</Text>
              <Text style={styles.missionText}>
                In a world that often feels overwhelming, we believe everyone deserves a moment of clarity and understanding. Subliminals isn't about quick fixes or empty positivity — it's about creating space for authentic self-reflection and gentle guidance when you need it most.
              </Text>
            </View>

            <View style={styles.contactSection}>
              <Text style={styles.sectionTitle}>Get in Touch</Text>
              <Text style={styles.contactText}>
                Have feedback, questions, or just want to share your experience? We'd love to hear from you.
              </Text>
              <Text style={styles.contactEmail}>subliminalsapp@gmail.com</Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Made with care for your inner journey</Text>
              <Text style={styles.copyright}>© 2025 Subliminals</Text>
            </View>
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
  versionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  version: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
  },
  missionSection: {
    marginBottom: 32,
  },
  missionText: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  contactSection: {
    marginBottom: 32,
  },
  contactText: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  contactEmail: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2B2B2B',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  copyright: {
    color: '#555',
    fontSize: 12,
  },
}); 