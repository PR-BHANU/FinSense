import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import Header from '../components/Header';
import firestore from '@react-native-firebase/firestore';
import Toast from '../components/Toast';
import ExpenseSummaryCard from '../components/ExpenseSummary';
import Graphs from '../components/Graphs/CategoryGraph';
import GraphViewer from '../components/Graphs/GraphViewer';
import RecentExpensesHorizontal from '../components/ShowRecentExpense';
import BudgetProgressBar from '../components/BudgetProgressBar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function DashboardScreen({ navigation, route }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);

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
    if (!currentUser) navigation.navigate('Get-Started');
    setLoading(true);
    const unsubscribe = firestore()
      .collection('Users')
      .doc(currentUser.uid)
      .collection('Expenses')
      .orderBy('date', 'desc')
      .onSnapshot(snapshot => {
        if (snapshot.empty) {
          setExpenses([]);
          setLoading(false);
          return;
        }
        const list = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || data.description || 'Untitled',
            amount: data.amount || 0,
            category: data.category || 'Miscellaneous',
            date: data.date?.toDate
              ? data.date.toDate()
              : new Date(data.date || Date.now()),
          };
        });
        setExpenses(list);
        setLoading(false);
      });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading user...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header profilePic={user.photoURL} navigation={navigation} />
        <View style={{ height: 8 }} />

        <View style={styles.sectionWrapper}>
          <ExpenseSummaryCard navigation={navigation} />
        </View>

        <View style={styles.sectionWrapper}>
          <RecentExpensesHorizontal />
        </View>

        <View style={styles.progressBar}>
          <BudgetProgressBar expenses={expenses} navigation={navigation} />
        </View>
        <View style={styles.Graph}>
          <GraphViewer expenses={expenses} />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Toast message={toastMessage} visible={toastVisible} onHide={hideToast} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 1,
    paddingBottom: 60,
  },

  sectionWrapper: {
    width: '100%',
    marginBottom: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  Graph: {
    width: '100%',
    paddingTop: 5,
    marginBottom: 20,
  },
  progressBar: {},
});
