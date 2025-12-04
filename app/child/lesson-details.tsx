import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';

interface Lesson {
  id?: string;
  _id?: string;
  title?: string;
  tieuDe?: string;
  category?: string;
  danhMuc?: string;
  level?: string;
  capDo?: string;
  description?: string;
  moTa?: string;
  imageUrl?: string;
  anhDaiDien?: string;
  content?: {
    text?: string;
    examples?: string[];
    exercises?: Exercise[];
  };
  noiDung?: {
    vanBan?: string;
    viDu?: string[];
    baiTap?: any[];
  };
}

interface Exercise {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: any;
  imageUrl?: string;
  text?: string;
}

interface LessonHistoryItem {
  id: string;
  lesson: Lesson;
  score: number;
  timeSpent: number;
  completedAt: string;
  answers: Array<{
    exerciseId: string;
    answer: string;
    isCorrect: boolean;
    correctAnswer?: string;
    question?: string;
    options?: string[];
  }>;
}

export default function LessonDetails() {
  const router = useRouter();
  const { lessonId, historyId } = useLocalSearchParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [historyItem, setHistoryItem] = useState<LessonHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading lesson details for lessonId:', lessonId);
      
      if (!lessonId) {
        Alert.alert('Lỗi', 'Không tìm thấy ID bài học');
        router.back();
        return;
      }
      
      const lessonResponse = await api.lessons.get(lessonId as string);
      const lessonData = lessonResponse.data;
      
      // Transform exercises from Vietnamese to English format
      const exercises = (lessonData.content?.exercises || lessonData.noiDung?.baiTap || []).map((ex: any) => ({
        id: ex._id || ex.id,
        type: ex.loai === 'tracNghiem' ? 'multiple_choice' :
              ex.loai === 'dienKhuyet' ? 'fill_blank' :
              ex.loai === 'keoTha' ? 'drag_drop' :
              ex.loai === 'ghepDoi' ? 'matching' :
              ex.loai === 'toMau' ? 'coloring' : ex.type,
        question: ex.cauHoi || ex.question,
        options: ex.phuongAn || ex.options,
        correctAnswer: ex.dapAnDung || ex.correctAnswer,
        imageUrl: ex.anhDaiDien || ex.imageUrl,
        text: ex.vanBan || ex.text
      }));
      
      // Transform lesson data to handle both Vietnamese and English fields
      const transformedLesson: Lesson = {
        ...lessonData,
        id: lessonData.id || lessonData._id,
        title: lessonData.title || lessonData.tieuDe,
        description: lessonData.description || lessonData.moTa,
        category: lessonData.category || lessonData.danhMuc,
        level: lessonData.level || lessonData.capDo,
        imageUrl: lessonData.imageUrl || lessonData.anhDaiDien,
        content: {
          text: lessonData.content?.text || lessonData.noiDung?.vanBan,
          examples: lessonData.content?.examples || lessonData.noiDung?.viDu,
          exercises: exercises
        },
        noiDung: lessonData.noiDung
      };
      setLesson(transformedLesson);

      if (historyId) {
        console.log('Loading history item:', historyId);
        try {
          const progressResponse = await api.progress.get(historyId as string);
          console.log('Progress response:', progressResponse);
          
          if (progressResponse.data) {
            const progress = progressResponse.data;
            const historyItem: LessonHistoryItem = {
              id: progress._id || progress.id,
              lesson: progress.baiHoc || progress.lesson,
              score: progress.diemSo || progress.score || 0,
              timeSpent: progress.thoiGianDaDung || progress.timeSpent || 0,
              completedAt: progress.ngayHoanThanh || progress.completedAt || new Date().toISOString(),
              answers: (progress.cauTraLoi || progress.answers || []).map((a: any) => ({
                exerciseId: a.idBaiTap || a.exerciseId,
                answer: a.cauTraLoi || a.answer,
                isCorrect: a.dung !== undefined ? a.dung : a.isCorrect
              }))
            };
            console.log('History item created:', historyItem);
            setHistoryItem(historyItem);
          }
        } catch (error) {
          console.error('Error loading progress:', error);
          const mockHistoryItem: LessonHistoryItem = {
            id: historyId as string,
            lesson: lessonResponse.data,
            score: 0,
            timeSpent: 0,
            completedAt: new Date().toISOString(),
            answers: []
          };
          setHistoryItem(mockHistoryItem);
        }
      }
    } catch (error) {
      console.error('Error loading lesson details:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết bài học');
    } finally {
      setLoading(false);
    }
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

  const checkAnswer = (exerciseId: string, userAnswer: any, correctAnswer: any, options?: string[]) => {
    if (options) {
      let userIndex = userAnswer;
      if (typeof userAnswer === 'string' && userAnswer.length === 1) {
        userIndex = userAnswer.charCodeAt(0) - 65;
      }
      
      let correctIndex;
      if (typeof correctAnswer === 'string' && correctAnswer.length === 1) {
        correctIndex = correctAnswer.charCodeAt(0) - 65;
      } else {
        correctIndex = typeof correctAnswer === 'string' ? 
          parseInt(correctAnswer) : correctAnswer;
      }
      
      return userIndex === correctIndex;
    }
    return userAnswer === correctAnswer;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#F44336" />
        <Text style={styles.errorText}>Không tìm thấy bài học</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài học</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.lessonInfo}>
          <View style={styles.lessonHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(lesson.category || lesson.danhMuc || '') }]}>
              <Ionicons name={getCategoryIcon(lesson.category || lesson.danhMuc || '') as any} size={24} color="#fff" />
            </View>
            <View style={styles.lessonDetails}>
              <Text style={styles.lessonTitle}>{lesson.title || lesson.tieuDe}</Text>
              <Text style={styles.lessonCategory}>{getCategoryName(lesson.category || lesson.danhMuc || '')}</Text>
              <Text style={styles.lessonLevel}>{getLevelText(lesson.level || lesson.capDo || '')}</Text>
            </View>
          </View>

          {(lesson.description || lesson.moTa) && (
            <Text style={styles.lessonDescription}>{lesson.description || lesson.moTa}</Text>
          )}

          {((lesson.content?.text || lesson.noiDung?.vanBan)) && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Nội dung bài học</Text>
              <Text style={styles.contentText}>{lesson.content?.text || lesson.noiDung?.vanBan}</Text>
            </View>
          )}

          {((lesson.content?.examples || lesson.noiDung?.viDu) && (lesson.content?.examples || lesson.noiDung?.viDu || []).length > 0) && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Ví dụ</Text>
              {(lesson.content?.examples || lesson.noiDung?.viDu || []).map((example, index) => (
                <Text key={index} style={styles.exampleText}>
                  • {example}
                </Text>
              ))}
            </View>
          )}
        </View>

          {historyItem && (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionTitle}>Kết quả bài làm</Text>
              <View style={styles.resultsCard}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Điểm số:</Text>
                  <Text style={[styles.resultValue, { color: getScoreColor(historyItem.score) }]}>
                    {historyItem.score}%
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Thời gian:</Text>
                  <Text style={styles.resultValue}>{formatTime(historyItem.timeSpent)}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Ngày hoàn thành:</Text>
                  <Text style={styles.resultValue}>{formatDate(historyItem.completedAt)}</Text>
                </View>
                {historyItem.answers && historyItem.answers.length > 0 && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Kết quả:</Text>
                    <Text style={styles.resultValue}>
                      {historyItem.answers.filter(a => a.isCorrect).length}/{historyItem.answers.length} câu đúng
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {((lesson.content?.exercises || lesson.noiDung?.baiTap) && (lesson.content?.exercises || lesson.noiDung?.baiTap || []).length > 0) && (
            <View style={styles.exercisesSection}>
              <Text style={styles.sectionTitle}>Bài tập</Text>
            {(lesson.content?.exercises || (lesson.noiDung?.baiTap || []).map((ex: any) => ({
              id: ex._id || ex.id,
              type: ex.loai === 'tracNghiem' ? 'multiple_choice' :
                    ex.loai === 'dienKhuyet' ? 'fill_blank' :
                    ex.loai === 'keoTha' ? 'drag_drop' :
                    ex.loai === 'ghepDoi' ? 'matching' :
                    ex.loai === 'toMau' ? 'coloring' : ex.type,
              question: ex.cauHoi || ex.question,
              options: ex.phuongAn || ex.options,
              correctAnswer: ex.dapAnDung || ex.correctAnswer,
              imageUrl: ex.anhDaiDien || ex.imageUrl,
              text: ex.vanBan || ex.text
            })) || []).map((exercise, index) => (
              <View key={exercise.id || index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseNumber}>Câu {index + 1}</Text>
                  <Text style={styles.exerciseType}>
                    {exercise.type === 'multiple_choice' ? 'Trắc nghiệm' :
                     exercise.type === 'fill_blank' ? 'Điền từ' :
                     exercise.type === 'drag_drop' ? 'Kéo thả' :
                     exercise.type === 'matching' ? 'Nối' : 'Tô màu'}
                  </Text>
                </View>

                <Text style={styles.exerciseQuestion}>{exercise.question}</Text>
                
                {historyItem?.answers && (() => {
                  const exerciseId = exercise.id || (exercise as any)._id;
                  const studentAnswer = historyItem.answers.find(a => 
                    a.exerciseId === exerciseId || 
                    a.exerciseId === exercise.id || 
                    a.exerciseId === (exercise as any)._id
                  );
                  
                  if (studentAnswer) {
                    return (
                      <View style={styles.answerSummary}>
                        <View style={styles.answerRow}>
                          <Text style={styles.answerLabel}>Đáp án của bạn:</Text>
                          <Text style={[styles.answerValue, { color: studentAnswer.isCorrect ? '#4CAF50' : '#F44336' }]}>
                            {(() => {
                              if (typeof studentAnswer.answer === 'number') {
                                return String.fromCharCode(65 + studentAnswer.answer);
                              } else if (typeof studentAnswer.answer === 'string') {
                                if (studentAnswer.answer.length === 1 && studentAnswer.answer >= 'A' && studentAnswer.answer <= 'D') {
                                  return studentAnswer.answer;
                                } else if (studentAnswer.answer.length === 1 && studentAnswer.answer >= '0' && studentAnswer.answer <= '3') {
                                  return String.fromCharCode(65 + parseInt(studentAnswer.answer)); 
                                }
                              }
                              return studentAnswer.answer;
                            })()}
                          </Text>
                          <Ionicons 
                            name={studentAnswer.isCorrect ? "checkmark-circle" : "close-circle"} 
                            size={20} 
                            color={studentAnswer.isCorrect ? '#4CAF50' : '#F44336'} 
                          />
                        </View>
                        <View style={styles.answerRow}>
                          <Text style={styles.answerLabel}>Đáp án đúng:</Text>
                          <Text style={[styles.answerValue, { color: '#4CAF50' }]}>
                            {(() => {
                              if (typeof exercise.correctAnswer === 'number') {
                                return String.fromCharCode(65 + exercise.correctAnswer); 
                              } else if (typeof exercise.correctAnswer === 'string') {
                                if (exercise.correctAnswer.match(/^[A-D]$/)) {
                                  return exercise.correctAnswer;
                                }
                                const num = parseInt(exercise.correctAnswer);
                                if (!isNaN(num) && num >= 0 && num <= 3) {
                                  return String.fromCharCode(65 + num);
                                }
                                return exercise.correctAnswer;
                              }
                              return exercise.correctAnswer;
                            })()}
                          </Text>
                          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()}

                {exercise.type === 'multiple_choice' && exercise.options && (
                  <View style={styles.optionsContainer}>
                    {exercise.options.map((option: string, optionIndex: number) => {
                      let correctIndex;
                      if (typeof exercise.correctAnswer === 'string' && exercise.correctAnswer.length === 1) {
                        correctIndex = exercise.correctAnswer.charCodeAt(0) - 65;
                      } else {
                        correctIndex = typeof exercise.correctAnswer === 'string' ? 
                          parseInt(exercise.correctAnswer) : exercise.correctAnswer;
                      }
                      const isCorrectOption = optionIndex === correctIndex;
                      
                      const exerciseId = exercise.id || (exercise as any)._id;
                      const studentAnswer = historyItem?.answers?.find(a => 
                        a.exerciseId === exerciseId || 
                        a.exerciseId === exercise.id || 
                        a.exerciseId === (exercise as any)._id
                      );
                      
                      let studentAnswerIndex: number | undefined = undefined;
                      if (studentAnswer?.answer !== undefined) {
                        if (typeof studentAnswer.answer === 'number') {
                          studentAnswerIndex = studentAnswer.answer;
                        } else if (typeof studentAnswer.answer === 'string' && studentAnswer.answer.length === 1) {
                          studentAnswerIndex = studentAnswer.answer.charCodeAt(0) - 65;
                        }
                      }
                      const isStudentAnswer = studentAnswer && studentAnswerIndex !== undefined && studentAnswerIndex === optionIndex;
                      
                      
                      return (
                        <View
                          key={optionIndex}
                          style={[
                            styles.optionItem,
                            isCorrectOption && styles.optionCorrect,
                            isStudentAnswer && styles.optionStudentAnswer
                          ]}
                        >
                          <Text style={[
                            styles.optionText,
                            isCorrectOption && styles.optionTextCorrect,
                            isStudentAnswer && styles.optionTextStudentAnswer
                          ]}>
                            {typeof option === 'string' && option.includes(': ') 
                              ? option 
                              : `${String.fromCharCode(65 + optionIndex)}. ${option}`}
                          </Text>
                          <View style={styles.optionIcons}>
                            {isCorrectOption && (
                              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                            )}
                            {isStudentAnswer && (
                              <Ionicons 
                                name={studentAnswer.isCorrect ? "checkmark-circle" : "close-circle"} 
                                size={20} 
                                color={studentAnswer.isCorrect ? "#4CAF50" : "#F44336"} 
                              />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {exercise.type === 'fill_blank' && exercise.text && (
                  <Text style={styles.exerciseText}>{exercise.text}</Text>
                )}

                {exercise.imageUrl && (
                  <View style={styles.exerciseImageContainer}>
                    <Text style={styles.imagePlaceholder}>Hình ảnh bài tập</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {historyItem && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Kết quả bài làm</Text>
            <View style={styles.historyCard}>
              <View style={styles.historyStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{historyItem.score}%</Text>
                  <Text style={styles.statLabel}>Điểm số</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatTime(historyItem.timeSpent)}</Text>
                  <Text style={styles.statLabel}>Thời gian</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatDate(historyItem.completedAt)}
                  </Text>
                  <Text style={styles.statLabel}>Hoàn thành</Text>
                </View>
              </View>

              <View style={styles.answersSummary}>
                <Text style={styles.answersTitle}>Chi tiết câu trả lời:</Text>
                {historyItem.answers.map((answer, index) => (
                  <View key={index} style={styles.answerItem}>
                    <Ionicons 
                      name={answer.isCorrect ? "checkmark-circle" : "close-circle"} 
                      size={20} 
                      color={answer.isCorrect ? "#4CAF50" : "#F44336"} 
                    />
                    <Text style={styles.answerText}>
                      Câu {index + 1}: {answer.answer} 
                      {answer.isCorrect ? " (Đúng)" : " (Sai)"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  lessonInfo: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  lessonDetails: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lessonCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lessonLevel: {
    fontSize: 14,
    color: '#999',
  },
  lessonDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  contentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  exampleText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 8,
  },
  exercisesSection: {
    margin: 20,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  exerciseType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  exerciseQuestion: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionCorrect: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  optionTextCorrect: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  optionTextStudentAnswer: {
    color: '#2196F3',
    fontWeight: '600',
  },
  optionStudentAnswer: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  answerSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  answerLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginRight: 8,
    minWidth: 100,
  },
  answerValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  exerciseImageContainer: {
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  imagePlaceholder: {
    color: '#999',
    fontSize: 14,
  },
  historySection: {
    margin: 20,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  answersSummary: {
    marginTop: 16,
  },
  answersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  answerText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});
