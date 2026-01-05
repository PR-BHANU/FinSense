import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { generateTestExpenses } from '../../scripts/RandomData';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category?: string;
  date: Date;
}

interface Props {
  expenses: Expense[];
}

export default function MonthlySpendingGraph({ expenses }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const seedData = async () => {
      // if (__DEV__) {
      //   setIsLoading(true);
      //   await generateTestExpenses();
      //   setIsLoading(false);
      // }
    };
    seedData();
  }, []);

  const chartData = useMemo(() => {
    if (!expenses || !expenses.length) return [];

    const monthlyTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      const d = new Date(exp.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + exp.amount;
    });

    const sortedData = Object.entries(monthlyTotals)
      .map(([key, total]) => {
        const [year, monthNum] = key.split('-').map(Number);
        const monthName = new Date(year, monthNum - 1).toLocaleString(
          'default',
          {
            month: 'short',
          },
        );

        return {
          label: monthName,
          value: total,
          year,
          monthIndex: monthNum - 1,
        };
      })
      .sort((a, b) => {
        if (a.year === b.year) return a.monthIndex - b.monthIndex;
        return a.year - b.year;
      });

    return sortedData
      .map(item => ({
        value: item.value,
        label: item.label,
        dataPointText: `₹${item.value.toLocaleString()}`,
        dataPointColor: '#2563eb',
      }))
      .slice(-6);
  }, [expenses]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Seeding test data...</Text>
      </View>
    );
  }

  if (!chartData.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Not enough data to show trend 💤</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Monthly Spending Trend</Text>
      <LineChart
        data={chartData}
        curved
        thickness={3}
        color="#1472bfff"
        showDataPoints
        dataPointsHeight={6}
        dataPointsWidth={6}
        hideRules
        hideYAxisText
        areaChart
        startFillColor="#1472bfff"
        endFillColor="#93c5fd"
        startOpacity={0.4}
        endOpacity={0.1}
        yAxisColor="transparent"
        xAxisColor="transparent"
        xAxisLabelTextStyle={{ color: '#475569', fontSize: 12 }}
        noOfSections={4}
        animateOnDataChange
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', // 💠 Light blue background
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 14,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#334155',
    fontSize: 14,
  },
});
