import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
} from 'react-native-reanimated';
import CategoryGraph from './CategoryGraph';
import MonthlyTrendGraph from './MonthlyGraph';
import { LightTheme, DarkTheme } from '../../scripts/theme';

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
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.inputBg, shadowColor: '#000' },
      ]}
    >
      <Text style={[styles.heading, { color: theme.text }]}>
        Spending Insights
      </Text>

      <View
        style={[
          styles.tabRow,
          { backgroundColor: scheme === 'dark' ? '#1E293B' : '#EEF2FF' },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'category' && {
              backgroundColor: theme.primary,
            },
          ]}
          onPress={() => setSelectedTab('category')}
          activeOpacity={0.9}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === 'category' ? '#fff' : theme.subText,
              },
            ]}
          >
            Category
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'monthly' && {
              backgroundColor: theme.primary,
            },
          ]}
          onPress={() => setSelectedTab('monthly')}
          activeOpacity={0.9}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === 'monthly' ? '#fff' : theme.subText,
              },
            ]}
          >
            Monthly Trend
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.divider,
          { backgroundColor: scheme === 'dark' ? '#334155' : '#E5EDFF' },
        ]}
      />

      {selectedTab === 'category' ? (
        <Animated.View
          entering={FadeInLeft.duration(280)}
          exiting={FadeOutRight.duration(200)}
          style={{ width: '100%' }}
        >
          <CategoryGraph expenses={expenses} />
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeInRight.duration(280)}
          exiting={FadeOutLeft.duration(200)}
          style={{ width: '100%' }}
        >
          <View style={styles.centerGraph}>
            <MonthlyTrendGraph expenses={expenses} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '92%',
    alignSelf: 'center',
    borderRadius: 20,
    marginVertical: 14,
    paddingVertical: 14,
    paddingBottom: 18,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  heading: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    paddingHorizontal: 18,
  },

  tabRow: {
    flexDirection: 'row',
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 4,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  divider: {
    height: 1,
    width: '90%',
    alignSelf: 'center',
    marginVertical: 14,
  },
  centerGraph: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
