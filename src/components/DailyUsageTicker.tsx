import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useDailyUsage } from '../context/DailyUsageContext';

interface DailyUsageTickerProps {
  onPress?: () => void;
}

export const DailyUsageTicker: React.FC<DailyUsageTickerProps> = ({ onPress }) => {
  const { dailyUsage } = useDailyUsage();
  
  const getUsageText = () => {
    return `${dailyUsage}/3`;
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>
        {getUsageText()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    right: 30, // Move slightly to the right
    width: 80,
    height: 40,
    backgroundColor: 'transparent',
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
    // Add subtle shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 