import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';

interface StudentProgress {
  student: {
    id: string;
    hoTen: string;
    ngaySinh?: string;
    gioiTinh: string;
  };
  progress: Array<{
    id: string;
    baiHoc?: {
      _id: string;
      tieuDe: string;
      danhMuc: string;
    };
    troChoi?: {
      _id: string;
      tieuDe: string;
      loai: string;
    };
    diemSo: number;
    thoiGianDaDung: number;
    ngayHoanThanh: string;
    loai: string;
  }>;
  totalCompleted: number;
  averageScore: number;
}

interface ClassProgress {
  class: {
    id: string;
    tenLop: string;
    moTa?: string;
  };
  students: StudentProgress[];
}

export default function ClassProgress() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const [data, setData] = useState<ClassProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const response = await api.classes.getProgress(classId as string);
      setData(response.data);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải kết quả');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudentProgress = (studentId: string) => {
    router.push({
      pathname: '/teacher/student-progress',
      params: { classId: classId as string, studentId }
    } as any);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy dữ liệu</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Kết quả lớp {data.class.tenLop}</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {data.students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có kết quả nào</Text>
          </View>
        ) : (
          data.students.map((studentProgress) => (
            <TouchableOpacity
              key={studentProgress.student.id}
              style={styles.studentCard}
              onPress={() => handleViewStudentProgress(studentProgress.student.id)}
            >
              <View style={styles.studentHeader}>
                <View style={styles.studentInfo}>
                  <Ionicons name="person-circle" size={40} color="#4CAF50" />
                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{studentProgress.student.hoTen}</Text>
                    <Text style={styles.studentMeta}>
                      {studentProgress.student.gioiTinh === 'nam' ? 'Nam' : 'Nữ'}
                      {studentProgress.student.ngaySinh && ` • ${formatDate(studentProgress.student.ngaySinh)}`}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{studentProgress.totalCompleted}</Text>
                  <Text style={styles.statLabel}>Bài đã làm</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: getScoreColor(studentProgress.averageScore) }]}>
                    {studentProgress.averageScore}%
                  </Text>
                  <Text style={styles.statLabel}>Điểm trung bình</Text>
                </View>
              </View>

              {studentProgress.progress.length > 0 && (
                <View style={styles.recentProgress}>
                  <Text style={styles.recentTitle}>Bài làm gần đây:</Text>
                  {studentProgress.progress.slice(0, 3).map((item) => (
                    <View key={item.id} style={styles.progressItem}>
                      <Ionicons
                        name={item.loai === 'baiHoc' ? 'book' : 'game-controller'}
                        size={16}
                        color="#666"
                      />
                      <Text style={styles.progressText} numberOfLines={1}>
                        {item.baiHoc?.tieuDe || item.troChoi?.tieuDe || 'N/A'}
                      </Text>
                      <Text style={styles.progressScore}>{item.diemSo}%</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getScoreColor = (score: number) => {
  if (score >= 90) return '#4CAF50';
  if (score >= 70) return '#FF9800';
  if (score >= 50) return '#FF5722';
  return '#F44336';
};

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginBottom: 20
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
    color: '#fff',
    flex: 1,
    textAlign: 'center'
  },
  placeholder: {
    width: 24
  },
  content: {
    flex: 1
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  studentDetails: {
    marginLeft: 12,
    flex: 1
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  studentMeta: {
    fontSize: 14,
    color: '#666'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#666'
  },
  recentProgress: {
    gap: 8
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    gap: 8
  },
  progressText: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  progressScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50'
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

