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

export default function Classes() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Lớp học của tôi</Text>
        <Text style={styles.headerSubtitle}>{classes.length} lớp học</Text>
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
                <View style={styles.statItem}>
                  <Ionicons name="game-controller" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {classItem.troChoi?.length || 0} trò chơi
                  </Text>
                </View>
              </View>

              <View style={styles.classActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleViewClass(classItem);
                  }}
                >
                  <Ionicons name="eye" size={18} color="#2196F3" />
                  <Text style={styles.actionText}>Chi tiết</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleViewProgress(classItem);
                  }}
                >
                  <Ionicons name="bar-chart" size={18} color="#4CAF50" />
                  <Text style={styles.actionText}>Kết quả</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
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
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    color: '#666',
  },
  classDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  classStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  classActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

