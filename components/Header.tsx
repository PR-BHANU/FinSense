import { Settings } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

type HeaderProps = {
  profilePic: string | null;
  navigation: any;
};

type UserData = {
  name?: string;
};

export default function Header({ profilePic, navigation }: HeaderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const authUser = auth().currentUser;

  useEffect(() => {
    if (!authUser) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(authUser.uid)
      .onSnapshot(doc => {
        if (doc.exists) {
          setUser(doc.data() as UserData);
        }
      });

    return unsubscribe;
  }, [authUser]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
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
            <Text style={styles.greeting}>
              Good Morning
              {user?.name
                ? `, ${user.name}`
                : authUser?.displayName
                ? `, ${authUser.displayName}`
                : ''}{' '}
              👋
            </Text>

            <Text style={styles.subtitle}>Your Smart Finance Partner</Text>
          </View>
        </View>

        <Pressable
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Settings size={22} color="#000" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
function settingsPress(navigation) {
  navigation.navigate('Settings');
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: '#fff',
  },

  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e5e5e5',
  },

  textContainer: {
    marginLeft: 12,
  },

  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  subtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },

  settingsBtn: {
    padding: 8,
  },
});
