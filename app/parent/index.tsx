import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Dimensions,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface Child {
  id: string;
  name: string;
  birthdate: string;
  avatarUrl?: string;
  learningLevel: string;
}

interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  averageScore: number;
  totalTimeSpent: number;
}

interface Activity {
  id: string;
  type: 'lesson' | 'game' | 'achievement';
  title: string;
  description?: string;
  timeAgo: string;
  score?: number;
  icon: string;
  color: string;
}

export default function ParentHome() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadChildProgress();
      loadRecentActivities();
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const response = await api.children.list();
      const childrenData = response.data || [];
      
      const mappedChildren = childrenData.map((child: any) => ({
        id: child._id || child.id,
        name: child.hoTen || child.name || 'Trẻ',
        birthdate: child.ngaySinh || '',
        avatarUrl: child.anhDaiDien || undefined,
        learningLevel: child.capDoHocTap || 'coBan'
      }));
      
      setChildren(mappedChildren);
      if (mappedChildren.length > 0) {
        setSelectedChild(mappedChildren[0]);
      } else {
        setSelectedChild(null);
      }
    } catch (error: any) {
      console.error('Error loading children:', error);
      Alert.alert('Lỗi', `Không thể tải danh sách trẻ: ${error.message || 'Lỗi không xác định'}`);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChildProgress = async () => {
    if (!selectedChild || !selectedChild.id) {
      return;
    }
    
    try {
      const response = await api.children.getStats(selectedChild.id);
      setProgressStats(response.data || {
        totalLessons: 0,
        completedLessons: 0,
        averageScore: 0,
        totalTimeSpent: 0
      });
    } catch (error: any) {
      console.error('Error loading progress:', error);
      setProgressStats({
        totalLessons: 0,
        completedLessons: 0,
        averageScore: 0,
        totalTimeSpent: 0
      });
    }
  };

  const loadRecentActivities = async () => {
    if (!selectedChild || !selectedChild.id) {
      return;
    }
    
    try {
      const response = await api.children.getActivities(selectedChild.id, { limit: 5 });
      
      let activities = [];
      if (Array.isArray(response.data)) {
        activities = response.data;
      } else if (response.data && Array.isArray(response.data.activities)) {
        activities = response.data.activities;
      } else if (response.data && Array.isArray(response.data.data)) {
        activities = response.data.data;
      } else if (response.data && response.data.activities && Array.isArray(response.data.activities)) {
        activities = response.data.activities;
      }
      
      const mappedActivities = activities.map((activity: any) => {
        const isLesson = activity.loai === 'baiHoc' || !!activity.baiHoc;
        const isGame = activity.loai === 'troChoi' || !!activity.troChoi;
        
        const type = isGame ? 'game' : 'lesson';
        const title = isLesson
          ? (activity.baiHoc?.tieuDe || 'Bài học')
          : isGame
            ? (activity.troChoi?.tieuDe || 'Trò chơi')
            : (activity.title || 'Hoạt động học tập');
        
        const time = activity.ngayHoanThanh || activity.updatedAt || activity.createdAt;
        const score = activity.diemSo ?? activity.score;

        return {
          id: activity._id || activity.id,
          type,
          title,
          description: activity.ghiChu || activity.description,
          timeAgo: formatTimeAgo(time),
          score,
          icon: getActivityIcon(type),
          color: getActivityColor(type)
        };
      });
      
      setRecentActivities(mappedActivities);
    } catch (error: any) {
      console.error('Error loading activities:', error);
      setRecentActivities([]);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson': return 'book';
      case 'game': return 'game-controller';
      case 'achievement': return 'star';
      default: return 'book';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lesson': return '#4CAF50';
      case 'game': return '#FF6B6B';
      case 'achievement': return '#FFD700';
      default: return '#4CAF50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Vừa xong';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadChildren(),
      selectedChild ? Promise.all([loadChildProgress(), loadRecentActivities()]) : Promise.resolve()
    ]);
    setRefreshing(false);
  };

  const handleAddChild = () => {
    router.push('/parent/children');
  };


  const handleSetSchedule = () => {
    Alert.alert('Lịch học', 'Chức năng cài đặt lịch học sẽ được triển khai');
  };

  const handleViewNotifications = () => {
    router.push('/parent/notifications');
  };

  const handleViewChildActivities = () => {
    router.push('/parent/activities');
  };

  const handleManageChildren = () => {
    router.push('/parent/children');
  };


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 17) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const getCompletionRate = () => {
    if (!progressStats || progressStats.totalLessons === 0) return 0;
    return Math.round((progressStats.completedLessons / progressStats.totalLessons) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{user?.hoTen}!</Text>
            <Text style={styles.subtitle}>Quản lý học tập của con</Text>
          </View>
          <TouchableOpacity style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Con của bạn</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddChild}>
            <Ionicons name="add" size={20} color="#2196F3" />
            <Text style={styles.addButtonText}>Thêm trẻ</Text>
          </TouchableOpacity>
        </View>
        
        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>Chưa có trẻ nào</Text>
            <Text style={styles.emptyStateSubtext}>Thêm trẻ để bắt đầu theo dõi học tập</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childrenContainer}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childCard,
                  selectedChild?.id === child.id && styles.childCardActive
                ]}
                onPress={() => setSelectedChild(child)}
              >
                <View style={styles.childAvatar}>
                  <Ionicons name="happy" size={30} color="#2196F3" />
                </View>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childLevel}>{child.learningLevel}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {selectedChild && progressStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiến độ học tập - {selectedChild.name}</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Tỷ lệ hoàn thành</Text>
              <Text style={styles.progressPercentage}>{getCompletionRate()}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getCompletionRate()}%` }
                ]} 
              />
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="book" size={24} color="#4CAF50" />
                <Text style={styles.statLabel}>Bài học</Text>
                <Text style={styles.statValue}>
                  {progressStats.completedLessons}/{progressStats.totalLessons}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Text style={styles.statLabel}>Điểm TB</Text>
                <Text style={styles.statValue}>{Math.round(progressStats.averageScore)}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={24} color="#FF6B6B" />
                <Text style={styles.statLabel}>Thời gian</Text>
                <Text style={styles.statValue}>{Math.round(progressStats.totalTimeSpent)} phút</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handleViewChildActivities}>
            <Ionicons name="list" size={30} color="#2196F3" />
            <Text style={styles.actionTitle}>Hoạt động</Text>
            <Text style={styles.actionSubtitle}>Xem hoạt động trẻ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleViewNotifications}>
            <Ionicons name="notifications" size={30} color="#FF9800" />
            <Text style={styles.actionTitle}>Thông báo</Text>
            <Text style={styles.actionSubtitle}>Nhắc nhở học tập</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleManageChildren}>
            <Ionicons name="people" size={30} color="#9C27B0" />
            <Text style={styles.actionTitle}>Quản lý trẻ</Text>
            <Text style={styles.actionSubtitle}>Thêm/sửa trẻ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={logout}>
            <Ionicons name="log-out" size={30} color="#F44336" />
            <Text style={styles.actionTitle}>Đăng xuất</Text>
            <Text style={styles.actionSubtitle}>Thoát tài khoản</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedChild && recentActivities.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hoạt động gần đây - {selectedChild.name}</Text>
            <TouchableOpacity onPress={handleViewChildActivities}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activitiesScroll}>
            {recentActivities.slice(0, 5).map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                  <Ionicons name={activity.icon as any} size={24} color={activity.color} />
                </View>
                <Text style={styles.activityTitle} numberOfLines={2}>{activity.title}</Text>
                {activity.score !== undefined && (
                  <Text style={styles.activityScore}>Điểm: {activity.score}</Text>
                )}
                <Text style={styles.activityTime}>{activity.timeAgo}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tổng quan</Text>
        <View style={styles.overviewGrid}>
          <TouchableOpacity style={styles.overviewCard} onPress={handleViewChildActivities}>
            <Ionicons name="time" size={32} color="#2196F3" />
            <Text style={styles.overviewTitle}>Hoạt động</Text>
            <Text style={styles.overviewSubtitle}>Xem hoạt động học tập</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.overviewCard} onPress={() => router.push('/parent/reports')}>
            <Ionicons name="bar-chart" size={32} color="#4CAF50" />
            <Text style={styles.overviewTitle}>Báo cáo</Text>
            <Text style={styles.overviewSubtitle}>Tình trạng học của trẻ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.overviewCard} onPress={handleViewNotifications}>
            <Ionicons name="notifications" size={32} color="#FF9800" />
            <Text style={styles.overviewTitle}>Thông báo</Text>
            <Text style={styles.overviewSubtitle}>Tin nhắn hệ thống</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.overviewCard} onPress={handleManageChildren}>
            <Ionicons name="people" size={32} color="#9C27B0" />
            <Text style={styles.overviewTitle}>Quản lý trẻ</Text>
            <Text style={styles.overviewSubtitle}>Thêm/sửa trẻ</Text>
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
    color: '#E3F2FD',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  childrenContainer: {
    marginBottom: 10,
  },
  childCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childCardActive: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  childName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  childLevel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
    fontSize: 14,
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  emptyActivityContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyActivityText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  activityDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  activitiesScroll: {
    marginTop: 12,
  },
  activityCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityScore: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
  },
});
