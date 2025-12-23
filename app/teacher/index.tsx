import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

const { width } = Dimensions.get('window');

interface Class {
  _id: string;
  tenLop: string;
  moTa?: string;
  maLop: string;
  hocSinh: Array<{
    _id: string;
    hoTen: string;
  }>;
  baiTap: Array<{
    _id: string;
    tieuDe: string;
  }>;
  troChoi: Array<{
    _id: string;
    tieuDe: string;
  }>;
}

export default function TeacherHome() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalLessons: 0,
    totalGames: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadClasses(), loadStats()]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await api.classes.list();
      if (response && response.success) {
        if (response.data && response.data.classes) {
          setClasses(response.data.classes);
        } else if (Array.isArray(response.data)) {
          setClasses(response.data);
        } else {
          setClasses([]);
        }
      } else {
        setClasses([]);
      }
    } catch (error: any) {
      console.error('Error loading classes:', error);
      setClasses([]);
    }
  };

  const loadStats = async () => {
    try {
      const allClasses = classes.length > 0 ? classes : await (async () => {
        const response = await api.classes.list();
        return (response.data?.classes || response.data || []);
      })();

      const totalClasses = allClasses.length;
      let totalStudents = 0;
      let totalLessons = 0;
      let totalGames = 0;

      allClasses.forEach((classItem: Class) => {
        totalStudents += classItem.hocSinh?.length || 0;
        totalLessons += classItem.baiTap?.length || 0;
        totalGames += classItem.troChoi?.length || 0;
      });

      setStats({
        totalClasses,
        totalStudents,
        totalLessons,
        totalGames
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleViewClass = (classItem: Class) => {
    router.push({
      pathname: '/teacher/class-details',
      params: { classId: classItem._id }
    } as any);
  };

  const handleViewProgress = (classItem: Class) => {
    router.push({
      pathname: '/teacher/class-progress',
      params: { classId: classItem._id }
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Vui lòng đăng nhập</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xin chào!</Text>
            <Text style={styles.name}>{user?.hoTen}</Text>
            <Text style={styles.subtitle}>Giáo viên</Text>
          </View>
          <View style={styles.profileButtonContainer}>
            <TouchableOpacity onPress={() => setProfileMenuVisible((v) => !v)}>
              <Ionicons name="person-circle-outline" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="school" size={30} color="#4CAF50" />
              <Text style={styles.statValue}>{stats.totalClasses}</Text>
              <Text style={styles.statLabel}>Lớp học</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people" size={30} color="#2196F3" />
              <Text style={styles.statValue}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Học sinh</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="book" size={30} color="#FF9800" />
              <Text style={styles.statValue}>{stats.totalLessons}</Text>
              <Text style={styles.statLabel}>Bài tập</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="game-controller" size={30} color="#F44336" />
              <Text style={styles.statValue}>{stats.totalGames}</Text>
              <Text style={styles.statLabel}>Trò chơi</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lớp học của tôi ({classes.length})</Text>
          {classes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có lớp học nào</Text>
              <Text style={styles.emptySubtext}>Admin sẽ tạo lớp và thêm bạn vào</Text>
            </View>
          ) : (
            classes.map((classItem) => (
              <TouchableOpacity
                key={classItem._id}
                style={styles.classCard}
                onPress={() => handleViewClass(classItem)}
              >
                <View style={styles.classHeader}>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{classItem.tenLop}</Text>
                    <Text style={styles.classCode}>Mã lớp: {classItem.maLop}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                </View>

                {classItem.moTa && (
                  <Text style={styles.classDescription}>{classItem.moTa}</Text>
                )}

                <View style={styles.classStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="people" size={16} color="#666" />
                    <Text style={styles.statText}>
                      {classItem.hocSinh?.length || 0} học sinh
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="book" size={16} color="#666" />
                    <Text style={styles.statText}>
                      {classItem.baiTap?.length || 0} bài tập
                    </Text>
                  </View>
                </View>

                <View style={styles.classActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewClass(classItem)}
                  >
                    <Ionicons name="eye" size={18} color="#2196F3" />
                    <Text style={styles.actionText}>Chi tiết</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewProgress(classItem)}
                  >
                    <Ionicons name="bar-chart" size={18} color="#4CAF50" />
                    <Text style={styles.actionText}>Kết quả</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={profileMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileMenuVisible(false)}
        >
          <View style={styles.profileMenuContainer}>
            <View style={styles.profileMenu} onStartShouldSetResponder={() => true}>
              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => {
                  setProfileMenuVisible(false);
                  router.push('/teacher/profile' as any);
                }}
              >
                <Ionicons name="person" size={18} color="#333" />
                <Text style={styles.profileMenuText}>Xem thông tin cá nhân</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => {
                  setProfileMenuVisible(false);
                  router.push('/teacher/change-password' as any);
                }}
              >
                <Ionicons name="key" size={18} color="#333" />
                <Text style={styles.profileMenuText}>Đổi mật khẩu</Text>
              </TouchableOpacity>
              <View style={styles.profileMenuDivider} />
              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => {
                  setProfileMenuVisible(false);
                  logout();
                }}
              >
                <Ionicons name="log-out" size={18} color="#E53935" />
                <Text style={[styles.profileMenuText, { color: '#E53935' }]}>
                  Đăng xuất
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2
  },
  content: {
    flex: 1
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#666'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    fontWeight: '600'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center'
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  classDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  classStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
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
  classActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  profileButtonContainer: {
    position: 'relative',
    zIndex: 1
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: 20
  },
  profileMenuContainer: {
    alignItems: 'flex-end'
  },
  profileMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8
  },
  profileMenuText: {
    fontSize: 14,
    color: '#333'
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 6
  }
});
