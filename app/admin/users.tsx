import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';

interface User {
  id?: string;
  _id?: string;
  hoTen: string;
  email: string;
  vaiTro: 'admin' | 'phuHuynh' | 'hocSinh' | 'giaoVien';
  trangThai: boolean;
  createdAt: string;
  thongTinCaNhan?: {
    anhDaiDien?: string;
    soDienThoai?: string;
    diaChi?: string;
    ngaySinh?: string;
    gioiTinh?: 'nam' | 'nu' | 'khac';
  };
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [classesModalVisible, setClassesModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [teacherClassesLoading, setTeacherClassesLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [page, searchText, filterRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (searchText) params.search = searchText;
      if (filterRole !== 'all') params.vaiTro = filterRole;

      const response = await api.users.list(params);
      setUsers(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Làm mới danh sách người dùng khi kéo xuống
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  // Mở modal để chỉnh sửa thông tin người dùng
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setModalVisible(true);
  };

  const handleDeleteUser = (user: User) => {
    const userId = user.id || user._id;
    if (!userId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID người dùng');
      return;
    }

    Alert.alert(
      'Xóa tài khoản',
      `Bạn có chắc chắn muốn xóa tài khoản ${user.hoTen}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.users.delete(userId);
              await loadUsers();
              Alert.alert('Thành công', 'Đã xóa tài khoản');
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa tài khoản');
            }
          }
        }
      ]
    );
  };

  const handleViewTeacherClasses = async (user: User) => {
    if (user.vaiTro !== 'giaoVien') return;
    setSelectedTeacher(user);
    setClassesModalVisible(true);
    setTeacherClassesLoading(true);
    try {
      const response = await api.classes.list({ limit: 500 });
      const classesData = response.data?.classes || response.data || [];
      const filtered = classesData.filter((cls: any) => {
        const teacherId = cls.giaoVien?._id || cls.giaoVien?.id || cls.giaoVien;
        const uid = user.id || user._id;
        return teacherId && uid && teacherId.toString() === uid.toString();
      });
      setTeacherClasses(filtered);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải danh sách lớp của giáo viên');
      setTeacherClasses([]);
    } finally {
      setTeacherClassesLoading(false);
    }
  };

  const handleCreateTeacher = () => {
    setEditingUser(null);
    setModalVisible(true);
  };

  // Lấy màu sắc tương ứng với vai trò người dùng
  const getRoleColor = (vaiTro: string) => {
    switch (vaiTro) {
      case 'admin': return '#9C27B0';
      case 'phuHuynh': return '#2196F3';
      case 'hocSinh': return '#4CAF50';
      case 'giaoVien': return '#FF9800';
      default: return '#666';
    }
  };

  // Lấy icon tương ứng với vai trò người dùng
  const getRoleIcon = (vaiTro: string) => {
    switch (vaiTro) {
      case 'admin': return 'shield';
      case 'phuHuynh': return 'people';
      case 'hocSinh': return 'happy';
      case 'giaoVien': return 'school';
      default: return 'person';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9C27B0" />
        <Text style={styles.loadingText}>Đang tải danh sách người dùng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#9C27B0', '#7B1FA2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Quản lý người dùng</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.addButton} onPress={handleCreateTeacher}>
              <Ionicons name="school" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Giáo viên</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>
            Tổng: {users.length} người dùng
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên, email..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <View style={styles.filterContainer}>
          {['all', 'phuHuynh', 'hocSinh', 'giaoVien'].map((role, index) => (
            <TouchableOpacity
              key={role || `role-${index}`}
              style={[
                styles.filterButton,
                filterRole === role && styles.filterButtonActive
              ]}
              onPress={() => setFilterRole(role)}
            >
              <Text style={[
                styles.filterButtonText,
                filterRole === role && styles.filterButtonTextActive
              ]}>
                {role === 'all' ? 'Tất cả' : 
                 role === 'phuHuynh' ? 'Phụ huynh' : 
                 role === 'hocSinh' ? 'Học sinh' : 
                 'Giáo viên'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {users.map((user, index) => (
          <TouchableOpacity
            key={user.id || user._id || `user-${index}`}
            style={[
            styles.userCard,
            !user.trangThai && styles.userCardInactive
          ]}
            activeOpacity={user.vaiTro === 'giaoVien' ? 0.8 : 1}
            onPress={() => user.vaiTro === 'giaoVien' && handleViewTeacherClasses(user)}
          >
            <View style={styles.userInfo}>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.vaiTro) }]}>
                <Ionicons name={getRoleIcon(user.vaiTro) as any} size={16} color="#fff" />
              </View>
              <View style={styles.userDetails}>
                <View style={styles.userNameRow}>
                  <Text style={[
                    styles.userName,
                    !user.trangThai && styles.userNameInactive
                  ]}>
                    {user.hoTen}
                  </Text>
              {/* Ẩn badge khóa vì đã bỏ chức năng khóa */}
                </View>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userRole}>
                  {user.vaiTro === 'admin' ? 'Quản trị viên' : 
                   user.vaiTro === 'phuHuynh' ? 'Phụ huynh' : 
                   user.vaiTro === 'giaoVien' ? 'Giáo viên' : 'Học sinh'}
                </Text>
              </View>
            </View>
            
            <View style={styles.userActions}>
              {user.vaiTro === 'giaoVien' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleViewTeacherClasses(user)}
                >
                  <Ionicons name="book" size={18} color="#FF9800" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditUser(user)}
              >
                <Ionicons name="pencil" size={18} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteUser(user)}
              >
                <Ionicons name="trash" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <UserModal
        visible={modalVisible}
        user={editingUser}
        onClose={() => setModalVisible(false)}
        onSave={loadUsers}
      />

      <TeacherClassesModal
        visible={classesModalVisible}
        teacher={selectedTeacher}
        classes={teacherClasses}
        loading={teacherClassesLoading}
        onClose={() => setClassesModalVisible(false)}
      />
    </View>
  );
}

function TeacherClassesModal({ visible, teacher, classes, loading, onClose }: {
  visible: boolean;
  teacher: User | null;
  classes: any[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {teacher ? `Lớp của ${teacher.hoTen}` : 'Lớp của giáo viên'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#9C27B0" />
              <Text style={styles.loadingText}>Đang tải danh sách lớp...</Text>
            </View>
          ) : classes.length === 0 ? (
            <View style={styles.emptyClassContainer}>
              <Text style={styles.emptyClassText}>Chưa có lớp nào</Text>
            </View>
          ) : (
            classes.map((cls, idx) => (
              <View key={cls._id || cls.id || `class-${idx}`} style={styles.userCard}>
                <Text style={styles.classTitle}>{cls.tenLop || cls.className || 'Lớp học'}</Text>
                {cls.moTa ? <Text style={styles.classDescription}>{cls.moTa}</Text> : null}
                <Text style={styles.userRole}>Số học sinh: {(cls.hocSinh && cls.hocSinh.length) || 0}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function UserModal({ visible, user, onClose, onSave }: {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    hoTen: '',
    email: '',
    matKhau: '',
    vaiTro: 'phuHuynh' as 'admin' | 'phuHuynh' | 'hocSinh' | 'giaoVien',
    soDienThoai: '',
    diaChi: '',
    gioiTinh: 'nam' as 'nam' | 'nu' | 'khac'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        hoTen: user.hoTen,
        email: user.email,
        matKhau: '',
        vaiTro: user.vaiTro,
        soDienThoai: user.thongTinCaNhan?.soDienThoai || '',
        diaChi: user.thongTinCaNhan?.diaChi || '',
        gioiTinh: user.thongTinCaNhan?.gioiTinh || 'nam'
      });
    } else {
      setFormData({
        hoTen: '',
        email: '',
        matKhau: '',
        vaiTro: 'giaoVien',
        soDienThoai: '',
        diaChi: '',
        gioiTinh: 'nam'
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!formData.hoTen || !formData.email || !formData.matKhau) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }
    
    if (formData.matKhau.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    try {
      const userData: any = {
        hoTen: formData.hoTen,
        email: formData.email,
        matKhau: formData.matKhau,
        vaiTro: formData.vaiTro
      };
      
      if (formData.soDienThoai || formData.diaChi || formData.gioiTinh) {
        userData.thongTinCaNhan = {};
        if (formData.soDienThoai) userData.thongTinCaNhan.soDienThoai = formData.soDienThoai;
        if (formData.diaChi) userData.thongTinCaNhan.diaChi = formData.diaChi;
        if (formData.gioiTinh) userData.thongTinCaNhan.gioiTinh = formData.gioiTinh;
      }
      
      if (user) {
        delete userData.matKhau;
        await api.users.update(user.id || user._id || '', userData);
        Alert.alert('Thành công', 'Đã cập nhật người dùng');
      } else {
        await api.users.create(userData);
        Alert.alert('Thành công', 'Đã tạo tài khoản giáo viên');
      }
      onSave();
      onClose();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu người dùng');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {user ? 'Thông tin người dùng' : 'Tạo tài khoản giáo viên'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên</Text>
            <TextInput
              style={[styles.input, user && styles.inputReadOnly]}
              value={formData.hoTen}
              onChangeText={(text) => setFormData({ ...formData, hoTen: text })}
              placeholder="Nhập tên người dùng"
              editable={!user}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, user && styles.inputReadOnly]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Nhập email"
              keyboardType="email-address"
              editable={!user}
            />
          </View>

          {!user && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu *</Text>
              <TextInput
                style={styles.input}
                value={formData.matKhau}
                onChangeText={(text) => setFormData({ ...formData, matKhau: text })}
                placeholder="Nhập mật khẩu"
                secureTextEntry
              />
            </View>
          )}

          {!user && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vai trò</Text>
              <View style={styles.roleSelector}>
                {['giaoVien'].map((vaiTro, index) => (
                  <TouchableOpacity
                    key={vaiTro || `modal-role-${index}`}
                    style={[
                      styles.roleOption,
                      formData.vaiTro === vaiTro && styles.roleOptionActive
                    ]}
                    onPress={() => setFormData({ ...formData, vaiTro: vaiTro as any })}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      formData.vaiTro === vaiTro && styles.roleOptionTextActive
                    ]}>
                      Giáo viên
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              style={[styles.input, user && styles.inputReadOnly]}
              value={formData.soDienThoai}
              onChangeText={(text) => setFormData({ ...formData, soDienThoai: text })}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              editable={!user}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Địa chỉ</Text>
            <TextInput
              style={[styles.input, user && styles.inputReadOnly]}
              value={formData.diaChi}
              onChangeText={(text) => setFormData({ ...formData, diaChi: text })}
              placeholder="Nhập địa chỉ"
              multiline
              editable={!user}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Giới tính</Text>
            <View style={styles.genderSelector}>
              {['nam', 'nu', 'khac'].map((gioiTinh, index) => (
                <TouchableOpacity
                  key={gioiTinh || `gender-${index}`}
                  style={[
                    styles.genderOption,
                    formData.gioiTinh === gioiTinh && styles.genderOptionActive,
                    user && styles.genderOptionReadOnly
                  ]}
                  onPress={() => !user && setFormData({ ...formData, gioiTinh: gioiTinh as any })}
                >
                  <Text style={[
                    styles.genderOptionText,
                    formData.gioiTinh === gioiTinh && styles.genderOptionTextActive
                  ]}>
                    {gioiTinh === 'nam' ? 'Nam' : 
                     gioiTinh === 'nu' ? 'Nữ' : 'Khác'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Đóng</Text>
          </TouchableOpacity>
          {!user && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Tạo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerStats: {
    alignItems: 'center',
  },
  statsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#9C27B0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  userCardInactive: {
    borderLeftColor: '#F44336',
    opacity: 0.7,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userNameInactive: {
    color: '#999',
  },
  inactiveBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputReadOnly: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: '#9C27B0',
  },
  roleOptionReadOnly: {
    opacity: 0.6,
  },
  roleOptionText: {
    fontSize: 14,
    color: '#666',
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  genderSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: '#2196F3',
  },
  genderOptionReadOnly: {
    opacity: 0.6,
  },
  genderOptionText: {
    fontSize: 14,
    color: '#666',
  },
  genderOptionTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#9C27B0',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  emptyClassContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyClassText: {
    fontSize: 14,
    color: '#666',
  },
  classTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  classDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
