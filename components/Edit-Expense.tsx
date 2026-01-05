import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SelectList } from 'react-native-dropdown-select-list';
import { useNavigation } from '@react-navigation/native';
import Toast from '../components/Toast'; // ✅ your Toast component file (Toast.tsx)

const defaultCategories = [
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

async function handleEdit(user, expense, amount, selected, description, date) {
  await firestore()
    .collection('Users')
    .doc(user.uid)
    .collection('Expenses')
    .doc(expense.id)
    .update({
      amount,
      category: selected,
      description,
      date,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}

export default function EditExpense({ expense, onEditSuccess }) {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>();
  const [amount, setAmount] = useState('');
  const [selected, setSelected] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // ✅ Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

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
    if (!expense) return;
    const currentUser = auth().currentUser;
    if (!currentUser) return;
    setUser(currentUser);

    const fetchExpense = async () => {
      try {
        const doc = await firestore()
          .collection('Users')
          .doc(currentUser.uid)
          .collection('Expenses')
          .doc(expense.id)
          .get();

        if (doc.exists) {
          const data = doc.data();
          setAmount(String(data.amount || ''));
          setSelected(data.category || '');
          setDescription(data.description || '');
          setDate(data.date?.toDate ? data.date.toDate() : new Date());
        } else {
          setAmount(String(expense.amount || ''));
          setSelected(expense.category || '');
          setDescription(expense.title || '');
          setDate(expense.date ? new Date(expense.date) : new Date());
        }
      } catch (err) {
        console.error('Error fetching expense:', err);
      }
    };
    fetchExpense();
  }, [expense]);

  const combinedCategories = [
    '+ Add New Category',
    ...customCategories,
    ...defaultCategories,
  ];

  const onChange = (_event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!amount.trim()) {
      Alert.alert('Invalid Input', 'Amount cannot be empty');
      return;
    }
    if (isNaN(Number(amount))) {
      Alert.alert('Invalid Input', 'Amount must be a number');
      return;
    }
    if (!selected) {
      Alert.alert('Invalid Input', 'Please select a category');
      return;
    }

    try {
      setLoading(true);
      await handleEdit(
        user,
        expense,
        Number(amount),
        selected,
        description,
        date,
      );

      // ✅ Show toast
      showToast('Expense Edited Successfully!');

      // ✅ Close modal via parent callback
      if (onEditSuccess) onEditSuccess();

      // Clear form
      setAmount('');
      setSelected('');
      setDescription('');
      setDate(new Date());
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while editing the expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }
    try {
      if (!user) return;
      await firestore()
        .collection('Users')
        .doc(user.uid)
        .collection('Custom-Categories')
        .add({ name: newCategoryName });

      setSelected(newCategoryName);
      setNewCategoryName('');
      setShowCategoryModal(false);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not add category.');
    }
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={Styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={Styles.container}>
          <Text style={Styles.header}>Edit Expense</Text>

          {/* Amount */}
          <Text style={Styles.label}>Amount (₹)</Text>
          <TextInput
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={Styles.input}
          />

          {/* Category */}
          <Text style={Styles.label}>Category</Text>
          <SelectList
            placeholder="Select category"
            setSelected={val => {
              if (val === '+ Add New Category') setShowCategoryModal(true);
              else setSelected(val);
            }}
            data={combinedCategories}
            save="value"
            search={false}
            defaultOption={
              selected ? { key: selected, value: selected } : undefined
            }
          />

          {/* Description */}
          <Text style={Styles.description}>Description</Text>
          <TextInput
            placeholder="Add a short note"
            value={description}
            onChangeText={setDescription}
            style={Styles.input}
            multiline
          />

          {/* Date */}
          <Text style={Styles.label}>Date</Text>
          <TouchableOpacity
            style={Styles.input}
            onPress={() => setShowPicker(true)}
          >
            <Text>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChange}
            />
          )}

          <TouchableOpacity
            style={[Styles.saveButton, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={Styles.saveText}>
              {loading ? 'Saving...' : 'Save Expense'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </>
  );
}

const Styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f9f9f9' },
  scroll: { flexGrow: 1 },
  container: { flex: 1, padding: 20 },
  header: {
    paddingTop: 20,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#555' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    paddingTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
});
