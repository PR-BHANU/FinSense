import {
  DefaultTheme as NavLight,
  DarkTheme as NavDark,
} from '@react-navigation/native';

export const LightNavigationTheme = {
  ...NavLight,
  dark: false,
  colors: {
    ...NavLight.colors,
    primary: '#2563eb',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
    notification: '#ef4444',
  },
};

export const DarkNavigationTheme = {
  ...NavDark,
  dark: true,
  colors: {
    ...NavDark.colors,
    primary: '#60a5fa',
    background: '#020617',
    card: '#020617',
    text: '#f8fafc',
    border: '#1e293b',
    notification: '#ef4444',
  },
};
