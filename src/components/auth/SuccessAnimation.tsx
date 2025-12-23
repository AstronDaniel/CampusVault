import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';

interface SuccessAnimationProps {
  visible: boolean;
  title: string;
  subtitle: string;
  onComplete?: () => void;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  visible,
  title,
  subtitle,
  onComplete,
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
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
        ]),
        Animated.spring(checkAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          onComplete?.();
        }, 1500);
      });
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      checkAnim.setValue(0);
    }
  }, [visible, fadeAnim, scaleAnim, checkAnim, onComplete]);

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
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: checkAnim }],
            },
          ]}
        >
          <IconButton
            icon="check-circle"
            size={64}
            iconColor={theme.colors.primary}
          />
        </Animated.View>
        
        <Text variant="headlineSmall" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </Text>
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
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 40,
      alignItems: 'center',
      elevation: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      maxWidth: 320,
      marginHorizontal: 24,
    },
    iconContainer: {
      marginBottom: 16,
    },
    title: {
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 8,
      fontWeight: '700',
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      opacity: 0.8,
    },
  });

export default SuccessAnimation;