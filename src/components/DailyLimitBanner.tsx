import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDailyUsage } from '../context/DailyUsageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DailyLimitBannerProps {
  onUpgradePress?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const DailyLimitBanner: React.FC<DailyLimitBannerProps> = ({ onUpgradePress }) => {
  const { showBanner, dismissBanner, getBannerConfig, dailyUsage } = useDailyUsage();
  const bannerConfig = getBannerConfig();
  const insets = useSafeAreaInsets();
  
  console.log('🎪 BANNER COMPONENT DEBUG:', {
    showBanner,
    bannerConfig,
    insets,
    dailyUsage
  });
  
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle visibility changes with proper timing
  useEffect(() => {
    if (showBanner && !isVisible) {
      // Show banner in full state
      setIsVisible(true);
      setIsMinimized(false);
      showSlideAnimation();
      
      // Set up auto-minimize if configured
      if (bannerConfig.autoHideDelay) {
        autoHideTimeoutRef.current = setTimeout(() => {
          minimizeBanner();
        }, bannerConfig.autoHideDelay);
      }
    } else if (!showBanner && isVisible) {
      // Hide banner completely
      hideSlideAnimation();
    }

    // Cleanup timeout on unmount or when showBanner changes
    return () => {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
        autoHideTimeoutRef.current = undefined;
      }
    };
  }, [showBanner]);

  const showSlideAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: insets.top,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const minimizeBanner = () => {
    // Animate to top-right corner as a small counter
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: insets.top,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.4, // Scale down to 40%
        duration: 250,
        useNativeDriver: true,
      })
    ]).start((finished) => {
      if (finished) {
        setIsMinimized(true);
        // Clear any pending auto-hide timeout
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
          autoHideTimeoutRef.current = undefined;
        }
      }
    });
  };

  const expandBanner = () => {
    setIsMinimized(false);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: insets.top,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start();
    
    // Auto-minimize again after expansion
    if (bannerConfig.autoHideDelay) {
      autoHideTimeoutRef.current = setTimeout(() => {
        minimizeBanner();
      }, bannerConfig.autoHideDelay);
    }
  };

  const hideSlideAnimation = () => {
    // Hide behind the status bar like native iOS notifications
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start((finished) => {
      if (finished) {
        setIsVisible(false);
        setIsMinimized(false);
        // Clear any pending auto-hide timeout
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
          autoHideTimeoutRef.current = undefined;
        }
      }
    });
  };

  const handleDismiss = () => {
    // Clear auto-hide timeout since user manually dismissed
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
      autoHideTimeoutRef.current = undefined;
    }
    
    hideSlideAnimation();
    // Use setTimeout to ensure animation completes before calling dismissBanner
    setTimeout(() => {
      dismissBanner();
    }, 250);
  };

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    }
    handleDismiss();
  };

  // Don't render anything if not visible and not showing
  if (!isVisible && !showBanner) {
    return null;
  }

  const getBannerStyle = () => {
    return {
      backgroundColor: 'transparent',
      borderColor: 'white',
    };
  };

  const getTextColor = () => {
    return 'white';
  };

  const getUsageText = () => {
    const remaining = 3 - dailyUsage;
    if (remaining <= 0) return '0/3 entries';
    return `${remaining}/3 entries`;
  };

  if (isMinimized) {
    // Minimized counter view
    return (
      <Animated.View
        style={[
          styles.minimizedContainer,
          {
            top: 0,
            right: -45,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
            ...getBannerStyle(),
          },
        ]}
      >
        <TouchableOpacity onPress={expandBanner} style={styles.minimizedContent}>
          <Text style={[styles.counterText, { color: getTextColor() }]}>
            {getUsageText()}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Full banner view
  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: 0,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          ...getBannerStyle(),
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.message, { color: getTextColor() }]}>
          {bannerConfig.message}
        </Text>
        
        <View style={styles.actions}>
          {bannerConfig.showUpgrade && (
            <TouchableOpacity 
              style={[styles.upgradeButton, { borderColor: getTextColor() }]} 
              onPress={handleUpgrade}
            >
              <Text style={[styles.upgradeText, { color: getTextColor() }]}>
                Upgrade
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.minimizeButton} onPress={minimizeBanner}>
            <Ionicons name="remove" size={18} color={getTextColor()} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <Ionicons name="close" size={18} color={getTextColor()} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    elevation: 1000,
    // Add subtle shadow to match app design
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  minimizedContainer: {
    position: 'absolute',
    width: 220,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
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
  minimizedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 32,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upgradeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  upgradeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  minimizeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}); 