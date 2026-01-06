import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { StyleSheet, StatusBar, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigations/AppNavigator';
import { LightTheme, DarkTheme } from './scripts/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import Config from 'react-native-config';
import auth from '@react-native-firebase/auth';
import {
  LightNavigationTheme,
  DarkNavigationTheme,
} from './scripts/navigationTheme';

export default function App() {
  const scheme = useColorScheme();
  const navTheme =
    scheme === 'dark' ? DarkNavigationTheme : LightNavigationTheme;

  useEffect(() => {
    OneSignal.initialize(Config.ONESIGNAL_APP_ID);

    // Always request permission explicitly
    OneSignal.Notifications.requestPermission(true);

    // ✅ v5 async permission check
    OneSignal.Notifications.getPermissionAsync().then(permission => {
      console.log('🔔 Permission async:', permission);
    });

    // ✅ v5 async subscription check
    OneSignal.User.pushSubscription.getOptedInAsync().then(optedIn => {
      console.log('🔔 Push opted in:', optedIn);
    });

    OneSignal.User.pushSubscription.getIdAsync().then(id => {
      console.log('🔔 Push subscription ID:', id);
    });

    OneSignal.User.pushSubscription.getTokenAsync().then(token => {
      console.log('🔔 Push token:', token);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) {
        OneSignal.login(user.uid);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        />
        <NavigationContainer theme={navTheme}>
          <AppNavigator />
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
