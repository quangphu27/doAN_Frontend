import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AuthLayout() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (user) {
            const target = user.vaiTro === 'admin' ? '/admin' : 
                          user.vaiTro === 'phuHuynh' ? '/parent' : 
                          user.vaiTro === 'hocSinh' ? '/child' :
                          user.vaiTro === 'giaoVien' ? '/teacher' : '/auth/login';
            router.replace(target as any);
        }
    }, [user, loading]);

    if (loading) return null;
    if (user) return null;

    return <Stack screenOptions={{ headerShown: false }} />;
}
