import React, { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function ParentLayout() {
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
        if (user.vaiTro !== 'phuHuynh') {
            hasRedirected.current = true;
            const target = user.vaiTro === 'admin' ? '/admin' : 
                          user.vaiTro === 'hocSinh' ? '/child' :
                          user.vaiTro === 'giaoVien' ? '/teacher' : '/auth/login';
            router.replace(target as any);
        }
    }, [user, loading, router]);

    if (loading) return null;
    if (!user || user.vaiTro !== 'phuHuynh') return null;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#2196F3',
                tabBarInactiveTintColor: '#666',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e0e0e0',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="children"
                options={{
                    title: 'Quản lý trẻ',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="activities"
                options={{
                    title: 'Hoạt động',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="time" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="reports"
                options={{
                    title: 'Báo cáo',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="bar-chart" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Thông báo',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="notifications" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}


