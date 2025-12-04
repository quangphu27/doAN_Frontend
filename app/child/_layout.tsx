import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ActivityProvider } from '../../context/ActivityContext';

export default function ChildLayout() {
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
        if (user.vaiTro !== 'hocSinh') {
            hasRedirected.current = true;
            const target = user.vaiTro === 'admin' ? '/admin' : 
                          user.vaiTro === 'phuHuynh' ? '/parent' :
                          user.vaiTro === 'giaoVien' ? '/teacher' : '/auth/login';
            router.replace(target as any);
        }
    }, [user, loading, router]);

    if (loading) return null;
    if (!user || user.vaiTro !== 'hocSinh') return null;

    return (
        <ActivityProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </ActivityProvider>
    );
}


