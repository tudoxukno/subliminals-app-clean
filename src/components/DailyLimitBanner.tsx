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
  
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const [isVisible, setIsVisible] = useState(false);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Get current status bar height
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;

  useEffect(() => {
    if (showBanner && !isVisible) {
      setIsVisible(true);
      showSlideAnimation();
    } else if (!showBanner && isVisible) {
      hideSlideAnimation();
    }
  }, [showBanner, isVisible]);

  const showSlideAnimation = () => {
    // Clear any existing timeout
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }

    // Slide down from behind status bar
    Animated.timing(slideAnim, {
      toValue: statusBarHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Set auto-hide timeout if specified
    if (bannerConfig.autoHideDelay) {
      autoHideTimeoutRef.current = setTimeout(() => {
        dismissBanner();
      }, bannerConfig.autoHideDelay);
    }
  };

  const hideSlideAnimation = () => {
    // Clear timeout if banner is manually dismissed
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
      autoHideTimeoutRef.current = undefined;
    }

    // Hide behind the status bar like native iOS notifications
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 250,
      useNativeDriver: false,
    }).start((finished) => {
      if (finished) {
        setIsVisible(false);
      }
    });
  };

  const handleDismiss = () => {
    dismissBanner();
  };

  const handleUpgrade = () => {
    onUpgradePress?.();
  };

  const getBannerStyle = () => {
    return {
      backgroundColor: 'transparent',
      borderColor: 'white',
    };
  };

  const getTextColor = () => {
    return 'white';
  };

  // Don't render anything if banner should not be visible
  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: 0,
          transform: [{ translateY: slideAnim }],
          ...getBannerStyle(),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.message, { color: getTextColor() }]}>
            {bannerConfig.message}
          </Text>
        </View>
        
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
    borderRadius: 16,
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
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  upgradeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
}); 