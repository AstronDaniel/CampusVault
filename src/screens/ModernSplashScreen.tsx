import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface ModernSplashScreenProps {
  onAnimationComplete?: () => void;
}

const ModernSplashScreen: React.FC<ModernSplashScreenProps> = ({ onAnimationComplete }) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animationSequence = Animated.sequence([
      // Initial fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Text slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      // Subtle rotation for modern feel
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      setTimeout(() => {
        onAnimationComplete?.();
      }, 800);
    });
  }, [fadeAnim, slideAnim, scaleAnim, rotateAnim, onAnimationComplete]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Background */}
      <View style={styles.gradientBackground} />
      
      <View style={styles.content}>
        {/* Modern Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate: rotation },
              ],
            },
          ]}
        >
          <View style={styles.modernLogo}>
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>CV</Text>
            </View>
            <View style={styles.logoRing} />
          </View>
        </Animated.View>

        {/* App Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text variant="displaySmall" style={styles.appTitle}>
            CampusVault
          </Text>
          <View style={styles.titleUnderline} />
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text variant="titleMedium" style={styles.tagline}>
            Digital Campus Resources
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Reimagined for the modern student
          </Text>
        </Animated.View>

        {/* Loading Dots */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
          </View>
        </Animated.View>
      </View>

      {/* Floating Elements */}
      <View style={styles.floatingElements}>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            { opacity: fadeAnim, transform: [{ rotate: rotation }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            { opacity: fadeAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            { opacity: fadeAnim, transform: [{ rotate: rotation }] },
          ]}
        />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    gradientBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `${theme.colors.primary}10`,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      zIndex: 1,
    },
    logoContainer: {
      marginBottom: 50,
    },
    modernLogo: {
      width: 100,
      height: 100,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoInner: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    logoText: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.onPrimary,
      letterSpacing: -1,
    },
    logoRing: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
    },
    titleContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    appTitle: {
      color: theme.colors.onBackground,
      fontWeight: '300',
      letterSpacing: -1,
      textAlign: 'center',
    },
    titleUnderline: {
      width: 60,
      height: 3,
      backgroundColor: theme.colors.primary,
      marginTop: 8,
      borderRadius: 2,
    },
    taglineContainer: {
      alignItems: 'center',
      marginBottom: 60,
    },
    tagline: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 4,
      fontWeight: '500',
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      opacity: 0.7,
      fontStyle: 'italic',
    },
    loadingContainer: {
      alignItems: 'center',
    },
    dotsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginHorizontal: 4,
    },
    floatingElements: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },
    floatingElement: {
      position: 'absolute',
      borderRadius: 20,
      opacity: 0.1,
    },
    element1: {
      width: 40,
      height: 40,
      backgroundColor: theme.colors.secondary,
      top: height * 0.15,
      right: width * 0.1,
    },
    element2: {
      width: 60,
      height: 20,
      backgroundColor: theme.colors.tertiary,
      bottom: height * 0.2,
      left: width * 0.05,
      borderRadius: 10,
    },
    element3: {
      width: 30,
      height: 30,
      backgroundColor: theme.colors.primary,
      top: height * 0.7,
      right: width * 0.15,
    },
  });

export default ModernSplashScreen;