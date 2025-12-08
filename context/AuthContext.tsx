import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAccessToken } from '../lib/api';

interface UserInfo { 
	id: string; 
	hoTen: string; 
	email: string; 
	vaiTro: 'admin' | 'phuHuynh' | 'hocSinh' | 'giaoVien';
	thongTinCaNhan?: {
		anhDaiDien?: string;
		soDienThoai?: string;
		diaChi?: string;
		ngaySinh?: string;
		gioiTinh?: 'nam' | 'nu' | 'khac';
	};
	caiDat?: {
		thongBao: boolean;
		ngonNgu: string;
		muiGio: string;
	};
	trangThai?: boolean;
}
interface AuthState { user: UserInfo | null; token: string | null; refreshToken: string | null; loading: boolean; }
interface AuthContextType extends AuthState {
	login: (email: string, matKhau: string) => Promise<UserInfo>;
	register: (hoTen: string, email: string, matKhau: string, vaiTro: 'phuHuynh' | 'hocSinh') => Promise<UserInfo>;
	logout: () => Promise<void>;
	updateProfile: (data: Partial<UserInfo>) => Promise<UserInfo>;
	changePassword: (matKhauHienTai: string, matKhauMoi: string) => Promise<void>;
	refreshTokenFunc: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [state, setState] = useState<AuthState>({ user: null, token: null, refreshToken: null, loading: true });

	useEffect(() => {
		(async () => {
			const token = await AsyncStorage.getItem('token');
			const refreshToken = await AsyncStorage.getItem('refreshToken');
			const user = await AsyncStorage.getItem('user');
			if (token) setAccessToken(token);
			setState({ user: user ? JSON.parse(user) : null, token, refreshToken, loading: false });
		})();
	}, []);
	// gọi den ham nay
	const login = async (email: string, matKhau: string) => {
		const res = await api.auth.login(email, matKhau);
		const { token, refreshToken, user } = res.data;
		setAccessToken(token);
		await AsyncStorage.multiSet([
			['token', token],
			['refreshToken', refreshToken],
			['user', JSON.stringify(user)]
		]);
		if (user.vaiTro === 'hocSinh') {
			try {
				await api.appSessions.start(user.id);
			} catch (error) {
				console.warn('Không thể start app session cho học sinh:', error);
			}
		}

		setState({ user, token, refreshToken, loading: false });
		return user as UserInfo;
	};

	const register = async (hoTen: string, email: string, matKhau: string, vaiTro: 'phuHuynh' | 'hocSinh') => {
		const res = await api.auth.register(hoTen, email, matKhau, vaiTro);
		const { token, refreshToken, user } = res.data;
		setAccessToken(token);
		await AsyncStorage.multiSet([
			['token', token],
			['refreshToken', refreshToken],
			['user', JSON.stringify(user)]
		]);
		setState({ user, token, refreshToken, loading: false });
		return user as UserInfo;
	};

	const logout = async () => {
		if (state.user && state.user.vaiTro === 'hocSinh') {
			try {
				await api.appSessions.end(state.user.id);
			} catch (error) {
			}
		}
		
		try { await api.auth.logout(); } catch {}
		await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
		setAccessToken(null);
		setState({ user: null, token: null, refreshToken: null, loading: false });
	};

	const updateProfile = async (data: Partial<UserInfo>) => {
		const res = await api.auth.updateProfile(data);
		const updatedUser = { ...state.user, ...res.data.user };
		await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
		setState(prev => ({ ...prev, user: updatedUser }));
		return updatedUser as UserInfo;
	};

	const changePassword = async (matKhauHienTai: string, matKhauMoi: string) => {
		await api.auth.changePassword(matKhauHienTai, matKhauMoi);
	};

	const refreshTokenFunc = async () => {
		if (!state.refreshToken) throw new Error('No refresh token available');
		try {
			const res = await api.auth.refresh(state.refreshToken);
			const { token } = res.data;
			setAccessToken(token);
			await AsyncStorage.setItem('token', token);
			setState(prev => ({ ...prev, token }));
		} catch (error) {
			await logout();
			throw error;
		}
	};

	const value = useMemo(() => ({ ...state, login, register, logout, updateProfile, changePassword, refreshTokenFunc }), [state]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
};
