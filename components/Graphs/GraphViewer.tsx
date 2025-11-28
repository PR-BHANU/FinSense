import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
} from 'react-native-reanimated';
import CategoryGraph from './CategoryGraph';
import MonthlyTrendGraph from './MonthlyGraph';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category?: string;
  date: Date;
}

interface GraphViewerProps {
  expenses: Expense[];
}

export default function GraphViewer({ expenses }: GraphViewerProps) {
  const [selectedTab, setSelectedTab] = useState<'category' | 'monthly'>(
    'category',
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Spending Insights</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'category' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('category')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'category' && styles.activeTabText,
            ]}
          >
            Category
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'monthly' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('monthly')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'monthly' && styles.activeTabText,
            ]}
          >
            Monthly Trend
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {selectedTab === 'category' ? (
        <Animated.View
          entering={FadeInLeft.duration(300)}
          exiting={FadeOutRight.duration(300)}
          style={{ width: '100%' }}
        >
          <CategoryGraph expenses={expenses} />
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeInRight.duration(300)}
          exiting={FadeOutLeft.duration(300)}
          style={{ width: '100%' }}
        >
          <MonthlyTrendGraph expenses={expenses} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#ffffffff', // 💧 Soft blue background to match other cards
    borderRadius: 18,
    marginVertical: 12,
    paddingVertical: 12,
    paddingBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#e0f4ff', // slightly lighter inner blue
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  activeTab: {
    backgroundColor: '#2563eb', // vivid blue for selection
  },
  activeTabText: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#bae6fd', // soft blue divider
    width: '90%',
    marginVertical: 8,
  },
});
