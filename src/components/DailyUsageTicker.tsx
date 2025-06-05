import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDailyUsage } from '../context/DailyUsageContext';

interface DailyUsageTickerProps {
  onUpgradePress?: () => void;
}

export const DailyUsageTicker: React.FC<DailyUsageTickerProps> = ({ onUpgradePress }) => {
  const { dailyUsage } = useDailyUsage();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Animation values
  const widthAnim = useRef(new Animated.Value(80)).current;
  const heightAnim = useRef(new Animated.Value(40)).current;
  const contentOpacityAnim = useRef(new Animated.Value(0)).current;
  const tickerOpacityAnim = useRef(new Animated.Value(1)).current;
  const iconPulseAnim = useRef(new Animated.Value(1)).current;
  
  // Pulse animation for the expand icon
  useEffect(() => {
    if (!isExpanded) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(iconPulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(iconPulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isExpanded, iconPulseAnim]);

  const getUsageText = () => {
    return `${dailyUsage}/3`;
  };

  const getUsageStatus = () => {
    if (dailyUsage >= 3) return 'limit';
    if (dailyUsage >= 2) return 'warning';
    return 'normal';
  };

  const getMarketingMessage = () => {
    const status = getUsageStatus();
    if (status === 'limit') {
      return "You've reached your daily limit! Upgrade to Subliminals+ for unlimited entries.";
    } else if (status === 'warning') {
      return "Almost at your daily limit. Get unlimited access with Subliminals+.";
    }
    return "Track your daily usage. Upgrade to Subliminals+ for unlimited entries and premium features.";
  };

  const expandTicker = () => {
    setIsExpanded(true);
    
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: 320,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(heightAnim, {
        toValue: 140,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(tickerOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => {
      Animated.timing(contentOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  const collapseTicker = () => {
    Animated.timing(contentOpacityAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start(() => {
      Animated.parallel([
        Animated.timing(widthAnim, {
          toValue: 80,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(heightAnim, {
          toValue: 40,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(tickerOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsExpanded(false);
      });
    });
  };

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    }
    collapseTicker();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: widthAnim,
          height: heightAnim,
        },
      ]}
    >
      {/* Ticker Content (small state) */}
      <Animated.View
        style={[
          styles.tickerContent,
          { opacity: tickerOpacityAnim },
        ]}
        pointerEvents={isExpanded ? 'none' : 'auto'}
      >
        <TouchableOpacity 
          style={styles.tickerTouch}
          onPress={expandTicker}
          activeOpacity={0.7}
        >
          <View style={styles.tickerRow}>
            <Text style={styles.tickerText}>
              {getUsageText()}
            </Text>
            <Animated.View style={[styles.expandIcon, { transform: [{ scale: iconPulseAnim }] }]}>
              <Ionicons name="chevron-down" size={14} color="white" />
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Expanded Content (large state) */}
      <Animated.View
        style={[
          styles.expandedContent,
          { opacity: contentOpacityAnim },
        ]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <View style={styles.expandedHeader}>
          <Text style={styles.usageCounter}>
            {getUsageText()} entries
          </Text>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={collapseTicker}
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.marketingText}>
          {getMarketingMessage()}
        </Text>
        
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={handleUpgrade}
        >
          <Text style={styles.upgradeButtonText}>
            Upgrade Now
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 30,
    backgroundColor: 'transparent',
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  tickerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tickerTouch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  expandIcon: {
    marginLeft: 4,
  },
  expandedContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    justifyContent: 'space-between',
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageCounter: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  marketingText: {
    color: 'white',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'left',
    flex: 1,
    marginBottom: 8,
  },
  upgradeButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '600',
  },
}); 