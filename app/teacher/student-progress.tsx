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

interface ProgressItem {
  id: string;
  baiHoc?: {
    _id: string;
    tieuDe: string;
    danhMuc: string;
    capDo: string;
    moTa?: string;
  };
  troChoi?: {
    _id: string;
    tieuDe: string;
    loai: string;
    danhMuc: string;
    moTa?: string;
  };
  diemSo: number;
  thoiGianDaDung: number;
  ngayHoanThanh: string;
  cauTraLoi: Array<{
    idBaiTap?: string;
    exerciseId?: string;
    cauTraLoi?: any;
    answer?: any;
    dung?: boolean;
    isCorrect?: boolean;
  }>;
  loai: string;
}

interface StudentProgressData {
  student: {
    id: string;
    hoTen: string;
    ngaySinh?: string;
    gioiTinh: string;
    phongHoc?: string;
  };
  progress: ProgressItem[];
  totalCompleted: number;
  averageScore: number;
}

export default function StudentProgress() {
  const router = useRouter();
  const { classId, studentId } = useLocalSearchParams();
  const [data, setData] = useState<StudentProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const response = await api.classes.getStudentProgress(classId as string, studentId as string);
      setData(response.data);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải kết quả');
    } finally {
      setLoading(false);
    }
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 70) return '#FF9800';
    if (score >= 50) return '#FF5722';
    return '#F44336';
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
        <Text style={styles.headerTitle}>Kết quả {data.student.hoTen}</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.studentInfoCard}>
          <View style={styles.studentHeader}>
            <Ionicons name="person-circle" size={60} color="#4CAF50" />
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{data.student.hoTen}</Text>
              <Text style={styles.studentMeta}>
                {data.student.gioiTinh === 'nam' ? 'Nam' : 'Nữ'}
                {data.student.ngaySinh && ` • ${formatDate(data.student.ngaySinh)}`}
                {data.student.phongHoc && ` • ${data.student.phongHoc}`}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.totalCompleted}</Text>
              <Text style={styles.statLabel}>Bài đã làm</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: getScoreColor(data.averageScore) }]}>
                {data.averageScore}%
              </Text>
              <Text style={styles.statLabel}>Điểm trung bình</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết bài làm ({data.progress.length})</Text>
          {data.progress.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Chưa có bài làm nào</Text>
            </View>
          ) : (
            data.progress.map((item) => (
              <View key={item.id} style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <View style={styles.progressType}>
                    <Ionicons
                      name={item.loai === 'baiHoc' ? 'book' : 'game-controller'}
                      size={24}
                      color={item.loai === 'baiHoc' ? '#FF9800' : '#F44336'}
                    />
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressTitle}>
                        {item.baiHoc?.tieuDe || item.troChoi?.tieuDe || 'N/A'}
                      </Text>
                      <Text style={styles.progressMeta}>
                        {item.loai === 'baiHoc' ? 'Bài học' : 'Trò chơi'}
                        {item.baiHoc?.danhMuc && ` • ${item.baiHoc.danhMuc}`}
                        {item.baiHoc?.capDo && ` • ${item.baiHoc.capDo}`}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.diemSo) + '20' }]}>
                    <Text style={[styles.scoreText, { color: getScoreColor(item.diemSo) }]}>
                      {item.diemSo}%
                    </Text>
                  </View>
                </View>

                <View style={styles.progressDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.detailText}>{formatTime(item.thoiGianDaDung)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.detailText}>{formatDate(item.ngayHoanThanh)}</Text>
                  </View>
                  {item.cauTraLoi && item.cauTraLoi.length > 0 && (
                    <View style={styles.detailRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        {item.cauTraLoi.filter((a: any) => a.dung || a.isCorrect).length}/{item.cauTraLoi.length} câu đúng
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
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
  studentInfoCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  studentDetails: {
    marginLeft: 16,
    flex: 1
  },
  studentName: {
    fontSize: 22,
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
    gap: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#666'
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#999'
  },
  progressCard: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  progressType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  progressInfo: {
    marginLeft: 12,
    flex: 1
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  progressMeta: {
    fontSize: 12,
    color: '#666'
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  progressDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  detailText: {
    fontSize: 14,
    color: '#666'
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

