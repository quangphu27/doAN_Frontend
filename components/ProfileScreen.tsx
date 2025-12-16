import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const formatBirthDateForDisplay = (raw: string): string => {
  if (!raw) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (!isNaN(date.getTime())) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  return raw;
};

const normalizeBirthDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.hoTen || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.thongTinCaNhan?.soDienThoai || '');
  const [address, setAddress] = useState(user?.thongTinCaNhan?.diaChi || '');
  const [birthDate, setBirthDate] = useState(
    formatBirthDateForDisplay(user?.thongTinCaNhan?.ngaySinh || '')
  );
  const [gender, setGender] = useState<'nam' | 'nu' | 'khac'>(user?.thongTinCaNhan?.gioiTinh || 'nam');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Họ tên không được để trống');
      return;
    }
    try {
      setSavingProfile(true);
      await updateProfile({
        hoTen: fullName.trim(),
        email: email.trim(),
        thongTinCaNhan: {
          ...(user.thongTinCaNhan || {}),
          soDienThoai: phone.trim() || undefined,
          diaChi: address.trim() || undefined,
          ngaySinh: birthDate.trim() || undefined,
          gioiTinh: gender
        }
      } as any);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân');
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể cập nhật thông tin');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ tên</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ tên"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.rowItem]}>
              <Text style={styles.label}>Giới tính</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, gender === 'nam' && styles.chipActive]}
                  onPress={() => setGender('nam')}
                >
                  <Text style={[styles.chipText, gender === 'nam' && styles.chipTextActive]}>Nam</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, gender === 'nu' && styles.chipActive]}
                  onPress={() => setGender('nu')}
                >
                  <Text style={[styles.chipText, gender === 'nu' && styles.chipTextActive]}>Nữ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, gender === 'khac' && styles.chipActive]}
                  onPress={() => setGender('khac')}
                >
                  <Text style={[styles.chipText, gender === 'khac' && styles.chipTextActive]}>Khác</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.inputGroup, styles.rowItem]}>
              <Text style={styles.label}>Ngày sinh</Text>
              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={(text) => setBirthDate(normalizeBirthDateInput(text))}
                placeholder="dd/MM/yyyy"
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Nhập địa chỉ"
              multiline
            />
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, savingProfile && styles.buttonDisabled]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            <Text style={styles.primaryButtonText}>{savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  content: {
    flex: 1
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12
  },
  inputGroup: {
    marginBottom: 12
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top'
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  secondaryButton: {
    marginTop: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  rowItem: {
    flex: 1
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff'
  },
  chipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50'
  },
  chipText: {
    fontSize: 13,
    color: '#555'
  },
  chipTextActive: {
    color: '#2E7D32',
    fontWeight: '600'
  }
});


