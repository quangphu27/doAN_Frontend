import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  childName?: string;
  childId?: string;
}

interface Child {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  avatarUrl?: string;
  learningLevel: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notificationsResponse, childrenResponse] = await Promise.all([
        api.notifications.list(),
        api.children.list()
      ]);

      const notificationsData = notificationsResponse.data?.notifications || [];
      const mappedNotifications = notificationsData.map((notification: any) => ({
        ...notification,
        id: notification._id || notification.id
      }));

      const childrenData = childrenResponse.data || [];
      const mappedChildren = childrenData.map((child: any) => ({
        ...child,
        id: child._id || child.id
      }));

      setNotifications(mappedNotifications);
      setChildren(mappedChildren);
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.notifications.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      Alert.alert('Lỗi', 'Không thể đánh dấu tất cả thông báo');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.notifications.delete(notificationId);
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      Alert.alert('Lỗi', 'Không thể xóa thông báo');
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#2196F3';
    }
  };

  const getChildName = (childId?: string) => {
    if (!childId) return '';
    const child = children.find(c => c.id === childId);
    return child ? child.name : '';
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải thông báo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tất cả ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Chưa đọc ({unreadCount})
          </Text>
        </TouchableOpacity>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={16} color="#2196F3" />
            <Text style={styles.markAllText}>Đánh dấu tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications" size={60} color="#ccc" />
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'Chưa có thông báo nào' : 'Không có thông báo chưa đọc'}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'Bạn sẽ nhận được thông báo về hoạt động học tập của trẻ'
                : 'Tất cả thông báo đã được đọc'
              }
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <View 
              key={notification.id} 
              style={[
                styles.notificationCard,
                !notification.isRead && styles.unreadCard
              ]}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={getNotificationIcon(notification.type) as any} 
                    size={24} 
                    color={getNotificationColor(notification.type)} 
                  />
                </View>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {notification.childName && (
                    <Text style={styles.childName}>{notification.childName}</Text>
                  )}
                  <Text style={styles.notificationTime}>
                    {formatTimeAgo(notification.createdAt)}
                  </Text>
                </View>
                <View style={styles.notificationActions}>
                  {!notification.isRead && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => markAsRead(notification.id)}
                    >
                      <Ionicons name="checkmark" size={16} color="#4CAF50" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteNotification(notification.id)}
                  >
                    <Ionicons name="trash" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              
              {!notification.isRead && (
                <View style={styles.unreadIndicator} />
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#FF5722',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
  },
  markAllText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  childName: {
    fontSize: 12,
    color: '#2196F3',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
});
