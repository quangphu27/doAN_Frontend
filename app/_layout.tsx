import { Slot } from 'expo-router';
import React from 'react';
import { LogBox } from 'react-native';
import { AuthProvider } from '../context/AuthContext';

if (__DEV__) {
  LogBox.ignoreLogs([
    'Text strings must be rendered within a <Text> component',
    /Text strings must be rendered/i,
  ]);
  
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (args[0]?.includes?.('Text strings must be rendered')) {
      return;
    }
    originalError.apply(console, args);
  };
}

export default function Layout() {
  return (
    <AuthProvider>
      <Slot /> 
    </AuthProvider>
  );
}
