import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/auth/login');
      else if (user.vaiTro === 'admin') router.replace('/admin');
      else if (user.vaiTro === 'phuHuynh') router.replace('/parent');
      else if (user.vaiTro === 'hocSinh') router.replace('/child');
      else if (user.vaiTro === 'giaoVien') router.replace('/teacher');
    }
  }, [user, loading]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  return null;
}
