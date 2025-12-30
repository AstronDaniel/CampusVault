import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BlurView } from '@react-native-community/blur'; // If available, or just semi-transparent bg

const { height } = Dimensions.get('window');

interface DropdownItem {
    id: number | string;
    label: string;
}

interface GlassDropdownProps {
    data: DropdownItem[];
    value: number | string | null;
    onChange: (item: DropdownItem) => void;
    placeholder: string;
    icon?: string;
}

const GlassDropdown: React.FC<GlassDropdownProps> = ({
    data,
    value,
    onChange,
    placeholder,
    icon
}) => {
    const [visible, setVisible] = useState(false);

    const selectedItem = data.find(item => item.id === value);

    const handleSelect = (item: DropdownItem) => {
        onChange(item);
        setVisible(false);
    };

    return (
        <>
            <TouchableOpacity
                style={styles.trigger}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                {icon && <Icon name={icon} size={20} color="rgba(255,255,255,0.7)" style={styles.icon} />}
                <Text style={[styles.text, !selectedItem && styles.placeholder]}>
                    {selectedItem ? selectedItem.label : placeholder}
                </Text>
                <Icon name="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>{placeholder}</Text>
                        </View>
                        <FlatList
                            data={data}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.item}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={[
                                        styles.itemText,
                                        item.id === value && styles.selectedItemText
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {item.id === value && (
                                        <Icon name="check" size={20} color="#EC4899" />
                                    )}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    icon: {
        marginRight: 10,
    },
    text: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
    },
    placeholder: {
        color: 'rgba(255, 255, 255, 0.4)',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1E1E2E', // Dark high contrast
        borderRadius: 20,
        maxHeight: height * 0.6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    header: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    item: {
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
    },
    selectedItemText: {
        color: '#EC4899', // Pink Neon
        fontWeight: 'bold',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
});

export default GlassDropdown;
