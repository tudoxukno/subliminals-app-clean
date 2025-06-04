import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 24;

type BackButtonProps = {
  onPress?: () => void;
  color?: string;
  size?: number;
  withGradient?: boolean;
};

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  color = '#fff',
  size = 28,
  withGradient = false,
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  if (withGradient) {
    return (
      <View style={styles.gradientContainer}>
        <LinearGradient
          colors={['#0A0A0A', '#0A0A0A', 'rgba(10, 10, 10, 0)']}
          locations={[0, 0.7, 1]}
          style={styles.gradientBackground}
        />
        <TouchableOpacity 
          onPress={handlePress}
          style={styles.gradientBackButton}
        >
          <Ionicons name="arrow-back" size={size} color={color} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={styles.backButton}
    >
      <Ionicons name="arrow-back" size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    left: 20,
    top: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT + 100 : 104,
    zIndex: 2,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  gradientBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT + 20 : 24,
    left: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 