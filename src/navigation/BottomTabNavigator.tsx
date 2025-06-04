import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const BOTTOM_NAV_HEIGHT = Platform.OS === 'ios' ? 90 : 80;

type RootStackParamList = {
  Home: undefined;
  Saved: undefined;
  Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BottomTabNavigator = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.tabBar}>
      <LinearGradient
        colors={['#141414', '#0A0A0A']}
        locations={[0, 1]}
        style={styles.tabBarBackground}
      />
      <View style={styles.tabBarLine} />
      <View style={styles.tabBarContent}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.navigate('Saved')}
        >
          <Ionicons name="bookmark" size={24} color="#fff" />
          <Text style={styles.tabText}>Saved</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="add-circle" size={40} color="#fff" />
          <Text style={styles.tabText}>New</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
          <Text style={styles.tabText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_NAV_HEIGHT,
    backgroundColor: '#0A0A0A',
  },
  tabBarBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  tabBarLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#1A1A1A',
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    minWidth: 80,
  },
  tabText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
}); 