import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';

type Step = 'email' | 'otp' | 'password';

export default function ForgotScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (lockedUntil) {
      const updateCountdown = () => {
        const now = new Date();
        const diff = Math.max(0, Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000));
        setCountdown(diff);
        
        if (diff === 0) {
          setLockedUntil(null);
          setCanResend(true);
        }
      };
      
      updateCountdown();
      interval = setInterval(updateCountdown, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockedUntil]);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.auth.forgot(email);
      if (response.success) {
        setSuccess('Mã xác nhận đã được gửi đến email của bạn');
        setStep('otp');
        setCanResend(false);
        setTimeout(() => setCanResend(true), 60000);
      }
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };
  //Giao diện nhập email và kiểm tra OTP
  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 số');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.auth.verifyOTP(email, otp);
      if (response.success) {
        setSuccess('Mã OTP hợp lệ');
        setStep('password');
        setRemainingAttempts(null);
      }
    } catch (e: any) {
      const errorMessage = e.message || 'Có lỗi xảy ra';
      setError(errorMessage);

      if (errorMessage.includes('đợi')) {
        const match = errorMessage.match(/(\d+)/);
        if (match) {
          const seconds = parseInt(match[1]);
          const lockedDate = new Date(Date.now() + seconds * 1000);
          setLockedUntil(lockedDate);
          setCanResend(false);
          setCountdown(seconds);
        }
      }

      if (errorMessage.includes('còn')) {
        const match = errorMessage.match(/(\d+)/);
        if (match) {
          setRemainingAttempts(parseInt(match[1]));
        }
      }
    } finally {
      setLoading(false);
    }
  };
  // đúng thì chuyển qua giao diện đổi mật khẩu
  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.auth.reset(email, otp, newPassword);
      if (response.success) {
        Alert.alert(
          'Thành công',
          'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
          [
            {
              text: 'Đăng nhập',
              onPress: () => router.replace('/auth/login')
            }
          ]
        );
      }
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetToEmail = () => {
    setStep('email');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    setRemainingAttempts(null);
    setLockedUntil(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2196F3', '#1976D2', '#1565C0']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Quên mật khẩu</Text>
            <Text style={styles.headerSubtitle}>
              {step === 'email' && 'Nhập email để nhận mã xác nhận'}
              {step === 'otp' && 'Nhập mã OTP đã được gửi đến email'}
              {step === 'password' && 'Nhập mật khẩu mới'}
            </Text>
          </View>
        </View>
        
        <View style={styles.stepIndicator}>
          <View style={[styles.step, step === 'email' && styles.stepActive, (step === 'otp' || step === 'password') && styles.stepCompleted]}>
            <Text style={[styles.stepNumber, (step === 'otp' || step === 'password') && styles.stepNumberCompleted]}>1</Text>
            <Text style={[styles.stepLabel, step === 'email' && styles.stepLabelActive]}>Email</Text>
          </View>
          <View style={[styles.stepLine, (step === 'otp' || step === 'password') && styles.stepLineCompleted]} />
          <View style={[styles.step, step === 'otp' && styles.stepActive, step === 'password' && styles.stepCompleted]}>
            <Text style={[styles.stepNumber, step === 'password' && styles.stepNumberCompleted]}>2</Text>
            <Text style={[styles.stepLabel, step === 'otp' && styles.stepLabelActive]}>OTP</Text>
          </View>
          <View style={[styles.stepLine, step === 'password' && styles.stepLineCompleted]} />
          <View style={[styles.step, step === 'password' && styles.stepActive]}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={[styles.stepLabel, step === 'password' && styles.stepLabelActive]}>Mật khẩu</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {step === 'email' && (
              <>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={22} color="#2196F3" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập email của bạn"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError(null);
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable={!loading}
                  />
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color="#F44336" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {success && (
                  <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.successText}>{success}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Gửi mã OTP</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'otp' && (
              <>
                <View style={styles.otpInfoContainer}>
                  <Ionicons name="mail" size={48} color="#2196F3" />
                  <Text style={styles.otpInfoText}>Mã OTP đã được gửi đến</Text>
                  <Text style={styles.otpEmailText}>{email}</Text>
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="keypad-outline" size={22} color="#2196F3" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="Nhập OTP"
                    placeholderTextColor="#999"
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                      setError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading && !lockedUntil}
                    autoFocus
                  />
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color="#F44336" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {remainingAttempts !== null && (
                  <View style={styles.warningContainer}>
                    <Ionicons name="warning" size={18} color="#FF9800" />
                    <Text style={styles.warningText}>
                      Bạn còn {remainingAttempts} lần thử
                    </Text>
                  </View>
                )}

                {lockedUntil && countdown > 0 && (
                  <View style={styles.lockedContainer}>
                    <Ionicons name="lock-closed" size={18} color="#F44336" />
                    <Text style={styles.lockedText}>
                      Vui lòng đợi {formatTime(countdown)} trước khi thử lại
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.button,
                    (loading || lockedUntil) && styles.buttonDisabled
                  ]}
                  onPress={handleVerifyOTP}
                  disabled={loading || !!lockedUntil}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Xác nhận OTP</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleSendOTP}
                  disabled={!canResend || loading || !!lockedUntil}
                >
                  <Ionicons 
                    name="refresh" 
                    size={16} 
                    color={(!canResend || loading || !!lockedUntil) ? '#ccc' : '#2196F3'} 
                  />
                  <Text style={[
                    styles.resendText,
                    (!canResend || loading || !!lockedUntil) && styles.resendTextDisabled
                  ]}>
                    {lockedUntil && countdown > 0 
                      ? `Gửi lại sau ${formatTime(countdown)}`
                      : 'Gửi lại mã OTP'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={resetToEmail}
                >
                  <Ionicons name="arrow-back" size={16} color="#666" />
                  <Text style={styles.backText}>Quay lại nhập email</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'password' && (
              <>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                  <Text style={styles.successMessage}>Mã OTP hợp lệ!</Text>
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={22} color="#2196F3" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu mới"
                    placeholderTextColor="#999"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      setError(null);
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={22} color="#2196F3" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Xác nhận mật khẩu"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setError(null);
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color="#F44336" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep('otp')}
                >
                  <Ionicons name="arrow-back" size={16} color="#666" />
                  <Text style={styles.backText}>Quay lại nhập OTP</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerText}>
                  Nhớ mật khẩu? <Text style={styles.footerLink}>Đăng nhập</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerBackButton: {
    marginRight: 12,
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTextContainer: {
    flex: 1,
    paddingTop: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    lineHeight: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  step: {
    alignItems: 'center',
    width: 60,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 4,
  },
  stepNumberCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepActive: {
    transform: [{ scale: 1.1 }],
  },
  stepCompleted: {
    opacity: 1,
  },
  stepLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
    marginBottom: 20,
  },
  stepLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  otpInput: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 8,
    textAlign: 'center',
  },
  otpInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  otpInfoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  otpEmailText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  successMessage: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    color: '#4CAF50',
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    color: '#FF9800',
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  lockedText: {
    color: '#F44336',
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
    fontWeight: '600',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  resendText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  resendTextDisabled: {
    color: '#ccc',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  backText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 6,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#2196F3',
    fontWeight: '600',
  },
});
