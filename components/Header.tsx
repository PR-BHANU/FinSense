import { Settings } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { LightTheme, DarkTheme } from '../scripts/theme';
import { StatusBar, Platform } from 'react-native';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
export default function Header({ profilePic, navigation }) {
  const [user, setUser] = useState<any>(null);
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;
  const authUser = auth().currentUser;

  useEffect(() => {
    if (!authUser) return;
    return firestore()
      .collection('users')
      .doc(authUser.uid)
      .onSnapshot(doc => doc.exists && setUser(doc.data()));
  }, [authUser]);

  return (
    <View style={styles.wrapper}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={scheme === 'dark' ? 'dark' : 'light'}
        blurAmount={Platform.OS === 'ios' ? 40 : 14}
        reducedTransparencyFallbackColor={
          scheme === 'dark' ? 'rgba(12,12,12,0.25)' : 'rgba(255,255,255,0.35)'
        }
      />

      <View style={styles.container}>
        <View style={styles.left}>
          <Image
            source={{
              uri:
                profilePic ??
                'https://i.pinimg.com/736x/28/04/02/2804023793ab0bf0f98b2c245cd308ed.jpg',
            }}
            style={styles.profilePic}
          />

          <View style={styles.textContainer}>
            <Text style={[styles.greeting, { color: theme.text }]}>
              Good Morning{user?.name ? `, ${user.name}` : ''} 👋
            </Text>
            <Text style={[styles.subtitle, { color: theme.subText }]}>
              Your Smart Finance Partner
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Settings')}
          style={[
            styles.settingsBtn,
            {
              backgroundColor:
                scheme === 'dark'
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(0,0,0,0.12)',
            },
          ]}
        >
          <Settings size={22} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 14,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    overflow: 'hidden',
    zIndex: 100,
  },
  container: {
    height: 78,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  textContainer: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  settingsBtn: {
    padding: 10,
    borderRadius: 12,
  },
});
