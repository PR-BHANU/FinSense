import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SwipeListView } from 'react-native-swipe-list-view';
import { SelectList } from 'react-native-dropdown-select-list';
import EditExpense from './Edit-Expense';
import Toast from '../components/Toast';
import plusImage from '../Assets/Icons/plus.png';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CirclePlus } from 'lucide-react-native';
firestore().settings({ persistence: true });

const sortOptions = [
  'Newest First',
  'Oldest First',
  'Highest Amount',
  'Lowest Amount',
];
const defaultCategories = [
  'All',
  'Food & Drinks',
  'Transport',
  'Bills & Utilities',
  'Shopping',
  'Health',
  'Entertainment',
  'Education',
  'Subscriptions',
  'Miscellaneous',
];

interface Expense {
  id: string;
  title: string;
  amount: number;
  category?: string;
  date: Date;
}

interface Filters {
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}

async function deleteExpense(expense: Expense) {
  const currentUser = auth().currentUser;
  if (!currentUser) return;

  await firestore()
    .collection('Users')
    .doc(currentUser.uid)
    .collection('Expenses')
    .doc(expense.id)
    .delete();

  console.log(`${expense.title}, ${expense.amount} deleted`);
}

export default function Expenses({}) {
  const navigation = useNavigation();
  const route = useRoute();
  const [user, setUser] = useState<any>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Newest First');

  // Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const hideToast = useCallback(() => setToastVisible(false), []);
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // Fetch expenses live
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const unsubscribe = firestore()
      .collection('Users')
      .doc(currentUser.uid)
      .collection('Expenses')
      .orderBy('date', 'desc')
      .onSnapshot(snapshot => {
        if (snapshot.empty) {
          setExpenses([]);
          setLoading(false);
          return;
        }

        const list: Expense[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || data.description || 'Untitled',
            amount: data.amount || 0,
            category: data.category || 'Miscellaneous',
            date: data.date?.toDate
              ? data.date.toDate()
              : new Date(data.date || Date.now()),
          };
        });

        setExpenses(list);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) setUser(currentUser);
    if (!currentUser) return;

    const unSubscribe = firestore()
      .collection('Users')
      .doc(currentUser.uid)
      .collection('Custom-Categories')
      .onSnapshot(snapshot => {
        const Categories = snapshot.docs.map(doc => doc.data().name);
        setCustomCategories(Categories);
      });

    return () => unSubscribe();
  }, []);
  useEffect(() => {
    if (route.params?.toastMessage) {
      setToastMessage(route.params.toastMessage);
      setToastVisible(true);
    }
  }, [route.params?.toastMessage]);

  const filteredAndSortedExpenses = expenses
    .filter(expense => {
      return selectedCategory === 'All'
        ? true
        : expense.category === selectedCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'Newest First':
          return b.date.getTime() - a.date.getTime();
        case 'Oldest First':
          return a.date.getTime() - b.date.getTime();
        case 'Highest Amount':
          return b.amount - a.amount;
        case 'Lowest Amount':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });
  const handleDelete = async (item: Expense) => {
    await deleteExpense(item);
    showToast('Expense Deleted Successfully!');
  };

  const handleEditSuccess = () => {
    setEditingExpense(null);
    showToast('Expense Edited Successfully!');
  };

  // UI Renders
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  if (expenses.length === 0)
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No expenses yet 🚀</Text>
      </View>
    );

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.card}>
      <Text style={styles.amount}>₹{item.amount}</Text>
      <Text style={styles.title}>{item.title}</Text>
      {item.category && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      )}
      <Text style={styles.date}>{item.date.toDateString()}</Text>
    </View>
  );

  const renderHiddenItem = ({ item }: { item: Expense }) => (
    <View style={styles.hiddenRow}>
      <View style={[styles.roundButtonContainer, { alignItems: 'flex-start' }]}>
        <TouchableOpacity
          style={[styles.roundButton, styles.editButton]}
          onPress={() => setEditingExpense(item)}
        >
          <Text style={styles.hiddenText}>✏️</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.roundButtonContainer, { alignItems: 'flex-end' }]}>
        <TouchableOpacity
          style={[styles.roundButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.hiddenText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  const combinedCategories = [
    'All',
    ...new Set([...defaultCategories.slice(1), ...customCategories]),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f5f7', padding: 16 }}>
      <View style={styles.container}>
        <Text style={styles.expensesText}>Expenses</Text>

        <View style={styles.filtersContainer}>
          <View style={{ flex: 1, zIndex: 2 }}>
            <Text style={styles.filterLabel}>Filter:</Text>
            <SelectList
              data={combinedCategories}
              setSelected={setSelectedCategory}
              defaultOption={{ key: 'All', value: 'All' }}
              search={false}
              save="value"
              boxStyles={styles.dropdownBox}
              dropdownStyles={styles.dropdownList}
            />
          </View>
          <View style={{ flex: 1, zIndex: 2 }}>
            <Text style={styles.filterLabel}>Sort:</Text>
            <SelectList
              data={sortOptions}
              setSelected={setSortBy}
              defaultOption={{ key: 'Newest First', value: 'Newest First' }}
              search={false}
              save="value"
              boxStyles={styles.dropdownBox}
              dropdownStyles={styles.dropdownList}
            />
          </View>
        </View>

        <SwipeListView
          data={filteredAndSortedExpenses}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-80}
          leftOpenValue={80}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 5 }} // ✅ add space for last card
          showsVerticalScrollIndicator={false}
        />

        {/* ✏️ Edit Modal */}
        <Modal
          visible={!!editingExpense}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditingExpense(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { padding: 0 }]}>
              <ScrollView
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {editingExpense && (
                  <EditExpense
                    expense={editingExpense}
                    onEditSuccess={handleEditSuccess}
                  />
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setEditingExpense(null)}
                >
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>

      <TouchableOpacity
        style={styles.plusCircle}
        onPress={() => navigation.navigate('Add-Expense')}
      >
        <CirclePlus size={32} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
      <Toast message={toastMessage} visible={toastVisible} onHide={hideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#de0e0e',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#de0e0e',
    marginBottom: 6,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 4 },
  date: { fontSize: 13, color: '#777' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#777' },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'visible',
  },
  expensesText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 18,
    textAlign: 'left',
  },
  hiddenRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
  roundButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  roundButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: { backgroundColor: '#60a5fa' },
  deleteButton: { backgroundColor: '#f87171' },
  hiddenText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
    marginTop: 2,
  },
  categoryText: { color: '#0284c7', fontWeight: '600', fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '85%',
    padding: 20,
    borderRadius: 16,
    elevation: 10,
    maxHeight: '95%',
  },
  closeButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  closeText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
    zIndex: 10,
    elevation: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  dropdownBox: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  dropdownList: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
  },
  plusCircle: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#515851ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  plusIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
});
