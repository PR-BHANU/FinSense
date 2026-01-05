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
import GetStarted from '../screens/GetStarted';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Get-Started"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Get-Started" component={GetStarted} />
      <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Login" component={LogInScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Add-Expense" component={AddExpense} />
      <Stack.Screen name="Show-Expense" component={ShowExpense} />
    </Stack.Navigator>
  );
}
