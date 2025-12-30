import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';

interface AnimatedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  error?: boolean;
  errorText?: string;
  delay?: number;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  delay = 0,
  error = false,
  errorText,
  ...props
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const styles = createStyles(theme);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TextInput
        {...props}
        mode="outlined"
        style={[
          styles.input,
          error && styles.inputError,
        ]}
        error={error}
      />
      {error && errorText && (
        <Animated.Text style={styles.errorText}>
          {errorText}
        </Animated.Text>
      )}
    </Animated.View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    input: {
      backgroundColor: `${theme.colors.surface}80`,
    },
    inputError: {
      backgroundColor: `${theme.colors.errorContainer}20`,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: 4,
      marginLeft: 16,
    },
  });

export default AnimatedInput;