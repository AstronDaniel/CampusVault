import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { authService } from '../services/authService';

const ChangePasswordScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const isDark = theme.dark;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!currentPassword || !newPassword) return Alert.alert('Error', 'Please fill all fields');
    if (newPassword !== confirmPassword) return Alert.alert('Error', "Passwords don't match");
    try {
      setLoading(true);
      await authService.changePassword?.(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      navigation.goBack();
    } catch (e: any) {
      console.error('Change password error', e);
      Alert.alert('Error', e?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8FAFC' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#111' }]}>Change Password</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Current password"
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF'}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          style={[styles.input, { backgroundColor: isDark ? '#111827' : '#fff', color: isDark ? '#fff' : '#000' }]}
        />
        <TextInput
          placeholder="New password"
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF'}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          style={[styles.input, { backgroundColor: isDark ? '#111827' : '#fff', color: isDark ? '#fff' : '#000' }]}
        />
        <TextInput
          placeholder="Confirm new password"
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF'}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={[styles.input, { backgroundColor: isDark ? '#111827' : '#fff', color: isDark ? '#fff' : '#000' }]}
        />

        <Button mode="contained" onPress={handleChange} loading={loading} style={{ marginTop: 12 }}>
          Change Password
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  form: { padding: 20 },
  input: { height: 50, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
});

export default ChangePasswordScreen;
