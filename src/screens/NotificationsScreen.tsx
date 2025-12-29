import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const NotificationsScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const isDark = theme.dark;
  const mock: any[] = [];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8FAFC' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#111' }]}>Notifications</Text>
      </View>

      <View style={styles.body}>
        <FlatList
          data={mock}
          keyExtractor={(item, i) => String(i)}
          renderItem={() => <Text style={{ color: theme.colors.outline }}>No notifications</Text>}
          ListEmptyComponent={<Text style={{ color: theme.colors.outline }}>You're all caught up</Text>}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  body: { padding: 20, flex: 1 },
});

export default NotificationsScreen;
