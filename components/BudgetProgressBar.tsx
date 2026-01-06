import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  Dimensions,
  LayoutChangeEvent,
  useColorScheme,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as progress from 'react-native-progress';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LightTheme, DarkTheme } from '../scripts/theme';

interface Expense {
  id: string;
  amount: number;
  date: Date | any;
  category?: string;
  title?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BudgetProgressBar({
  expenses,
  navigation,
}: {
  expenses: Expense[];
  navigation: any;
}) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;

  const [budget, setBudget] = useState<number | null>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Expense[]>([]);
  const [containerWidth, setContainerWidth] = useState<number>(
    SCREEN_WIDTH - 64,
  );
  const [editing, setEditing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [draft, setDraft] = useState('');

  const onBarLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const openEditor = () => {
    setDraft(budget ? String(budget) : '');
    setEditing(true);
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const filtered = expenses.filter(e => {
      const d = e.date;
      return d >= startOfMonth && d <= endOfMonth;
    });

    setMonthlyExpenses(filtered);
  }, [expenses]);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    return firestore()
      .collection('Users')
      .doc(user.uid)
      .onSnapshot(doc => {
        setBudget(doc.data()?.monthlyBudget ?? null);
      });
  }, []);

  const totalThisMonth = useMemo(
    () => monthlyExpenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    [monthlyExpenses],
  );

  useEffect(() => {
    if (!budget || budget === 0) {
      setProgressValue(0);
      return;
    }
    const v = totalThisMonth / budget;
    setProgressValue(Math.max(0, Math.min(1, v)));
  }, [budget, totalThisMonth]);

  const handleSaveDraft = async () => {
    const user = auth().currentUser;
    if (!user) return;

    const value = Number(draft);
    await firestore().collection('Users').doc(user.uid).update({
      monthlyBudget: value,
    });

    setBudget(value);
    setEditing(false);
  };

  if (!budget) {
    return (
      <View
        style={[
          styles.emptyCard,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          Set a Monthly Budget
        </Text>

        <TouchableOpacity
          onPress={openEditor}
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.primaryText}>Add Budget</Text>
        </TouchableOpacity>

        {renderModal()}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.card, { backgroundColor: theme.inputBg }]}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.label, { color: theme.subText }]}>
              Monthly Budget
            </Text>
            <Text style={[styles.amount, { color: theme.text }]}>
              ₹{budget}
            </Text>
          </View>

          <View style={styles.right}>
            <Text style={[styles.small, { color: theme.subText }]}>Spent</Text>
            <Text style={[styles.smallAmount, { color: theme.text }]}>
              ₹{totalThisMonth}
            </Text>

            <TouchableOpacity
              onPress={openEditor}
              style={[styles.editBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.primaryText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.barWrapper} onLayout={onBarLayout}>
          <progress.Bar
            progress={progressValue}
            width={containerWidth}
            height={14}
            borderRadius={999}
            color={theme.primary}
            unfilledColor={scheme === 'dark' ? '#1E293B' : '#E5EDFF'}
            borderWidth={0}
            animated
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: theme.subText }]}>
            {(progressValue * 100).toFixed(2)}% used
          </Text>
          <Text style={[styles.metaRight, { color: theme.text }]}>
            Remaining ₹{budget - totalThisMonth}
          </Text>
        </View>
      </View>

      {renderModal()}
    </SafeAreaView>
  );

  function renderModal() {
    return (
      <Modal transparent visible={editing} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
            <View style={[styles.modal, { backgroundColor: theme.inputBg }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Set Monthly Budget
              </Text>

              <TextInput
                value={draft}
                onChangeText={setDraft}
                keyboardType="numeric"
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="e.g. 10000"
                placeholderTextColor={theme.subText}
                cursorColor={theme.primary}
              />

              <View style={styles.modalRow}>
                <TouchableOpacity
                  onPress={() => setEditing(false)}
                  style={[styles.modalBtn, { backgroundColor: theme.border }]}
                >
                  <Text style={{ color: theme.text }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveDraft}
                  style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.primaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  card: {
    borderRadius: 16,
    padding: 16,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  label: { fontWeight: '600' },
  amount: { marginTop: 4, fontSize: 20, fontWeight: '800' },

  right: { alignItems: 'flex-end' },
  small: { fontSize: 12 },
  smallAmount: { fontWeight: '700', marginTop: 4 },

  editBtn: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  barWrapper: {
    marginTop: 14,
    width: '100%',
    overflow: 'hidden',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  metaText: { fontWeight: '600' },
  metaRight: { fontWeight: '700' },

  emptyCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  modal: {
    width: '86%',
    padding: 16,
    borderRadius: 14,
  },

  modalTitle: {
    fontWeight: '800',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },

  modalRow: {
    flexDirection: 'row',
    marginTop: 12,
  },

  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
});
