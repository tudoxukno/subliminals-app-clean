import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ArchetypeCard {
  archetype: 'Mirror' | 'Therapist' | 'Realist' | 'Poet' | 'Best Friend';
  icon: string;
  response: string;
  tags: string[];
}

interface SplashScreenProps {
  onFinish: () => void;
}

// Static archetype messages for splash screen (no API calls)
const archetypeMessages: ArchetypeCard[] = [
  {
    archetype: 'Mirror',
    icon: '🪞',
    response: 'You\'re processing something important right now. Trust your inner wisdom to guide you.',
    tags: ['self-awareness', 'reflection']
  },
  {
    archetype: 'Therapist',
    icon: '🫂',
    response: 'It\'s okay to feel uncertain. Growth often begins in the space between what was and what will be.',
    tags: ['support', 'growth']
  },
  {
    archetype: 'Realist',
    icon: '🪓',
    response: 'Progress isn\'t always linear. Sometimes the most important work happens in the quiet moments.',
    tags: ['perspective', 'balance']
  },
  {
    archetype: 'Poet',
    icon: '🌙',
    response: 'Your story is still being written. Each chapter adds depth to the beautiful narrative of you.',
    tags: ['creativity', 'beauty']
  },
  {
    archetype: 'Mirror',
    icon: '🪞',
    response: 'What you\'re feeling right now is valid. Your emotions are messengers, not enemies.',
    tags: ['validation', 'awareness']
  },
  {
    archetype: 'Therapist',
    icon: '🫂',
    response: 'Healing isn\'t about forgetting the past. It\'s about changing your relationship with it.',
    tags: ['healing', 'transformation']
  },
  {
    archetype: 'Realist',
    icon: '🪓',
    response: 'Small, consistent actions create lasting change. You don\'t need to transform overnight.',
    tags: ['consistency', 'progress']
  },
  {
    archetype: 'Poet',
    icon: '🌙',
    response: 'In the garden of your mind, tend to thoughts that help you bloom.',
    tags: ['mindfulness', 'growth']
  },
  {
    archetype: 'Best Friend',
    icon: '🫶',
    response: 'Hey bestie, I see you right now. You\'re doing better than you think, and I\'m proud of you.',
    tags: ['support', 'loyalty']
  },
  {
    archetype: 'Best Friend',
    icon: '🫶',
    response: 'Not too much on my friend today. You\'re exactly where you need to be, and I got you.',
    tags: ['validation', 'friendship']
  }
];

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animation values for each row
  const row1Animation = useRef(new Animated.Value(0)).current;
  const row2Animation = useRef(new Animated.Value(0)).current;
  const row3Animation = useRef(new Animated.Value(0)).current;
  const row4Animation = useRef(new Animated.Value(0)).current;
  const row5Animation = useRef(new Animated.Value(0)).current;
  
  // Logo animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start logo animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Start row animations with same slower pace
    const startRowAnimation = (animValue: Animated.Value, delay: number) => {
      setTimeout(() => {
        Animated.loop(
          Animated.timing(animValue, {
            toValue: 1,
            duration: 25000, // Slower pace - 25 seconds
            useNativeDriver: true,
          })
        ).start();
      }, delay);
    };

    startRowAnimation(row1Animation, 0);
    startRowAnimation(row2Animation, 500);
    startRowAnimation(row3Animation, 1000);
    startRowAnimation(row4Animation, 1500);
    startRowAnimation(row5Animation, 2000);

    // Auto-transition after 6 seconds (longer for app loading)
    const timer = setTimeout(() => {
      onFinish();
    }, 6000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const renderCard = (card: ArchetypeCard, index: number) => {
    const getArchetypeColor = (archetype: string) => {
      switch (archetype) {
        case 'Mirror': return '#4A90E2';
        case 'Therapist': return '#7ED321';
        case 'Realist': return '#F5A623';
        case 'Poet': return '#BD10E0';
        case 'Best Friend': return '#FF6B6B';
        default: return '#4A90E2';
      }
    };

    const color = getArchetypeColor(card.archetype);

    return (
      <View key={`${card.archetype}-${index}`} style={[
        styles.archetypeCard,
      ]}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>{card.icon}</Text>
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle}>{card.archetype}</Text>
              <Text style={styles.toneSubtitle}>{card.tags.slice(0, 2).join(' • ')}</Text>
            </View>
          </View>
          <View style={styles.quoteContainer}>
            <View style={[styles.quoteLine, { backgroundColor: color }]} />
            <Text style={styles.cardResponse}>"{card.response}"</Text>
          </View>
        </View>
      </View>
    );
  };

  // Create 5 rows with different card sets including Best Friend
  const row1Cards = archetypeMessages.slice(0, 4);
  const row2Cards = archetypeMessages.slice(2, 6);
  const row3Cards = archetypeMessages.slice(1, 5);
  const row4Cards = archetypeMessages.slice(3, 7);
  const row5Cards = archetypeMessages.slice(4, 8); // Include Best Friend cards

  console.log('🎭 ROW DATA:', {
    row1Cards: row1Cards.map(c => c.archetype),
    row2Cards: row2Cards.map(c => c.archetype),
    row3Cards: row3Cards.map(c => c.archetype),
    row4Cards: row4Cards.map(c => c.archetype),
    row5Cards: row5Cards.map(c => c.archetype)
  });

  const renderRow = (
    cards: ArchetypeCard[],
    animationValue: Animated.Value,
    direction: 'left' | 'right',
    rowIndex: number
  ) => {
    console.log(`🔍 RENDERING ROW ${rowIndex}:`, {
      cardCount: cards.length,
      direction,
      firstCard: cards[0]?.archetype
    });

    const cardWidth = 320;
    const cardSpacing = 16;
    const totalWidth = cards.length * (cardWidth + cardSpacing);
    
    const translateX = animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: direction === 'left' 
        ? [0, -totalWidth]  // Left: start from screen edge, move left
        : [-cardWidth, screenWidth], // Right: start from left edge, move right
    });

    // Simple explicit positioning for each row
    let topPosition;
    switch (rowIndex) {
      case 1:
        topPosition = 50; // First row - very top
        break;
      case 2:
        topPosition = 220; // Second row - much lower and more visible
        break;
      case 3:
        topPosition = 390; // Third row - consistent spacing (220 + 170 = 390)
        break;
      case 4:
        topPosition = 560; // Fourth row
        break;
      case 5:
        topPosition = 730; // Fifth row - consistent spacing (560 + 170 = 730)
        break;
      default:
        topPosition = 50;
    }

    console.log(`🎯 ROW ${rowIndex} POSITION:`, { 
      topPosition, 
      direction, 
      totalWidth, 
      screenWidth,
      outputRange: direction === 'left' 
        ? [0, -totalWidth]
        : [-cardWidth, screenWidth]
    });

    return (
      <View key={`row-${rowIndex}`} style={[
        styles.rowContainer, 
        { 
          top: topPosition,
        }
      ]}>
        <Animated.View
          style={[
            styles.row,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {cards.map((card, index) => {
            console.log(`🎴 ROW ${rowIndex} CARD ${index}:`, card.archetype);
            return renderCard(card, index);
          })}
          {/* Duplicate cards for seamless loop */}
          {cards.map((card, index) => renderCard(card, index + cards.length))}
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      
      {/* Background */}
      <View style={styles.background} />
      
      {/* Animated card rows - NOW WITH ALL 5 ROWS */}
      <View style={styles.cardRowsContainer}>
        {renderRow(row1Cards, row1Animation, 'right', 1)}
        {renderRow(row2Cards, row2Animation, 'left', 2)}
        {renderRow(row3Cards, row3Animation, 'right', 3)}
        {renderRow(row4Cards, row4Animation, 'left', 4)}
        {renderRow(row5Cards, row5Animation, 'right', 5)}
      </View>

      {/* Overlay to make logo more visible */}
      <View style={styles.overlay} />

      {/* Centered logo */}
      <View style={styles.logoContainer}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Subliminals</Text>
          <Text style={styles.tagline}>What's on your mind?</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0A',
  },
  cardRowsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 100,
    paddingBottom: 100,
  },
  rowContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 160,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    height: 160,
    alignItems: 'center',
  },
  // Authentic ArchetypeCard styles
  archetypeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginHorizontal: 8,
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
    width: 350,
    height: 160,
  },
  cardContent: {
    padding: 20,
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
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
    flex: 1,
    paddingRight: 12,
  },
  quoteLine: {
    width: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 16,
    borderRadius: 1.5,
  },
  cardResponse: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default SplashScreen; 