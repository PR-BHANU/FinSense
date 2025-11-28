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
console.log('Rendered: LogInScreen');

GoogleSignin.configure({
  webClientId:
    '160508348147-17h7klvt7tu76fr1i9g0d80c957en1j1.apps.googleusercontent.com',
  offlineAccess: true,
});

//Login with Google
async function loginWithGoogle(navigation: any) {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const userInfo = await GoogleSignin.signIn();
    const idToken = (userInfo as any).idToken || userInfo.data?.idToken;
    if (!idToken) throw new Error('No idToken returned from Google');

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

    Alert.alert('Success ✅', 'Logged in with Google!');
    navigation.navigate('Dashboard');
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('User cancelled login');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('Login in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert('Error', 'Play Services not available or outdated');
    } else {
      console.error('❌ Google login error:', error);
      Alert.alert('Error', error.message || 'Google login failed.');
    }
  }
}

//LogIn with email
async function LogInWithEmail(
  email: string,
  password: string,
  navigation: any,
  setLoading: (loading: boolean) => void,
) {
  try {
    const userCredentials = await firebaseAuth.signInWithEmailAndPassword(
      email,
      password,
    );

    if (!userCredentials.user.emailVerified) {
      await userCredentials.user.sendEmailVerification();
      Alert.alert(
        'Email Verification',
        `Verification link sent to ${userCredentials.user.email}`,
      );
    }

    navigation.navigate('Dashboard');
  } catch (err: any) {
    if (err.code === 'auth/invalid-credential') {
      Alert.alert(
        'Invalid Credentials',
        "The email or password is invalid. If you don't have an account, please sign up.",
      );
    } else if (err.code === 'auth/invalid-email') {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
    } else if (err.code === 'auth/user-not-found') {
      Alert.alert('User Not Found', 'No account exists with this email.');
    } else if (err.code === 'auth/wrong-password') {
      Alert.alert('Wrong Password', 'The password you entered is incorrect.');
    } else {
      console.error('❌ Login error:', err.code, err.message);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  } finally {
    setLoading(false);
  }
}

export default function LogInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    // Basic validations before hitting Firebase
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Password is required');
      return;
    }

    setLoading(true);
    LogInWithEmail(email, password, navigation, setLoading);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Enter your credentials</Text>

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
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
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
                await loginWithGoogle(navigation);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          />
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('SignIn')}
          style={styles.linkContainer}
        >
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
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
    backgroundColor: '#28a745',
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
