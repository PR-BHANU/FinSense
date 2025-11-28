import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

export default function RecentExpensesHorizontal() {
  const navigation = useNavigation();
  const [recent, setRecent] = useState<any[]>([]);

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
            title: d.title || 'Untitled',
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
    <View style={styles.wrapper /* ensures overflow visible */}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Recent Expenses</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Show-Expense')}>
          <Text style={styles.viewAll}>View All →</Text>
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
                  { marginRight: isLast ? outerPadding : cardSpacing },
                ]}
                onPress={() => navigation.navigate('Show-Expense')}
                activeOpacity={0.9}
              >
                <Text style={styles.amount}>₹{item.amount}</Text>
                <Text numberOfLines={1} style={styles.title}>
                  {item.title}
                </Text>
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <Text style={styles.date}>
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
    paddingHorizontal: 0,
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
    fontWeight: '800',
    color: '#0f172a',
  },
  viewAll: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 14,
  },

  card: {
    width: 150,
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },

  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },

  categoryText: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
  },

  date: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
});
