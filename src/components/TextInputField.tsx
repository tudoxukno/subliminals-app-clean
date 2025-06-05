import React, { forwardRef } from 'react';
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  Platform,
} from 'react-native';

interface TextInputFieldProps extends TextInputProps {
  isFocused?: boolean;
  minHeight?: number;
  inputHeight?: number;
}

const TextInputField = forwardRef<TextInput, TextInputFieldProps>(({
  isFocused = false,
  minHeight = 50,
  inputHeight,
  style,
  ...props
}, ref) => {
  const inputStyle = isFocused ? styles.inputFocused : styles.input;
  
  // Calculate proper height - for non-focused state, use 56px to accommodate 
  // 16px text + descenders + 18px top/bottom padding. For focused state, use dynamic height.
  const calculatedHeight = isFocused 
    ? Math.max(inputHeight || 150, 150)
    : 56; // Fixed height that properly fits text with descenders
  
  return (
    <TextInput
      ref={ref}
      style={[
        inputStyle,
        { height: calculatedHeight },
        style
      ]}
      placeholder="What's on your mind..."
      placeholderTextColor="#666"
      multiline
      textAlignVertical="top"
      returnKeyType="done"
      blurOnSubmit={true}
      {...props}
    />
  );
});

TextInputField.displayName = 'TextInputField';

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    fontSize: 16,
    color: '#fff',
    width: '100%',
    textAlignVertical: 'top',
  },
  inputFocused: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    paddingHorizontal: 20,
    paddingVertical: 20,
    fontSize: 18,
    color: '#fff',
    textAlignVertical: 'top',
  },
});

export default TextInputField;