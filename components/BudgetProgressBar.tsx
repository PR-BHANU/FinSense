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
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as progress from 'react-native-progress';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface Expense {
  id: string;
  amount: number;
  date: Date | { seconds: number; nanoseconds: number } | any;
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
  const [budget, setBudget] = useState(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Expense[]>([]);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [draft, setDraft] = useState(budget ? String(budget) : '');

  const onCardLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
  };

  const openEditor = () => {
    setDraft(budget ? String(budget) : '');
    setEditing(true);
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const filteredExpenses = expenses?.filter((e: Expense) => {
      const dt = e.date;
      if (!dt) return false;
      return dt >= startOfMonth && dt <= endOfMonth;
    });
    setMonthlyExpenses(filteredExpenses);
  }, [expenses, startOfMonth.toISOString(), endOfMonth.toISOString()]);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    const user = auth().currentUser;
    if (!user) {
      setLoadingBudget(false);
      return;
    }
    const docRef = firestore().collection('Users').doc(user.uid);
    unsub = docRef.onSnapshot(
      doc => {
        const data = doc.data();
        setBudget(data?.monthlyBudget ?? null);
        setLoadingBudget(false);
      },
      err => {
        console.warn('Failed to load budget:', err);
        setLoadingBudget(false);
      },
    );
    return () => unsub && unsub();
  }, []);

  const totalThisMonth = useMemo(() => {
    return monthlyExpenses.reduce((s, e) => {
      const amt = Number(e?.amount || 0);
      return s + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [monthlyExpenses]);

  const handleSaveDraft = async () => {
    const user = auth().currentUser;
    const value = Number(draft);
    if (!user) return;
    await firestore()
      .collection('Users')
      .doc(user?.uid)
      .update({ monthlyBudget: value });

    setBudget(value);

    setEditing(false);
  };

  const handleCancelDraft = () => {
    setDraft(budget ? String(budget) : '');
    setEditing(false);
  };

  useEffect(() => {
    if (!budget || budget === 0) {
      setProgressValue(0);
      return;
    }

    const value = Number(totalThisMonth) / Number(budget);
    const clamped = Math.max(0, Math.min(1, isNaN(value) ? 0 : value));
    setProgressValue(clamped);
  }, [budget, totalThisMonth]);

  if (budget === null || budget === undefined || budget == 0) {
    return (
      <View
        style={{
          backgroundColor: '#f8fafc',
          padding: 18,
          borderRadius: 12,
          borderStyle: 'dashed',
          borderWidth: 1.5,
          borderColor: '#94a3b8',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#475569',
            marginBottom: 6,
          }}
        >
          Set a Monthly Budget
        </Text>

        <TouchableOpacity
          onPress={openEditor}
          style={{
            backgroundColor: '#2563eb',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Add Budget</Text>
        </TouchableOpacity>

        <Modal
          visible={editing}
          transparent
          animationType="slide"
          onRequestClose={handleCancelDraft}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Set Monthly Budget</Text>

              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="e.g. 10000"
                keyboardType="numeric"
                placeholderTextColor="grey"
                style={styles.input}
              />

              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#eee' }]}
                  onPress={handleCancelDraft}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: '#2563eb', marginLeft: 10 },
                  ]}
                  onPress={handleSaveDraft}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card} onLayout={onCardLayout}>
        {/* Top Row */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.label}>Monthly Budget</Text>
            <Text style={styles.amount}>₹{budget}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.small}>Spent</Text>
            <Text style={styles.smallAmount}>₹{totalThisMonth}</Text>

            {/* open modal from main card too */}
            <TouchableOpacity
              onPress={openEditor}
              style={{
                marginTop: 8,
                backgroundColor: '#2563eb',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={styles.barWrapper}
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            // store the inner width (this is same place you already read onCardLayout)
            setContainerWidth(w);
          }}
        >
          <progress.Bar
            progress={Math.max(0, Math.min(1, Number(progressValue) || 0))} // guaranteed 0..1
            width={
              containerWidth ? containerWidth : Math.round(SCREEN_WIDTH * 0.88)
            } // explicit number
            height={14}
            borderRadius={999}
            color="#2563eb"
            unfilledColor="#eef2ff"
            borderWidth={0}
            animated={true}
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {(progressValue * 100).toFixed(2)}% used
          </Text>
          <Text style={styles.metaRight}>
            Remaining ₹{budget - totalThisMonth}
          </Text>
        </View>
      </View>

      <Modal
        visible={editing}
        transparent
        animationType="slide"
        onRequestClose={handleCancelDraft}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <KeyboardAwareScrollView
            enableOnAndroid
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Edit Monthly Budget</Text>

                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="e.g. 10000"
                  keyboardType="numeric"
                  placeholderTextColor="grey"
                  style={styles.input}
                />

                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: '#eee' }]}
                    onPress={handleCancelDraft}
                  >
                    <Text>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      { backgroundColor: '#2563eb', marginLeft: 10 },
                    ]}
                    onPress={handleSaveDraft}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: {
    flex: 1,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  label: { color: '#64748b', fontWeight: '600' },
  amount: { marginTop: 4, fontSize: 20, fontWeight: '800', color: '#0f172a' },

  right: { alignItems: 'flex-end' },
  small: { color: '#64748b', fontSize: 12 },
  smallAmount: { fontWeight: '700', marginTop: 4 },

  barWrapper: {
    marginTop: 14,
    width: '100%',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  metaText: { color: '#64748b', fontWeight: '600' },
  metaRight: { color: '#0f172a', fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modal: {
    width: '86%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  modalTitle: { fontWeight: '800', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e6edf3',
    padding: 10,
    borderRadius: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
