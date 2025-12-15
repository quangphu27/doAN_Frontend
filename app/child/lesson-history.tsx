import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface LessonHistoryItem {
  id: string;
  lesson: {
    id: string;
    title: string;
    category: string;
    level: string;
    description?: string;
    imageUrl?: string;
  };
  score: number;
  timeSpent: number;
  completedAt: string;
  answers: Array<{
    exerciseId: string;
    answer: string;
    isCorrect: boolean;
  }>;
}

export default function LessonHistory() {
  const { user } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<LessonHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await api.lessons.getHistory(user.id, { limit: 100 });
      
      const historyData = response.data?.data?.history || response.data?.history || [];
      const sortedHistory = historyData.sort((a: any, b: any) => {
        return new Date(b.completedAt || b.ngayHoanThanh || b.createdAt || 0).getTime() -
          new Date(a.completedAt || a.ngayHoanThanh || a.createdAt || 0).getTime();
      });
      setHistory(sortedHistory);
    } catch (error) {
      console.error('Error loading lesson history:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử bài học');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'letter': return '#4CAF50';
      case 'number': return '#2196F3';
      case 'color': return '#FF9800';
      case 'action': return '#9C27B0';
      default: return '#666';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'letter': return 'text';
      case 'number': return 'calculator';
      case 'color': return 'color-palette';
      case 'action': return 'play';
      default: return 'book';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'letter': return 'Chữ cái';
      case 'number': return 'Số';
      case 'color': return 'Màu sắc';
      case 'action': return 'Hành động';
      default: return 'Khác';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Cơ bản';
      case 'intermediate': return 'Trung bình';
      case 'advanced': return 'Nâng cao';
      default: return level;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 70) return '#FF9800';
    if (score >= 50) return '#FF5722';
    return '#F44336';
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleViewDetails = (item: LessonHistoryItem) => {
    const lessonId = item.lesson.id || (item.lesson as any)._id;
    
    if (!lessonId) {
      Alert.alert('Lỗi', 'Không thể xem chi tiết bài học');
      return;
    }
    
    router.push({
      pathname: '/child/result-detail',
      params: {
        type: 'lesson',
        itemId: lessonId,
        studentId: user?.id || '',
        title: item.lesson.title || '',
        studentName: user?.hoTen || ''
      }
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử bài học</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Chưa có bài học nào</Text>
            <Text style={styles.emptySubtitle}>
              Hãy bắt đầu học để xem lịch sử bài học của bạn
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((item, index) => {
              if (!item.lesson) {
                return null;
              }
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyCard}
                  onPress={() => handleViewDetails(item)}
                >
                <View style={styles.cardHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.lesson.category || (item.lesson as any).danhMuc) }]}>
                    <Ionicons name={getCategoryIcon(item.lesson.category || (item.lesson as any).danhMuc) as any} size={20} color="#fff" />
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text style={styles.lessonTitle}>{item.lesson.title || (item.lesson as any).tieuDe}</Text>
                    <Text style={styles.lessonCategory}>{getCategoryName(item.lesson.category || (item.lesson as any).danhMuc)}</Text>
                    <Text style={styles.lessonLevel}>{getLevelText(item.lesson.level || (item.lesson as any).capDo)}</Text>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.score) }]}>
                    <Text style={styles.scoreText}>{item.score}%</Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="time" size={16} color="#666" />
                      <Text style={styles.statText}>{formatTime(item.timeSpent)}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="calendar" size={16} color="#666" />
                      <Text style={styles.statText}>{formatDate(item.completedAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.answersSummary}>
                    <Text style={styles.answersTitle}>Kết quả chi tiết:</Text>
                    <View style={styles.answersList}>
                      {item.answers && item.answers.length > 0 ? (
                        item.answers.map((answer, index) => (
                          <View key={index} style={styles.answerItem}>
                            <Ionicons 
                              name={answer.isCorrect ? "checkmark-circle" : "close-circle"} 
                              size={16} 
                              color={answer.isCorrect ? "#4CAF50" : "#F44336"} 
                            />
                            <Text style={styles.answerText}>
                              Câu {index + 1}: {(() => {
                                if (typeof answer.answer === 'number') {
                                  return String.fromCharCode(65 + answer.answer);
                                } else if (typeof answer.answer === 'string' && answer.answer.length === 1) {
                                  return answer.answer; 
                                }
                                return answer.answer;
                              })()} - {answer.isCorrect ? "Đúng" : "Sai"}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noAnswersText}>Không có thông tin chi tiết</Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>Xem chi tiết</Text>
                    <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    marginTop: 12,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  noAnswersText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  historyList: {
    padding: 20,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lessonCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  lessonLevel: {
    fontSize: 12,
    color: '#999',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardContent: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  answersSummary: {
    marginTop: 8,
  },
  answersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  answersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerText: {
    fontSize: 12,
    color: '#666',
  },
  cardFooter: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});
