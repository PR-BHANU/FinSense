import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SelectList } from 'react-native-dropdown-select-list';
import { Mic } from 'lucide-react-native';
import {
  startVoice,
  stopVoice,
  setVoiceCallbacks,
  clearVoiceCallbacks,
} from '../Services/VoiceMount';

async function requestMicrophonePermission() {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message:
          'This app needs access to your microphone for speech recognition',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    return false;
  }
}

function parseVoiceInput(text: string) {
  const result = {
    amount: '',
    category: '',
    description: text.trim(),
  };

  const amountMatch = text.match(
    /(?:₹|rupees?|rs\.?)\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:₹|rupees?|rs\.?)/i,
  );
  if (amountMatch) {
    result.amount = amountMatch[1] || amountMatch[2];
  }

  const categories = [
    {
      keywords: ['food', 'drinks', 'restaurant', 'eating'],
      name: 'Food & Drinks',
    },
    {
      keywords: ['transport', 'taxi', 'uber', 'travel', 'bus'],
      name: 'Transport',
    },
    {
      keywords: ['bills', 'utilities', 'electricity', 'water'],
      name: 'Bills & Utilities',
    },
    { keywords: ['shopping', 'clothes', 'mall'], name: 'Shopping' },
    { keywords: ['health', 'medical', 'doctor', 'pharmacy'], name: 'Health' },
    { keywords: ['entertainment', 'movie', 'game'], name: 'Entertainment' },
    { keywords: ['education', 'course', 'books'], name: 'Education' },
    { keywords: ['subscription', 'netflix', 'spotify'], name: 'Subscriptions' },
  ];

  const lowerText = text.toLowerCase();
  for (const cat of categories) {
    if (cat.keywords.some(keyword => lowerText.includes(keyword))) {
      result.category = cat.name;
      break;
    }
  }

  if (!result.category) {
    result.category = 'Miscellaneous';
  }

  return result;
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
  const [state, setState] = useState<'Manual' | 'Voice'>('Manual');
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState<string>();

  const isMountedRef = useRef(true);
  const isStartingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const currentUser = auth().currentUser;
    if (currentUser) setUser(currentUser);
    if (!currentUser) return;

    const unsub = firestore()
      .collection('Users')
      .doc(currentUser.uid)
      .collection('Custom-Categories')
      .onSnapshot(snapshot => {
        const Categories = snapshot.docs
          .map(doc => doc.data().name)
          .filter(Boolean);
        if (isMountedRef.current) setCustomCategories(Categories);
      });

    return () => {
      isMountedRef.current = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    setVoiceCallbacks(
      () => {
        if (isMountedRef.current) {
          setIsListening(true);
          isStartingRef.current = false;
        }
      },
      () => {
        if (isMountedRef.current) {
          setIsListening(false);
          isStartingRef.current = false;
        }
      },
      text => {
        if (isMountedRef.current && text) {
          setTranscription(text);
        }
      },
      error => {
        if (!isMountedRef.current) return;

        switch (error?.code) {
          case 7:
            Alert.alert("Couldn't understand", 'Please speak more clearly.');
            break;
          case 6:
            Alert.alert('Timeout', 'Please try again.');
            break;
          case 9:
            Alert.alert(
              'Permission needed',
              'Please enable microphone access.',
            );
            break;
          case 1:
          case 2:
            Alert.alert('No internet', 'Please check your connection.');
            break;
          default:
            Alert.alert('Voice error', 'Please try again.');
            break;
        }

        setIsListening(false);
        isStartingRef.current = false;
      },
    );

    return () => {
      clearVoiceCallbacks();
    };
  }, []);

  useEffect(() => {
    if (!transcription || !isMountedRef.current) return;

    const parsed = parseVoiceInput(transcription);

    const detectedInfo = [
      parsed.amount ? `Amount: ₹${parsed.amount}` : null,
      parsed.category ? `Category: ${parsed.category}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    if (parsed.amount || parsed.category) {
      if (parsed.amount) setAmount(parsed.amount);
      if (parsed.category) setSelected(parsed.category);
      if (parsed.description) setDescription(parsed.description);

      setState('Manual');

      Alert.alert(
        'Voice Input Detected',
        detectedInfo || 'Processing your input...',
        [{ text: 'OK' }],
      );
    } else {
      Alert.alert(
        'Unable to parse',
        'Try saying something like: "I spent 500 rupees on food"',
        [{ text: 'OK' }],
      );
    }
  }, [transcription]);

  const combinedCategories = [
    { key: '+ Add New Category', value: '+ Add New Category' },
    ...customCategories.map(cat => ({ key: cat, value: cat })),
    { key: 'Food & Drinks', value: 'Food & Drinks' },
    { key: 'Transport', value: 'Transport' },
    { key: 'Bills & Utilities', value: 'Bills & Utilities' },
    { key: 'Shopping', value: 'Shopping' },
    { key: 'Health', value: 'Health' },
    { key: 'Entertainment', value: 'Entertainment' },
    { key: 'Education', value: 'Education' },
    { key: 'Subscriptions', value: 'Subscriptions' },
    { key: 'Miscellaneous', value: 'Miscellaneous' },
  ];

  const onChange = (_event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const sanitizeAmountInput = (text: string) => {
    const cleaned = text.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length <= 2) return cleaned;
    return parts[0] + '.' + parts.slice(1).join('');
  };

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
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
  }

  async function onStartListening() {
    if (isStartingRef.current || isListening) {
      return;
    }

    isStartingRef.current = true;

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      Alert.alert(
        'Microphone Permission Required',
        'Please enable microphone access in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      isStartingRef.current = false;
      return;
    }

    try {
      await startVoice();
    } catch (error) {
      Alert.alert('Error', 'Failed to start voice recognition');
      isStartingRef.current = false;
      if (isMountedRef.current) {
        setIsListening(false);
      }
    }
  }

  async function onStopListening() {
    if (!isListening) {
      return;
    }

    try {
      await stopVoice();
    } catch (error) {
      if (isMountedRef.current) {
        setIsListening(false);
      }
    }
  }

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to save expenses.');
      return;
    }
    if (!amount.trim()) {
      Alert.alert('Invalid Input', 'Amount cannot be empty');
      return;
    }
    const numeric = Number(amount);
    if (isNaN(numeric) || numeric <= 0) {
      Alert.alert('Invalid Input', 'Amount must be a positive number');
      return;
    }
    if (!selected) {
      Alert.alert('Invalid Input', 'Please select a category');
      return;
    }

    try {
      setLoading(true);
      await onExpenseClick(user, numeric, selected, description, date);
      navigation.navigate('Show-Expense', {
        toastMessage: 'Expense Added Successfully!',
      });

      setAmount('');
      setSelected('');
      setDescription('');
      setDate(new Date());
      setTranscription(undefined);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while adding the expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Invalid Input', 'Category name cannot be empty');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      await firestore()
        .collection('Users')
        .doc(user.uid)
        .collection('Custom-Categories')
        .add({
          name: newCategoryName.trim(),
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      setSelected(newCategoryName.trim());
      setNewCategoryName('');
      setShowCategoryModal(false);
      Alert.alert('Success', 'Category added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add category');
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

          <View style={Styles.mode}>
            <TouchableOpacity
              style={[
                Styles.modeButton,
                state === 'Manual' && Styles.modeActive,
              ]}
              onPress={() => setState('Manual')}
            >
              <Text
                style={[
                  Styles.modeText,
                  state === 'Manual' && Styles.modeTextActive,
                ]}
              >
                Manual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                Styles.modeButton,
                state === 'Voice' && Styles.modeActive,
              ]}
              onPress={() => setState('Voice')}
            >
              <Text
                style={[
                  Styles.modeText,
                  state === 'Voice' && Styles.modeTextActive,
                ]}
              >
                Voice
              </Text>
            </TouchableOpacity>
          </View>

          {state === 'Voice' && (
            <View style={Styles.voiceCard}>
              <View style={Styles.voiceIcon}>
                <Mic style={Styles.voiceEmoji} />
              </View>

              <Text style={Styles.voiceTitle}>Voice Input</Text>
              <Text style={Styles.voiceSubtitle}>
                Say: "I spent 500 rupees on food"
              </Text>

              {transcription && (
                <View style={Styles.transcriptionBox}>
                  <Text style={Styles.transcriptionLabel}>You said:</Text>
                  <Text style={Styles.transcriptionText}>{transcription}</Text>
                </View>
              )}

              {!isListening && (
                <TouchableOpacity
                  style={Styles.voiceButtonOff}
                  onPress={onStartListening}
                >
                  <Text style={Styles.voiceButtonText}>Start Listening</Text>
                </TouchableOpacity>
              )}

              {isListening && (
                <TouchableOpacity
                  style={Styles.voiceButtonOn}
                  onPress={onStopListening}
                >
                  <Text style={Styles.voiceButtonText}>Stop Listening</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {state === 'Manual' && (
            <View>
              <Text style={Styles.label}>Amount (₹)</Text>
              <TextInput
                placeholder="Enter amount"
                value={amount}
                onChangeText={t => setAmount(sanitizeAmountInput(t))}
                placeholderTextColor="grey"
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                style={Styles.input}
              />

              <Text style={Styles.label}>Category</Text>
              <SelectList
                placeholder="Select category"
                setSelected={(val: string) => {
                  if (val === '+ Add New Category') setShowCategoryModal(true);
                  else setSelected(val);
                }}
                data={combinedCategories}
                save="key"
                search={false}
                boxStyles={{ borderRadius: 12 }}
                inputStyles={{ fontSize: 16 }}
              />

              <Text style={Styles.description}>Description</Text>
              <TextInput
                placeholder="Add a short note"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="grey"
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
                  onChange={onChange}
                  maximumDate={new Date()}
                />
              )}

              <TouchableOpacity
                style={[Styles.saveButton, loading && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={Styles.saveText}>Save Expense</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={Styles.modalOverlay}>
          <View style={Styles.modalContent}>
            <Text style={Styles.modalTitle}>Add New Category</Text>

            <TextInput
              placeholder="Enter category name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              style={Styles.modalInput}
              placeholderTextColor="#999"
            />

            <View style={Styles.modalButtons}>
              <TouchableOpacity
                style={[Styles.modalButton, Styles.modalButtonCancel]}
                onPress={() => {
                  setNewCategoryName('');
                  setShowCategoryModal(false);
                }}
              >
                <Text style={Styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[Styles.modalButton, Styles.modalButtonAdd]}
                onPress={handleAddCategory}
              >
                <Text style={[Styles.modalButtonText, { color: '#fff' }]}>
                  Add
                </Text>
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
  container: { padding: 20 },
  header: {
    paddingTop: 40,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  description: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    paddingTop: 15,
    color: '#555',
  },
  mode: {
    flexDirection: 'row',
    backgroundColor: '#ededed',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modeActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  modeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#777',
  },
  modeTextActive: {
    color: '#111',
  },
  voiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  voiceIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  voiceEmoji: {
    color: 'Black',
  },
  voiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  voiceSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  transcriptionBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
  },
  transcriptionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  transcriptionText: {
    fontSize: 14,
    color: '#111',
    fontStyle: 'italic',
  },
  voiceButtonOff: {
    backgroundColor: '#111',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  voiceButtonOn: {
    backgroundColor: '#ff0000ff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonAdd: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
});
