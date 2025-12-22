import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions, Image } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedRe, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    useAnimatedScrollHandler
} from 'react-native-reanimated';

const ONBOARDING_DATA = [
    {
        id: '1',
        title: 'Welcome to CampusVault',
        description: 'Your ultimate companion for university resources. Access notes, past papers, and more.',
        animation: require('../assets/animations/splash.json'),
        image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop', // University building
    },
    {
        id: '2',
        title: 'Stay Organized',
        description: 'Keep track of your course units, assignments, and exam schedules in one place.',
        animation: require('../assets/animations/splash.json'),
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop', // Study/Notebook
    },
    {
        id: '3',
        title: 'Collaborate & Share',
        description: 'Connect with peers, share resources, and grow together in your academic journey.',
        animation: require('../assets/animations/splash.json'),
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop', // Students collaborating
    },
    {
        id: '4',
        title: 'Get Started',
        description: 'Join the community today and unlock your full academic potential.',
        animation: require('../assets/animations/splash.json'),
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop', // Abstract/Tech/Future
    },
];

const OnboardingScreen = ({ navigation }: { navigation: any }) => {
    const { width } = useWindowDimensions();
    const theme = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    const finishOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            });
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    };

    const handleNext = () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            finishOnboarding();
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

        const animatedImageStyle = useAnimatedStyle(() => {
            const translateX = interpolate(
                scrollX.value,
                inputRange,
                [-width * 0.5, 0, width * 0.5],
                Extrapolate.CLAMP
            );
            return {
                transform: [{ translateX }],
            };
        });

        return (
            <View style={[styles.itemContainer, { width }]}>
                {/* Background Image Layer */}
                <View style={StyleSheet.absoluteFillObject}>
                    <Image
                        source={{ uri: item.image }}
                        style={[StyleSheet.absoluteFillObject, { opacity: 0.3 }]}
                        resizeMode="cover"
                        blurRadius={3}
                    />
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.background, opacity: 0.7 }]} />
                </View>

                <View style={styles.imageContainer}>
                    <AnimatedRe.View style={[styles.lottieContainer, animatedImageStyle]}>
                        <LottieView
                            source={item.animation}
                            autoPlay
                            loop
                            style={styles.lottie}
                            resizeMode="contain"
                        />
                    </AnimatedRe.View>
                </View>
                <View style={[styles.textContainer, { backgroundColor: theme.colors.surface, opacity: 0.95 }]}>
                    <Text variant="headlineLarge" style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                        {item.title}
                    </Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 20 }}>
                        {item.description}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <AnimatedRe.FlatList
                ref={flatListRef as any}
                data={ONBOARDING_DATA}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            <View style={styles.footer}>
                <View style={styles.paginator}>
                    {ONBOARDING_DATA.map((_, i) => {
                        const animatedDotStyle = useAnimatedStyle(() => {
                            const widthDot = interpolate(
                                scrollX.value,
                                [(i - 1) * width, i * width, (i + 1) * width],
                                [10, 20, 10],
                                Extrapolate.CLAMP
                            );
                            const opacity = interpolate(
                                scrollX.value,
                                [(i - 1) * width, i * width, (i + 1) * width],
                                [0.5, 1, 0.5],
                                Extrapolate.CLAMP
                            );
                            return {
                                width: widthDot,
                                opacity,
                            };
                        });

                        return (
                            <AnimatedRe.View
                                key={i.toString()}
                                style={[styles.dot, animatedDotStyle, { backgroundColor: theme.colors.primary }]}
                            />
                        );
                    })}
                </View>

                <View style={styles.buttonContainer}>
                    {currentIndex < ONBOARDING_DATA.length - 1 ? (
                        <>
                            <Button onPress={finishOnboarding} mode="text" textColor={theme.colors.secondary}>
                                Skip
                            </Button>
                            <Button onPress={handleNext} mode="contained" buttonColor={theme.colors.primary}>
                                Next
                            </Button>
                        </>
                    ) : (
                        <Button onPress={finishOnboarding} mode="contained" buttonColor={theme.colors.primary} style={styles.startBtn}>
                            Get Started
                        </Button>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    itemContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        flex: 0.6,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        overflow: 'hidden',
    },
    lottieContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: 300,
        height: 300,
    },
    textContainer: {
        flex: 0.4,
        width: '100%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 40,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4.65,
        elevation: 6,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 20,
        paddingBottom: 40,
    },
    paginator: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    startBtn: {
        width: '100%',
    }
});

export default OnboardingScreen;
