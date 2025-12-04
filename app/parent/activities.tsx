//Phụ huynh hiển thị hoạt động trẻ ở đây
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

interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number;
  status: 'active' | 'completed';
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

export default function Activities() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState<string>('');
  const [isChildActive, setIsChildActive] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadSessions();
      loadLastActivityTime();
    }
  }, [selectedChild]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isChildActive && selectedChild) {
      interval = setInterval(() => {
        loadLastActivityTime();
        loadSessions();
      }, 30000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isChildActive, selectedChild]);

  const loadLastActivityTime = async () => {
    if (!selectedChild) return;
    
    try {
      const response = await api.appSessions.getLastActivityTime(selectedChild.id);
      if (response.success && response.data) {
        if (response.data.isActive) {
          setLastActivityTime(response.data.timeAgo || 'Đang hoạt động');
        } else {
          setLastActivityTime(response.data.timeAgo || 'Chưa có hoạt động');
        }
        setIsChildActive(response.data.isActive || false);
        setStatusText(response.data.statusText || '');
      } else {
        setLastActivityTime('Chưa có hoạt động');
        setIsChildActive(false);
        setStatusText('Chưa có hoạt động');
      }
    } catch (error: any) {
      setLastActivityTime('');
      setIsChildActive(false);
      setStatusText('');
    }
  };

  const loadChildren = async () => {
    try {
      const response = await api.children.list();
      const childrenData = response.data || [];
      const mappedChildren = childrenData.map((child: any) => ({
        ...child,
        id: child._id || child.id
      }));
      
      setChildren(mappedChildren);
      if (mappedChildren.length > 0) {
        setSelectedChild(mappedChildren[0]);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải danh sách trẻ');
    } finally {
      setLoading(false);
    }
  };
// hàm lấy danh sách hoạt động trẻ 
  const loadSessions = async () => {
    if (!selectedChild) return;
    
    try {
      const response = await api.appSessions.getChildSessions(selectedChild.id, { limit: 50 });
      
      let sessionsData = [];
      if (response.data && response.data.sessions) {
        sessionsData = response.data.sessions;
      } else if (Array.isArray(response.data)) {
        sessionsData = response.data;
      }
      
      const mappedSessions = sessionsData.map((session: any) => ({
        id: session._id || session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration || 0,
        status: session.status || 'completed'
      }));
      
      setSessions(mappedSessions);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải lịch sử đăng nhập của con');
      setSessions([]);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadChildren(), loadSessions(), loadLastActivityTime()]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải lịch sử đăng nhập...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Lịch sử đăng nhập</Text>
        <Text style={styles.headerSubtitle}>Xem thời gian đăng nhập và đăng xuất của trẻ</Text>
      </LinearGradient>

      <View style={styles.childSelectorContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.childSelector}
        >
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childButton,
                selectedChild?.id === child.id && styles.childButtonActive
              ]}
              onPress={() => setSelectedChild(child)}
            >
              <Text style={[
                styles.childButtonText,
                selectedChild?.id === child.id && styles.childButtonTextActive
              ]}>
                {child.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>


      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {lastActivityTime && (
          <View style={[
            styles.lastActivityContainer,
            isChildActive && styles.lastActivityContainerActive
          ]}>
            <Ionicons 
              name={isChildActive ? "radio-button-on" : "time-outline"} 
              size={24} 
              color={isChildActive ? "#4CAF50" : "#2196F3"} 
            />
            <View style={styles.lastActivityInfo}>
              <Text style={styles.lastActivityLabel}>
                Trạng thái hiện tại
              </Text>
              <Text style={[
                styles.lastActivityTime,
                isChildActive && styles.lastActivityTimeActive
              ]}>
                {lastActivityTime}
              </Text>
            </View>
          </View>
        )}
         {/* kiểm tra điều kiện không có thì thông báo ra, có hoạt động thì map dữ liệu */}
        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="log-in-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có lịch sử đăng nhập</Text>
            <Text style={styles.emptySubtext}>
              Trẻ chưa có lịch sử đăng nhập vào ứng dụng
            </Text>
          </View>
        ) : (
          sessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionTimeRow}>
                <Ionicons name="log-in" size={18} color="#4CAF50" />
                <Text style={styles.sessionTimeLabel}>Đăng nhập:</Text>
                <Text style={styles.sessionTimeLogin}>{formatDateTime(session.startTime)}</Text>
              </View>
              {session.endTime ? (
                <View style={styles.sessionTimeRow}>
                  <Ionicons name="log-out" size={18} color="#F44336" />
                  <Text style={styles.sessionTimeLabel}>Đăng xuất:</Text>
                  <Text style={styles.sessionTimeLogout}>{formatDateTime(session.endTime)}</Text>
                </View>
              ) : (
                <View style={styles.sessionTimeRow}>
                  <Ionicons name="log-out" size={18} color="#999" />
                  <Text style={styles.sessionTimeLabel}>Đăng xuất:</Text>
                  <Text style={styles.sessionTimePending}>Chưa đăng xuất</Text>
                </View>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 4,
  },
  childSelectorContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  childSelector: {
    flexDirection: 'row',
  },
  childButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  childButtonActive: {
    backgroundColor: '#2196F3',
  },
  childButtonText: {
    fontSize: 14,
    color: '#666',
  },
  childButtonTextActive: {
    color: '#fff',
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
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTimeLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '500',
    minWidth: 80,
  },
  sessionTimeLogin: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    flex: 1,
  },
  sessionTimeLogout: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
    flex: 1,
  },
  sessionTimePending: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    flex: 1,
  },
  lastActivityContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  lastActivityContainerActive: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  lastActivityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  lastActivityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastActivityTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  lastActivityTimeActive: {
    color: '#4CAF50',
  },
  lastActivityDuration: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
