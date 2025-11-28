// components/Header.tsx
import { Settings } from 'lucide-react-native';
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

type HeaderProps = {
  profilePic: string | null;
  navigation: any;
};

export default function Header({ profilePic, navigation }: HeaderProps) {
  return (
    <View style={styles.container}>
      {/* Profile Picture */}
      <Image
        source={
          profilePic
            ? { uri: profilePic }
            : {
                uri: 'https://i.pinimg.com/736x/28/04/02/2804023793ab0bf0f98b2c245cd308ed.jpg',
              }
        }
        style={styles.profilePic}
      />

      <Text style={styles.title}>Dashboard</Text>

      {/* Settings Button */}
      <Pressable
        onPress={() => {
          settingsPress(navigation);
        }}
      >
        <Settings />
      </Pressable>
    </View>
  );
}

function settingsPress(navigation) {
  navigation.navigate('Settings');
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsIcon: {
    fontSize: 22,
  },
});
