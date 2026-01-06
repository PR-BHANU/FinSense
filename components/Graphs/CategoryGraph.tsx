import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import MonthPicker from 'react-native-month-year-picker';
import { Calendar } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LightTheme, DarkTheme } from '../../scripts/theme';

const { width } = Dimensions.get('window');

interface Expense {
  id: string;
  title: string;
  amount: number;
  category?: string;
  date: Date;
}

export default function CategoryGraph({ expenses }: { expenses: Expense[] }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;

  const gradientColors =
    scheme === 'dark' ? ['#020617', '#020617'] : ['#ffffff', '#f8fafc'];

  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const now = new Date();

  const onMonthChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) setSelectedDate(date);
  };

  const categoryData = useMemo(() => {
    const filtered = expenses.filter(e => {
      const d = new Date(e.date);
      return (
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      );
    });

    const totals: Record<string, number> = {};
    filtered.forEach(e => {
      const cat = e.category || 'Miscellaneous';
      totals[cat] = (totals[cat] || 0) + e.amount;
    });

    const totalAmount = Object.values(totals).reduce((a, b) => a + b, 0);
    if (!totalAmount) return [];

    const colors =
      scheme === 'dark'
        ? [
            '#60a5fa',
            '#fb7185',
            '#fbbf24',
            '#34d399',
            '#a78bfa',
            '#f472b6',
            '#22d3ee',
          ]
        : [
            '#2563eb',
            '#f43f5e',
            '#f59e0b',
            '#10b981',
            '#8b5cf6',
            '#ec4899',
            '#14b8a6',
          ];

    return Object.entries(totals).map(([category, value], i) => {
      const pct = (value / totalAmount) * 100;
      return {
        value,
        color: colors[i % colors.length],
        text: pct >= 6 ? `${pct.toFixed(0)}%` : '',
        category,
        percentage: pct.toFixed(1),
      };
    });
  }, [expenses, selectedDate, scheme]);

  if (!categoryData.length) {
    return (
      <View style={styles.emptyWrap}>
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={[styles.datePill, { backgroundColor: theme.inputBg }]}
        >
          <Calendar size={16} color={theme.primary} />
          <Text style={[styles.monthText, { color: theme.primary }]}>
            {selectedDate.toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No expenses yet
        </Text>
        <Text style={[styles.emptySub, { color: theme.subText }]}>
          Start tracking to see insights here
        </Text>

        {showPicker && (
          <MonthPicker
            value={selectedDate}
            onChange={onMonthChange}
            maximumDate={now}
          />
        )}
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <LinearGradient
        colors={gradientColors}
        style={[styles.card, { backgroundColor: theme.card }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Spending by Category
          </Text>

          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={[styles.datePill, { backgroundColor: theme.inputBg }]}
          >
            <Calendar size={16} color={theme.primary} />
            <Text style={[styles.monthText, { color: theme.primary }]}>
              {selectedDate.toLocaleString('default', {
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartCenter}>
          <PieChart
            data={categoryData.map(({ value, color, text }) => ({
              value,
              color,
              text,
            }))}
            donut
            innerRadius={72}
            radius={118}
            showText
            textColor="#fff"
            textSize={12}
            backgroundColor={theme.card}
            isAnimated
            animationDuration={700}
            centerLabelComponent={() => (
              <View>
                <Text style={[styles.total, { color: theme.text }]}>
                  ₹
                  {categoryData
                    .reduce((s, i) => s + i.value, 0)
                    .toLocaleString()}
                </Text>
                <Text style={[styles.totalSub, { color: theme.subText }]}>
                  Total spent
                </Text>
              </View>
            )}
          />
        </View>

        <View style={[styles.legendBox, { borderTopColor: theme.border }]}>
          {categoryData.map((item, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: theme.text }]}>
                {item.category}
              </Text>
              <Text style={[styles.legendPct, { color: theme.subText }]}>
                {item.percentage}%
              </Text>
            </View>
          ))}
        </View>

        {showPicker && (
          <MonthPicker
            value={selectedDate}
            onChange={onMonthChange}
            maximumDate={now}
          />
        )}
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 325,
    borderRadius: 24,
    padding: 22,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
  },

  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },

  monthText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },

  chartCenter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  total: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },

  totalSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },

  legendBox: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },

  legendText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },

  legendPct: {
    fontSize: 13,
    fontWeight: '500',
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },

  emptySub: {
    fontSize: 14,
    marginTop: 6,
  },
});
