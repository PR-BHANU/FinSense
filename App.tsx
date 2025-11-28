import 'react-native-reanimated';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SignInScreen from './screens/SignInScreen';
import { getApp, initializeApp } from '@react-native-firebase/app';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ...now throughout your app, use firebase APIs normally, for example:
const firebaseApp = getApp();
import AppNavigator from './navigations/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white', // use white to clearly see the screen
  },
  text: {
    color: 'black', // visible text
    fontSize: 24,
  },
});
