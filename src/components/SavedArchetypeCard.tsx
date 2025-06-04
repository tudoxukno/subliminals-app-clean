import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavedSubliminalWithDisplayDate } from '../types/subliminal';

type SavedArchetypeCardProps = {
  subliminal: SavedSubliminalWithDisplayDate;
  onCardPress: (subliminal: SavedSubliminalWithDisplayDate) => void;
  onOptionsPress: (subliminal: SavedSubliminalWithDisplayDate) => void;
};

// Same preview logic as ArchetypeSelectionScreen for consistency
const createResponsePreview = (fullMessage: string): string => {
  if (!fullMessage) return "Tap to see full response";
  
  // Remove quotes from the beginning and end
  const cleanMessage = fullMessage.replace(/^["']|["']$/g, '').trim();
  
  // Split into sentences and take the first 1-2 sentences
  const sentences = cleanMessage.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return "Tap to see full response";
  
  // Take first sentence, or first two if the first is very short
  let preview = sentences[0].trim();
  if (preview.length < 50 && sentences.length > 1) {
    preview += '. ' + sentences[1].trim();
  }
  
  // Add ellipsis if there's more content
  if (sentences.length > 1 && preview.length < cleanMessage.length - 20) {
    preview += '...';
  }
  
  return preview;
};

export const SavedArchetypeCard: React.FC<SavedArchetypeCardProps> = ({
  subliminal,
  onCardPress,
  onOptionsPress,
}) => {
  return (
    <View style={styles.cardShadowWrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed
        ]}
        onPress={() => onCardPress(subliminal)}
      >
        <View style={[styles.cardContent, styles.cardBorder]}>
          <View style={styles.headerSection}>
            <View style={styles.titleContainer}>
              <View style={styles.archetypeRow}>
                <Text style={styles.archetypeIcon}>{subliminal.archetypeData.icon}</Text>
                <View style={styles.titleSection}>
                  <Text style={styles.titleText}>{subliminal.selectedArchetype}</Text>
                  <Text style={styles.dateText}>{subliminal.displayDate}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => onOptionsPress(subliminal)}
              style={styles.ellipsisButton}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.quoteSection}>
            <View style={styles.quoteLine} />
            <Text style={styles.quoteText}>
              {createResponsePreview(subliminal.archetypeData.fullMessage || subliminal.archetypeData.response)}
            </Text>
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.toneContainer}>
              {subliminal.archetypeData.tags.map((tag, index) => (
                <View key={tag} style={styles.tonePill}>
                  <Text style={styles.toneText}>{tag}</Text>
                </View>
              ))}
            </View>
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={28} color="#fff" />
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  cardShadowWrapper: {
    shadowColor: '#595959',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardContent: {
    padding: 16,
    backgroundColor: '#1A1A1A',
  },
  cardBorder: {
    borderRadius: 12,
  },
  headerSection: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  archetypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  archetypeIcon: {
    fontSize: 20,
    width: 24,
    marginRight: 10,
    textAlign: 'center',
  },
  titleSection: {
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
  quoteSection: {
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
  quoteText: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    flex: 1,
  },
  ellipsisButton: {
    padding: 4,
    marginLeft: 12,
    height: 28,
    justifyContent: 'center',
    marginTop: -8,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  toneContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tonePill: {
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  toneText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arrowContainer: {
    marginLeft: 12,
  },
}); 