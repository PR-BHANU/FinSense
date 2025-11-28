// firebase.ts
import { getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

const firebaseApp = getApp(); // already initialized

export const firebaseAuth = auth(firebaseApp);
