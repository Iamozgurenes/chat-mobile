import { DefaultTheme } from '@react-navigation/native';

// Ana temayı tanımla
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db',
    secondary: '#2ecc71',
    background: '#f8f9fa',
    card: '#ffffff',
    text: '#333333',
    border: '#eeeeee',
    notification: '#e74c3c',
    error: '#e74c3c',
    success: '#2ecc71',
    warning: '#f39c12',
    info: '#3498db',
    placeholder: '#999999',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    s: 4,
    m: 8,
    l: 16,
    xl: 25,
    xxl: 32,
  },
  typography: {
    fontFamily: {
      regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
      medium: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
      bold: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
    },
    fontSize: {
      xs: 12,
      s: 14,
      m: 16,
      l: 18,
      xl: 20,
      xxl: 24,
    },
  },
  shadow: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3.84,
      elevation: 2,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 6,
    },
  },
};

import { Platform } from 'react-native';

// Yardımcı temalar ve stil üreticileri
export const getPrimaryButtonStyle = (disabled = false) => ({
  backgroundColor: disabled ? theme.colors.primary + '80' : theme.colors.primary,
  borderRadius: theme.radius.m,
  paddingVertical: theme.spacing.m,
  paddingHorizontal: theme.spacing.l,
  alignItems: 'center' as 'center',
  justifyContent: 'center' as 'center',
});

export const getPrimaryTextStyle = () => ({
  color: 'white',
  fontSize: theme.typography.fontSize.m,
  fontWeight: '600' as '600',
  fontFamily: theme.typography.fontFamily.medium,
});

export const getCardStyle = () => ({
  backgroundColor: theme.colors.card,
  borderRadius: theme.radius.m,
  padding: theme.spacing.m,
  ...theme.shadow.light,
});

export const getInputStyle = (error = false) => ({
  height: 48,
  fontSize: theme.typography.fontSize.m,
  borderWidth: 1,
  borderColor: error ? theme.colors.error : theme.colors.border,
  borderRadius: theme.radius.m,
  paddingHorizontal: theme.spacing.m,
  backgroundColor: theme.colors.background,
});

// Ortak avatar işlevleri
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    theme.colors.primary,
    theme.colors.secondary,
    '#e74c3c', '#f39c12', 
    '#9b59b6', '#1abc9c', '#d35400', '#34495e'
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default theme;
