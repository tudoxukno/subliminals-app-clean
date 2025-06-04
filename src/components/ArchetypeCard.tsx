import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ArchetypeCardProps = {
  title: string;
  icon: string;
  response: string;
  tags: string[];
  onPress: () => void;
};

export const ArchetypeCard: React.FC<ArchetypeCardProps> = ({
  title,
  icon,
  response,
  tags,
  onPress,
}) => {
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.toneSubtitle}>{tags.join(' • ')}</Text>
          </View>
        </View>
        <View style={styles.quoteContainer}>
          <View style={styles.quoteLine} />
          <Text style={styles.cardResponse}>"{response}"</Text>
        </View>
        <View style={styles.bottomContainer}>
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    shadowColor: '#595959',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  toneSubtitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quoteContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingRight: 8,
  },
  quoteLine: {
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 12,
    borderRadius: 1,
  },
  cardResponse: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  bottomContainer: {
    alignItems: 'flex-end',
  },
}); 