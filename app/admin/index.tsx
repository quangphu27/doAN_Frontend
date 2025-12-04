import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Pressable,
  StyleSheet, 
  ScrollView, 
  Alert,
  Dimensions,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AdminHome() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tải tất cả dữ liệu cần thiết cho trang chủ admin
  // Sử dụng Promise.all để tải song song các dữ liệu: thống kê, người dùng gần đây, và trẻ em đang học
  // Hiển thị loading indicator trong quá trình tải và thông báo lỗi nếu có
  const load = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadChildren()
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Tải thống kê tổng quan hệ thống từ API
  // Bao gồm: tổng số người dùng, trẻ em, bài học, trò chơi, người dùng hoạt động, bài học đã hoàn thành
  // Nếu lỗi, đặt giá trị mặc định là 0 cho tất cả các thống kê
  const loadStats = async () => {
    try {
      const response = await api.admin.stats();
      setStats(response.data || {
        totalUsers: 0,
        totalChildren: 0,
        totalLessons: 0,
        totalGames: 0,
        activeUsers: 0,
        completedLessons: 0
      });
    } catch (error: any) {
      Alert.alert('Lỗi', `Không thể tải thống kê: ${error.message || 'Lỗi không xác định'}`);
      setStats({
        totalUsers: 0,
        totalChildren: 0,
        totalLessons: 0,
        totalGames: 0,
        activeUsers: 0,
        completedLessons: 0
      });
    }
  };

  // Tải danh sách 3 người dùng gần đây nhất từ API
  // Sử dụng limit: 3 và page: 1 để chỉ lấy 3 người dùng đầu tiên (đã được sắp xếp theo createdAt từ backend)
  // Nếu lỗi, đặt danh sách rỗng để tránh crash
  const loadUsers = async () => {
    try {
      const response = await api.admin.users({ limit: 3, page: 1 });
      setUsers(response.data || []);
    } catch (error) {
      setUsers([]);
    }
  };

  // Tải danh sách trẻ em đang học (có hoạt động trong vòng 20 phút)
  // Quy trình:
  // 1. Lấy tất cả trẻ em từ API (limit: 100 để đảm bảo không bỏ sót)
  // 2. Với mỗi trẻ, gọi API getLastActivityTime để kiểm tra hoạt động gần đây
  // 3. Lọc những trẻ có isActive = true và startTime trong vòng 20 phút, hoặc có lastActivityTime trong vòng 20 phút
  // 4. Sắp xếp theo thời gian hoạt động gần đây nhất (mới nhất trước)
  // 5. Chỉ lấy 3 trẻ đầu tiên để hiển thị
  const loadChildren = async () => {
    try {
      const response = await api.admin.children({ limit: 100, page: 1 });
      const allChildren = response.data || [];
      
      const now = new Date();
      
      const activeChildren = await Promise.all(
        allChildren.map(async (child: any) => {
          try {
            const activityResponse = await api.appSessions.getLastActivityTime(child.id || child._id);
            const activityData = activityResponse.data || {};
            
            if (activityData.isActive) {
              const lastActivityTime = new Date(activityData.lastActivityTime);
              const diffInMinutes = (now.getTime() - lastActivityTime.getTime()) / (1000 * 60);
              
              if (diffInMinutes <= 20) {
                return { ...child, lastActivityTime, isCurrentlyActive: true };
              }
            } else if (activityData.lastActivityTime) {
              const lastActivityTime = new Date(activityData.lastActivityTime);
              const diffInMinutes = (now.getTime() - lastActivityTime.getTime()) / (1000 * 60);
              
              if (diffInMinutes <= 20) {
                return { ...child, lastActivityTime, isCurrentlyActive: false };
              }
            }
            
            return null;
          } catch (error) {
            return null;
          }
        })
      );
      
      const filteredChildren = activeChildren
        .filter((child): child is any => child !== null)
        .sort((a, b) => {
          const timeA = a.lastActivityTime ? new Date(a.lastActivityTime).getTime() : 0;
          const timeB = b.lastActivityTime ? new Date(b.lastActivityTime).getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, 3);
      
      setChildren(filteredChildren);
    } catch (error: any) {
      setChildren([]);
    }
  };


  useEffect(() => {
    load();
  }, []);

  // Làm mới dữ liệu khi người dùng kéo xuống (pull-to-refresh)
  // Đặt trạng thái refreshing = true để hiển thị loading indicator
  // Gọi lại hàm load() để tải lại tất cả dữ liệu
  // Sau khi hoàn thành, đặt refreshing = false để ẩn loading indicator
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9C27B0" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  // Điều hướng đến trang quản lý người dùng
  // Sử dụng expo-router để chuyển màn hình sang /admin/users
  const handleManageUsers = () => {
    router.push('/admin/users');
  };

  // Điều hướng đến trang quản lý bài học
  // Sử dụng expo-router để chuyển màn hình sang /admin/lessons
  const handleManageLessons = () => {
    router.push('/admin/lessons');
  };

  // Điều hướng đến trang quản lý trò chơi
  // Sử dụng expo-router để chuyển màn hình sang /admin/games
  const handleManageGames = () => {
    router.push('/admin/games');
  };

  // Điều hướng đến trang gửi thông báo
  // Sử dụng expo-router để chuyển màn hình sang /admin/notifications
  const handleSendNotification = () => {
    router.push('/admin/notifications');
  };


  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >

      <LinearGradient
        colors={['#9C27B0', '#7B1FA2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Xin chào Admin!</Text>
            <Text style={styles.name}>{user?.hoTen}</Text>
            <Text style={styles.subtitle}>Quản lý hệ thống học tập</Text>
          </View>
          <TouchableOpacity style={styles.avatarContainer}>
            <Ionicons name="shield" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tổng quan hệ thống</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={30} color="#2196F3" />
            <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Người dùng</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="happy" size={30} color="#4CAF50" />
            <Text style={styles.statValue}>{stats?.totalChildren || 0}</Text>
            <Text style={styles.statLabel}>Trẻ em</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book" size={30} color="#FF9800" />
            <Text style={styles.statValue}>{stats?.totalLessons || 0}</Text>
            <Text style={styles.statLabel}>Bài học</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="game-controller" size={30} color="#F44336" />
            <Text style={styles.statValue}>{stats?.totalGames || 0}</Text>
            <Text style={styles.statLabel}>Trò chơi</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quản lý hệ thống</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handleManageUsers}>
            <Ionicons name="people" size={40} color="#2196F3" />
            <Text style={styles.actionTitle}>Người dùng</Text>
            <Text style={styles.actionSubtitle}>Quản lý tài khoản</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleManageLessons}>
            <Ionicons name="book" size={40} color="#FF9800" />
            <Text style={styles.actionTitle}>Bài học</Text>
            <Text style={styles.actionSubtitle}>Quản lý bài học</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleManageGames}>
            <Ionicons name="game-controller" size={40} color="#F44336" />
            <Text style={styles.actionTitle}>Trò chơi</Text>
            <Text style={styles.actionSubtitle}>Quản lý trò chơi</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/classes' as any)}>
            <Ionicons name="school" size={40} color="#9C27B0" />
            <Text style={styles.actionTitle}>Lớp học</Text>
            <Text style={styles.actionSubtitle}>Quản lý lớp học</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Người dùng gần đây</Text>
        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={40} color="#ccc" />
            <Text style={styles.emptyStateText}>Chưa có người dùng nào</Text>
          </View>
        ) : (
          <View style={styles.usersList}>
            {users.map((user, index) => (
              <View key={user.id || user._id || `user-${index}`} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={20} color="#2196F3" />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.hoTen}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                </View>
                <View style={[styles.userStatus, { backgroundColor: user.trangThai ? '#4CAF50' : '#F44336' }]}>
                  <Text style={styles.userStatusText}>{user.isActive ? 'Hoạt động' : 'Không hoạt động'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trẻ em đang học</Text>
        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="happy" size={40} color="#ccc" />
            <Text style={styles.emptyStateText}>Không có trẻ đang học</Text>
            <Text style={[styles.emptyStateText, { fontSize: 12, marginTop: 4, color: '#999' }]}>
              (Trẻ có hoạt động trong vòng 20 phút gần đây)
            </Text>
          </View>
        ) : (
          <View style={styles.childrenList}>
            {children.map((child, index) => {
              const lastActivityTime = child.lastActivityTime ? new Date(child.lastActivityTime) : null;
              const now = new Date();
              const diffInMinutes = lastActivityTime 
                ? Math.floor((now.getTime() - lastActivityTime.getTime()) / (1000 * 60))
                : null;
              
              return (
                <View key={child.id || child._id || `child-${index}`} style={styles.childCard}>
                  <View style={styles.childInfo}>
                    <View style={styles.childAvatar}>
                      <Ionicons name="happy" size={20} color="#4CAF50" />
                    </View>
                    <View style={styles.childDetails}>
                      <Text style={styles.childName}>{child.name}</Text>
                      <Text style={styles.childParent}>{child.email}</Text>
                      <Text style={styles.childLevel}>{child.learningLevel}</Text>
                    </View>
                  </View>
                  <View style={styles.childProgress}>
                    <Text style={[styles.childProgressText, { color: child.isCurrentlyActive ? '#4CAF50' : '#FF9800' }]}>
                      {child.isCurrentlyActive 
                        ? `Đang học (${diffInMinutes !== null ? diffInMinutes + ' phút' : ''})`
                        : `Vừa học xong (${diffInMinutes !== null ? diffInMinutes + ' phút trước' : ''})`
                      }
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        
        
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleSendNotification}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications" size={24} color="#FF9800" />
            <Text style={styles.quickActionText}>Gửi thông báo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={logout}>
            <Ionicons name="log-out" size={24} color="#F44336" />
            <Text style={styles.quickActionText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E1BEE7',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  usersList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  userStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userStatusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  childrenList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  childParent: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  childProgress: {
    alignItems: 'flex-end',
  },
  childProgressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  childLevel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    color: '#2196F3',
    marginRight: 4,
  },
  childProgressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  childProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 80,
    minWidth: 80,
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});
