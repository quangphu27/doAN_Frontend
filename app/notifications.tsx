import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Notification {
  id: string;
  type: 'reminder' | 'summary' | 'achievement' | 'system' | 'schedule';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  child?: {
    name: string;
    avatarUrl?: string;
  };
  data?: {
    lessonId?: string;
    gameId?: string;
    score?: number;
    achievement?: string;
  };
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.notifications.list();
      setNotifications(response.data.notifications);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.notifications.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadNotifications(), loadUnreadCount()]);
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.notifications.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đánh dấu thông báo');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đánh dấu tất cả thông báo');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.notifications.delete(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa thông báo');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'time';
      case 'summary':
        return 'document-text';
      case 'achievement':
        return 'trophy';
      case 'system':
        return 'settings';
      case 'schedule':
        return 'calendar';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'reminder':
        return '#FF9800';
      case 'summary':
        return '#4CAF50';
      case 'achievement':
        return '#FFD700';
      case 'system':
        return '#9C27B0';
      case 'schedule':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} phút trước`;
    } else if (hours < 24) {
      return `${hours} giờ trước`;
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải thông báo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Đánh dấu tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off" size={60} color="#ccc" />
          <Text style={styles.emptyStateText}>Chưa có thông báo nào</Text>
          <Text style={styles.emptyStateSubtext}>Các thông báo mới sẽ xuất hiện ở đây</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.notificationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.unreadNotification
              ]}
              onPress={() => !notification.isRead && markAsRead(notification.id)}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIcon}>
                  <Ionicons 
                    name={getNotificationIcon(notification.type)} 
                    size={24} 
                    color={getNotificationColor(notification.type)} 
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationText}>{notification.content}</Text>
                  {notification.child && (
                    <Text style={styles.childInfo}>
                      Cho: {notification.child.name}
                    </Text>
                  )}
                  <Text style={styles.notificationTime}>
                    {formatDate(notification.createdAt)}
                  </Text>
                </View>
                <View style={styles.notificationActions}>
                  {!notification.isRead && (
                    <View style={styles.unreadDot} />
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteNotification(notification.id)}
                  >
                    <Ionicons name="trash" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  notificationsList: {
    flex: 1,
  },
  notificationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  childInfo: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationActions: {
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
});
