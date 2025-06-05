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
import { LinearGradient } from 'expo-linear-gradient';
import { useDailyUsage } from '../context/DailyUsageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DailyLimitBannerProps {
  onUpgradePress?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const DailyLimitBanner: React.FC<DailyLimitBannerProps> = ({ onUpgradePress }) => {
  const { showBanner, dismissBanner, resetBannerDismissal, getBannerConfig, dailyUsage, dailyLimit, bannerDismissed, isLimitReached } = useDailyUsage();
  const bannerConfig = getBannerConfig();
  const insets = useSafeAreaInsets();
  
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(false);
  const [showMinimalIndicator, setShowMinimalIndicator] = useState(false);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Get current status bar height
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;

  useEffect(() => {
    // Cleanup function to stop all animations and prevent conflicts
    return () => {
      slideAnim.stopAnimation();
      pulseAnim.stopAnimation();
      sparkleAnim.stopAnimation();
      indicatorOpacity.stopAnimation();
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showBanner && !isVisible) {
      setIsVisible(true);
      setShowMinimalIndicator(false);
      
      // Stop any existing animations to prevent conflicts
      slideAnim.stopAnimation();
      indicatorOpacity.stopAnimation();
      
      // Reset animation values to ensure clean start and avoid driver conflicts
      slideAnim.setValue(-120);
      indicatorOpacity.setValue(0);
      
      showSlideAnimation();
      startSparkleAnimation();
      // Hide minimal indicator when banner shows
      Animated.timing(indicatorOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else if (!showBanner && isVisible) {
      hideSlideAnimation();
    }
    
    // Show minimal indicator when banner is dismissed but user has some usage (not at limit)
    if (bannerDismissed && dailyUsage > 0 && !showBanner && !isLimitReached) {
      setShowMinimalIndicator(true);
      Animated.timing(indicatorOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else if (!bannerDismissed || showBanner || isLimitReached) {
      setShowMinimalIndicator(false);
      Animated.timing(indicatorOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [showBanner, isVisible, bannerDismissed, dailyUsage, isLimitReached]);

  // Sparkle animation for visual appeal
  const startSparkleAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  // Pulse animation for urgent banners
  const startPulseAnimation = () => {
    if (bannerConfig.level === 'high') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  };

  const showSlideAnimation = () => {
    // Clear any existing timeout
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }

    const targetPosition = statusBarHeight + 8; // Back to original value

    // Slide down from behind status bar with bounce
    Animated.spring(slideAnim, {
      toValue: targetPosition,
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    }).start((finished) => {
    });

    startPulseAnimation();

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

    // Hide behind the status bar
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
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

  const handleIndicatorPress = () => {
    // Reset the banner dismissal state in the context
    resetBannerDismissal();
    // The banner will automatically show due to the useEffect that watches showBanner
  };

  // Get banner design based on level
  const getBannerDesign = () => {
    const remaining = dailyLimit - dailyUsage;
    
    if (bannerConfig.level === 'high') {
      return {
        gradientColors: ['#FF6B6B', '#FF8E8E', '#FFB3B3'] as const,
        icon: '🚀',
        title: 'Ready to Level Up?',
        subtitle: 'Daily limit reached • Upgrade for unlimited access',
        actionText: 'Upgrade Now',
        actionStyle: 'primary' as const,
        showClose: false,
        accentColor: '#FF4757',
      };
    } else if (bannerConfig.level === 'medium') {
      return {
        gradientColors: ['#FFA726', '#FFB74D', '#FFCC80'] as const,
        icon: '⚡',
        title: 'Last Chance!',
        subtitle: `${remaining} entry remaining • Don't miss out!`,
        actionText: 'Upgrade',
        actionStyle: 'secondary' as const,
        showClose: true,
        accentColor: '#FF9800',
      };
    } else {
      return {
        gradientColors: ['#66BB6A', '#81C784', '#A5D6A7'] as const,
        icon: '✨',
        title: 'You\'re All Set!',
        subtitle: `${remaining} free entries available today`,
        actionText: 'Go Premium',
        actionStyle: 'minimal' as const,
        showClose: true,
        accentColor: '#4CAF50',
      };
    }
  };

  const design = getBannerDesign();

  return (
    <>
      {/* Minimal Usage Indicator - shown when banner is dismissed */}
      {showMinimalIndicator && (
        <Animated.View
          style={[
            styles.minimalIndicator,
            {
              top: statusBarHeight + 8,
              opacity: indicatorOpacity,
            }
          ]}
        >
          <TouchableOpacity
            style={styles.minimalIndicatorContent}
            onPress={handleIndicatorPress}
            activeOpacity={0.8}
          >
            <View style={styles.miniProgressBar}>
              <View
                style={[
                  styles.miniProgressFill,
                  {
                    width: `${(dailyUsage / dailyLimit) * 100}%`,
                    backgroundColor: dailyUsage >= dailyLimit ? '#FF4757' : dailyUsage >= 2 ? '#FF9800' : '#4CAF50',
                  }
                ]}
              />
            </View>
            <Text style={styles.miniProgressText}>{dailyUsage}/{dailyLimit}</Text>
            <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Full Banner */}
      {isVisible && (
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { translateY: slideAnim },
                { scale: pulseAnim }
              ],
            },
          ]}
        >
          <LinearGradient
            colors={design.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
          >
            {/* Sparkle Effects */}
            <Animated.View
              style={[
                styles.sparkle,
                styles.sparkle1,
                {
                  opacity: sparkleAnim,
                  transform: [{
                    rotate: sparkleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.sparkleText}>✨</Text>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.sparkle,
                styles.sparkle2,
                {
                  opacity: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                }
              ]}
            >
              <Text style={styles.sparkleText}>⭐</Text>
            </Animated.View>

            <View style={styles.content}>
              {/* Left Side - Icon and Text */}
              <View style={styles.leftContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${design.accentColor}40` }]}>
                  <Text style={styles.iconText}>{design.icon}</Text>
                </View>
                
                <View style={styles.textContent}>
                  <Text style={styles.title}>{design.title}</Text>
                  <Text style={styles.subtitle}>{design.subtitle}</Text>
                </View>
              </View>

              {/* Right Side - Actions */}
              <View style={styles.rightContent}>
                {bannerConfig.showUpgrade && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      design.actionStyle === 'primary' && styles.primaryButton,
                      design.actionStyle === 'secondary' && [styles.secondaryButton, { borderColor: '#FFF' }],
                      design.actionStyle === 'minimal' && styles.minimalButton,
                    ]}
                    onPress={handleUpgrade}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        design.actionStyle === 'primary' && styles.primaryButtonText,
                        design.actionStyle === 'secondary' && styles.secondaryButtonText,
                        design.actionStyle === 'minimal' && styles.minimalButtonText,
                      ]}
                    >
                      {design.actionText}
                    </Text>
                    {design.actionStyle === 'primary' && (
                      <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    )}
                  </TouchableOpacity>
                )}
                
                {design.showClose && (
                  <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
                    <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(dailyUsage / dailyLimit) * 100}%`,
                      backgroundColor: design.accentColor,
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {dailyUsage}/{dailyLimit}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    minHeight: 100,
    borderRadius: 20,
    zIndex: 1100,
    elevation: 1100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientContainer: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  iconText: {
    fontSize: 20,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  minimalButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#333',
  },
  secondaryButtonText: {
    color: '#FFF',
  },
  minimalButtonText: {
    color: '#FFF',
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    minWidth: 30,
    textAlign: 'right',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: 12,
    right: 60,
  },
  sparkle2: {
    bottom: 16,
    left: 70,
  },
  sparkleText: {
    fontSize: 12,
  },
  minimalIndicator: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 1000,
    elevation: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  minimalIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: '100%',
  },
  miniProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  miniProgressText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginRight: 6,
    minWidth: 24,
    textAlign: 'center',
  },
}); 