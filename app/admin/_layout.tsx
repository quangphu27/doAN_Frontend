import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const hasRedirected = useRef(false);

    useEffect(() => {
        if (loading || hasRedirected.current) return;
        if (!user) {
            hasRedirected.current = true;
            router.replace('/auth/login');
            return;
        }
        if (user.vaiTro !== 'admin') {
            hasRedirected.current = true;
            const target = user.vaiTro === 'phuHuynh' ? '/parent' : 
                          user.vaiTro === 'hocSinh' ? '/child' :
                          user.vaiTro === 'giaoVien' ? '/teacher' : '/auth/login';
            router.replace(target as any);
        }
    }, [user, loading, router]);

    if (loading) return null;
    if (!user || user.vaiTro !== 'admin') return null;

    return <Stack screenOptions={{ headerShown: false }} />;
}
