import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { firebaseAuth } from '../scripts/firebase';
import firestore from '@react-native-firebase/firestore';
import {
  GoogleSignin,
  statusCodes,
  GoogleSigninButton,
} from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
console.log('Rendered: SignInScreen');

GoogleSignin.configure({
  webClientId:
    '160508348147-17h7klvt7tu76fr1i9g0d80c957en1j1.apps.googleusercontent.com',
  offlineAccess: true,
});

// 🔹 Email validation regex
const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

//google SignIn
async function signInWithGoogle(navigation: any) {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const userInfo = await GoogleSignin.signIn();
    console.log('Google userInfo:', userInfo);

    const idToken = (userInfo as any).idToken || userInfo.data?.idToken;
    if (!idToken) throw new Error('No idToken returned from Google Sign-In');

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);

    // ✅ Save/update Firestore with UID as doc ID
    await firestore()
      .collection('Users')
      .doc(userCredential.user.uid)
      .set(
        {
          uId: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName,
          phone: userCredential.user.phoneNumber,
          createdAt: userCredential.user.metadata.creationTime,
          monthlyBudget: 0,
          currency: 'INR',
          preferredCategories: [],
          authProvider: userCredential.user.providerId,
          profilePic:
            userCredential.user.photoURL ||
            'https://i.pinimg.com/736x/28/04/02/2804023793ab0bf0f98b2c245cd308ed.jpg',
        },
        { merge: true },
      );

    Alert.alert('Success ✅', 'Signed in with Google!');
    navigation.navigate('Dashboard');
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('User cancelled the login flow');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('Sign in is in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert('Error', 'Play Services not available or outdated');
    } else {
      console.error('❌ Google sign-in error:', error);
      Alert.alert('Error', error.message || 'Google sign-in failed.');
    }
  }
}

async function SignInWithEmail(
  email: string,
  password: string,
  navigation: any,
  setLoading: (val: boolean) => void,
) {
  try {
    console.log('🔄 Step 1: Starting account creation...');
    const userCredentials = await firebaseAuth.createUserWithEmailAndPassword(
      email,
      password,
    );
    console.log('✅ Step 1 Complete: Account created');

    await userCredentials.user.sendEmailVerification();
    console.log('✅ Email verification sent');

    // ✅ Save/update Firestore with UID as doc ID
    console.log('🔄 Step 3: Saving to Firestore...');
    await firestore()
      .collection('Users')
      .doc(userCredentials.user.uid)
      .set(
        {
          uId: userCredentials.user.uid,
          email: userCredentials.user.email,
          name: userCredentials.user.displayName,
          phone: userCredentials.user.phoneNumber,
          createdAt: userCredentials.user.metadata.creationTime,
          monthlyBudget: 0,
          currency: 'INR',
          preferredCategories: [],
          authProvider: userCredentials.user.providerId,
          profilePic:
            userCredentials.user.photoURL ||
            'https://i.pinimg.com/736x/28/04/02/2804023793ab0bf0f98b2c245cd308ed.jpg',
        },
        { merge: true },
      );

    console.log('✅ Step 3 Complete: Firestore save successful');

    return { success: true };
  } catch (err: any) {
    console.error('❌ Sign in error:', err.code, err.message);

    if (err.code === 'auth/email-already-in-use') {
      Alert.alert(
        'Email in Use',
        'You already have an account. Please log in instead.',
      );
    } else if (err.code === 'auth/invalid-email') {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
    } else if (err.code === 'auth/weak-password') {
      Alert.alert('Weak Password', 'Password should be at least 6 characters.');
    } else {
      Alert.alert('Error', err.message);
    }
    return { success: false };
  } finally {
    setLoading(false);
  }
}

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email format.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await SignInWithEmail(
      email,
      password,
      navigation,
      setLoading,
    );
    if (result.success) {
      navigation.navigate('Dashboard');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
        <View style={styles.separatorContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <GoogleSigninButton
            style={{
              width: 230,
              height: 48,
              marginVertical: 10,
            }}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={async () => {
              try {
                setLoading(true);
                await signInWithGoogle(navigation);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          />
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.linkContainer}
        >
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkContainer: { alignItems: 'center' },
  linkText: { color: '#007bff', fontSize: 14 },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  orText: {
    marginHorizontal: 10,
    color: '#555',
    fontWeight: 'bold',
  },
});
