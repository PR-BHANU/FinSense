import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export async function generateTestExpenses() {
  const user = auth().currentUser;
  if (!user) {
    console.error('No user logged in.');
    return;
  }

  const expensesRef = firestore()
    .collection('Users')
    .doc(user.uid)
    .collection('Expenses');

  try {
    console.log('🧹 Deleting old expenses...');
    const snapshot = await expensesRef.get();
    const batch = firestore().batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log('✅ Old expenses deleted.');

    console.log('📊 Adding example expenses...');
    const categories = [
      'Food & Drinks',
      'Transport',
      'Shopping',
      'Health',
      'Education',
      'Entertainment',
      'Bills & Utilities',
      'Subscriptions',
    ];

    const titles = [
      'Lunch at Cafe',
      'Metro Card',
      'Online Course',
      'Movie Night',
      'Grocery Shopping',
      'Gym Membership',
      'Netflix Renewal',
      'Electric Bill',
    ];

    const now = new Date();
    const exampleExpenses = Array.from({ length: 25 }).map(() => {
      const randomMonth = Math.floor(Math.random() * 12); // 0–11
      const randomAmount = Math.floor(Math.random() * 5000) + 100; // ₹100–₹5100
      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      const randomDate = new Date(
        now.getFullYear(),
        randomMonth,
        Math.floor(Math.random() * 28) + 1,
      );

      return {
        title: randomTitle,
        amount: randomAmount,
        category: randomCategory,
        date: randomDate,
      };
    });

    const addBatch = firestore().batch();
    exampleExpenses.forEach(exp => {
      const newDoc = expensesRef.doc();
      addBatch.set(newDoc, exp);
    });
    await addBatch.commit();

    console.log('🎉 Test expenses added successfully!');
  } catch (err) {
    console.error('Error generating test expenses:', err);
  }
}
