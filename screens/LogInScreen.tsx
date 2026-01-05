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
import { LightTheme, DarkTheme } from '../scripts/theme';
import { Eye, EyeOff } from 'lucide-react-native';

GoogleSignin.configure({
  webClientId:
    '160508348147-17h7klvt7tu76fr1i9g0d80c957en1j1.apps.googleusercontent.com',
  offlineAccess: true,
});

async function loginWithGoogle(navigation: any) {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const userInfo = await GoogleSignin.signIn();
    const idToken = (userInfo as any).idToken || userInfo.data?.idToken;
    if (!idToken) throw new Error('No idToken returned from Google');

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
      Alert.alert('Email Verification', 'Verification link sent.');
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
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  } finally {
    setLoading(false);
  }
}

export default function LogInScreen({ navigation }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
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
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Login</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          Enter your credentials
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
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={[styles.passwordInput, { color: theme.text }]}
            placeholderTextColor={theme.subText}
            cursorColor={theme.primary}
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            {showPassword ? (
              <Eye size={20} color={theme.subText} />
            ) : (
              <EyeOff size={20} color={theme.subText} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
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
          <Text style={[styles.linkText, { color: theme.primary }]}>
            Don't have an account? Sign Up
          </Text>
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

  eyeButton: {
    paddingLeft: 10,
  },
});
