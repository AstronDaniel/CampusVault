import React from 'react';
import { Button } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';

interface CVButtonProps {
    mode?: 'text' | 'outlined' | 'contained';
    onPress: () => void;
    children: React.ReactNode;
    style?: ViewStyle;
    icon?: string;
    loading?: boolean;
}

const CVButton = ({ mode = 'contained', onPress, children, style, icon, loading }: CVButtonProps) => {
    return (
        <Button
            mode={mode}
            onPress={onPress}
            style={[styles.button, style]}
            contentStyle={styles.content}
            icon={icon}
            loading={loading}
        >
            {children}
        </Button>
    );
};

const styles = StyleSheet.create({
    button: {
        marginVertical: 8,
        borderRadius: 8,
    },
    content: {
        paddingVertical: 6,
    },
});

export default CVButton;
