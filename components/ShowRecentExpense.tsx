import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  useColorScheme,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { LightTheme, DarkTheme } from '../scripts/theme';

export default function RecentExpensesHorizontal() {
  const navigation = useNavigation();
  const [recent, setRecent] = useState<any[]>([]);
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsub = firestore()
      .collection('Users')
      .doc(user.uid)
      .collection('Expenses')
      .orderBy('date', 'desc')
      .limit(5)
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title || d.description || 'Untitled',
            amount: d.amount || 0,
            category: d.category || 'Misc',
            date: d.date?.toDate ? d.date.toDate() : new Date(),
          };
        });
        setRecent(data);
      });

    return () => unsub();
  }, []);

  if (!recent.length) return null;

  const outerPadding = 20;
  const cardWidth = 150;
  const cardSpacing = 14;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: theme.text }]}>
          Recent Expenses
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Show-Expense')}>
          <Text style={[styles.viewAll, { color: theme.primary }]}>
            View All →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 170, overflow: 'visible' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + cardSpacing}
          snapToAlignment="start"
          contentContainerStyle={{
            paddingLeft: outerPadding,
            paddingRight: outerPadding + 6,
            alignItems: 'center',
          }}
        >
          {recent.map((item, index) => {
            const isLast = index === recent.length - 1;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  {
                    marginRight: isLast ? outerPadding : cardSpacing,
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => navigation.navigate('Show-Expense')}
                activeOpacity={0.9}
              >
                <Text style={[styles.amount, { color: '#DC2626' }]}>
                  ₹{item.amount}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[styles.title, { color: theme.text }]}
                >
                  {item.title}
                </Text>

                <View
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        scheme === 'dark' ? '#1E3A8A' : '#E0F2FE',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: scheme === 'dark' ? '#BFDBFE' : '#0284C7',
                      },
                    ]}
                  >
                    {item.category}
                  </Text>
                </View>

                <Text style={[styles.date, { color: theme.subText }]}>
                  {item.date.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
    overflow: Platform.OS === 'android' ? 'visible' : 'visible',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  heading: {
    fontSize: 20,
    fontWeight: '700',
  },

  viewAll: {
    fontWeight: '600',
    fontSize: 14,
  },

  card: {
    width: 150,
    height: 150,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },

  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },

  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },

  date: {
    marginTop: 4,
    fontSize: 12,
  },
});
