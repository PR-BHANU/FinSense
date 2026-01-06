import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
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

export default function MonthlySpendingGraph({
  expenses,
}: {
  expenses: Expense[];
}) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;

  const gradientColors =
    scheme === 'dark' ? [theme.card, theme.background] : ['#ffffff', '#f8fafc'];

  const chartData = useMemo(() => {
    if (!expenses?.length) return [];

    const monthlyTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      const d = new Date(exp.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + exp.amount;
    });

    return Object.entries(monthlyTotals)
      .map(([key, value]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          value,
          label: new Date(year, month).toLocaleString('default', {
            month: 'short',
          }),
          dataPointText: `₹${value.toLocaleString()}`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-6);
  }, [expenses]);

  if (!chartData.length) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No trend data yet
        </Text>
        <Text style={[styles.emptySub, { color: theme.subText }]}>
          Track expenses to see monthly insights
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradientColors}
      style={[styles.card, { backgroundColor: theme.card }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        Monthly Spending Trend
      </Text>

      <LineChart
        data={chartData}
        curved
        thickness={3}
        color={theme.primary}
        areaChart
        startFillColor={theme.primary}
        endFillColor={theme.primary}
        startOpacity={0.25}
        endOpacity={0.05}
        hideRules
        hideYAxisText
        xAxisColor="transparent"
        yAxisColor="transparent"
        showDataPoints
        dataPointsColor={theme.primary}
        dataPointsHeight={6}
        dataPointsWidth={6}
        xAxisLabelTextStyle={{
          color: theme.subText,
          fontSize: 12,
          fontWeight: '600',
        }}
        spacing={width / 7}
        initialSpacing={20}
        noOfSections={4}
        animateOnDataChange
        animationDuration={700}
      />
    </LinearGradient>
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

  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  emptySub: {
    fontSize: 14,
    marginTop: 6,
  },
});
