import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  Home: undefined;
  Saved: undefined;
  Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type BottomNavProps = {
  currentRoute?: 'Home' | 'Saved' | 'Settings';
  onNewPress?: () => void;
};

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNewPress }) => {
  const navigation = useNavigation<NavigationProp>();

  const handleNewPress = () => {
    if (onNewPress) {
      onNewPress();
    } else if (currentRoute !== 'Home') {
      navigation.navigate('Home');
    }
  };

  return (
    <View style={styles.bottomNav}>
      <LinearGradient
        colors={['#141414', '#0A0A0A']}
        locations={[0, 1]}
        style={styles.bottomNavBackground}
      />
      <View style={styles.contrastLine} />
      <View style={styles.bottomNavContent}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => currentRoute !== 'Saved' && navigation.navigate('Saved')}
        >
          <View style={styles.iconContainer}>
            <Ionicons 
              name={currentRoute === 'Saved' ? "bookmark" : "bookmark-outline"}
              size={24} 
              color="#fff" 
            />
          </View>
          <Text style={styles.navText}>Saved</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={handleNewPress}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="add" size={24} color="#fff" />
          </View>
          <Text style={styles.navText}>New</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => currentRoute !== 'Settings' && navigation.navigate('Settings')}
        >
          <View style={styles.iconContainer}>
            <Ionicons 
              name={currentRoute === 'Settings' ? "settings" : "settings-outline"} 
              size={24} 
              color="#fff" 
            />
          </View>
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 80,
    backgroundColor: '#0A0A0A',
  },
  bottomNavBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  contrastLine: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#1A1A1A',
    zIndex: 2,
  },
  bottomNavContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    minWidth: 80,
    flex: 1,
  },
  iconContainer: {
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 4,
  },
}); 