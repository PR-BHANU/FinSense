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
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import TextRecognition from 'react-native-text-recognition';

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

async function onExpenseClick(
  user: any,
  amount: number,
  category: string,
  description: string,
  date: Date,
) {
  await firestore()
    .collection('Users')
    .doc(user.uid)
    .collection('Expenses')
    .add({
      amount,
      category,
      description,
      date,
    });
}

export default function AddExpense({ navigation }: any) {
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
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');

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
    if (mode === 'scan') {
      (async () => {
        const result = await launchImageLibrary({
          mediaType: 'photo',
          selectionLimit: 1,
        });
        console.log('Image: ', result);
        if (result.didCancel) return;
        else if (result.errorMessage)
          return (
            <View>
              <Text>{result.errorMessage}</Text>
            </View>
          );
        else if (result.assets) {
          const ocrText = TextRecognition.recognize(result.assets[0].uri);
          console.log(ocrText);
        }
      })();
    }
  }, [mode]);
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

    // Validation
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
      await onExpenseClick(user, Number(amount), selected, description, date);

      navigation.navigate('Show-Expense', {
        toastMessage: 'Expense Added Successfully!',
      });

      // Clear form
      setAmount('');
      setSelected('');
      setDescription('');
      setDate(new Date());
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while adding the expense.');
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
    <KeyboardAvoidingView
      style={Styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={Styles.scroll}>
        <View style={Styles.container}>
          <Text style={Styles.header}>Add New Expense</Text>
          <View
            style={{
              flexDirection: 'row',
              alignSelf: 'center',
              marginBottom: 18,
            }}
          >
            <TouchableOpacity
              onPress={() => setMode('manual')}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 20,
                borderRadius: 10,
                backgroundColor: mode === 'manual' ? '#2563eb' : '#fff',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  color: mode === 'manual' ? '#fff' : '#111',
                  fontWeight: '700',
                }}
              >
                Manual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('scan')}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 20,
                borderRadius: 10,
                backgroundColor: mode === 'scan' ? '#2563eb' : '#fff',
                borderWidth: 1,
                borderColor: '#e2e8f0',
              }}
            >
              <Text
                style={{
                  color: mode === 'scan' ? '#fff' : '#111',
                  fontWeight: '700',
                }}
              >
                Scan
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={Styles.label}>Amount (₹)</Text>
          <TextInput
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={Styles.input}
          />

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
          />

          <Text style={Styles.description}>Description</Text>
          <TextInput
            placeholder="Add a short note"
            value={description}
            onChangeText={setDescription}
            style={Styles.input}
            multiline
          />

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

      {/* Modal for Adding Category */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={Styles.modalOverlay}>
          <View style={Styles.modalContainer}>
            <Text style={Styles.modalHeader}>Add New Category</Text>
            <TextInput
              placeholder="Category Name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              style={Styles.modalInput}
            />
            <View style={Styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={[Styles.modalButton, { backgroundColor: '#ccc' }]}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddCategory}
                style={[Styles.modalButton, { backgroundColor: '#4CAF50' }]}
              >
                <Text style={{ color: '#fff' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const Styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f9f9f9' },
  scroll: { flexGrow: 1 },
  container: { flex: 1, padding: 20, paddingTop: 0 },
  header: {
    paddingTop: 40,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
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
    marginBottom: 8,
    color: '#555',
    paddingTop: 20,
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
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
});
