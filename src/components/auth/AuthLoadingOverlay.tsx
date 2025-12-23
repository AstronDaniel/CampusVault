import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface AuthLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const AuthLoadingOverlay: React.FC<AuthLoadingOverlayProps> = ({
  visible,
  message = 'Signing you in...',
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  const styles = createStyles(theme);

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.content}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.spinner}
          />
          <Text variant="titleMedium" style={styles.message}>
            {message}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 32,
      alignItems: 'center',
      elevation: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      minWidth: 200,
    },
    content: {
      alignItems: 'center',
    },
    spinner: {
      marginBottom: 16,
    },
    message: {
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
  });

export default AuthLoadingOverlay;