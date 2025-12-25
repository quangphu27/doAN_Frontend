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

interface LessonStat {
  id: string;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  image?: string;
  summary: {
    totalStudents: number;
    submittedCount: number;
    notSubmittedCount: number;
    averageScore: number;
  };
}

interface GameStat {
  id: string;
  title: string;
  description?: string;
  category?: string;
  type?: string;
  image?: string;
  summary: {
    totalStudents: number;
    submittedCount: number;
    notSubmittedCount: number;
    averageScore: number;
  };
}

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
  const [assignmentStats, setAssignmentStats] = useState<{ lessons: LessonStat[]; games: GameStat[] }>({
    lessons: [],
    games: []
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'assignments' | 'students'>('assignments');

  useEffect(() => {
    if (classId) {
      loadProgress();
    }
  }, [classId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const [progressRes, statsRes] = await Promise.all([
        api.classes.getProgress(classId as string),
        api.classes.getLessonsStats(classId as string)
      ]);
      setData(progressRes.data);
      if (statsRes?.data) {
        setAssignmentStats({
          lessons: statsRes.data.lessons || [],
          games: statsRes.data.games || []
        });
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải kết quả');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAssignment = (item: LessonStat | GameStat, type: 'lesson' | 'game') => {
    const backTo = {
      pathname: '/teacher/class-progress',
      params: { classId }
    };
    router.push({
      pathname: '/teacher/item-results',
      params: {
        classId: classId as string,
        itemId: item.id,
        type,
        title: item.title,
        backTo: JSON.stringify(backTo)
      }
    } as any);
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

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'assignments' && styles.tabActive]}
          onPress={() => setViewMode('assignments')}
        >
          <Text style={[styles.tabText, viewMode === 'assignments' && styles.tabTextActive]}>Bài tập / Trò chơi</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'students' && styles.tabActive]}
          onPress={() => setViewMode('students')}
        >
          <Text style={[styles.tabText, viewMode === 'students' && styles.tabTextActive]}>Theo học sinh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {viewMode === 'assignments' ? (
          <>
            <Text style={styles.sectionTitle}>Bài tập ({assignmentStats.lessons.length})</Text>
            {assignmentStats.lessons.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có bài tập</Text>
              </View>
            ) : (
              assignmentStats.lessons.map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={styles.itemCard}
                  onPress={() => handleViewAssignment(lesson, 'lesson')}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Ionicons name="book" size={22} color="#4CAF50" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{lesson.title}</Text>
                        <Text style={styles.itemSub}>{lesson.description || 'Bài tập'}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="#666" />
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{lesson.summary.submittedCount}</Text>
                      <Text style={styles.statLabel}>Đã nộp</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{lesson.summary.notSubmittedCount}</Text>
                      <Text style={styles.statLabel}>Chưa nộp</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: getScoreColor(lesson.summary.averageScore) }]}>
                        {lesson.summary.averageScore}
                      </Text>
                      <Text style={styles.statLabel}>Điểm TB</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            <Text style={styles.sectionTitle}>Trò chơi ({assignmentStats.games.length})</Text>
            {assignmentStats.games.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="game-controller-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có trò chơi</Text>
              </View>
            ) : (
              assignmentStats.games.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  style={styles.itemCard}
                  onPress={() => handleViewAssignment(game, 'game')}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Ionicons name="game-controller" size={22} color="#F44336" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{game.title}</Text>
                        <Text style={styles.itemSub}>{game.description || 'Trò chơi'}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="#666" />
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{game.summary.submittedCount}</Text>
                      <Text style={styles.statLabel}>Đã nộp</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{game.summary.notSubmittedCount}</Text>
                      <Text style={styles.statLabel}>Chưa nộp</Text>
                    </View>
                    <View style={styles.statItem}>
                      {(() => {
                        const isColoring = game.type === 'toMau';
                        if (isColoring && game.summary.averageScore === 0 && game.summary.submittedCount > 0) {
                          return (
                            <>
                              <Text style={[styles.statValue, { color: '#999', fontSize: 14 }]}>
                                Chưa có điểm
                              </Text>
                              <Text style={styles.statLabel}>Điểm TB</Text>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <Text style={[styles.statValue, { color: getScoreColor(game.summary.averageScore) }]}>
                                {game.summary.averageScore}
                              </Text>
                              <Text style={styles.statLabel}>Điểm TB</Text>
                            </>
                          );
                        }
                      })()}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : data.students.length === 0 ? (
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
                  {studentProgress.averageScore > 0 ? (
                    <Text style={[styles.statValue, { color: getScoreColor(studentProgress.averageScore) }]}>
                      {studentProgress.averageScore}
                    </Text>
                  ) : (
                    <Text style={[styles.statValue, { color: '#999', fontSize: 16 }]}>
                      Chưa có điểm
                    </Text>
                  )}
                  <Text style={styles.statLabel}>Điểm trung bình</Text>
                </View>
              </View>

              {studentProgress.progress.length > 0 && (
                <View style={styles.recentProgress}>
                  <Text style={styles.recentTitle}>Bài làm gần đây:</Text>
                  {studentProgress.progress.slice(0, 3).map((item) => {
                    const isColoring = item.loai === 'troChoi' && (item.troChoi?.loai === 'toMau');
                    const teacherScore = (item as any).teacherScore ?? (item as any).diemGiaoVien;
                    if (isColoring) {
                      if (typeof teacherScore === 'number') {
                        return (
                          <View key={item.id} style={styles.progressItem}>
                            <Ionicons
                              name={item.loai === 'baiHoc' ? 'book' : 'game-controller'}
                              size={16}
                              color="#666"
                            />
                            <Text style={styles.progressText} numberOfLines={1}>
                              {item.baiHoc?.tieuDe || item.troChoi?.tieuDe || 'N/A'}
                            </Text>
                            <Text style={[styles.progressScore, { color: getScoreColor(teacherScore) }]}>
                              {teacherScore}
                            </Text>
                          </View>
                        );
                      } else {
                        return (
                          <View key={item.id} style={styles.progressItem}>
                            <Ionicons
                              name={item.loai === 'baiHoc' ? 'book' : 'game-controller'}
                              size={16}
                              color="#666"
                            />
                            <Text style={styles.progressText} numberOfLines={1}>
                              {item.baiHoc?.tieuDe || item.troChoi?.tieuDe || 'N/A'}
                            </Text>
                            <Text style={[styles.progressScore, { color: '#999' }]}>
                              Chưa có điểm
                            </Text>
                          </View>
                        );
                      }
                    } else {
                      const displayScore = typeof teacherScore === 'number' ? teacherScore : item.diemSo;
                      return (
                        <View key={item.id} style={styles.progressItem}>
                          <Ionicons
                            name={item.loai === 'baiHoc' ? 'book' : 'game-controller'}
                            size={16}
                            color="#666"
                          />
                          <Text style={styles.progressText} numberOfLines={1}>
                            {item.baiHoc?.tieuDe || item.troChoi?.tieuDe || 'N/A'}
                          </Text>
                          <Text style={[styles.progressScore, { color: getScoreColor(displayScore) }]}>
                            {displayScore}
                          </Text>
                        </View>
                      );
                    }
                  })}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2
  },
  itemSub: {
    fontSize: 13,
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  tabActive: {
    backgroundColor: '#e8f5e9'
  },
  tabText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500'
  },
  tabTextActive: {
    color: '#2e7d32',
    fontWeight: '700'
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

