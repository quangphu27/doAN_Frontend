import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';

interface Class {
  _id: string;
  tenLop: string;
  moTa?: string;
  maLop: string;
  giaoVien: {
    _id: string;
    hoTen: string;
    email: string;
  };
  hocSinh: Array<{
    _id: string;
    hoTen: string;
    ngaySinh?: string;
    gioiTinh: string;
  }>;
  baiTap: Array<{
    _id: string;
    tieuDe: string;
    danhMuc: string;
  }>;
  troChoi: Array<{
    _id: string;
    tieuDe: string;
    loai: string;
  }>;
  trangThai: boolean;
}

export default function ClassManagement() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    tenLop: '',
    moTa: '',
    emailGiaoVien: ''
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await api.classes.list();
      setClasses(response.data.classes || []);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách lớp');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  const handleCreate = () => {
    setFormData({ tenLop: '', moTa: '', emailGiaoVien: '' });
    setSelectedClass(null);
    setModalVisible(true);
  };

  const handleEdit = (classItem: Class) => {
    setFormData({
      tenLop: classItem.tenLop,
      moTa: classItem.moTa || '',
      emailGiaoVien: classItem.giaoVien.email
    });
    setSelectedClass(classItem);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.tenLop || !formData.emailGiaoVien) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      if (selectedClass) {
        await api.classes.update(selectedClass._id, {
          tenLop: formData.tenLop,
          moTa: formData.moTa
        });
        Alert.alert('Thành công', 'Đã cập nhật lớp');
      } else {
        await api.classes.create({
          tenLop: formData.tenLop,
          moTa: formData.moTa,
          emailGiaoVien: formData.emailGiaoVien
        });
        Alert.alert('Thành công', 'Đã tạo lớp mới');
      }
      setModalVisible(false);
      loadClasses();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu lớp');
    }
  };

  const handleDelete = (classItem: Class) => {
    Alert.alert('Xác nhận', `Bạn có chắc muốn xóa lớp "${classItem.tenLop}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.classes.delete(classItem._id);
            Alert.alert('Thành công', 'Đã xóa lớp');
            loadClasses();
          } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể xóa lớp');
          }
        }
      }
    ]);
  };

  const handleViewDetails = (classItem: Class) => {
    router.push({
      pathname: '/admin/class-details',
      params: { classId: classItem._id }
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý lớp học</Text>
        <TouchableOpacity onPress={handleCreate}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {classes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có lớp học nào</Text>
          </View>
        ) : (
          classes.map((classItem) => (
            <TouchableOpacity
              key={classItem._id}
              style={styles.classCard}
              onPress={() => handleViewDetails(classItem)}
            >
              <View style={styles.classHeader}>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{classItem.tenLop}</Text>
                  <Text style={styles.classCode}>Mã lớp: {classItem.maLop}</Text>
                </View>
                <View style={styles.classActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEdit(classItem)}
                  >
                    <Ionicons name="pencil" size={20} color="#2196F3" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(classItem)}
                  >
                    <Ionicons name="trash" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>

              {classItem.moTa && (
                <Text style={styles.classDescription}>{classItem.moTa}</Text>
              )}

              <View style={styles.classStats}>
                <View style={styles.statItem}>
                  <Ionicons name="person" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {classItem.giaoVien.hoTen}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {classItem.hocSinh.length} học sinh
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="book" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {classItem.baiTap.length} bài tập
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedClass ? 'Chỉnh sửa lớp' : 'Tạo lớp mới'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên lớp *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.tenLop}
                  onChangeText={(text) => setFormData({ ...formData, tenLop: text })}
                  placeholder="Nhập tên lớp"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mô tả</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.moTa}
                  onChangeText={(text) => setFormData({ ...formData, moTa: text })}
                  placeholder="Nhập mô tả"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {!selectedClass && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email giáo viên *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.emailGiaoVien}
                    onChangeText={(text) => setFormData({ ...formData, emailGiaoVien: text })}
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  content: {
    flex: 1
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16
  },
  classCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  classInfo: {
    flex: 1
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  classCode: {
    fontSize: 14,
    color: '#666'
  },
  classActions: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    padding: 8
  },
  classDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  classStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statText: {
    fontSize: 14,
    color: '#666'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  form: {
    gap: 16
  },
  inputGroup: {
    gap: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f5f5f5'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  saveButton: {
    backgroundColor: '#4CAF50'
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  }
});

