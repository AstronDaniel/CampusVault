import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme, Button, SegmentedButtons, Surface, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn, ZoomOut, Layout } from 'react-native-reanimated';
import FilePicker from 'react-native-file-picker';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

const UploadScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const isDark = theme.dark;

    // Form State
    const [pickedFile, setPickedFile] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [resourceType, setResourceType] = useState('notes');
    const [selectedCourse, setSelectedCourse] = useState<any>(null);

    // Context Data
    const [courseUnits, setCourseUnits] = useState<any[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCourseModalVisible, setIsCourseModalVisible] = useState(false);

    // Upload Execution State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSpeed, setUploadSpeed] = useState('0 KB/s');
    const [eta, setEta] = useState('');

    useEffect(() => {
        loadCourseUnits();
    }, []);

    const loadCourseUnits = async () => {
        try {
            // Passing empty year/semester to get all as enabled by my previous axios client change
            const response = await authService.getCourseUnits(0); // Assuming 0 or null gets all for user's context
            const data = Array.isArray(response) ? response : (response?.items || []);
            setCourseUnits(data);
            setFilteredCourses(data);
        } catch (error) {
            console.error('Failed to load courses:', error);
        }
    };

    const handlePickFile = async () => {
        try {
            const res = await FilePicker.pick({
                type: [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'image/*',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                ],
                multiple: false,
            });
            const file = Array.isArray(res) ? res[0] : res;
            setPickedFile(file);

            // Auto-fill title
            if (!title && file && file.name) {
                const name = file.name || 'Untitled';
                const dotIndex = name.lastIndexOf('.');
                setTitle(dotIndex > 0 ? name.substring(0, dotIndex) : name);
            }
        } catch (err: any) {
            if (err && err.message && err.message.includes('cancelled')) {
                // User cancelled the picker
            } else {
                throw err;
            }
        }
    };

    const handleSearchCourse = (query: string) => {
        setSearchQuery(query);
        const filtered = courseUnits.filter(c =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            (c.code && c.code.toLowerCase().includes(query.toLowerCase()))
        );
        setFilteredCourses(filtered);
    };

    const simulateUpload = () => {
        if (!pickedFile || !selectedCourse || !title) {
            Toast.show({
                type: 'error',
                text1: 'Incomplete Form',
                text2: 'Please select a file, title and course unit.'
            });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 0.1;
            if (progress >= 1) {
                progress = 1;
                setIsUploading(false);
                clearInterval(interval);

                Toast.show({
                    type: 'success',
                    text1: 'Upload Successful',
                    text2: 'Your resource has been shared with the community!'
                });

                // Reset form
                setPickedFile(null);
                setTitle('');
                setDescription('');
                setSelectedCourse(null);
                setUploadProgress(0);
            }
            setUploadProgress(progress);

            // Random speed simulation
            const speed = (Math.random() * 500 + 100).toFixed(1);
            setUploadSpeed(`${speed} KB/s`);

            // ETA simulation
            const remaining = (1 - progress) * 20;
            setEta(remaining > 0 ? `${Math.ceil(remaining)}s` : '');

        }, 500);
    };

    const formatFileSize = (size: number) => {
        if (size < 1024) return size + ' B';
        if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* HEADER */}
                <Animated.View entering={FadeInUp.delay(200)}>
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Share Resource</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.outline }]}>
                        Contribute your materials to help other students grow.
                    </Text>
                </Animated.View>

                {/* FILE PICKER */}
                <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
                    {!pickedFile ? (
                        <TouchableOpacity
                            onPress={handlePickFile}
                            style={[styles.dropZone, { borderStyle: 'dashed', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                        >
                            <LinearGradient
                                colors={isDark ? ['#1E1E1E', '#161616'] : ['#F3F4F6', '#fff']}
                                style={styles.dropZoneInner}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '10' }]}>
                                    <Icon name="cloud-upload-outline" size={32} color={theme.colors.primary} />
                                </View>
                                <Text style={[styles.dropZoneTitle, { color: isDark ? '#fff' : '#000' }]}>Select Document</Text>
                                <Text style={[styles.dropZoneSubtitle, { color: theme.colors.outline }]}>
                                    PDF, DOCX, PPTX or Images (Max 50MB)
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <Surface style={[styles.filePreview, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
                            <View style={[styles.fileIconBox, { backgroundColor: '#10B981' + '15' }]}>
                                <Icon name="file-document-outline" size={28} color="#10B981" />
                            </View>
                            <View style={styles.fileInfo}>
                                <Text style={[styles.fileName, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                                    {pickedFile.name}
                                </Text>
                                <Text style={[styles.fileSize, { color: theme.colors.outline }]}>
                                    {formatFileSize(pickedFile.size || 0)}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setPickedFile(null)} style={styles.removeBtn}>
                                <Icon name="close-circle" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </Surface>
                    )}
                </Animated.View>

                {/* FORM FIELDS */}
                <Animated.View entering={FadeInDown.delay(600)} style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.outline }]}>Title</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }]}
                            placeholder="Enter a descriptive title..."
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.outline }]}>Course Unit</Text>
                        <TouchableOpacity
                            onPress={() => setIsCourseModalVisible(true)}
                            style={[styles.pickerTrigger, { backgroundColor: isDark ? '#1E1E1E' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }]}
                        >
                            <Text style={[styles.pickerText, { color: selectedCourse ? (isDark ? '#fff' : '#000') : (isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF') }]}>
                                {selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : 'Tap to select course unit...'}
                            </Text>
                            <Icon name="chevron-down" size={20} color={theme.colors.outline} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.outline }]}>Type</Text>
                        <SegmentedButtons
                            value={resourceType}
                            onValueChange={setResourceType}
                            buttons={[
                                { value: 'notes', label: 'Lecture Notes', icon: 'notebook-outline' },
                                { value: 'past_paper', label: 'Past Paper', icon: 'file-check-outline' },
                            ]}
                            style={styles.segmented}
                            theme={{ colors: { secondaryContainer: theme.colors.primary + '20', onSecondaryContainer: theme.colors.primary } }}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.outline }]}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#1E1E1E' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }]}
                            placeholder="Briefly describe the highlights of this document..."
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                            multiline
                            numberOfLines={4}
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>
                </Animated.View>

                {/* UPLOAD PROGRESS PANEL */}
                {isUploading && (
                    <Animated.View entering={FadeInUp.springify()} style={styles.progressPanel}>
                        <Surface style={[styles.progressCard, { backgroundColor: isDark ? '#262626' : '#fff' }]}>
                            <View style={styles.progressHeader}>
                                <View style={styles.statusLabel}>
                                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
                                    <Text style={[styles.statusText, { color: isDark ? '#fff' : '#000' }]}>Uploading...</Text>
                                </View>
                                <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
                                    {Math.round(uploadProgress * 100)}%
                                </Text>
                            </View>

                            <ProgressBar
                                progress={uploadProgress}
                                color={theme.colors.primary}
                                style={styles.progressBar}
                            />

                            <View style={styles.progressStats}>
                                <Text style={[styles.statItem, { color: theme.colors.outline }]}>
                                    <Icon name="speedometer" size={14} /> {uploadSpeed}
                                </Text>
                                <Text style={[styles.statItem, { color: theme.colors.outline }]}>
                                    <Icon name="clock-outline" size={14} /> ETA: {eta}
                                </Text>
                            </View>
                        </Surface>
                    </Animated.View>
                )}

                {/* ACTION BUTTON */}
                <Animated.View entering={FadeInUp.delay(800)} style={styles.actionContainer}>
                    <Button
                        mode="contained"
                        onPress={simulateUpload}
                        loading={isUploading}
                        disabled={isUploading}
                        contentStyle={styles.submitBtnContent}
                        style={styles.submitBtn}
                        labelStyle={styles.submitBtnLabel}
                    >
                        {isUploading ? 'Uploading Material...' : 'Share Material'}
                    </Button>
                </Animated.View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* COURSE SELECTION MODAL */}
            <Modal
                visible={isCourseModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsCourseModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>Select Course Unit</Text>
                            <TouchableOpacity onPress={() => setIsCourseModalVisible(false)}>
                                <Icon name="close" size={24} color={theme.colors.outline} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.modalSearch, { backgroundColor: isDark ? '#262626' : '#F3F4F6', color: isDark ? '#fff' : '#000' }]}
                            placeholder="Search code or name..."
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                            value={searchQuery}
                            onChangeText={handleSearchCourse}
                        />

                        <FlatList
                            data={filteredCourses}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.courseItem}
                                    onPress={() => {
                                        setSelectedCourse(item);
                                        setIsCourseModalVisible(false);
                                    }}
                                >
                                    <View style={[styles.courseIcon, { backgroundColor: theme.colors.primary + '10' }]}>
                                        <Text style={[styles.coursePrefix, { color: theme.colors.primary }]}>
                                            {item.code?.substring(0, 2)}
                                        </Text>
                                    </View>
                                    <View style={styles.courseInfo}>
                                        <Text style={[styles.courseName, { color: isDark ? '#fff' : '#000' }]}>{item.name}</Text>
                                        <Text style={[styles.courseCode, { color: theme.colors.outline }]}>{item.code}</Text>
                                    </View>
                                    <Icon name="chevron-right" size={20} color={theme.colors.outline} />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.modalEmpty}>
                                    <Text style={{ color: theme.colors.outline }}>No courses found</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* TOAST COMPONENT */}
            <Toast />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        padding: 24,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 15,
        marginTop: 4,
        lineHeight: 22,
    },
    section: {
        marginTop: 24,
        marginBottom: 20,
    },
    dropZone: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    dropZoneInner: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    dropZoneTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    dropZoneSubtitle: {
        fontSize: 13,
        fontWeight: '600',
    },
    filePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        elevation: 2,
    },
    fileIconBox: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    fileSize: {
        fontSize: 12,
        fontWeight: '600',
    },
    removeBtn: {
        padding: 8,
    },
    form: {
        marginTop: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 15,
        fontWeight: '600',
        borderWidth: 1,
    },
    textArea: {
        height: 120,
        paddingTop: 16,
        textAlignVertical: 'top',
    },
    pickerTrigger: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    pickerText: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    segmented: {
        height: 48,
    },
    progressPanel: {
        marginTop: 10,
        marginBottom: 20,
    },
    progressCard: {
        padding: 20,
        borderRadius: 24,
        elevation: 4,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontWeight: '800',
        fontSize: 15,
    },
    progressPercent: {
        fontWeight: '900',
        fontSize: 16,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        marginBottom: 12,
    },
    progressStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        fontSize: 12,
        fontWeight: '700',
    },
    actionContainer: {
        marginTop: 10,
    },
    submitBtn: {
        borderRadius: 16,
        elevation: 4,
    },
    submitBtnContent: {
        height: 56,
    },
    submitBtnLabel: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: height * 0.7,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
    },
    modalSearch: {
        height: 50,
        borderRadius: 15,
        paddingHorizontal: 16,
        marginBottom: 20,
        fontSize: 14,
        fontWeight: '600',
    },
    courseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    courseIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coursePrefix: {
        fontSize: 15,
        fontWeight: '900',
    },
    courseInfo: {
        flex: 1,
        marginLeft: 16,
    },
    courseName: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    courseCode: {
        fontSize: 12,
        fontWeight: '600',
    },
    modalEmpty: {
        alignItems: 'center',
        marginTop: 40,
    },
});

export default UploadScreen;
