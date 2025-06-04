import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type ScrollHintProps = {
  visible: boolean;
  onPress: () => void;
  text?: string;
  bottomOffset?: number;
  hasInteracted?: boolean;
  delay?: number;
};

export const ScrollHint: React.FC<ScrollHintProps> = ({
  visible,
  onPress,
  text = "Tap to see options",
  bottomOffset = 20,
  hasInteracted = false,
  delay = 1000,
}) => {
  const scrollHintAnim = useRef(new Animated.Value(0)).current;
  const scrollHintPulseAnim = useRef(new Animated.Value(1)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;

  // Enhanced scroll hint animation with haptics
  useEffect(() => {
    if (!visible) return;

    // Initial delay before showing hint
    const showHintTimeout = setTimeout(() => {
      // Initial haptic feedback - only for first appearance
      if (!hasInteracted) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Animate scroll hint
      Animated.sequence([
        Animated.timing(scrollHintAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.2, 0, 0.2, 1),
        }),
        Animated.parallel([
          // Pulse animation
          Animated.loop(
            Animated.sequence([
              Animated.timing(scrollHintPulseAnim, {
                toValue: 1.05,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
              }),
              Animated.timing(scrollHintPulseAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
              }),
            ]),
            { iterations: hasInteracted ? 1 : 2 } // Less animation for repeat appearances
          ),
          // Chevron animation
          Animated.loop(
            Animated.sequence([
              Animated.timing(chevronAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
              }),
              Animated.timing(chevronAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
              }),
            ]),
            { iterations: hasInteracted ? 1 : 2 } // Less animation for repeat appearances
          ),
        ]),
      ]).start();
    }, hasInteracted ? 500 : delay); // Shorter delay for repeat appearances

    return () => clearTimeout(showHintTimeout);
  }, [visible, hasInteracted, delay]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.scrollHintContainer,
        {
          bottom: bottomOffset,
          opacity: scrollHintAnim,
          transform: [
            { translateY: scrollHintAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              })
            },
            { scale: scrollHintPulseAnim }
          ]
        }
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        style={styles.scrollHintTouchable}
        activeOpacity={0.7}
      >
        <View style={styles.scrollHintContent}>
          <Text style={styles.scrollHintText}>{text}</Text>
          <Animated.View style={{
            transform: [{
              translateY: chevronAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              })
            }]
          }}>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  scrollHintContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  scrollHintTouchable: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  scrollHintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
}); 