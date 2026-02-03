import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Modal, FlatList, KeyboardAvoidingView, Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { useTheme, Button, SegmentedButtons, Surface, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn, ZoomOut, Layout } from 'react-native-reanimated';
import { pick, types } from '@react-native-documents/picker';
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
    // Duplicate check state
    const [duplicateChecking, setDuplicateChecking] = useState(false);
    const [duplicateProgress, setDuplicateProgress] = useState(0);
    const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
    const [isDuplicateModalVisible, setIsDuplicateModalVisible] = useState(false);
    const [computedSha, setComputedSha] = useState<string | null>(null);

    // AI Metadata Generation
    const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);

    useEffect(() => {
        loadCourseUnits();
    }, []);

    const loadCourseUnits = async () => {
        try {
            // Fetch all course units (no program filter)
            const response = await authService.getCourseUnits();
            console.log('[Upload] course units response:', response);
            const data = Array.isArray(response) ? response : (response?.items || []);
            setCourseUnits(data);
            setFilteredCourses(data);
        } catch (error) {
            console.error('Failed to load courses:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to load courses',
                text2: 'Please try again later'
            });
        }
    };

    const requestFilePermission = async () => {
        if (Platform.OS !== 'android') return true;

        try {
            // Android 13+ (API 33+): Don't request storage permissions
            // The system document picker handles permissions automatically
            if (Platform.Version >= 33) {
                console.log('[UploadScreen] Android 13+ detected, using system document picker (no permissions needed)');
                return true; // Let the document picker handle permissions
            } 
            
            // Android 12 and below - Use legacy storage permission
            const permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
            
            const result = await PermissionsAndroid.request(permission, {
                title: 'Storage Permission',
                message: 'This app needs access to storage to select files for upload.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            });
            
            if (result === PermissionsAndroid.RESULTS.GRANTED) {
                return true;
            }
            
            if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                Alert.alert(
                    'Permission Required',
                    'Storage access has been permanently denied. Please enable storage permission in app settings to select files.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() }
                    ]
                );
            }
            
            return false;
        } catch (error) {
            console.error('Permission request error:', error);
            Toast.show({
                type: 'error',
                text1: 'Permission Error',
                text2: 'Failed to request file access permission'
            });
            return false;
        }
    };

    // Update the handlePickFile function to properly trigger duplicate check:
    const handlePickFile = async () => {
        try {
            // First, request proper permissions based on Android version
            const hasPermission = await requestFilePermission();
            if (!hasPermission) {
                console.log('[UploadScreen] File permission not granted');
                return;
            }

            // Use DocumentPicker for all file types
            console.log('[UploadScreen] Using DocumentPicker for file selection');
            const results = await pick({
                type: [types.allFiles],
            });
            const res = results[0]; // Get first result since we only need one file
            console.log('[UploadScreen] DocumentPicker succeeded:', res);

            // Normalize response from DocumentPicker
            const file = {
                name: res.name || 'file',
                uri: res.uri,
                type: res.type || 'application/octet-stream',
                size: res.size || 0,
            };

            console.log('[UploadScreen] Selected file:', {
                name: file.name,
                uri: file.uri,
                type: file.type,
                size: file.size
            });

            // Check file size (max 50MB)
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
                Toast.show({
                    type: 'error',
                    text1: 'File too large',
                    text2: 'Maximum file size is 50MB'
                });
                return;
            }

            setPickedFile(file);

            // Auto-fill title
            if (!title && file && file.name) {
                const name = file.name || 'Untitled';
                const dotIndex = name.lastIndexOf('.');
                setTitle(dotIndex > 0 ? name.substring(0, dotIndex) : name);
            }

            // Reset duplicate info
            setDuplicateInfo(null);
            setDuplicateProgress(0);
            setDuplicateChecking(false);

            // Run duplicate check if course is selected
            if (selectedCourse && file.uri) {
                // Small delay to ensure state is updated
                setTimeout(() => {
                    runDuplicateCheck(selectedCourse, file);
                }, 300);
            }
        } catch (err: any) {
            // Handle DocumentPicker cancellation
            if (err && err.message && (err.message.includes('cancelled') || err.message.includes('cancel'))) {
                console.log('[UploadScreen] User cancelled document picker');
                return;
            }
            
            console.error('File pick error:', err);
            
            // Enhanced error handling for different types of errors
            let errorTitle = 'File Pick Error';
            let errorMessage = 'Failed to pick file';
            
            // Handle permission-related errors
            if (err.message?.toLowerCase().includes('permission') || 
                err.message?.toLowerCase().includes('denied') || 
                err.code === 'PERMISSION_DENIED' ||
                err.message?.toLowerCase().includes('storage') ||
                err.message?.toLowerCase().includes('access')) {
                if (Platform.OS === 'android' && Platform.Version >= 33) {
                    errorTitle = 'Permission Required';
                    errorMessage = 'Please grant file access permission in Settings';
                    
                    Alert.alert(
                        errorTitle,
                        'Android 13+ requires file permissions. Please go to:\n\n' +
                        '1. Settings → Apps → CampusVault\n' +
                        '2. Permissions → Files and media (or Storage)\n' +
                        '3. Select "Allow"\n\n' +
                        'Then try again.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open Settings', onPress: () => Linking.openSettings() },
                        ]
                    );
                    return;
                } else {
                    errorTitle = 'Permission Required';
                    errorMessage = 'Storage permission is required to select files. Please grant permission and try again.';
                }
            }
            // Use provided error message or fallback
            else if (err.message) {
                errorMessage = err.message;
            }
            
            Toast.show({
                type: 'error',
                text1: errorTitle,
                text2: errorMessage
            });
        }
    };

    // Add a useEffect to run duplicate check when course changes:
    useEffect(() => {
        if (selectedCourse && pickedFile && pickedFile.uri && !duplicateChecking) {
            // Run duplicate check when course is selected and file exists
            const timer = setTimeout(() => {
                runDuplicateCheck(selectedCourse, pickedFile);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [selectedCourse]);

    const runDuplicateCheck = async (course: any, file: any) => {
        if (!course || !file || !file.uri) {
            console.log('[UploadScreen] Missing course or file for duplicate check');
            setDuplicateInfo({ error: 'File not selected properly' });
            return;
        }

        try {
            setDuplicateChecking(true);
            setDuplicateProgress(0);
            setDuplicateInfo(null);

            console.log('[UploadScreen] Starting duplicate check:', {
                courseId: course.id,
                fileName: file.name,
                fileSize: file.size,
                fileUri: file.uri
            });

            // Call duplicate check (hash computation happens inside authService)
            const resp = await authService.checkDuplicate(
                Number(course.id),
                {
                    uri: file.uri,
                    name: file.name || 'file',
                    type: file.type || 'application/octet-stream',
                    size: file.size || 0
                },
                (progressEvent: any) => {
                    try {
                        // Handle different progress phases
                        if (progressEvent.phase === 'hashing') {
                            // Hash computation: 0-50%
                            const progress = progressEvent.progress || 0;
                            setDuplicateProgress(progress * 0.5);
                            console.log('[UploadScreen] Hash progress:', Math.round(progress * 50) + '%');
                        } else if (progressEvent.phase === 'checking') {
                            // API call: 50-100%
                            const progress = progressEvent.progress || 0;
                            setDuplicateProgress(0.5 + progress * 0.5);
                            console.log('[UploadScreen] Check progress:', Math.round(50 + progress * 50) + '%');
                        } else if (progressEvent.total && progressEvent.loaded) {
                            // Fallback for standard progress events
                            const loaded = progressEvent.loaded;
                            const total = progressEvent.total;
                            const progress = total > 0 ? Math.min(1, loaded / total) : 0;
                            setDuplicateProgress(progress);
                            console.log('[UploadScreen] Progress:', Math.round(progress * 100) + '%');
                        }
                    } catch (e) {
                        console.error('[UploadScreen] Progress update error:', e);
                    }
                }
            );

            console.log('[UploadScreen] Duplicate check result:', resp);
            setDuplicateInfo(resp as any);
            if ((resp as any).sha256) {
                setComputedSha((resp as any).sha256);
            }

            // Auto-trigger AI metadata generation if not a duplicate
            if (!(resp as any)?.duplicate && selectedCourse && pickedFile) {
                console.log('[UploadScreen] File is not a duplicate, auto-generating metadata...');
                try {
                    const metadata = await authService.generateMetadata(
                        pickedFile.name,
                        selectedCourse.name,
                        resourceType
                    );

                    if (metadata) {
                        if (metadata.title) setTitle(metadata.title);
                        if (metadata.description) setDescription(metadata.description);
                        if (metadata.tag) setResourceType(metadata.tag);

                        Toast.show({
                            type: 'success',
                            text1: 'AI Details Generated',
                            text2: 'Title, description and tag auto-filled!'
                        });
                    }
                } catch (aiError: any) {
                    console.error('[UploadScreen] Auto AI generation failed:', aiError);
                    // Don't show error toast - AI is optional, duplicate check succeeded
                }
            }

        } catch (e: any) {
            console.error('[UploadScreen] Duplicate check failed:', e);

            // Handle hash computation errors specifically
            if (e.code === 'HASH_ERROR' || e.message?.includes('hash') || e.message?.includes('SHA256')) {
                setDuplicateInfo({
                    error: 'Failed to compute file hash. Please try another file.',
                    rawError: e
                });
            } else {
                // Handle other errors
                let errorMessage = 'Failed to check for duplicates';

                if (e.error === 'Request timeout') {
                    errorMessage = 'Duplicate check timed out. Please try again.';
                } else if (e.code === 'NETWORK_ERROR') {
                    errorMessage = 'Network error. Please check your connection.';
                } else if (e.status === 404) {
                    errorMessage = 'Duplicate check service unavailable';
                } else if (e.details) {
                    errorMessage = e.details?.message || 'Validation error';
                } else if (e.message) {
                    errorMessage = e.message;
                }

                setDuplicateInfo({
                    error: errorMessage,
                    rawError: e
                });
            }
        } finally {
            setDuplicateChecking(false);
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

    const handleGenerateMetadata = async () => {
        if (!pickedFile || !selectedCourse) {
            Toast.show({
                type: 'error',
                text1: 'Requirements Missing',
                text2: 'Please select a file and a course unit first.'
            });
            return;
        }

        try {
            setIsGeneratingMetadata(true);
            Toast.show({
                type: 'info',
                text1: 'Generating Details...',
                text2: 'AI is analyzing your file name.'
            });

            const metadata = await authService.generateMetadata(
                pickedFile.name,
                selectedCourse.name,
                resourceType
            );

            if (metadata) {
                if (metadata.title) setTitle(metadata.title);
                if (metadata.description) setDescription(metadata.description);
                if (metadata.tag) setResourceType(metadata.tag);

                Toast.show({
                    type: 'success',
                    text1: 'Details Generated',
                    text2: 'Title, description and tag updated!'
                });
            }
        } catch (error: any) {
            console.error('Metadata generation failed:', error);
            Toast.show({
                type: 'error',
                text1: 'Generation Failed',
                text2: error?.message || 'Could not generate metadata.'
            });
        } finally {
            setIsGeneratingMetadata(false);
        }
    };

    const lastLoadedRef = useRef(0);
    const lastTimeRef = useRef<number | null>(null);

    const handleUpload = async () => {
        if (!pickedFile || !selectedCourse || !title) {
            Toast.show({
                type: 'error',
                text1: 'Incomplete Form',
                text2: 'Please select a file, title and course unit.'
            });
            return;
        }

        // If duplicate exists, show warning
        if (duplicateInfo?.duplicate) {
            setIsDuplicateModalVisible(true);
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);
            setUploadSpeed('0 KB/s');
            setEta('');
            lastLoadedRef.current = 0;
            lastTimeRef.current = null;

            // 1. Get SHA256 if not already computed
            let sha256 = computedSha;
            if (!sha256) {
                console.log('[UploadScreen] SHA256 not computed yet, computing now...');
                // We'll use a small trick: runDuplicateCheck again but it returns the hash
                // Better: calling authService.checkDuplicate directly
                const checkResp = await authService.checkDuplicate(
                    Number(selectedCourse.id),
                    {
                        uri: pickedFile.uri,
                        name: pickedFile.name,
                        type: pickedFile.type,
                        size: pickedFile.size
                    }
                );
                // Get the locally computed SHA returned by the service
                sha256 = (checkResp as any).computed_sha256 || (checkResp as any).sha256;

                if (!sha256) {
                    throw new Error('Failed to compute file hash');
                }
                setComputedSha(sha256);
            }

            // 2. Initiate upload on Backend (Gets Resumable URL)
            console.log('[UploadScreen] Initiating direct upload...');
            const { upload_url } = await authService.initiateUploadMobile({
                course_unit_id: Number(selectedCourse.id),
                filename: pickedFile.name,
                content_type: pickedFile.type || 'application/octet-stream',
                size_bytes: pickedFile.size || 0
            });

            // 3. Direct upload to Drive
            console.log('[UploadScreen] Transferring file to Cloud...');
            const cloudFile = await authService.directUploadToDrive(
                upload_url,
                pickedFile.uri,
                pickedFile.type || 'application/octet-stream',
                (ev: { loaded: number; total: number }) => {
                    const progress = ev.loaded / ev.total;
                    setUploadProgress(progress);

                    const now = Date.now();
                    if (lastTimeRef.current) {
                        const timeDiff = (now - lastTimeRef.current) / 1000; // seconds
                        if (timeDiff >= 0.5) { // Update stats every 0.5s
                            const loadedDiff = ev.loaded - lastLoadedRef.current;
                            const speedBytesPerSec = loadedDiff / timeDiff;

                            // Formatted speed
                            let speedText = '0 KB/s';
                            if (speedBytesPerSec > 1024 * 1024) {
                                speedText = `${(speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
                            } else {
                                speedText = `${(speedBytesPerSec / 1024).toFixed(1)} KB/s`;
                            }
                            setUploadSpeed(speedText);

                            // ETA
                            const remainingBytes = ev.total - ev.loaded;
                            if (speedBytesPerSec > 0) {
                                const remainingSeconds = Math.round(remainingBytes / speedBytesPerSec);
                                if (remainingSeconds < 60) {
                                    setEta(`${remainingSeconds}s`);
                                } else {
                                    const mins = Math.floor(remainingSeconds / 60);
                                    const secs = remainingSeconds % 60;
                                    setEta(`${mins}m ${secs}s`);
                                }
                            }

                            lastLoadedRef.current = ev.loaded;
                            lastTimeRef.current = now;
                        }
                    } else {
                        lastTimeRef.current = now;
                        lastLoadedRef.current = ev.loaded;
                    }
                }
            );

            // 4. Finalize upload on Backend
            console.log('[UploadScreen] Finalizing metadata...');
            await authService.finalizeUploadMobile({
                course_unit_id: Number(selectedCourse.id),
                file_id: cloudFile.file_id,
                file_url: cloudFile.file_url,
                filename: pickedFile.name,
                content_type: pickedFile.type || 'application/octet-stream',
                size_bytes: pickedFile.size || 0,
                sha256: sha256!,
                title: title,
                description: description,
                resource_type: resourceType
            });

            Toast.show({
                type: 'success',
                text1: 'Upload Successful',
                text2: 'Your resource has been shared!'
            });

            // Reset form
            setPickedFile(null);
            setTitle('');
            setDescription('');
            setSelectedCourse(null);
            setUploadProgress(0);
            setDuplicateInfo(null);
            setComputedSha(null);

            // Navigate back after successful upload
            setTimeout(() => {
                navigation.goBack();
            }, 1500);
        } catch (error: any) {
            console.error('[UploadScreen] Upload failed:', error);
            Toast.show({
                type: 'error',
                text1: 'Upload Failed',
                text2: error?.detail?.message || error?.message || 'An error occurred during direct upload'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (size: number) => {
        if (!size) return '0 B';
        if (size < 1024) return size + ' B';
        if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
    };


    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* HEADER */}
                <Animated.View entering={FadeInUp.delay(200)}>
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
                        Share Resource
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.outline }]}>
                        Contribute your materials to help other students grow.
                    </Text>
                </Animated.View>

                {/* FILE PICKER */}
                <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
                    {!pickedFile ? (
                        <TouchableOpacity
                            onPress={handlePickFile}
                            style={[
                                styles.dropZone,
                                {
                                    borderStyle: 'dashed',
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                    borderWidth: 2
                                }
                            ]}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={isDark ? ['#1E1E1E', '#161616'] : ['#F3F4F6', '#fff']}
                                style={styles.dropZoneInner}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '10' }]}>
                                    <Icon name="cloud-upload-outline" size={32} color={theme.colors.primary} />
                                </View>
                                <Text style={[styles.dropZoneTitle, { color: isDark ? '#fff' : '#000' }]}>
                                    Select Document
                                </Text>
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
                            <TouchableOpacity
                                onPress={() => setPickedFile(null)}
                                style={styles.removeBtn}
                            >
                                <Icon name="close-circle" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </Surface>
                    )}
                </Animated.View>

                {/* DUPLICATE CHECK CARD */}
                {pickedFile && (
                    <Animated.View entering={FadeInUp.delay(450)} style={{ marginTop: 12 }}>
                        <Surface style={[
                            styles.duplicateCard,
                            {
                                backgroundColor: isDark ? '#111' : '#fff',
                                padding: 16,
                                borderRadius: 16,
                                marginBottom: 16
                            }
                        ]}>
                            {!selectedCourse ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Icon name="information-outline" size={20} color={theme.colors.outline} style={{ marginRight: 8 }} />
                                        <Text style={{ color: theme.colors.outline, flex: 1 }}>
                                            Select a course unit to check for duplicates
                                        </Text>
                                    </View>
                                    <Button
                                        compact
                                        onPress={() => setIsCourseModalVisible(true)}
                                        mode="contained"
                                    >
                                        Select
                                    </Button>
                                </View>
                            ) : duplicateChecking ? (
                                <View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
                                            <Text style={{
                                                fontWeight: '600',
                                                color: isDark ? '#fff' : '#000',
                                                fontSize: 14
                                            }}>
                                                Checking for duplicates...
                                            </Text>
                                        </View>
                                        <Text style={{ color: theme.colors.outline, fontSize: 14 }}>
                                            {Math.round(duplicateProgress * 100)}%
                                        </Text>
                                    </View>
                                    <ProgressBar
                                        progress={duplicateProgress}
                                        color={theme.colors.primary}
                                        style={{
                                            height: 6,
                                            borderRadius: 3
                                        }}
                                    />
                                    <Text style={{
                                        fontSize: 11,
                                        color: theme.colors.outline,
                                        marginTop: 4,
                                        textAlign: 'center'
                                    }}>
                                        Comparing file with existing resources...
                                    </Text>
                                </View>
                            ) : duplicateInfo ? (
                                duplicateInfo.error ? (
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                            <Icon name="alert-circle" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                                            <Text style={{
                                                color: '#EF4444',
                                                fontWeight: '600',
                                                flex: 1
                                            }}>
                                                {duplicateInfo.error}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                            <Button
                                                compact
                                                onPress={() => runDuplicateCheck(selectedCourse, pickedFile)}
                                                mode="outlined"
                                                style={{ marginRight: 8 }}
                                            >
                                                Retry
                                            </Button>
                                            <Button
                                                compact
                                                onPress={() => setDuplicateInfo(null)}
                                                mode="text"
                                            >
                                                Dismiss
                                            </Button>
                                        </View>
                                    </View>
                                ) : duplicateInfo.duplicate ? (
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                            <Icon name="alert-octagon" size={20} color="#F59E0B" style={{ marginRight: 8 }} />
                                            <Text style={{
                                                fontWeight: '700',
                                                color: '#F59E0B',
                                                fontSize: 15
                                            }}>
                                                Similar File Found
                                            </Text>
                                        </View>

                                        <View style={{
                                            backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
                                            padding: 12,
                                            borderRadius: 12,
                                            marginBottom: 12
                                        }}>
                                            <Text style={{
                                                fontWeight: '600',
                                                color: isDark ? '#fff' : '#000',
                                                marginBottom: 4
                                            }}>
                                                {duplicateInfo.existing?.title}
                                            </Text>
                                            <Text style={{
                                                color: theme.colors.outline,
                                                fontSize: 12,
                                                marginBottom: 8
                                            }}>
                                                Uploaded by: {duplicateInfo.existing?.uploader_name || 'Unknown user'}
                                            </Text>
                                            <Text style={{
                                                color: theme.colors.outline,
                                                fontSize: 11
                                            }}>
                                                Similarity: {duplicateInfo.similarity_score ?
                                                    `${Math.round(duplicateInfo.similarity_score * 100)}%` :
                                                    'High similarity detected'}
                                            </Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            <Button
                                                mode="contained"
                                                onPress={() => {
                                                    navigation.navigate('ResourceDetails', {
                                                        id: duplicateInfo.existing?.id
                                                    });
                                                }}
                                                style={{ marginRight: 8, marginBottom: 8 }}
                                                compact
                                                icon="file-document-outline"
                                            >
                                                View Existing
                                            </Button>
                                            <Button
                                                onPress={() => setIsDuplicateModalVisible(true)}
                                                style={{ marginRight: 8, marginBottom: 8 }}
                                                compact
                                                icon="information-outline"
                                            >
                                                Details
                                            </Button>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon name="check-circle" size={20} color="#10B981" style={{ marginRight: 8 }} />
                                        <Text style={{
                                            color: '#10B981',
                                            fontWeight: '700',
                                            fontSize: 14
                                        }}>
                                            No duplicates found
                                        </Text>
                                    </View>
                                )
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Icon name="shield-check-outline" size={20} color={theme.colors.outline} style={{ marginRight: 8 }} />
                                        <Text style={{ color: theme.colors.outline }}>
                                            Check for duplicate resources
                                        </Text>
                                    </View>
                                    <Button
                                        compact
                                        onPress={() => runDuplicateCheck(selectedCourse, pickedFile)}
                                        mode="contained"
                                        icon="magnify"
                                    >
                                        Check Now
                                    </Button>
                                </View>
                            )}
                        </Surface>
                    </Animated.View>
                )}

                {/* AI AUTO-FILL BUTTON */}
                {pickedFile && selectedCourse && (
                    <Animated.View entering={FadeInUp.delay(500)} style={{ marginBottom: 16 }}>
                        <Button
                            mode="contained-tonal"
                            icon="creation" // or 'magic-staff', 'sparkles', 'robot'
                            onPress={handleGenerateMetadata}
                            loading={isGeneratingMetadata}
                            disabled={isGeneratingMetadata || isUploading}
                            buttonColor={isDark ? '#2C2C2C' : '#E0E7FF'}
                            textColor={theme.colors.primary}
                        >
                            Auto-fill details with AI
                        </Button>
                    </Animated.View>
                )}

                {/* FORM FIELDS */}
                <Animated.View entering={FadeInDown.delay(600)} style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.outline }]}>
                            Title
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#1E1E1E' : '#fff',
                                    color: isDark ? '#fff' : '#000',
                                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB'
                                }
                            ]}
                            placeholder="Enter a descriptive title..."
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                            value={title}
                            onChangeText={setTitle}
                            editable={!isUploading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.outline }]}>
                            Course Unit
                        </Text>
                        <TouchableOpacity
                            onPress={() => setIsCourseModalVisible(true)}
                            style={[
                                styles.pickerTrigger,
                                {
                                    backgroundColor: isDark ? '#1E1E1E' : '#fff',
                                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB'
                                }
                            ]}
                            disabled={isUploading}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.pickerText,
                                {
                                    color: selectedCourse
                                        ? (isDark ? '#fff' : '#000')
                                        : (isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF')
                                }
                            ]}>
                                {selectedCourse
                                    ? `${selectedCourse.code} - ${selectedCourse.name}`
                                    : 'Tap to select course unit...'
                                }
                            </Text>
                            <Icon name="chevron-down" size={20} color={theme.colors.outline} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.outline }]}>
                            Type
                        </Text>
                        <SegmentedButtons
                            value={resourceType}
                            onValueChange={setResourceType}
                            buttons={[
                                {
                                    value: 'notes',
                                    label: 'Lecture Notes',
                                    icon: 'notebook-outline',
                                    disabled: isUploading
                                },
                                {
                                    value: 'past_paper',
                                    label: 'Past Paper',
                                    icon: 'file-check-outline',
                                    disabled: isUploading
                                },
                            ]}
                            style={styles.segmented}
                            theme={{
                                colors: {
                                    secondaryContainer: theme.colors.primary + '20',
                                    onSecondaryContainer: theme.colors.primary
                                }
                            }}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.outline }]}>
                            Description (Optional)
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                {
                                    backgroundColor: isDark ? '#1E1E1E' : '#fff',
                                    color: isDark ? '#fff' : '#000',
                                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB'
                                }
                            ]}
                            placeholder="Briefly describe the highlights of this document..."
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            value={description}
                            onChangeText={setDescription}
                            editable={!isUploading}
                        />
                        <Text style={[
                            styles.charCount,
                            { color: theme.colors.outline }
                        ]}>
                            {description.length}/500
                        </Text>
                    </View>
                </Animated.View>

                {/* UPLOAD PROGRESS PANEL - FIXED SYNTAX */}
                {isUploading && (
                    <Animated.View entering={FadeInUp.springify()} style={styles.progressPanel}>
                        <Surface style={[
                            styles.progressCard,
                            { backgroundColor: isDark ? '#262626' : '#fff' }
                        ]}>
                            <View style={styles.progressHeader}>
                                <View style={styles.statusLabel}>
                                    <ActivityIndicator
                                        size="small"
                                        color={theme.colors.primary}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={[
                                        styles.statusText,
                                        { color: isDark ? '#fff' : '#000' }
                                    ]}>
                                        Uploading...
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.progressPercent,
                                    { color: theme.colors.primary }
                                ]}>
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
                                    <Icon name="clock-outline" size={14} /> ETA: {eta || '--'}
                                </Text>
                            </View>
                        </Surface>
                    </Animated.View>
                )}

                {/* ACTION BUTTON */}
                <Animated.View entering={FadeInUp.delay(800)} style={styles.actionContainer}>
                    <Button
                        mode="contained"
                        onPress={handleUpload}
                        loading={isUploading}
                        disabled={isUploading || !pickedFile || !selectedCourse || !title}
                        contentStyle={styles.submitBtnContent}
                        style={styles.submitBtn}
                        labelStyle={styles.submitBtnLabel}
                        icon="share-variant"
                    >
                        {isUploading ? 'Uploading Material...' : 'Share Material'}
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={() => navigation.goBack()}
                        style={{ marginTop: 12 }}
                        disabled={isUploading}
                    >
                        Cancel
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
                    <View style={[
                        styles.modalContent,
                        {
                            backgroundColor: isDark ? '#1E1E1E' : '#fff',
                            height: height * 0.8
                        }
                    ]}>
                        <View style={styles.modalHeader}>
                            <Text style={[
                                styles.modalTitle,
                                { color: isDark ? '#fff' : '#000' }
                            ]}>
                                Select Course Unit
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsCourseModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Icon name="close" size={24} color={theme.colors.outline} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[
                                styles.modalSearch,
                                {
                                    backgroundColor: isDark ? '#262626' : '#F3F4F6',
                                    color: isDark ? '#fff' : '#000'
                                }
                            ]}
                            placeholder="Search by code or name..."
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                            value={searchQuery}
                            onChangeText={handleSearchCourse}
                            autoFocus
                        />

                        <FlatList
                            data={filteredCourses}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.courseItem,
                                        selectedCourse?.id === item.id && {
                                            backgroundColor: isDark
                                                ? theme.colors.primary + '20'
                                                : theme.colors.primary + '10'
                                        }
                                    ]}
                                    onPress={() => {
                                        setSelectedCourse(item);
                                        setIsCourseModalVisible(false);
                                        // Run duplicate check if file is already selected
                                        if (pickedFile) {
                                            runDuplicateCheck(item, pickedFile);
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.courseIcon,
                                        { backgroundColor: theme.colors.primary + '10' }
                                    ]}>
                                        <Text style={[
                                            styles.coursePrefix,
                                            { color: theme.colors.primary }
                                        ]}>
                                            {item.code?.substring(0, 2) || 'CU'}
                                        </Text>
                                    </View>
                                    <View style={styles.courseInfo}>
                                        <Text style={[
                                            styles.courseName,
                                            { color: isDark ? '#fff' : '#000' }
                                        ]}>
                                            {item.name}
                                        </Text>
                                        <Text style={[
                                            styles.courseCode,
                                            { color: theme.colors.outline }
                                        ]}>
                                            {item.code}
                                        </Text>
                                    </View>
                                    <Icon
                                        name="chevron-right"
                                        size={20}
                                        color={theme.colors.outline}
                                    />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.modalEmpty}>
                                    <Icon name="magnify" size={40} color={theme.colors.outline} />
                                    <Text style={{
                                        color: theme.colors.outline,
                                        marginTop: 12,
                                        fontSize: 16
                                    }}>
                                        No courses found
                                    </Text>
                                </View>
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>

            {/* TOAST COMPONENT */}
            <Toast />

            {/* Duplicate Details Modal */}
            <Modal
                visible={isDuplicateModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsDuplicateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modalContent,
                        {
                            backgroundColor: isDark ? '#1E1E1E' : '#fff',
                            height: 'auto',
                            maxHeight: height * 0.85,
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            padding: 0,
                        }
                    ]}>
                        <View style={{ padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{
                                        width: 40, height: 40, borderRadius: 20,
                                        backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12
                                    }}>
                                        <Icon name="file-document-multiple" size={22} color="#D97706" />
                                    </View>
                                    <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? '#fff' : '#111827' }}>
                                        Similar File Found
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setIsDuplicateModalVisible(false)}
                                    style={{ padding: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6', borderRadius: 20 }}
                                >
                                    <Icon name="close" size={20} color={theme.colors.outline} />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ fontSize: 14, color: theme.colors.outline, lineHeight: 20 }}>
                                We found an existing resource that matches the file you're trying to upload. To avoid duplicates, please check the existing file.
                            </Text>
                        </View>

                        <ScrollView
                            style={{ padding: 24 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* File Card */}
                            <Surface style={{
                                borderRadius: 24,
                                padding: 20,
                                backgroundColor: isDark ? '#262626' : '#fff',
                                elevation: 4,
                                marginBottom: 24
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <View style={{
                                        width: 48, height: 48, borderRadius: 14,
                                        backgroundColor: theme.colors.primary + '15',
                                        alignItems: 'center', justifyContent: 'center', marginRight: 16
                                    }}>
                                        <Icon name="file-pdf-box" size={28} color={theme.colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#fff' : '#000', marginBottom: 4 }}>
                                            {duplicateInfo?.existing?.title || 'Untitled Resource'}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Icon name="account-circle-outline" size={14} color={theme.colors.outline} style={{ marginRight: 4 }} />
                                            <Text style={{ fontSize: 12, color: theme.colors.outline, fontWeight: '600' }}>
                                                {duplicateInfo?.existing?.uploader_name || 'Unknown Uploader'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Metadata Grid */}
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
                                    <View style={{ width: '50%', padding: 8 }}>
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.colors.outline, marginBottom: 4, textTransform: 'uppercase' }}>Course</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#E5E7EB' : '#374151' }}>
                                            {duplicateInfo?.existing?.course_unit?.code || '—'}
                                        </Text>
                                    </View>
                                    <View style={{ width: '50%', padding: 8 }}>
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.colors.outline, marginBottom: 4, textTransform: 'uppercase' }}>Uploaded</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#E5E7EB' : '#374151' }}>
                                            {duplicateInfo?.existing?.created_at ? new Date(duplicateInfo.existing.created_at).toLocaleDateString() : '—'}
                                        </Text>
                                    </View>
                                    {duplicateInfo?.program_name && (
                                        <View style={{ width: '100%', padding: 8 }}>
                                            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.colors.outline, marginBottom: 4, textTransform: 'uppercase' }}>Program</Text>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#E5E7EB' : '#374151' }}>
                                                {duplicateInfo.program_name}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </Surface>

                            <Text style={{ textAlign: 'center', color: theme.colors.outline, fontSize: 13, marginBottom: 24, fontStyle: 'italic' }}>
                                "Quality over quantity. Helping keep our library clean!"
                            </Text>

                            <View style={{ gap: 12 }}>
                                <Button
                                    mode="contained"
                                    onPress={() => {
                                        setIsDuplicateModalVisible(false);
                                        navigation.navigate('ResourceDetails', { id: duplicateInfo?.existing?.id });
                                    }}
                                    style={{ borderRadius: 16 }}
                                    contentStyle={{ height: 54 }}
                                    labelStyle={{ fontSize: 16, fontWeight: '800' }}
                                >
                                    View Existing Resource
                                </Button>

                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setIsDuplicateModalVisible(false);
                                        setDuplicateInfo(null);
                                        setPickedFile(null); // Reset selection
                                    }}
                                    style={{ borderRadius: 16, borderColor: theme.colors.outline + '40' }}
                                    contentStyle={{ height: 54 }}
                                    textColor={isDark ? '#fff' : '#4B5563'}
                                >
                                    Cancel Upload
                                </Button>
                            </View>
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
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
        marginBottom: 8,
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
    charCount: {
        fontSize: 11,
        textAlign: 'right',
        marginTop: 4,
        marginRight: 4,
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
    duplicateCard: {
        elevation: 2,
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
        marginTop: 20,
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
    closeButton: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        flex: 1,
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
        paddingHorizontal: 4,
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
        marginTop: 60,
        padding: 20,
    },
});

export default UploadScreen;