import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDailyUsage } from '../context/DailyUsageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DailyUsageDebug: React.FC = () => {
  const { 
    dailyUsage, 
    dailyLimit, 
    incrementUsage, 
    isLimitReached, 
    showBanner, 
    getBannerConfig,
    dismissBanner,
    resetIfNewDay
  } = useDailyUsage();

  const bannerConfig = getBannerConfig();

  const resetUsage = async () => {
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      await AsyncStorage.removeItem(`dailyUsage_${todayKey}`);
      await resetIfNewDay(); // Reload from storage
      console.log('🧹 Daily usage reset for testing');
    } catch (error) {
      console.error('Error resetting usage:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Daily Usage Debug</Text>
      <Text style={styles.text}>Usage: {dailyUsage}/{dailyLimit}</Text>
      <Text style={styles.text}>Limit Reached: {isLimitReached ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>Show Banner: {showBanner ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>Banner Level: {bannerConfig.level}</Text>
      <Text style={styles.text}>Banner Message: {bannerConfig.message}</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={incrementUsage}
        disabled={isLimitReached}
      >
        <Text style={styles.buttonText}>
          {isLimitReached ? 'Limit Reached' : 'Simulate Usage +1'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.dismissButton]} 
        onPress={dismissBanner}
      >
        <Text style={styles.buttonText}>Dismiss Banner</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.resetButton]} 
        onPress={resetUsage}
      >
        <Text style={styles.buttonText}>Reset Usage (Dev Only)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#0066CC',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  dismissButton: {
    backgroundColor: '#CC6600',
  },
  resetButton: {
    backgroundColor: '#CC0000',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 