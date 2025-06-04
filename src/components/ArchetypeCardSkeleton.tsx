import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const ArchetypeCardSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
        useNativeDriver: false, // Need to use false for translateX with percentage
      })
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  const SkeletonLine = ({ width, height = 16, style = {} }: { width: number | string; height?: number; style?: any }) => (
    <View style={[styles.skeletonLine, { width, height }, style]} />
  );

  return (
    <View style={styles.skeletonCard}>
      {/* Shimmer overlay that moves across the entire card */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            transform: [{ translateX: shimmerTranslateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>

      <View style={styles.skeletonContent}>
        <View style={styles.skeletonHeader}>
          {/* Icon placeholder */}
          <View style={styles.skeletonIcon} />
          
          <View style={styles.skeletonTitleContainer}>
            {/* Title placeholder */}
            <SkeletonLine width="60%" height={20} style={{ marginBottom: 8 }} />
            {/* Subtitle placeholder */}
            <SkeletonLine width="80%" height={12} />
          </View>
        </View>

        <View style={styles.skeletonQuoteContainer}>
          <View style={styles.skeletonQuoteLine} />
          <View style={styles.skeletonQuoteText}>
            {/* Response text placeholders */}
            <SkeletonLine width="100%" height={16} style={{ marginBottom: 6 }} />
            <SkeletonLine width="85%" height={16} style={{ marginBottom: 6 }} />
            <SkeletonLine width="70%" height={16} />
          </View>
        </View>

        <View style={styles.skeletonBottomContainer}>
          {/* Arrow placeholder */}
          <View style={styles.skeletonArrow} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonCard: {
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
    overflow: 'hidden', // Important for shimmer effect
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
  },
  skeletonContent: {
    padding: 16,
    position: 'relative',
    zIndex: 0,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#2B2B2B',
    borderRadius: 4,
    marginRight: 12,
  },
  skeletonTitleContainer: {
    flex: 1,
  },
  skeletonQuoteContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingRight: 8,
  },
  skeletonQuoteLine: {
    width: 2,
    height: 60,
    backgroundColor: '#2B2B2B',
    marginRight: 12,
    borderRadius: 1,
  },
  skeletonQuoteText: {
    flex: 1,
  },
  skeletonBottomContainer: {
    alignItems: 'flex-end',
  },
  skeletonArrow: {
    width: 24,
    height: 24,
    backgroundColor: '#2B2B2B',
    borderRadius: 4,
  },
  skeletonLine: {
    backgroundColor: '#2B2B2B',
    borderRadius: 4,
  },
}); 