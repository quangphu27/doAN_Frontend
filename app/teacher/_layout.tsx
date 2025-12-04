import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function TeacherLayout() {
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
        if (user.vaiTro !== 'giaoVien') {
            hasRedirected.current = true;
            const target = user.vaiTro === 'admin' ? '/admin' : 
                          user.vaiTro === 'phuHuynh' ? '/parent' : 
                          user.vaiTro === 'hocSinh' ? '/child' : '/auth/login';
            router.replace(target as any);
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }
    
    if (!user || user.vaiTro !== 'giaoVien') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}

