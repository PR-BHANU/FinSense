import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowRight } from 'lucide-react-native';

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
        const data: Expense[] = snapshot.docs.map(doc => {
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
        const data: Expense[] = snapshot.docs.map(doc => {
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
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  // ✅ Define computed variables BEFORE conditional UI
  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totals: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = e.category || 'Miscellaneous';
    totals[cat] = (totals[cat] || 0) + e.amount;
  });
  const totalAmount = Object.values(totals).reduce((a, b) => a + b, 0);
  const entries = Object.entries(totals);
  const topCategory = entries.length
    ? entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max))
    : ['Miscellaneous', 0];
  const topCategoryPercentage =
    totalAmount > 0 ? ((topCategory[1] / totalAmount) * 100).toFixed(1) : '0';

  //total amount for last month
  let totalAmountLastMonth = 0;
  lastMonthExpenses.forEach(e => {
    totalAmountLastMonth += e.amount || 0;
  });
  useEffect(() => {
    const user = auth().currentUser;
    if (!user || !topCategory || !Array.isArray(topCategory)) return;

    firestore()
      .collection('Users')
      .doc(user.uid)
      .update({
        preferredCategory: topCategory[0],
      })
      .catch(err => console.error('Error updating category:', err));
  }, [topCategoryPercentage]);

  // ✅ Now we can safely return based on state
  if (loading)
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator color="#2563eb" />
        <Text style={{ color: '#64748b', marginTop: 8 }}>
          Loading summary...
        </Text>
      </View>
    );

  if (!expenses.length) {
    return (
      <TouchableOpacity onPress={() => navigation.navigate('Add-Expense')}>
        <View style={styles.loadingCard}>
          <Text style={{ color: '#64748b', fontSize: 16 }}>
            No expenses yet this month 💸. Click on me to add Expenses.
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Show-Expense')}>
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.monthText}>{currentMonth}'s Spending</Text>
          <ArrowRight size={18} color="#fff" />
        </View>

        <Text style={styles.totalAmount}>₹{total.toLocaleString()}</Text>

        <Text style={styles.insightText}>
          You spent most on{' '}
          <Text style={styles.categoryHighlight}>{topCategory[0]}</Text> (
          <Text style={styles.amountHighlight}>
            ₹{topCategory[1].toLocaleString()}
          </Text>
          ) — <Text style={styles.percentage}>{topCategoryPercentage}%</Text> of
          your spending this month.
        </Text>
        <Text style={styles.InsightsSpending}>
          {generateInsight(totalAmount, totalAmountLastMonth, topCategory)}{' '}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthText: {
    color: '#e0e7ff',
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#e2e8f0',
    marginTop: 12,
  },
  categoryHighlight: {
    color: '#fde68a',
    fontWeight: '700',
  },
  amountHighlight: {
    color: '#facc15',
    fontWeight: '600',
  },
  percentage: {
    color: '#93c5fd',
    fontWeight: '600',
  },
  InsightsSpending: {
    paddingTop: 5,
    color: '#f1f5f9',
    fontSize: 15,
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.9,
  },
});

const generateInsight = (current, last, topCategory) => {
  if (last === 0) return 'No past data — this month’s your fresh start! 🌱';

  const diff = current - last;
  const pct = ((Math.abs(diff) / last) * 100).toFixed(1);

  if (diff > 0) {
    const messages = [
      `🤑 Spent ${pct}% more than last month — ${topCategory} strikes again!`,
      `🍕 ${topCategory} took the top spot again — ${pct}% higher than before.`,
      `💸 Easy there! ${pct}% more than last month. Inflation or indulgence?`,
      `⚡ You’re on a roll... a *spending* roll. +${pct}% vs last month.`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  } else if (diff < 0) {
    const messages = [
      `🧘 Budget monk mode activated — you saved ${pct}% this month.`,
      `💪 You spent less this time. ${pct}% down. Hanuman discipline unlocked.`,
      `🌱 Growth mindset in action: ${pct}% less than last month.`,
      `🔥 You’re evolving — ${pct}% less spending this month. Keep it up!`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  } else {
    return '📊 Steady as a rock — same spending as last month.';
  }
};
