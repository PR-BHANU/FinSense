import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  SafeAreaViewBase,
  Platform,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LightTheme, DarkTheme } from '../scripts/theme';

export default function GetStarted({ navigation, route }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;
  return (
    <SafeAreaProvider
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.appName, { color: theme.text }]}>FinSense</Text>

        <View style={styles.iconPlaceholder}>
          <Image
            source={require('../Assets/Icons/AppIcons/playstore.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          Take control{'\n'}of your money.
        </Text>
        <Text
          style={[
            styles.description,
            { color: scheme === 'dark' ? '#B0B0B0' : '#555' },
          ]}
        >
          Track expenses, set budgets{'\n'}
          and understand your spending{'\n'}
          at your glance
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.getStartedBTN, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2F2F2F',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '600',
    marginBottom: 62,
    letterSpacing: 1,
  },
  iconPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 32,
  },
  icon: {
    width: 114,
    height: 124,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    paddingTop: 20,
    color: '#B0B0B0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: 24,
    paddingBottom: 50,
  },
  getStartedBTN: {
    paddingBottom: 20,
    backgroundColor: '#4A6CF7',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
