import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CrisisResource, getCrisisResourcesByRegion } from '../utils/crisisResources';

interface EnhancedCrisisResourcesProps {
  userRegion?: string;
}

export const EnhancedCrisisResources: React.FC<EnhancedCrisisResourcesProps> = ({
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
      style={[styles.resourceButton, isPrimary && styles.primaryResourceButton]}
      onPress={() => handleContact(resource)}
      activeOpacity={0.8}
    >
      <View style={styles.resourceContent}>
        <Ionicons 
          name={resource.type === 'call' ? 'call' : resource.type === 'text' ? 'chatbubbles' : 
                resource.type === 'email' ? 'mail' : 'globe'} 
          size={20} 
          color={isPrimary ? '#fff' : '#EF5350'} 
        />
        <Text style={[styles.resourceText, isPrimary && styles.primaryResourceText]}>
          {resource.name}
        </Text>
        <Text style={[styles.resourceDetails, isPrimary && styles.primaryResourceDetails]}>
          {resource.contact}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart" size={20} color="#EF5350" />
        </View>
        <Text style={styles.headerText}>We're here if you need extra support</Text>
      </View>

      {/* Gentle Check-in Message */}
      <View style={styles.checkInSection}>
        <Text style={styles.checkInText}>
          It sounds like you're going through something really tough right now. That takes courage to share, and you don't have to face this alone.
        </Text>
      </View>

      {/* Primary Crisis Resources */}
      <View style={styles.resourcesSection}>
        <Text style={styles.resourcesTitle}>Talk to someone now:</Text>
        
        <ContactButton resource={crisisResources.primary} isPrimary={true} />
        
        {crisisResources.secondary && (
          <ContactButton resource={crisisResources.secondary} />
        )}
        
        {crisisResources.chat && (
          <ContactButton resource={crisisResources.chat} />
        )}
      </View>

      {/* Encouraging Message */}
      <View style={styles.encouragementSection}>
        <Text style={styles.encouragementText}>
          🌱 Small steps forward are still progress. You're stronger than you know.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef7f0',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ffe0d1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c62828',
    flex: 1,
  },
  checkInSection: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  checkInText: {
    fontSize: 14,
    color: '#ef6c00',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  resourcesSection: {
    marginBottom: 16,
  },
  resourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c62828',
    marginBottom: 12,
  },
  resourceButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryResourceButton: {
    backgroundColor: '#EF5350',
    borderColor: '#EF5350',
  },
  resourceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c62828',
    marginLeft: 10,
    flex: 1,
  },
  primaryResourceText: {
    color: '#fff',
  },
  resourceDetails: {
    fontSize: 12,
    color: '#f57f7f',
  },
  primaryResourceDetails: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  encouragementSection: {
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  encouragementText: {
    fontSize: 13,
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default EnhancedCrisisResources; 