import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  FlatList, 
  Image,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { Text, Button, useTheme, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  imageUrl: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to CampusVault ',
    subtitle: 'Your Digital Campus Hub',
    description: 'Organize, access, and share your academic resources seamlessly across all your devices with intelligent automation.',
    icon: '🏛️',
    color: '#4F46E5',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&crop=center',
  },
  {
    id: 2,
    title: 'Smart Organization',
    subtitle: 'AI-Powered Resource Management',
    description: 'Let our intelligent system automatically categorize, tag, and organize your documents, notes, and study materials.',
    icon: '🧠',
    color: '#EC4899',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center',
  },
  {
    id: 3,
    title: 'Seamless Collaboration',
    subtitle: 'Connect with Your Peers',
    description: 'Share resources instantly, collaborate on projects in real-time, and build study groups with classmates.',
    icon: '🤝',
    color: '#10B981',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=center',
  },
  {
    id: 4,
    title: 'Ready to Start?',
    subtitle: 'Let\'s Set Up Your Account',
    description: 'Join thousands of students already using CampusVault to enhance their academic journey and achieve success.',
    icon: '🚀',
    color: '#F59E0B',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop&crop=center',
  },
];

interface EnhancedOnboardingScreenProps {
  onComplete: () => void;
}

const EnhancedOnboardingScreen: React.FC<EnhancedOnboardingScreenProps> = ({ onComplete }) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const styles = createStyles(theme);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (currentIndex < onboardingSteps.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const renderOnboardingItem = ({ item, index }: { item: OnboardingStep; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const backgroundScale = scrollX.interpolate({
      inputRange,
      outputRange: [1.1, 1, 1.1],
      extrapolate: 'clamp',
    });

    const backgroundOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.05, 0.15, 0.05],
      extrapolate: 'clamp',
    });

    const contentOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    const contentScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const cardTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [30, 0, -30],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slideContainer}>
        {/* Subtle Background Image */}
        <Animated.View
          style={[
            styles.backgroundContainer,
            {
              transform: [{ scale: backgroundScale }],
              opacity: backgroundOpacity,
            },
          ]}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View style={styles.backgroundMask} />
          <View style={[styles.colorWash, { backgroundColor: item.color }]} />
        </Animated.View>

        {/* Main Content Card */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: contentOpacity,
              transform: [
                { scale: contentScale },
                { translateY: cardTranslateY }
              ],
            },
          ]}
        >
          <Card style={[styles.contentCard, { borderColor: `${item.color}30` }]}>
            {/* Multi-layer glassy effect */}
            <View style={styles.glassBase} />
            <View style={[styles.glassHighlight, { backgroundColor: `${item.color}08` }]} />
            <View style={styles.glassBorder} />
            <Card.Content style={styles.cardContent}>
              {/* Icon Section */}
              <View style={styles.iconSection}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}12` }]}>
                  <View style={styles.iconGlass} />
                  <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                    <Text style={styles.iconText}>{item.icon}</Text>
                  </View>
                </View>
              </View>

              {/* Text Content */}
              <View style={styles.textSection}>
                <Text variant="headlineMedium" style={styles.title}>
                  {item.title}
                </Text>
                <Text variant="titleMedium" style={[styles.subtitle, { color: item.color }]}>
                  {item.subtitle}
                </Text>
                <Text variant="bodyLarge" style={styles.description}>
                  {item.description}
                </Text>
              </View>

              {/* Progress Indicator */}
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${((index + 1) / onboardingSteps.length) * 100}%`,
                        backgroundColor: item.color 
                      }
                    ]} 
                  />
                </View>
                <Text variant="bodySmall" style={styles.progressText}>
                  {index + 1} of {onboardingSteps.length}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Floating Decorative Elements */}
        <Animated.View
          style={[
            styles.decorativeElements,
            { opacity: contentOpacity }
          ]}
        >
          <View style={[styles.floatingDot, styles.dot1, { backgroundColor: `${item.color}20` }]} />
          <View style={[styles.floatingDot, styles.dot2, { backgroundColor: `${item.color}10` }]} />
          <View style={[styles.floatingDot, styles.dot3, { backgroundColor: `${theme.colors.secondary}15` }]} />
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {onboardingSteps.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          
          const dotScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.4, 0.8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  transform: [{ scale: dotScale }],
                  opacity: dotOpacity,
                  backgroundColor: index === currentIndex ? theme.colors.primary : theme.colors.outline,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const currentStep = onboardingSteps[currentIndex];
  const isLastStep = currentIndex === onboardingSteps.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingSteps}
        renderItem={renderOnboardingItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
      />

      {renderPagination()}

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          {currentIndex > 0 && (
            <Button
              mode="outlined"
              onPress={goToPrevious}
              style={[styles.backButton, { borderColor: currentStep.color }]}
              labelStyle={[styles.backButtonLabel, { color: currentStep.color }]}
            >
              Back
            </Button>
          )}
          
          <View style={styles.buttonSpacer} />
          
          {isLastStep ? (
            <Button
              mode="contained"
              onPress={onComplete}
              style={[styles.nextButton, { backgroundColor: currentStep.color }]}
              labelStyle={styles.nextButtonLabel}
            >
              Get Started
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={goToNext}
              style={[styles.nextButton, { backgroundColor: currentStep.color }]}
              labelStyle={styles.nextButtonLabel}
            >
              Continue
            </Button>
          )}
        </View>
        
        {!isLastStep && (
          <Button
            mode="text"
            onPress={onComplete}
            style={styles.skipButton}
            labelStyle={styles.skipButtonLabel}
          >
            Skip for now
          </Button>
        )}
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
    slideContainer: {
      width,
      flex: 1,
      position: 'relative',
    },
    backgroundContainer: {
      position: 'absolute',
      top: -50,
      left: -50,
      right: -50,
      bottom: -50,
      zIndex: 0,
    },
    backgroundImage: {
      width: '100%',
      height: '100%',
    },
    backgroundMask: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.background,
      opacity: 0.88,
    },
    colorWash: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.12,
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      zIndex: 2,
    },
    contentCard: {
      borderRadius: 24,
      elevation: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      borderWidth: 0,
      backgroundColor: 'transparent',
      overflow: 'hidden',
      position: 'relative',
    },
    cardContent: {
      padding: 32,
      position: 'relative',
      zIndex: 4,
    },
    glassBase: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `${theme.colors.surface}85`,
      borderRadius: 24,
      zIndex: 1,
    },
    glassHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '50%',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      zIndex: 2,
    },
    glassBorder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: `${theme.colors.outline}25`,
      zIndex: 3,
    },
    iconSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: `${theme.colors.outline}15`,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    iconGlass: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `${theme.colors.surface}70`,
      borderRadius: 60,
    },
    iconCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      zIndex: 2,
    },
    iconText: {
      fontSize: 28,
    },
    textSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    title: {
      textAlign: 'center',
      marginBottom: 8,
      color: theme.colors.onSurface,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    subtitle: {
      textAlign: 'center',
      marginBottom: 16,
      fontWeight: '600',
    },
    description: {
      textAlign: 'center',
      lineHeight: 24,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.9,
    },
    progressSection: {
      alignItems: 'center',
    },
    progressBar: {
      width: '100%',
      height: 4,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 2,
      marginBottom: 8,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    progressText: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
    },
    decorativeElements: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
    },
    floatingDot: {
      position: 'absolute',
      borderRadius: 50,
    },
    dot1: {
      width: 60,
      height: 60,
      top: '20%',
      right: '8%',
    },
    dot2: {
      width: 40,
      height: 40,
      bottom: '30%',
      left: '5%',
    },
    dot3: {
      width: 80,
      height: 80,
      top: '70%',
      right: '12%',
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 24,
      zIndex: 3,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    buttonContainer: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      zIndex: 3,
      backgroundColor: `${theme.colors.background}95`,
      borderTopWidth: 1,
      borderTopColor: `${theme.colors.outline}20`,
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    buttonSpacer: {
      flex: 1,
    },
    backButton: {
      minWidth: 100,
      borderRadius: 24,
    },
    backButtonLabel: {
      fontSize: 16,
      fontWeight: '500',
    },
    nextButton: {
      minWidth: 160,
      borderRadius: 28,
      elevation: 6,
    },
    nextButtonLabel: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    skipButton: {
      alignSelf: 'center',
    },
    skipButtonLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      opacity: 0.7,
    },
  });

export default EnhancedOnboardingScreen;