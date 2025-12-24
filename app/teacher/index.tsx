import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function TeacherHome() {
  const { user, logout } = useAuth();
  const router = useRouter();
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
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.classes.list();
      const allClasses = (response.data?.classes || response.data || []);

      const totalClasses = allClasses.length;
      let totalStudents = 0;
      let totalLessons = 0;
      let totalGames = 0;

      allClasses.forEach((classItem: any) => {
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
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
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
          <View>
            <TouchableOpacity onPress={() => setProfileMenuVisible(true)}>
              <Ionicons name="person-circle-outline" size={30} color="#fff" />
            </TouchableOpacity>
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
                <View style={styles.profileMenu}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setProfileMenuVisible(false);
                      router.push('/teacher/profile' as any);
                    }}
                  >
                    <Ionicons name="person-outline" size={20} color="#333" />
                    <Text style={styles.menuItemText}>Cập nhật thông tin cá nhân</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setProfileMenuVisible(false);
                      router.push('/teacher/change-password' as any);
                    }}
                  >
                    <Ionicons name="lock-closed-outline" size={20} color="#333" />
                    <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, styles.menuItemDanger]}
                    onPress={() => {
                      setProfileMenuVisible(false);
                      logout();
                    }}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#F44336" />
                    <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Đăng xuất</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
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
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/teacher/classes' as any)}
            >
              <Ionicons name="school" size={32} color="#4CAF50" />
              <Text style={styles.actionTitle}>Lớp học</Text>
              <Text style={styles.actionSubtitle}>Quản lý lớp học</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/teacher/notifications' as any)}
            >
              <Ionicons name="notifications" size={32} color="#FF9800" />
              <Text style={styles.actionTitle}>Thông báo</Text>
              <Text style={styles.actionSubtitle}>Xem thông báo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/teacher/profile' as any)}
            >
              <Ionicons name="person" size={32} color="#2196F3" />
              <Text style={styles.actionTitle}>Tài khoản</Text>
              <Text style={styles.actionSubtitle}>Thông tin cá nhân</Text>
            </TouchableOpacity>
          </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 48) / 3,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20
  },
  profileMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 4
  },
  menuItemText: {
    fontSize: 15,
    color: '#333'
  },
  menuItemTextDanger: {
    color: '#F44336'
  }
});
