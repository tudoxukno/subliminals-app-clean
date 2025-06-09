import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  LayoutChangeEvent,
  Animated,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  useFonts,
  PlayfairDisplay_500Medium_Italic,
} from '@expo-google-fonts/playfair-display';

const { width } = Dimensions.get('window');

// Card height configurations
const CARD_HEIGHTS = {
  MIN: 280, // Minimum height for subliminal view
  MAX: 500, // Maximum height to prevent overly tall cards
};

type SubliminalCardProps = {
  userInput: string;
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

// Helper function to clean the main message by removing appended support text
const cleanMainMessage = (message: string): string => {
  // Remove the appended support message if it exists
  const supportMessagePattern = /\s*💬\s*If things feel overwhelming.*$/;
  return message.replace(supportMessagePattern, '').trim();
};

export const SubliminalCard: React.FC<SubliminalCardProps> = ({
  userInput,
  selectedArchetype,
  archetypeData,
  background,
  contentFadeAnim,
  onLayout,
}) => {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium_Italic,
  });

  const contentRef = useRef<View>(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    onLayout?.(height);
  };

  if (!fontsLoaded) {
    return null;
  }

  const renderContent = () => (
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
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.overlay}
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
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
            style={styles.overlay}
          />
        </>
      ) : null}

      {/* Content */}
      <Animated.View 
        style={[
          styles.cardContent,
          contentFadeAnim && { opacity: contentFadeAnim }
        ]}
        ref={contentRef}
      >
        {/* Archetype Header */}
        <View style={styles.archetypeHeader}>
          <Text style={styles.archetypeIcon}>{archetypeData.icon}</Text>
          <View>
            <Text style={styles.archetypeTitle}>{selectedArchetype}</Text>
            <Text style={styles.archetypeSubtitle}>
              {archetypeData.tags.join(' • ')}
            </Text>
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Main Message */}
          <Text style={styles.message}>{cleanMainMessage(archetypeData.fullMessage)}</Text>
          
          {/* Divider */}
          <View style={styles.divider} />
          
          {/* Quote */}
          <View style={styles.quoteWrapper}>
            <Text style={styles.quote}>{archetypeData.quote}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );

  return renderContent();
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
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    marginTop: 24,
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  message: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
  },
  quoteWrapper: {
    paddingHorizontal: 20,
    marginHorizontal: -20,
    alignItems: 'center',
    paddingBottom: 12,
  },
  quote: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_500Medium_Italic',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
}); 