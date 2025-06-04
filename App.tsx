import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import SavedSubliminalsScreen from './src/screens/SavedSubliminalsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FullSubliminalView from './src/screens/FullSubliminalView';
import ShareSuiteScreen from './src/screens/ShareSuiteScreen';
import ArchetypeSelectionScreen from './src/screens/ArchetypeSelectionScreen';
import ActiveTextInputScreen from './src/screens/ActiveTextInputScreen';
import SplashScreen from './src/components/SplashScreen';
import { Platform } from 'react-native';
import { ActiveStateProvider } from './src/context/ActiveStateContext';
import { AuthProvider } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

// Custom transition configurations
const screenOptions = {
  headerShown: false,
  animation: 'slide_from_right' as const,
  animationDuration: 300,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  presentation: 'card' as const,
  animationTypeForReplace: 'push' as const,
  contentStyle: {
    backgroundColor: '#0A0A0A',
  },
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <AuthProvider>
      <ActiveStateProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={screenOptions}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{
                animation: 'fade' as const,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="ActiveTextInput" 
              component={ActiveTextInputScreen}
              options={{
                animation: 'fade' as const,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="Saved" 
              component={SavedSubliminalsScreen}
              options={{
                animation: 'slide_from_right' as const,
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{
                animation: 'slide_from_right' as const,
              }}
            />
            <Stack.Screen 
              name="ArchetypeSelection" 
              component={ArchetypeSelectionScreen}
              options={{
                animation: 'fade' as const,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="FullSubliminalView" 
              component={FullSubliminalView}
              options={{
                animation: 'slide_from_right' as const,
              }}
            />
            <Stack.Screen 
              name="ShareSuite" 
              component={ShareSuiteScreen}
              options={{
                animation: 'slide_from_right' as const,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ActiveStateProvider>
    </AuthProvider>
  );
}
