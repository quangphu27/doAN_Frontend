import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
	const { register } = useAuth();
	const router = useRouter();
	const [hoTen, setHoTen] = useState('');
	const [email, setEmail] = useState('');
	const [matKhau, setMatKhau] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [vaiTro, setVaiTro] = useState<'phuHuynh' | 'hocSinh'>('phuHuynh');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const onRegister = async () => {
		if (!hoTen || !email || !matKhau || !confirmPassword) {
			Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
			return;
		}

		if (matKhau !== confirmPassword) {
			Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
			return;
		}

		if (matKhau.length < 6) {
			Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
			return;
		}

		try {
			setLoading(true);
			const user = await register(hoTen, email, matKhau, vaiTro);
			
			switch (user.vaiTro) {
				case 'admin':
					router.replace('/admin' as any);
					break;
				case 'phuHuynh':
					router.replace('/parent' as any);
					break;
				case 'hocSinh':
					router.replace('/child' as any);
					break;
				default:
					router.replace('/(tabs)/index' as any);
			}
		} catch (e: any) {
			Alert.alert('Lỗi đăng ký', e.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				<View style={styles.header}>
					<View style={styles.logoContainer}>
						<Ionicons name="school" size={60} color="#4CAF50" />
					</View>
					<Text style={styles.title}>Tạo tài khoản mới</Text>
					<Text style={styles.subtitle}>Tham gia cùng chúng tôi để học tập vui vẻ</Text>
				</View>

				<View style={styles.form}>
					<View style={styles.inputContainer}>
						<Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="Họ và tên"
							value={hoTen}
							onChangeText={setHoTen}
							autoCapitalize="words"
						/>
					</View>

					<View style={styles.inputContainer}>
						<Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="Email"
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="Mật khẩu"
							value={matKhau}
							onChangeText={setMatKhau}
							secureTextEntry={!showPassword}
						/>
						<TouchableOpacity
							style={styles.eyeIcon}
							onPress={() => setShowPassword(!showPassword)}
						>
							<Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
						</TouchableOpacity>
					</View>

					<View style={styles.inputContainer}>
						<Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="Xác nhận mật khẩu"
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							secureTextEntry={!showConfirmPassword}
						/>
						<TouchableOpacity
							style={styles.eyeIcon}
							onPress={() => setShowConfirmPassword(!showConfirmPassword)}
						>
							<Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#666" />
						</TouchableOpacity>
					</View>

					<View style={styles.roleContainer}>
						<Text style={styles.roleLabel}>Loại tài khoản:</Text>
						<View style={styles.roleButtons}>
							<TouchableOpacity
								style={[styles.roleButton, vaiTro === 'phuHuynh' && styles.roleButtonActive]}
								onPress={() => setVaiTro('phuHuynh')}
							>
								<Ionicons name="people" size={20} color={vaiTro === 'phuHuynh' ? '#fff' : '#4CAF50'} />
								<Text style={[styles.roleButtonText, vaiTro === 'phuHuynh' && styles.roleButtonTextActive]}>
									Phụ huynh
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.roleButton, vaiTro === 'hocSinh' && styles.roleButtonActive]}
								onPress={() => setVaiTro('hocSinh')}
							>
								<Ionicons name="happy" size={20} color={vaiTro === 'hocSinh' ? '#fff' : '#4CAF50'} />
								<Text style={[styles.roleButtonText, vaiTro === 'hocSinh' && styles.roleButtonTextActive]}>
									Trẻ em
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					<TouchableOpacity
						style={[styles.registerButton, loading && styles.registerButtonDisabled]}
						onPress={onRegister}
						disabled={loading}
					>
						<Text style={styles.registerButtonText}>
							{loading ? 'Đang đăng ký...' : 'Đăng ký'}
						</Text>
					</TouchableOpacity>

					<View style={styles.divider}>
						<View style={styles.dividerLine} />
						<Text style={styles.dividerText}>hoặc</Text>
						<View style={styles.dividerLine} />
			</View>

					<View style={styles.loginContainer}>
						<Text style={styles.loginText}>Đã có tài khoản? </Text>
			<Link href="/auth/login" asChild>
							<TouchableOpacity>
								<Text style={styles.loginLink}>Đăng nhập ngay</Text>
							</TouchableOpacity>
			</Link>
		</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
	},
	scrollContainer: {
		flexGrow: 1,
		justifyContent: 'center',
		padding: 20,
	},
	header: {
		alignItems: 'center',
		marginBottom: 40,
	},
	logoContainer: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#E8F5E8',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#2E7D32',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
	},
	form: {
		width: '100%',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 12,
		marginBottom: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	inputIcon: {
		marginRight: 12,
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: '#333',
	},
	eyeIcon: {
		padding: 4,
	},
	roleContainer: {
		marginBottom: 24,
	},
	roleLabel: {
		fontSize: 16,
		fontWeight: '500',
		color: '#333',
		marginBottom: 12,
	},
	roleButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	roleButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#4CAF50',
		backgroundColor: '#fff',
	},
	roleButtonActive: {
		backgroundColor: '#4CAF50',
	},
	roleButtonText: {
		marginLeft: 8,
		fontSize: 14,
		fontWeight: '500',
		color: '#4CAF50',
	},
	roleButtonTextActive: {
		color: '#fff',
	},
	registerButton: {
		backgroundColor: '#4CAF50',
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center',
		marginBottom: 24,
		shadowColor: '#4CAF50',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	registerButtonDisabled: {
		backgroundColor: '#A5D6A7',
	},
	registerButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	divider: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 24,
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: '#E0E0E0',
	},
	dividerText: {
		marginHorizontal: 16,
		color: '#666',
		fontSize: 14,
	},
	loginContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	loginText: {
		color: '#666',
		fontSize: 14,
	},
	loginLink: {
		color: '#4CAF50',
		fontSize: 14,
		fontWeight: 'bold',
	},
});
