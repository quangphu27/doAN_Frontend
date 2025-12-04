import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

interface ProgressStats {
    totalLessons: number;
    completedLessons: number;
    averageScore: number;
    totalTimeSpent: number;
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

interface LessonAnswerDetail {
  questionId: string;
  question: string;
  answer: string;
  correctAnswer: string;
  isCorrect: boolean;
  options?: Array<{
    key: string;
    value: string;
    isCorrect: boolean;
    isSelected: boolean;
  }>;
}

interface LessonReport {
  id: string;
  title: string;
  category: string;
  level: string;
  description?: string;
  className?: string;
  score: number;
  timeSpent: number;
  completedAt?: string | null;
  status: string;
  answers: LessonAnswerDetail[];
  attempts?: number;
}

interface ClassReport {
  classId: string;
  className: string | null;
  classDescription?: string;
  lessons: LessonReport[];
}

export default function Reports() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [classReports, setClassReports] = useState<ClassReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<LessonReport | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadReports();
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    try {
      const response = await api.children.list();
      const childrenData = response.data || [];
      const mappedChildren = childrenData.map((child: any) => ({
        id: child._id || child.id,
        name: child.hoTen || child.name || 'Trẻ',
        email: child.email || '',
        age: child.ngaySinh ? new Date().getFullYear() - new Date(child.ngaySinh).getFullYear() : 0,
        gender: child.gioiTinh || 'other',
        avatarUrl: child.anhDaiDien || undefined,
        learningLevel: child.capDoHocTap || 'coBan'
      }));
      
      setChildren(mappedChildren);
      if (mappedChildren.length > 0) {
        setSelectedChild(mappedChildren[0]);
      }
    } catch (error: any) {
      console.error('Error loading children:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách trẻ');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    if (!selectedChild) return;
    
    try {
      const [statsResponse, detailResponse] = await Promise.all([
        api.children.getStats(selectedChild.id),
        api.progress.getDetailReport(selectedChild.id)
      ]);

      setProgressStats(statsResponse.data || {
        totalLessons: 0,
        completedLessons: 0,
        averageScore: 0,
        totalTimeSpent: 0
      });

      const classesData = detailResponse.data?.classes || [];
      const mappedClasses: ClassReport[] = classesData.map((cls: any) => ({
        classId: cls.classId || cls.id || cls._id,
        className: cls.classId ? (cls.className || cls.tenLop || 'Lớp học') : null,
        classDescription: cls.classDescription || cls.moTa || '',
        lessons: (cls.lessons || []).map((lesson: any) => mapLessonReport(lesson))
      }));

      setClassReports(mappedClasses);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      setProgressStats(null);
      setClassReports([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadChildren(), loadReports()]);
    setRefreshing(false);
  };

  const getCompletionRate = () => {
    if (!progressStats || progressStats.totalLessons === 0) return 0;
    return Math.round((progressStats.completedLessons / progressStats.totalLessons) * 100);
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'Xuất sắc', color: '#4CAF50' };
    if (score >= 80) return { grade: 'Tốt', color: '#8BC34A' };
    if (score >= 70) return { grade: 'Khá', color: '#FFC107' };
    if (score >= 60) return { grade: 'Trung bình', color: '#FF9800' };
    return { grade: 'Cần cải thiện', color: '#F44336' };
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}p ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
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
      case 'number': return 'Số học';
      case 'color': return 'Màu sắc';
      case 'action': return 'Hành động';
      default: return 'Chung';
    }
  };

  const mapLessonReport = (lesson: any): LessonReport => {
    const questionBank = lesson.questions || lesson.questionBank || lesson.questionList || [];
    const buildOptions = (question: any, selectedIndex: number, correctIndex: number) => {
      const options = question?.options || question?.choices || [];
      return options.map((option: any, index: number) => {
        let rawText = '';
        if (typeof option === 'string') {
          rawText = option.includes(':') ? option.split(':').slice(1).join(':').trim() : option;
        } else {
          rawText = option?.text || option?.label || option?.value || `Tùy chọn ${index + 1}`;
        }
        const key = String.fromCharCode(65 + index);
        return {
          key,
          value: `${key}. ${rawText}`,
          isCorrect: index === correctIndex,
          isSelected: index === selectedIndex
        };
      });
    };

    const answers: LessonAnswerDetail[] = (lesson.answers || []).map((ans: any, index: number) => {
      const question = questionBank.find((q: any) =>
        q?.id === ans.questionId ||
        q?._id === ans.questionId ||
        String(q?.id) === String(ans.questionId)
      );

      const determineIndex = (value: any) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          if (/^[A-D]$/i.test(value)) {
            return value.toUpperCase().charCodeAt(0) - 65;
          }
          const parsed = parseInt(value, 10);
          if (!isNaN(parsed)) return parsed;
        }
        return -1;
      };

      const correctIndex = determineIndex(question?.correctAnswer);
      const selectedIndex = determineIndex(ans.answer);
      const options = buildOptions(question, selectedIndex, correctIndex);

      const questionText = question?.question || question?.text || `Câu hỏi ${index + 1}`;
      const correctAnswer = correctIndex >= 0
        ? String.fromCharCode(65 + correctIndex)
        : 'N/A';
      const answerValue = selectedIndex >= 0
        ? String.fromCharCode(65 + selectedIndex)
        : 'Chưa trả lời';

      return {
        questionId: ans.questionId,
        question: questionText,
        answer: answerValue,
        correctAnswer,
        isCorrect: ans.isCorrect ?? (selectedIndex === correctIndex),
        options
      };
    });

    return {
      id: lesson.lessonId || lesson.id || lesson._id,
      title: lesson.title || 'Bài học',
      category: lesson.category || 'general',
      level: lesson.level || 'beginner',
      description: lesson.description || '',
      className: lesson.className,
      score: lesson.score || 0,
      timeSpent: lesson.timeSpent || 0,
      completedAt: lesson.completedAt || null,
      status: lesson.status || 'chuaBatDau',
      answers,
      attempts: lesson.attempts || 0
    };
  };

  const handleViewDetail = (report: LessonReport) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải báo cáo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
          <Text style={styles.headerTitle}>Báo cáo học tập</Text>
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
        {progressStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{String(progressStats.totalLessons)}</Text>
                <Text style={styles.statLabel}>Tổng bài học</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{String(progressStats.completedLessons)}</Text>
                <Text style={styles.statLabel}>Đã hoàn thành</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{String(getCompletionRate())}%</Text>
                <Text style={styles.statLabel}>Tỷ lệ hoàn thành</Text>
              </View>
            </View>

            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: getScoreGrade(progressStats.averageScore).color }]}>
                  {String(Math.round(progressStats.averageScore))}
                </Text>
                <Text style={styles.statLabel}>Điểm trung bình</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatTime(progressStats.totalTimeSpent)}</Text>
                <Text style={styles.statLabel}>Thời gian học</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: getScoreGrade(progressStats.averageScore).color }]}>
                  {getScoreGrade(progressStats.averageScore).grade}
                </Text>
                <Text style={styles.statLabel}>Đánh giá</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết bài học</Text>
          
          {classReports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có bài học nào</Text>
              <Text style={styles.emptySubtext}>Trẻ chưa hoàn thành bài học nào</Text>
            </View>
          ) : (
            classReports.map((classReport) => (
              <View key={classReport.classId} style={styles.classSection}>
                <Text style={styles.classTitle}>{classReport.className}</Text>
                {classReport.classDescription ? (
                  <Text style={styles.classDescription}>{classReport.classDescription}</Text>
                ) : null}

                {classReport.lessons.length === 0 ? (
                  <View style={styles.emptyClassContainer}>
                    <Text style={styles.emptyClassText}>Chưa có bài học nào trong lớp này</Text>
                  </View>
                ) : (
                  classReport.lessons.map((report) => (
                    <TouchableOpacity 
                      key={`${classReport.classId}-${report.id}`} 
                      style={styles.reportCard}
                      onPress={() => handleViewDetail(report)}
                    >
                      <View style={styles.reportHeader}>
                        <View style={styles.reportIcon}>
                          <Ionicons 
                            name={getCategoryIcon(report.category) as any} 
                            size={20} 
                            color="#2196F3" 
                          />
                        </View>
                        <View style={styles.reportInfo}>
                          <Text style={styles.reportTitle}>{report.title}</Text>
                          <Text style={styles.reportCategory}>
                            {`${getCategoryName(report.category)} • ${report.level}`}
                          </Text>
                  {report.className ? (
                    <Text style={styles.reportClassName}>{report.className}</Text>
                  ) : null}
                        </View>
                        <View style={styles.scoreContainer}>
                          <Text style={[
                            styles.scoreText,
                            { color: getScoreGrade(report.score).color }
                          ]}>
                            {String(report.score)}
                          </Text>
                          <Text style={styles.scoreLabel}>điểm</Text>
                        </View>
                      </View>

                      <View style={styles.reportDetails}>
                        <View style={styles.detailItem}>
                          <Ionicons name="time" size={16} color="#666" />
                          <Text style={styles.detailText}>{formatTime(report.timeSpent)}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="calendar" size={16} color="#666" />
                          <Text style={styles.detailText}>
                            {report.completedAt ? new Date(report.completedAt).toLocaleDateString('vi-VN') : 'Chưa hoàn thành'}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          <Text style={[styles.detailText, { color: '#4CAF50' }]}>
                            {getScoreGrade(report.score).grade}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ErrorBoundary>
        <LessonDetailModal
          visible={detailModalVisible}
          report={selectedReport}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedReport(null);
          }}
        />
      </ErrorBoundary>
    </View>
  );
}

function LessonDetailModal({ visible, report, onClose }: {
  visible: boolean;
  report: LessonReport | null;
  onClose: () => void;
}) {
  if (!report) return null;

  const safeRenderText = (value: any, fallback: string = ''): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    return String(value || fallback);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}p ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'Xuất sắc', color: '#4CAF50' };
    if (score >= 80) return { grade: 'Tốt', color: '#8BC34A' };
    if (score >= 70) return { grade: 'Khá', color: '#FFC107' };
    if (score >= 60) return { grade: 'Trung bình', color: '#FF9800' };
    return { grade: 'Cần cải thiện', color: '#F44336' };
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
      case 'number': return 'Số học';
      case 'color': return 'Màu sắc';
      case 'action': return 'Hành động';
      default: return 'Chung';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Chi tiết bài học</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.lessonInfoCard}>
            <View style={styles.lessonHeader}>
              <View style={styles.lessonIcon}>
                <Ionicons 
                  name={getCategoryIcon(report.category) as any} 
                  size={24} 
                  color="#2196F3" 
                />
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle}>{safeRenderText(report.title, 'Bài học')}</Text>
                <Text style={styles.lessonCategory}>
                  {`${safeRenderText(getCategoryName(report.category), 'Chung')} • ${safeRenderText(report.level, 'beginner')}`}
                </Text>
              </View>
              <View style={styles.modalScoreContainer}>
                <Text style={[
                  styles.modalScoreText,
                  { color: getScoreGrade(report.score || 0).color }
                ]}>
                  {String(report.score || 0)}
                </Text>
                <Text style={styles.modalScoreLabel}>điểm</Text>
                </View>
              </View>

            <View style={styles.lessonStats}>
              <View style={styles.modalStatItem}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.modalStatText}>{formatTime(report.timeSpent || 0)}</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.modalStatText}>
                  {report.completedAt ? safeRenderText(new Date(report.completedAt).toLocaleDateString('vi-VN'), 'Chưa hoàn thành') : 'Chưa hoàn thành'}
                </Text>
                      </View>
              <View style={styles.modalStatItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.modalStatText, { color: '#4CAF50' }]}>
                  {safeRenderText(getScoreGrade(report.score || 0).grade, 'Chưa đánh giá')}
                      </Text>
              </View>
              {report.attempts && report.attempts > 0 && (
                <View style={styles.modalStatItem}>
                  <Ionicons name="refresh" size={16} color="#666" />
                  <Text style={styles.modalStatText}>{safeRenderText(`${report.attempts} lần thử`, '0 lần thử')}</Text>
                </View>
                    )}
                  </View>
          </View>

          {report.answers && Array.isArray(report.answers) && report.answers.length > 0 && (
            <View style={styles.answersSection}>
              <Text style={styles.modalSectionTitle}>Chi tiết câu trả lời</Text>
              {report.answers.map((answer, index) => {
                try {
                  if (!answer || typeof answer !== 'object') return null;
                
                const safeAnswer = {
                  question: safeRenderText(answer.question, 'Câu hỏi không có nội dung'),
                  answer: safeRenderText(answer.answer, 'Chưa trả lời'),
                  correctAnswer: safeRenderText(answer.correctAnswer, 'Không có đáp án'),
                  isCorrect: Boolean(answer.isCorrect),
                  options: Array.isArray(answer.options) ? answer.options.map(opt => ({
                    key: safeRenderText(opt?.key, '?'),
                    value: safeRenderText(opt?.value, 'Tùy chọn không có nội dung'),
                    isCorrect: Boolean(opt?.isCorrect),
                    isSelected: Boolean(opt?.isSelected)
                  })) : []
                };
                
                return (
                  <View key={index} style={styles.answerCard}>
                    <View style={styles.answerHeader}>
                      <Text style={styles.questionNumber}>{`Câu ${index + 1}`}</Text>
                      <View style={[
                        styles.answerStatus,
                        { backgroundColor: safeAnswer.isCorrect ? '#E8F5E8' : '#FFEBEE' }
                      ]}>
                        <Ionicons 
                          name={safeAnswer.isCorrect ? 'checkmark' : 'close'} 
                          size={16} 
                          color={safeAnswer.isCorrect ? '#4CAF50' : '#F44336'} 
                        />
                        <Text style={[
                          styles.answerStatusText,
                          { color: safeAnswer.isCorrect ? '#4CAF50' : '#F44336' }
                        ]}>
                          {safeAnswer.isCorrect ? 'Đúng' : 'Sai'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.questionText}>
                      {safeRenderText(safeAnswer.question, 'Câu hỏi không có nội dung')}
                    </Text>
                    
                    {safeAnswer.options && safeAnswer.options.length > 0 && (
                      <View style={styles.optionsContainer}>
                        {safeAnswer.options.map((option, optionIndex) => {
                          if (!option || typeof option !== 'object') return null;
                          return (
                            <View key={optionIndex} style={[
                              styles.optionItem,
                              option.isCorrect && styles.optionItemCorrect,
                              option.isSelected && !option.isCorrect && styles.optionItemWrong
                            ]}>
                              <View style={[
                                styles.optionKey,
                                option.isSelected && !option.isCorrect && styles.optionKeyWrong,
                                option.isCorrect && styles.optionKeyCorrect
                              ]}>
                                <Text style={[
                                  styles.optionKeyText,
                                  option.isSelected && !option.isCorrect && styles.optionKeyTextWrong,
                                  option.isCorrect && styles.optionKeyTextCorrect
                                ]}>
                                  {safeRenderText(option.key, '?')}
                                </Text>
                              </View>
                              <Text style={[
                                styles.optionValue,
                                option.isSelected && !option.isCorrect && styles.optionValueWrong,
                                option.isCorrect && styles.optionValueCorrect
                              ]}>
                                {safeRenderText(option.value, 'Tùy chọn không có nội dung')}
                              </Text>
                            </View>
                          );
                        })}
                </View>
              )}

                    <View style={styles.answerSummary}>
                      <View style={styles.answerRow}>
                        <Text style={styles.answerLabel}>Đáp án của trẻ:</Text>
                        <Text style={[styles.answerValue, { color: safeAnswer.isCorrect ? '#4CAF50' : '#F44336' }]}>
                          {safeRenderText((() => {
                            const answer = safeAnswer.answer;
                            if (typeof answer === 'number') {
                              return String.fromCharCode(65 + answer);
                            } else if (typeof answer === 'string') {
                              if (answer.length === 1 && answer >= 'A' && answer <= 'D') {
                                return answer; 
                              } else if (answer.length === 1 && answer >= '0' && answer <= '3') {
                                return String.fromCharCode(65 + parseInt(answer));
                              }
                              return answer;
                            }
                            return String(answer || 'Chưa trả lời');
                          })(), 'Chưa trả lời')}
                        </Text>
                        <Ionicons 
                          name={safeAnswer.isCorrect ? "checkmark-circle" : "close-circle"} 
                          size={20} 
                          color={safeAnswer.isCorrect ? '#4CAF50' : '#F44336'} 
                        />
                      </View>
                      <View style={styles.answerRow}>
                        <Text style={styles.answerLabel}>Đáp án đúng:</Text>
                        <Text style={[styles.answerValue, { color: '#4CAF50' }]}>
                          {safeRenderText((() => {
                            const correctAnswer = safeAnswer.correctAnswer;
                            if (typeof correctAnswer === 'number') {
                              return String.fromCharCode(65 + correctAnswer); 
                            } else if (typeof correctAnswer === 'string') {
                              if (correctAnswer.match(/^[A-D]$/)) {
                                return correctAnswer;
                              }
                              const num = parseInt(correctAnswer);
                              if (!isNaN(num) && num >= 0 && num <= 3) {
                                return String.fromCharCode(65 + num);
                              }
                              return correctAnswer;
                            }
                            return String(correctAnswer || 'Không có đáp án');
                          })(), 'Không có đáp án')}
                        </Text>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      </View>
                    </View>
            </View>
                );
                } catch (error) {
                  return null;
                }
              })}
            </View>
        )}
      </ScrollView>
    </View>
    </Modal>
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
  statsContainer: {
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  classSection: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  classTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  emptyClassContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyClassText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  reportClassName: {
    fontSize: 11,
    color: '#9C27B0',
    fontStyle: 'italic',
  },
  reportCategory: {
    fontSize: 12,
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#4CAF50',
  },
  reportDetails: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  lessonInfoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lessonCategory: {
    fontSize: 14,
    color: '#666',
  },
  modalScoreContainer: {
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScoreLabel: {
    fontSize: 12,
    color: '#4CAF50',
  },
  lessonStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  modalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalStatText: {
    fontSize: 14,
    color: '#666',
  },
  answersSection: {
    marginTop: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  answerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  answerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  answerStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  answerDetails: {
    gap: 8,
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerLabel: {
    fontSize: 12,
    color: '#666',
    minWidth: 100,
  },
  answerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 40,
    alignItems: 'center',
  },
  answerBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  comparisonContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  comparisonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsContainer: {
    marginVertical: 12,
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionItemCorrect: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  optionItemWrong: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  optionKey: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionKeyWrong: {
    backgroundColor: '#F44336',
  },
  optionKeyCorrect: {
    backgroundColor: '#4CAF50',
  },
  optionKeyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  optionKeyTextWrong: {
    color: '#fff',
  },
  optionKeyTextCorrect: {
    color: '#fff',
  },
  optionValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  optionValueWrong: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  optionValueCorrect: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
  },
  answerValue: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  answerSummary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
});