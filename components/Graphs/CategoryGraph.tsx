import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import MonthPicker from 'react-native-month-year-picker';
import { Calendar } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const screenWidth = Dimensions.get('window').width;

interface Expense {
  id: string;
  title: string;
  amount: number;
  category?: string;
  date: Date;
}

interface GraphsProps {
  expenses: Expense[];
}

export default function CategoryGraph({ expenses }: GraphsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const now = new Date();

  const handleMonthChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) setSelectedDate(date);
  };

  const categoryData = useMemo(() => {
    const filtered = (expenses ?? []).filter(e => {
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
    const colors = [
      '#3b82f6',
      '#f43f5e',
      '#f59e0b',
      '#10b981',
      '#8b5cf6',
      '#ec4899',
      '#14b8a6',
    ];

    return Object.keys(totals).map((cat, i) => {
      const percentage = (totals[cat] / totalAmount) * 100;
      const formattedPercentage =
        percentage < 0.1 && percentage > 0 ? '<0.1' : percentage.toFixed(1);

      return {
        value: totals[cat],
        color: colors[i % colors.length],
        text:
          parseFloat(formattedPercentage) >= 5 ? `${formattedPercentage}%` : '',
        category: cat,
        percentage: formattedPercentage,
      };
    });
  }, [expenses, selectedDate]);

  if (!categoryData.length)
    return (
      <View style={styles.emptyContainer}>
        <TouchableOpacity onPress={() => setShowPicker(true)}>
          <Text style={styles.monthLabel}>
            {selectedDate.toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </TouchableOpacity>
        <Text style={styles.emptyText}>No expenses recorded 💤</Text>
        {showPicker && (
          <MonthPicker
            onChange={handleMonthChange}
            value={selectedDate}
            maximumDate={now}
          />
        )}
      </View>
    );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Spending by Category</Text>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={styles.dateSelector}
          >
            <Calendar size={18} color="#2563eb" />
            <Text style={styles.monthLabel}>
              {selectedDate.toLocaleString('default', {
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartWrapper}>
          <PieChart
            data={categoryData.map(({ value, color, text }) => ({
              value,
              color,
              text,
            }))}
            donut
            innerRadius={75}
            radius={120}
            showText
            textColor="#fff"
            textSize={12}
            isAnimated
            showTextBackground={false}
            centerLabelComponent={() => (
              <View>
                <Text style={styles.centerLabel}>
                  ₹
                  {categoryData
                    .reduce((sum, item) => sum + item.value, 0)
                    .toLocaleString()}
                </Text>
                <Text style={styles.centerSub}>Total</Text>
              </View>
            )}
          />
        </View>

        <View style={styles.legendContainer}>
          {categoryData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[styles.colorDot, { backgroundColor: item.color }]}
              />
              <Text style={styles.legendText}>
                {item.category}{' '}
                <Text style={styles.legendAmount}>— {item.percentage}%</Text>
              </Text>
            </View>
          ))}
        </View>

        {showPicker && (
          <MonthPicker
            onChange={handleMonthChange}
            value={selectedDate}
            maximumDate={now}
          />
        )}
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
  },
  card: {
    borderRadius: 22,
    padding: 22,
    marginVertical: 16,
    width: Math.min(screenWidth * 0.94, 760),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
    marginLeft: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  legendContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#334155',
  },
  legendAmount: {
    color: '#64748b',
    fontWeight: '500',
  },
  centerLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  centerSub: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 10,
  },
});
