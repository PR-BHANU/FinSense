import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  StatusBar,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import Header from '../components/Header';
import firestore from '@react-native-firebase/firestore';
import Toast from '../components/Toast';
import ExpenseSummaryCard from '../components/ExpenseSummary';
import GraphViewer from '../components/Graphs/GraphViewer';
import RecentExpensesHorizontal from '../components/ShowRecentExpense';
import BudgetProgressBar from '../components/BudgetProgressBar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, LightTheme } from '../scripts/theme';
import { OneSignal, LogLevel } from 'react-native-onesignal';

export default function DashboardScreen({ navigation, route }) {
  const [user, setUser] = useState<any>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;

  const hideToast = useCallback(() => setToastVisible(false), []);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) setUser(currentUser);
  }, []);

  useEffect(() => {
    if (route.params?.toastMessage) {
      setToastMessage(route.params.toastMessage);
      setToastVisible(true);
    }
  }, [route.params?.toastMessage]);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const unsubscribe = firestore()
      .collection('Users')
      .doc(currentUser.uid)
      .collection('Expenses')
      .orderBy('date', 'desc')
      .onSnapshot(snapshot => {
        const list = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || data.description || 'Untitled',
            amount: data.amount || 0,
            category: data.category || 'Miscellaneous',
            date: data.date?.toDate ? data.date.toDate() : new Date(),
          };
        });
        setExpenses(list);
      });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    OneSignal.User.pushSubscription.getTokenAsync().then(token => {
      if (!token) return;

      firestore()
        .collection('users')
        .doc(user.uid)
        .set({ fcmToken: token }, { merge: true });
    });
  }, []);

  if (!user) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.subText }}>Loading user...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
      <Header profilePic={user.photoURL} navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ExpenseSummaryCard navigation={navigation} />

        <RecentExpensesHorizontal />
        <BudgetProgressBar expenses={expenses} navigation={navigation} />
        <GraphViewer expenses={expenses} />
      </ScrollView>

      <Toast message={toastMessage} visible={toastVisible} onHide={hideToast} />
    </View>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 78 + (Platform.OS === 'android' ? 24 : 0),
    paddingBottom: 90,
  },

  progressBarContainer: {
    marginBottom: 24,
    paddingHorizontal: 10,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
