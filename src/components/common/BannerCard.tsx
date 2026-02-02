import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Linking,
    Dimensions,
    Alert,
} from 'react-native';
import { useTheme, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

interface BannerData {
    id: number;
    title: string;
    content?: string;
    image_url?: string;
    card_color: string;
    text_color: string;
    border_color?: string;
    footer_text?: string;
    action_text?: string;
    action_url?: string;
    action_type: 'link' | 'deep_link' | 'none';
    priority: number;
    style_options?: any;
}

interface BannerProps {
    banner: BannerData;
    onDismiss?: () => void;
    style?: any;
}

export const BannerCard: React.FC<BannerProps> = ({ banner, onDismiss, style }) => {
    const theme = useTheme();
    const isDark = theme.dark;

    const handleAction = async () => {
        if (!banner.action_url || banner.action_type === 'none') return;

        try {
            if (banner.action_type === 'deep_link') {
                // Handle deep links for navigation within app
                // You can extend this based on your app's deep link structure
                console.log('Deep link:', banner.action_url);
            } else {
                // Handle external links
                const supported = await Linking.canOpenURL(banner.action_url);
                if (supported) {
                    await Linking.openURL(banner.action_url);
                } else {
                    Alert.alert('Error', 'Cannot open this link');
                }
            }
        } catch (error) {
            console.error('Error opening link:', error);
            Alert.alert('Error', 'Failed to open link');
        }
    };

    const dynamicStyles = StyleSheet.create({
        card: {
            backgroundColor: banner.card_color || theme.colors.surface,
            borderColor: banner.border_color || theme.colors.outline,
        },
        title: {
            color: banner.text_color || theme.colors.onSurface,
        },
        content: {
            color: banner.text_color || theme.colors.onSurface,
        },
        footer: {
            color: banner.text_color || theme.colors.onSurface,
        },
    });

    return (
        <Animated.View
            entering={FadeInDown.duration(500)}
            exiting={FadeOutUp.duration(300)}
            style={[styles.container, style]}
        >
            <Surface style={[styles.card, dynamicStyles.card]}>
                {/* Dismiss Button */}
                {onDismiss && (
                    <TouchableOpacity
                        style={styles.dismissButton}
                        onPress={onDismiss}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon
                            name="close"
                            size={20}
                            color={banner.text_color || theme.colors.onSurface}
                        />
                    </TouchableOpacity>
                )}

                {/* Banner Image */}
                {banner.image_url && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: banner.image_url }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </View>
                )}

                {/* Card Body */}
                <View style={styles.body}>
                    {/* Title */}
                    <Text style={[styles.title, dynamicStyles.title]}>
                        {banner.title}
                    </Text>

                    {/* Content */}
                    {banner.content && (
                        <Text style={[styles.content, dynamicStyles.content]}>
                            {banner.content}
                        </Text>
                    )}
                </View>

                {/* Footer/Action Section */}
                {(banner.footer_text || banner.action_text) && (
                    <View style={styles.footer}>
                        {banner.footer_text && (
                            <Text style={[styles.footerText, dynamicStyles.footer]}>
                                {banner.footer_text}
                            </Text>
                        )}

                        {banner.action_text && banner.action_url && (
                            <TouchableOpacity
                                style={[styles.actionButton, {
                                    backgroundColor: banner.text_color || theme.colors.primary
                                }]}
                                onPress={handleAction}
                            >
                                <Text style={[styles.actionText, {
                                    color: banner.card_color || theme.colors.onPrimary
                                }]}>
                                    {banner.action_text}
                                </Text>
                                <Icon
                                    name={banner.action_type === 'deep_link' ? 'arrow-right' : 'open-in-new'}
                                    size={16}
                                    color={banner.card_color || theme.colors.onPrimary}
                                    style={styles.actionIcon}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Priority Indicator (for debugging) */}
                {__DEV__ && banner.priority > 0 && (
                    <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>{banner.priority}</Text>
                    </View>
                )}
            </Surface>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width - 32,
        alignSelf: 'center',
        marginVertical: 8,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    dismissButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        height: 160,
        width: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    body: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        lineHeight: 24,
    },
    content: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.9,
    },
    footer: {
        padding: 16,
        paddingTop: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
    },
    footerText: {
        fontSize: 12,
        opacity: 0.7,
        flex: 1,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionIcon: {
        marginLeft: 4,
    },
    priorityBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255, 0, 0, 0.7)',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priorityText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default BannerCard;