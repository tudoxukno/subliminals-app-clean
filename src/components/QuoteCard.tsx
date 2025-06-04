import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  useFonts,
  PlayfairDisplay_500Medium_Italic,
} from '@expo-google-fonts/playfair-display';

const { width } = Dimensions.get('window');

const CARD_HEIGHT = 340; // Minimum height for quote view

type QuoteCardProps = {
  selectedArchetype: string;
  archetypeData: {
    icon: string;
    response: string;
    fullMessage: string;
    quote: string;
    tags: string[];
    backgroundImage?: string;
  };
  background?: {
    source: any | null;
    url?: string;
  } | null;
  contentFadeAnim?: Animated.Value;
  onLayout?: (height: number) => void; // Add callback for height changes
};

export const QuoteCard: React.FC<QuoteCardProps> = ({
  selectedArchetype,
  archetypeData,
  background,
  contentFadeAnim,
  onLayout,
}) => {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium_Italic,
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    onLayout?.(height);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.card} onLayout={handleLayout}>
      {/* Background Image - selectedBackground takes priority over archetypeData.backgroundImage */}
      {background && (background.source || background.url) ? (
        <>
          <Image 
            style={styles.backgroundImage}
            source={background.source ? background.source : { uri: background.url }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.3)']}
            style={styles.backgroundOverlay}
          />
        </>
      ) : archetypeData.backgroundImage ? (
        <>
          <Image 
            style={styles.backgroundImage}
            source={{ uri: archetypeData.backgroundImage }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.3)']}
            style={styles.backgroundOverlay}
          />
        </>
      ) : null}
      
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.archetypeHeader}>
          <Text style={styles.archetypeIcon}>{archetypeData.icon}</Text>
          <View>
            <Text style={styles.archetypeTitle}>{selectedArchetype}</Text>
            <Text style={styles.archetypeSubtitle}>
              {archetypeData.tags.join(' • ')}
            </Text>
          </View>
        </View>

        {/* Quote Content */}
        <Animated.View 
          style={[
            styles.quoteContainer,
            contentFadeAnim ? { opacity: contentFadeAnim } : null
          ]}
        >
          <Text style={styles.quoteText}>{archetypeData.quote}</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width - 40,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
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
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 16,
    minHeight: 280,
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  archetypeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  archetypeTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  archetypeSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quoteContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    minHeight: 180,
  },
  quoteText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 42,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_500Medium_Italic',
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
}); 