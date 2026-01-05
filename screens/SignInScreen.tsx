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
  useColorScheme,
} from 'react-native';
import { firebaseAuth } from '../scripts/firebase';
import firestore from '@react-native-firebase/firestore';
import {
  GoogleSignin,
  statusCodes,
  GoogleSigninButton,
} from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import { LightTheme, DarkTheme } from '../scripts/theme';

GoogleSignin.configure({
  webClientId:
    '160508348147-17h7klvt7tu76fr1i9g0d80c957en1j1.apps.googleusercontent.com',
  offlineAccess: true,
});

const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

async function signInWithGoogle(navigation: any) {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const userInfo = await GoogleSignin.signIn();
    const idToken = (userInfo as any).idToken || userInfo.data?.idToken;
    if (!idToken) throw new Error('No idToken returned from Google Sign-In');

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);

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
          currency: 'INR',
          authProvider: userCredential.user.providerId,
          profilePic:
            userCredential.user.photoURL ||
            'https://i.pinimg.com/736x/28/04/02/2804023793ab0bf0f98b2c245cd308ed.jpg',
        },
        { merge: true },
      );

    navigation.navigate('Dashboard');
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
    if (error.code === statusCodes.IN_PROGRESS) return;
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert('Error', 'Play Services not available or outdated');
    } else {
      Alert.alert('Error', 'Something went wrong, please try again later.');
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
    const userCredentials = await firebaseAuth.createUserWithEmailAndPassword(
      email,
      password,
    );

    await userCredentials.user.sendEmailVerification();

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
          currency: 'INR',
          authProvider: userCredentials.user.providerId,
          profilePic:
            userCredentials.user.photoURL ||
            'https://i.pinimg.com/736x/28/04/02/2804023793ab0bf0f98b2c245cd308ed.jpg',
        },
        { merge: true },
      );

    return { success: true };
  } catch (err: any) {
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
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.title, { color: theme.text }]}>
            Create Your FinSense Account
          </Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Sign Up to continue
          </Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholderTextColor={theme.subText}
            cursorColor={theme.primary}
          />

          <View
            style={[
              styles.passwordContainer,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.border,
              },
            ]}
          >
            <TextInput
              placeholder="Password"
              value={password}
              autoCapitalize="none"
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.passwordInput, { color: theme.text }]}
              placeholderTextColor={theme.subText}
              cursorColor={theme.primary}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <Eye size={20} color={theme.subText} />
              ) : (
                <EyeOff size={20} color={theme.subText} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
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
            <View style={[styles.line, { backgroundColor: theme.text }]} />
            <Text style={[styles.orText, { color: theme.subText }]}>OR</Text>
            <View style={[styles.line, { backgroundColor: theme.text }]} />
          </View>

          <View style={{ alignItems: 'center', marginVertical: 10 }}>
            <GoogleSigninButton
              key={scheme}
              style={{ width: 230, height: 48, marginVertical: 10 }}
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
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkContainer: { alignItems: 'center' },
  linkText: { fontSize: 14 },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  line: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 10,
    fontWeight: 'bold',
  },
});
