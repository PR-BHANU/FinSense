import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { LightTheme, DarkTheme } from '../scripts/theme';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category?: string;
  date: Date;
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function ExpenseSummaryCard({ navigation }: any) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMonthExpenses, setLastMonthExpenses] = useState<Expense[]>([]);
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;

  const now = new Date();
  const currentMonth = months[now.getMonth()];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection('Users')
      .doc(user.uid)
      .collection('Expenses')
      .where('date', '>=', startOfMonth)
      .where('date', '<=', endOfMonth)
      .orderBy('date', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title || 'Untitled',
            amount: d.amount || 0,
            category: d.category || 'Miscellaneous',
            date: d.date?.toDate ? d.date.toDate() : new Date(),
          };
        });
        setExpenses(data);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection('Users')
      .doc(user.uid)
      .collection('Expenses')
      .where('date', '>=', startOfLastMonth)
      .where('date', '<=', endOfLastMonth)
      .orderBy('date', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title || 'Untitled',
            amount: d.amount || 0,
            category: d.category || 'Miscellaneous',
            date: d.date?.toDate ? d.date.toDate() : new Date(),
          };
        });
        setLastMonthExpenses(data);
      });

    return () => unsubscribe();
  }, []);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totals: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = e.category || 'Miscellaneous';
    totals[cat] = (totals[cat] || 0) + e.amount;
  });
  const entries = Object.entries(totals);
  const topCategory = entries.length
    ? entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max))
    : ['Miscellaneous', 0];
  const topCategoryPercentage =
    total > 0 ? ((topCategory[1] / total) * 100).toFixed(1) : '0';

  let lastTotal = 0;
  lastMonthExpenses.forEach(e => (lastTotal += e.amount));

  if (loading) {
    return (
      <View style={[styles.loadingCard, { backgroundColor: theme.inputBg }]}>
        <ActivityIndicator color={theme.primary} />
        <Text style={{ color: theme.subText, marginTop: 8 }}>
          Loading summary…
        </Text>
      </View>
    );
  }

  if (!expenses.length) {
    return (
      <TouchableOpacity onPress={() => navigation.navigate('Add-Expense')}>
        <View style={[styles.loadingCard, { backgroundColor: theme.inputBg }]}>
          <Text
            style={{ color: theme.subText, fontSize: 15, textAlign: 'center' }}
          >
            No expenses yet this month 💸
            {'\n'}Tap to add your first one
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Show-Expense')}>
      <LinearGradient
        colors={
          scheme === 'dark' ? ['#1E3A8A', '#1E40AF'] : ['#4A6CF7', '#365DF0']
        }
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.monthText}>{currentMonth}'s Spending</Text>
          <ArrowRight size={18} color="#fff" />
        </View>

        <Text style={styles.totalAmount}>₹{total.toLocaleString()}</Text>

        <Text style={styles.insightText}>
          Mostly spent on{' '}
          <Text style={styles.categoryHighlight}>{topCategory[0]}</Text> (
          <Text style={styles.amountHighlight}>
            ₹{topCategory[1].toLocaleString()}
          </Text>
          ) — <Text style={styles.percentage}>{topCategoryPercentage}%</Text>
        </Text>

        <Text style={styles.insightSecondary}>
          {generateInsight(total, lastTotal, topCategory[0])}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 14,
  },
  loadingCard: {
    borderRadius: 16,
    padding: 20,
    margin: 16,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthText: {
    color: '#E0E7FF',
    fontSize: 15,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#E5EDFF',
    marginTop: 12,
  },
  categoryHighlight: {
    color: '#FEF08A',
    fontWeight: '700',
  },
  amountHighlight: {
    color: '#FDE047',
    fontWeight: '600',
  },
  percentage: {
    color: '#BFDBFE',
    fontWeight: '600',
  },
  insightSecondary: {
    marginTop: 8,
    fontSize: 14,
    color: '#E5EDFF',
    opacity: 0.9,
    fontStyle: 'italic',
  },
});

const generateInsight = (current, last, category) => {
  if (last === 0) return 'Fresh month, fresh habits 🌱';

  const diff = current - last;
  const pct = ((Math.abs(diff) / last) * 100).toFixed(1);

  if (diff > 0) return `You spent ${pct}% more than last month on ${category}.`;
  if (diff < 0) return `Great job! Spending reduced by ${pct}% this month.`;
  return 'Spending stayed exactly the same as last month.';
};
