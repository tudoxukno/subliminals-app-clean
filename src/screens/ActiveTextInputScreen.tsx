import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
  Image,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type RootStackParamList = {
  Home: undefined;
  ArchetypeSelection: { userInput: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { height, width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 0;

interface ActiveTextInputScreenProps {
  route?: { params?: { initialText?: string } };
}

const ActiveTextInputScreen: React.FC<ActiveTextInputScreenProps> = ({ route }) => {
  const navigation = useNavigation<NavigationProp>();
  const [userInput, setUserInput] = useState(route?.params?.initialText || '');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const textInputRef = useRef<TextInput>(null);
  const colorScheme = useColorScheme(); // Detect system theme

  useEffect(() => {
    // Auto-focus the text input when the screen loads with minimal delay
    const timer = setTimeout(() => {
      textInputRef.current?.focus();
      // Set initial cursor position to end of text if there's initial text
      if (route?.params?.initialText) {
        const textLength = route.params.initialText.length;
        setSelection({ start: textLength, end: textLength });
      }
    }, 50); // Reduced delay

    return () => {
      clearTimeout(timer);
    };
  }, [route?.params?.initialText]);

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleSubmit = () => {
    if (userInput.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate('ArchetypeSelection', { userInput: userInput.trim() });
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <LinearGradient
        colors={['#0A0A0A', '#141414']}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <SafeAreaView style={styles.safeArea}>
            
            {/* Back Button - S Logo in upper LEFT corner (matching ArchetypeSelectionScreen) */}
            <View style={styles.backButton}>
              <TouchableOpacity 
                onPress={handleBackPress}
                style={styles.backButtonTouchable}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../../assets/images/logo.png')}
                  style={styles.sLogo}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Text Input Area - positioned to sit flush on top of keyboard */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={textInputRef}
                  style={styles.textInput}
                  value={userInput}
                  onChangeText={(text) => {
                    setUserInput(text);
                    // Update selection to cursor position to keep it visible
                    setSelection({ start: text.length, end: text.length });
                    
                    // Scroll to end on next frame to ensure cursor stays visible
                    setTimeout(() => {
                      textInputRef.current?.focus();
                    }, 10);
                  }}
                  selection={selection}
                  onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
                  placeholder="Say what's on your mind..."
                  placeholderTextColor="#666"
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  autoFocus
                  enablesReturnKeyAutomatically={false}
                  scrollEnabled={true}
                  // Smart keyboard features with system theme
                  keyboardAppearance={colorScheme === 'dark' ? 'dark' : 'light'}
                  autoCorrect={true}
                  spellCheck={true}
                  autoCapitalize="sentences"
                  textContentType="none"
                />
                
                {/* Submit Button - White square with black arrow */}
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    userInput.trim() ? styles.submitButtonActive : styles.submitButtonInactive
                  ]} 
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={!userInput.trim()}
                >
                  <Ionicons 
                    name="arrow-forward" 
                    size={24} 
                    color={userInput.trim() ? "#000" : "#666"} 
                  />
                </TouchableOpacity>
              </View>
            </View>

          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end', // Put input at bottom, keyboard will push it up
  },
  // Back button positioning matching ArchetypeSelectionScreen exactly
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT + 48 : 52,
    left: -20,
    zIndex: 10,
  },
  backButtonTouchable: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 32,
  },
  sLogo: {
    width: 110,
    height: 110,
  },
  inputContainer: {
    paddingBottom: 0,
  },
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: '#1A1A1A', // Changed from white to dark gray
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    paddingRight: 70, // Space for submit button
    fontSize: 18, // Increased font size
    color: '#FFFFFF', // Changed to white text for dark background
    lineHeight: 26, // Better line spacing for readability
    minHeight: 160,
    maxHeight: 250,
    textAlignVertical: 'top',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  submitButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 10,
  },
  submitButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  submitButtonInactive: {
    backgroundColor: '#3A3A3A',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});

export default ActiveTextInputScreen; 