import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ShimmerSkeletonProps = {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  shimmerColors?: [string, string, string];
  duration?: number;
};

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  width,
  height,
  borderRadius = 8,
  style = {},
  shimmerColors = [
    'rgba(43, 43, 43, 0.3)',
    'rgba(60, 60, 60, 0.8)',
    'rgba(43, 43, 43, 0.3)',
  ],
  duration = 1200,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
        useNativeDriver: false, // Need false for translateX with percentage
      })
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim, duration]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <View style={styles.shimmerContainer}>
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              transform: [{ translateX: shimmerTranslateX }],
            },
          ]}
        >
          <LinearGradient
            colors={shimmerColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2B2B2B',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
  },
}); 