import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal
} from 'react-native';
import { checkAnswerCorrect, convertAnswerToLetter, convertAnswerToIndex } from '../../utils/answerUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Exercise {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'drag_drop' | 'matching' | 'coloring';
  question: string;
  options?: string[];
  correctAnswer: any;
  imageUrl?: string;
  text?: string;
  blanks?: Blank[];
}

interface Blank {
  position: number;
  correctAnswer: string;
  options?: string[];
}

interface Lesson {
  id?: string;
  _id?: string;
  title?: string;
  tieuDe?: string;
  category?: 'letter' | 'number' | 'color' | 'action' | 'chuCai' | 'so' | 'mauSac' | 'hanhDong';
  danhMuc?: 'chuCai' | 'so' | 'mauSac' | 'hanhDong';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'coBan' | 'trungBinh' | 'nangCao';
  capDo?: 'coBan' | 'trungBinh' | 'nangCao';
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
  estimatedTime?: number;
  thoiGianUocTinh?: number;
}

interface LessonResultsProps {
  lesson: Lesson;
  userAnswers: {[key: string]: any};
  score: number;
  timeSpent: number;
  onClose: () => void;
  onRetry: () => void;
}

export default function LessonResults({ 
  lesson, 
  userAnswers, 
  score, 
  timeSpent, 
  onClose, 
  onRetry 
}: LessonResultsProps) {
  const checkAnswer = (exerciseId: string, userAnswer: any) => {
    const exercises = lesson.content?.exercises || (lesson as any).noiDung?.baiTap || [];
    const exercise = exercises.find((ex: any) => (ex as any)._id === exerciseId || ex.id === exerciseId);
    if (!exercise) return false;

    if (exercise.type === 'multiple_choice' && exercise.options) {
      return checkAnswerCorrect(userAnswer, exercise.correctAnswer);
    }

    return userAnswer === exercise.correctAnswer;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 70) return '#FF9800';
    if (score >= 50) return '#FF5722';
    return '#F44336';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Xuất sắc! 🌟';
    if (score >= 80) return 'Tuyệt vời! 🎉';
    if (score >= 70) return 'Tốt lắm! 👍';
    if (score >= 60) return 'Khá tốt! 😊';
    if (score >= 50) return 'Cần cố gắng thêm! 💪';
    return 'Hãy học lại nhé! 📚';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const correctAnswers = Object.entries(userAnswers).filter(([exerciseId, answer]) => 
    checkAnswer(exerciseId, answer)
  ).length;
  const exercises = lesson.content?.exercises || (lesson as any).noiDung?.baiTap || [];
  const totalQuestions = exercises.length;

  return (
    <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <LinearGradient
          colors={['#4CAF50', '#45A049']}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.headerCloseButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kết quả bài học</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
              {score}
            </Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
          <Text style={styles.scoreMessage}>{getScoreMessage(score)}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.statText}>{correctAnswers}/{totalQuestions} câu đúng</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.statText}>{formatTime(timeSpent)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>{lesson.title || (lesson as any).tieuDe}</Text>
          <Text style={styles.lessonCategory}>
            {(lesson.category || (lesson as any).danhMuc) === 'letter' || (lesson.category || (lesson as any).danhMuc) === 'chuCai' ? 'Chữ cái' :
             (lesson.category || (lesson as any).danhMuc) === 'number' || (lesson.category || (lesson as any).danhMuc) === 'so' ? 'Số đếm' :
             (lesson.category || (lesson as any).danhMuc) === 'color' || (lesson.category || (lesson as any).danhMuc) === 'mauSac' ? 'Màu sắc' : 'Hành động'} • {
             (lesson.level || (lesson as any).capDo) === 'beginner' || (lesson.level || (lesson as any).capDo) === 'coBan' ? 'Cơ bản' :
             (lesson.level || (lesson as any).capDo) === 'intermediate' || (lesson.level || (lesson as any).capDo) === 'trungBinh' ? 'Trung bình' : 'Nâng cao'}
          </Text>
        </View>

        <View style={styles.exercisesContainer}>
          <Text style={styles.exercisesTitle}>Chi tiết bài làm</Text>
          {exercises.map((exercise: any, index: number) => {
            const exerciseId = (exercise as any)._id || exercise.id || `exercise-${index}`;
            const userAnswer = userAnswers[exerciseId];
            let isCorrect = false;
            if (userAnswer !== undefined) {
              try {
                isCorrect = checkAnswer(exerciseId, userAnswer);
              } catch (error) {
                isCorrect = false;
              }
            }
            
            return (
              <View key={exercise.id || `exercise-${index}`} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseNumber}>Câu {index + 1}</Text>
                  <View style={[
                    styles.resultBadge,
                    { backgroundColor: isCorrect ? '#E8F5E8' : '#FFEBEE' }
                  ]}>
                    <Ionicons 
                      name={isCorrect ? "checkmark" : "close"} 
                      size={16} 
                      color={isCorrect ? "#4CAF50" : "#F44336"} 
                    />
                    <Text style={[
                      styles.resultBadgeText,
                      { color: isCorrect ? "#4CAF50" : "#F44336" }
                    ]}>
                      {isCorrect ? "Đúng" : "Sai"}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.exerciseQuestion}>{exercise.question}</Text>
                
                {exercise.type === 'multiple_choice' && exercise.options && (
                  <View style={styles.optionsContainer}>
                    <Text style={styles.optionsTitle}>Các lựa chọn:</Text>
                    {exercise.options.map((option: string, optionIndex: number) => {
                      let userIndex = userAnswer;
                      if (typeof userAnswer === 'string' && userAnswer.length === 1) {
                        userIndex = userAnswer.charCodeAt(0) - 65;
                      }
                      
                      const isSelected = userIndex === optionIndex;
                      
                      let correctIndex;
                      if (typeof exercise.correctAnswer === 'string' && exercise.correctAnswer.length === 1) {
                        correctIndex = exercise.correctAnswer.charCodeAt(0) - 65;
                      } else {
                        correctIndex = typeof exercise.correctAnswer === 'string' ? 
                          parseInt(exercise.correctAnswer) : exercise.correctAnswer;
                      }
                      const isCorrectOption = optionIndex === correctIndex;
                      
                      return (
                        <View
                          key={`option-${index}-${optionIndex}`}
                          style={[
                            styles.optionResult,
                            isSelected && styles.optionSelected,
                            isCorrectOption && styles.optionCorrect,
                            isSelected && !isCorrectOption && styles.optionIncorrect
                          ]}
                        >
                          <Text style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                            isCorrectOption && styles.optionTextCorrect,
                            isSelected && !isCorrectOption && styles.optionTextIncorrect
                          ]}>
                            {typeof option === 'string' && option.includes(': ') 
                              ? option 
                              : `${String.fromCharCode(65 + optionIndex)}. ${option}`}
                          </Text>
                          <View style={styles.optionIcons}>
                            {isSelected && (
                              <Text style={styles.selectedLabel}>Bạn chọn</Text>
                            )}
                            {isCorrectOption && (
                              <View style={styles.correctAnswerContainer}>
                                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={styles.optionIcon} />
                                <Text style={styles.correctAnswerLabel}>Đáp án đúng</Text>
                              </View>
                            )}
                            {isSelected && !isCorrectOption && (
                              <Ionicons name="close-circle" size={18} color="#F44336" style={styles.optionIcon} />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
                
                {exercise.type === 'multiple_choice' && (() => {
                  const correctIndex = convertAnswerToIndex(exercise.correctAnswer);
                  
                  return (
                    <View style={styles.answerSummary}>
                      <View style={styles.answerContainer}>
                        <Text style={styles.answerLabel}>Đáp án của bạn:</Text>
                        <Text style={[
                          styles.userAnswer,
                          isCorrect ? styles.userAnswerCorrect : styles.userAnswerIncorrect
                        ]}>
                          {userAnswer !== undefined ? convertAnswerToLetter(userAnswer) : 'Chưa trả lời'}
                        </Text>
                      </View>
                      <View style={styles.answerContainer}>
                        <Text style={styles.answerLabel}>Đáp án đúng:</Text>
                        <Text style={styles.correctAnswer}>
                          {convertAnswerToLetter(exercise.correctAnswer)}
                        </Text>
                      </View>
                    </View>
                  );
                })()}
                
                {exercise.type === 'fill_blank' && (
                  <View style={styles.fillBlankResult}>
                    <Text style={styles.fillBlankText}>{exercise.text}</Text>
                    <View style={styles.answerContainer}>
                      <Text style={styles.answerLabel}>Câu trả lời của bạn:</Text>
                      <Text style={[
                        styles.userAnswer,
                        isCorrect ? styles.userAnswerCorrect : styles.userAnswerIncorrect
                      ]}>
                        {userAnswer || 'Chưa trả lời'}
                      </Text>
                    </View>
                    <View style={styles.answerContainer}>
                      <Text style={styles.answerLabel}>Đáp án đúng:</Text>
                      <Text style={styles.correctAnswer}>{exercise.correctAnswer}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color="#4CAF50" />
          <Text style={styles.retryButtonText}>Làm lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.closeButtonText}>Hoàn thành</Text>
        </TouchableOpacity>
      </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCloseButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 18,
    color: '#666',
  },
  scoreMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 16,
    color: '#666',
  },
  lessonInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  lessonCategory: {
    fontSize: 14,
    color: '#666',
  },
  exercisesContainer: {
    marginBottom: 20,
  },
  exercisesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#333',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exerciseQuestion: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 8,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  optionResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionSelected: {
    backgroundColor: '#f0f0f0',
  },
  optionCorrect: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  optionIncorrect: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  optionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  optionIcon: {
    marginLeft: 4,
  },
  correctAnswerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  correctAnswerLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: '#F44336',
    fontWeight: '600',
  },
  fillBlankResult: {
    gap: 12,
  },
  fillBlankText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  answerContainer: {
    gap: 4,
  },
  answerLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  userAnswer: {
    fontSize: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  userAnswerCorrect: {
    backgroundColor: '#E8F5E8',
    color: '#4CAF50',
    fontWeight: '600',
  },
  userAnswerIncorrect: {
    backgroundColor: '#FFEBEE',
    color: '#F44336',
    fontWeight: '600',
  },
  correctAnswer: {
    fontSize: 16,
    padding: 8,
    backgroundColor: '#E8F5E8',
    color: '#4CAF50',
    borderRadius: 6,
    fontWeight: '600',
  },
  answerSummary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f8f0',
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 8,
  },
  retryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    gap: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
