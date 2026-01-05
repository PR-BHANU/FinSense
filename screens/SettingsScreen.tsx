import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';

interface SettingsScreenProps {
  navigation: any;
}

async function logout(navigation: any) {
  await auth().signOut();
  navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });
}
export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Theme Toggle */}
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Dark Mode</Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: '#ccc', true: '#007bff' }}
          thumbColor={
            Platform.OS === 'android'
              ? isDarkMode
                ? '#007bff'
                : '#fff'
              : undefined
          }
        />
        <View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => logout(navigation)}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F7F9FC',
  },

  backButton: {
    marginBottom: 24,
  },

  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A6CF7',
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },

  settingText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },

  logoutButton: {
    marginTop: 40,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
  },

  logoutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
