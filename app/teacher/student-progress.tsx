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
    capDo?: string;
    moTa?: string;
  };
  diemGiaoVien?: number | null;
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
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const response = await api.classes.getStudentProgress(classId as string, studentId as string);
      const sorted = {
        ...response.data,
        progress: [...(response.data?.progress || [])].sort((a: any, b: any) => {
          const aTime = new Date(a.ngayHoanThanh || a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.ngayHoanThanh || b.updatedAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        })
      };
      const progressList = sorted.progress || [];
      const coloringGames = progressList.filter((p: any) => 
        p.loai === 'troChoi' && p.troChoi && p.troChoi.loai === 'toMau'
      );
      const otherItems = progressList.filter((p: any) => 
        !(p.loai === 'troChoi' && p.troChoi && p.troChoi.loai === 'toMau')
      );
      const coloringScores = coloringGames
        .map((p: any) => typeof p.diemGiaoVien === 'number' ? p.diemGiaoVien : null)
        .filter((s: any) => s !== null);
      const otherScores = otherItems.map((p: any) => 
        typeof p.diemGiaoVien === 'number' ? p.diemGiaoVien : (p.diemSo || 0)
      );
      const allScores = [...coloringScores, ...otherScores];
      const calculatedAverage = allScores.length > 0
        ? Math.round(allScores.reduce((sum: number, s: number) => sum + s, 0) / allScores.length)
        : 0;
      setData({
        ...sorted,
        averageScore: calculatedAverage
      });
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
              {data.averageScore > 0 ? (
                <Text style={[styles.statValue, { color: getScoreColor(data.averageScore) }]}>
                  {data.averageScore}%
                </Text>
              ) : (
                <Text style={[styles.statValue, { color: '#999', fontSize: 16 }]}>
                  Chưa có điểm
                </Text>
              )}
              <Text style={styles.statLabel}>Điểm trung bình</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50', marginTop: 16 }]}
            onPress={async () => {
              try {
                if (!classId || !studentId) return;
                setSending(true);
                await api.classes.sendStudentReportEmail(classId as string, studentId as string);
                alert('Đã gửi báo cáo PDF về email của giáo viên.');
              } catch (e: any) {
                alert(e?.message || 'Không thể gửi báo cáo qua email');
              } finally {
                setSending(false);
              }
            }}
            disabled={sending}
          >
            <Ionicons name="send-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>
              {sending ? 'Đang gửi...' : 'Gửi báo cáo qua email'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết bài làm ({data.progress.length})</Text>
          {data.progress.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Chưa có bài làm nào</Text>
            </View>
          ) : (
            data.progress.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.progressCard}
                activeOpacity={0.8}
                onPress={() => {
                  const isLesson = item.loai === 'baiHoc';
                  const itemId = isLesson ? item.baiHoc?._id : item.troChoi?._id;
                  if (!itemId) return;
                  router.push({
                    pathname: '/teacher/result-detail',
                    params: {
                      type: isLesson ? 'lesson' : 'game',
                      itemId,
                      title: item.baiHoc?.tieuDe || item.troChoi?.tieuDe || 'Kết quả',
                      studentId: data.student.id || studentId,
                      studentName: data.student.hoTen,
                      gameType: isLesson ? undefined : item.troChoi?.loai,
                      progressId: item.id,
                      backTo: JSON.stringify({
                        pathname: '/teacher/student-progress',
                        params: { classId, studentId }
                      })
                    }
                  });
                }}
              >
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
                        {(item.baiHoc?.danhMuc || item.troChoi?.danhMuc) && ` • ${(item.baiHoc?.danhMuc || item.troChoi?.danhMuc)}`}
                        {(item.baiHoc?.capDo || item.troChoi?.capDo) && ` • ${(item.baiHoc?.capDo || item.troChoi?.capDo)}`}
                        {item.troChoi?.loai && ` • ${item.troChoi.loai}`}
                      </Text>
                    </View>
                  </View>
                  {(() => {
                    const isColoring = item.loai === 'troChoi' && (item.troChoi?.loai === 'toMau');
                    const teacherScore = typeof item.diemGiaoVien === 'number' ? item.diemGiaoVien : null;
                    if (isColoring) {
                      if (teacherScore !== null) {
                        const scoreColor = getScoreColor(teacherScore);
                        return (
                          <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
                            <Text style={[styles.scoreText, { color: scoreColor }]}>
                              {teacherScore}%
                            </Text>
                          </View>
                        );
                      } else {
                        return (
                          <View style={[styles.scoreBadge, { backgroundColor: '#999' + '20' }]}>
                            <Text style={[styles.scoreText, { color: '#999', fontSize: 12 }]}>
                              Chưa có điểm
                            </Text>
                          </View>
                        );
                      }
                    } else {
                      const scoreValue = teacherScore !== null ? teacherScore : item.diemSo;
                      const scoreColor = getScoreColor(scoreValue || 0);
                      return (
                        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
                          <Text style={[styles.scoreText, { color: scoreColor }]}>
                            {scoreValue ?? 0}%
                          </Text>
                        </View>
                      );
                    }
                  })()}
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
              </TouchableOpacity>
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
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});

