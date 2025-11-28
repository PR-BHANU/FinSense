import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignInScreen from '../screens/SignInScreen';
import LogInScreen from '../screens/LogInScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AuthLoadingScreen from '../screens/AuthLoadingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddExpense from '../screens/Add-ExpenseScreen';
import ShowExpense from '../screens/Show-Expenses';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="AuthLoading"
        screenOptions={{
          headerTitleAlign: 'center',
        }}
      >
        {/* This screen runs first to check if user is logged in */}
        <Stack.Screen
          name="AuthLoading"
          component={AuthLoadingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ title: 'Sign In', headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LogInScreen}
          options={{ title: 'Login', headerShown: false }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Dashboard', headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings', headerShown: false }}
        />
        <Stack.Screen
          name="Add-Expense"
          component={AddExpense}
          options={{ title: 'Add Expense', headerShown: true }}
        />
        <Stack.Screen
          name="Show-Expense"
          component={ShowExpense}
          options={{ title: 'Expenses', headerShown: true }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
