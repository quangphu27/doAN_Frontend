import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  Image,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { api } from '../../../lib/api';
import { getImageSource } from '../../../utils/imageUtils';
import { useAuth } from '../../../context/AuthContext';
import { useSound } from '../../../hooks/useSound';

const { width, height } = Dimensions.get('window');

interface Question {
  id: string;
  mediaUrl?: string;
  imageUrl?: string;
  mediaType?: 'image' | 'video' | 'gif';
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface GuessingGameProps {
  gameId?: string;
}

export default function GuessingGame({ gameId: propGameId }: GuessingGameProps) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { playSound } = useSound();
  const { user } = useAuth();
  const gameId = propGameId || (params.gameId as string);
  
  const [gameData, setGameData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Array<{ questionId: string; answer: string; isCorrect: boolean }>>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    setStartTime(Date.now());
    loadGameData();
  }, [gameId]);

  const loadGameData = async () => {
    if (!gameId) {
      Alert.alert('Lỗi', 'Không tìm thấy game ID');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.games.get(gameId);
      
      if (response && response.data) {
        const game = response.data;
        setGameData(game);

        let questionsData: Question[] = [];

        if (game.data?.questions && game.data.questions.length > 0) {
          questionsData = game.data.questions;
        } else if (game.duLieu?.cauHoi && Array.isArray(game.duLieu.cauHoi) && game.duLieu.cauHoi.length > 0) {
          questionsData = game.duLieu.cauHoi.map((q: any, index: number) => {
            const mediaPath = q.phuongTien || q.anhDaiDien || '';
            const loaiPhuongTien = q.loaiPhuongTien || 'anh';
            let mediaType: 'image' | 'video' | 'gif' = 'image';

            if (loaiPhuongTien === 'video') {
              mediaType = 'video';
            } else if (loaiPhuongTien === 'gif') {
              mediaType = 'gif';
            }

            return {
              id: q.id || `question_${index}`,
              mediaUrl: mediaPath,
              imageUrl: mediaType === 'image' ? mediaPath : undefined,
              mediaType: mediaType,
              options: q.phuongAn || [],
              correctAnswer: q.dapAnDung || '',
              explanation: q.giaiThich || ''
            } as Question;
          });
        }

        setQuestions(questionsData);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu game');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) {
      Alert.alert('Lỗi', 'Vui lòng chọn một đáp án');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      playSound('correct');
      setScore(prev => prev + 1);
    } else {
      playSound('failanswer');
    }

    setAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      isCorrect: correct
    }]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      handleGameComplete();
    }
  };

  const handleGameComplete = async () => {
    const completionTime = Math.round((Date.now() - startTime) / 1000);
    const finalScore = Math.round((score / questions.length) * 100);
    setCompleted(true);

    if (score === questions.length) {
      playSound('correct');
      Animated.parallel([
        Animated.spring(celebrationScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ]).start();
    }

    try {
      await api.games.saveResult({
        gameId,
        userId: user?.id || '',
        score: finalScore,
        timeSpent: completionTime,
        gameType: 'guessing',
        resultData: {
          isCompleted: true,
          correctAnswers: score,
          totalQuestions: questions.length,
          answers: answers
        }
      });
    } catch (error) {
    }

    setTimeout(() => {
      Alert.alert(
        '🎉 Hoàn thành!',
        `Bạn đã hoàn thành game!\n\nĐiểm số: ${score}/${questions.length}\nThời gian: ${completionTime} giây\nTỷ lệ: ${finalScore}%`,
        [
          {
            text: 'Chơi lại',
            onPress: () => {
              setCurrentQuestionIndex(0);
              setSelectedAnswer(null);
              setShowResult(false);
              setScore(0);
              setAnswers([]);
              setCompleted(false);
              setStartTime(Date.now());
              celebrationScale.setValue(0);
              celebrationOpacity.setValue(0);
            }
          },
          {
            text: 'Trang chủ',
            onPress: () => router.back()
          }
        ]
      );
    }, 2000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải game...</Text>
      </View>
    );
  }

  if (!gameData || questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy dữ liệu game</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const mediaUrl = currentQuestion?.mediaUrl || currentQuestion?.imageUrl;
  const mediaType = currentQuestion?.mediaType || (currentQuestion?.imageUrl ? 'image' : (mediaUrl?.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image'));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#9B59B6', '#8E44AD']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đoán hành động</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{score}/{questions.length}</Text>
        </View>
      </LinearGradient>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Câu {currentQuestionIndex + 1} / {questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mediaContainer}>
          {mediaUrl ? (
            <>
              {mediaType === 'video' || mediaUrl.match(/\.(mp4|mov|webm)$/i) ? (
                <Video
                  ref={videoRef}
                  source={getImageSource(mediaUrl)}
                  style={styles.media}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                  useNativeControls={true}
                />
              ) : (
                <Image
                  source={getImageSource(mediaUrl)}
                  style={styles.media}
                  resizeMode="contain"
                />
              )}
            </>
          ) : (
            <View style={styles.placeholderMedia}>
              <Ionicons name="image-outline" size={60} color="#ccc" />
              <Text style={styles.placeholderText}>Không có media</Text>
            </View>
          )}
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion?.options && currentQuestion.options.length > 0 ? (
            currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;
            const showCorrect = showResult && isCorrectOption;
            const showWrong = showResult && isSelected && !isCorrectOption;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && !showResult && styles.optionButtonSelected,
                  showCorrect && styles.optionButtonCorrect,
                  showWrong && styles.optionButtonWrong
                ]}
                onPress={() => handleAnswerSelect(option)}
                disabled={showResult}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionIndicator,
                    isSelected && styles.optionIndicatorSelected,
                    showCorrect && styles.optionIndicatorCorrect,
                    showWrong && styles.optionIndicatorWrong
                  ]}>
                    {isSelected && (
                      <Ionicons 
                        name={showCorrect ? "checkmark" : showWrong ? "close" : "radio-button-on"} 
                        size={20} 
                        color={showCorrect || showWrong ? "#fff" : "#9B59B6"} 
                      />
                    )}
                  </View>
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                    showCorrect && styles.optionTextCorrect,
                    showWrong && styles.optionTextWrong
                  ]}>
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
          ) : (
            <View style={styles.placeholderMedia}>
              <Ionicons name="help-circle-outline" size={40} color="#ccc" />
              <Text style={styles.placeholderText}>Không có đáp án</Text>
            </View>
          )}
        </View>

        {showResult && currentQuestion.explanation && (
          <View style={styles.explanationContainer}>
            <Ionicons name="information-circle" size={20} color="#4CAF50" />
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}

        {!showResult && (
          <TouchableOpacity
            style={[styles.submitButton, !selectedAnswer && styles.submitButtonDisabled]}
            onPress={handleSubmitAnswer}
            disabled={!selectedAnswer}
          >
            <Text style={styles.submitButtonText}>Xác nhận</Text>
          </TouchableOpacity>
        )}

        {showResult && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextQuestion}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {completed && score === questions.length && (
        <View style={styles.celebrationWrapper}>
          <Animated.View
            style={[
              styles.celebrationContainer,
              {
                opacity: celebrationOpacity,
                transform: [{ scale: celebrationScale }]
              }
            ]}
          >
            <Text style={styles.celebrationText}>🎉</Text>
            <Text style={styles.celebrationMessage}>Tuyệt vời!</Text>
          </Animated.View>
        </View>
      )}
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
  },
  scoreContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9B59B6',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mediaContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  placeholderMedia: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionButtonSelected: {
    borderColor: '#9B59B6',
    backgroundColor: '#f3e5f5',
  },
  optionButtonCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  optionButtonWrong: {
    borderColor: '#F44336',
    backgroundColor: '#ffebee',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIndicatorSelected: {
    borderColor: '#9B59B6',
  },
  optionIndicatorCorrect: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionIndicatorWrong: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#9B59B6',
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#F44336',
    fontWeight: '600',
  },
  explanationContainer: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    color: '#4CAF50',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#9B59B6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  celebrationWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
    maxWidth: '80%',
  },
  celebrationText: {
    fontSize: 60,
    marginBottom: 10,
  },
  celebrationMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9B59B6',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  backButtonText: {
    fontSize: 16,
    color: '#9B59B6',
    fontWeight: '600',
    marginTop: 20,
  },
});

