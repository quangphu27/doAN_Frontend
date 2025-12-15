import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { checkAnswerCorrect, normalizeAnswerForBackend, convertAnswerToIndex, convertAnswerToLetter } from '../../utils/answerUtils';
import LessonResults from './lesson-results';
import { useSound } from '../../hooks/useSound';

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
  completed?: boolean;
  progress?: {
    id: string;
    score: number;
    timeSpent: number;
    completedAt: string;
    answers: Array<{
      exerciseId: string;
      answer: string;
      isCorrect: boolean;
    }>;
  };
}

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

interface Game {
  id: string;
  title: string;
  type: 'puzzle' | 'coloring' | 'matching' | 'memory' | 'quiz' | 'guess_image' | 'guess_number' | 'guessing';
  category: 'letter' | 'number' | 'color' | 'action';
  level: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  imageUrl?: string;
  data: any;
  estimatedTime?: number;
  // Tên lớp (nếu game thuộc một lớp học cụ thể)
  className?: string;
}

interface GameResult {
  id: string;
  game: {
    id: string;
    title: string;
    type: string;
    category: string;
  };
  score: number;
  timeSpent: number;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
  }>;
  achievements: string[];
  completedAt: string;
}

export default function PlayScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { playSound } = useSound();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'lessons' | 'games' | 'results'>('lessons');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: any}>({});
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [gameModalVisible, setGameModalVisible] = useState(false);
  const [lessonResultsVisible, setLessonResultsVisible] = useState(false);
  const [lessonScore, setLessonScore] = useState(0);
  const [lessonTimeSpent, setLessonTimeSpent] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [completedGameIds, setCompletedGameIds] = useState<Set<string>>(new Set());

  const getLessonExercises = (lesson: Lesson | null): Exercise[] => {
    if (!lesson) return [];
    const exercises = lesson.content?.exercises || (lesson as any).noiDung?.baiTap || [];
    return exercises.map((ex: any) => ({
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
      text: ex.vanBan || ex.text,
      blanks: ex.oTrong || ex.blanks
    }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Chỉ lấy bài học/trò chơi liên quan đến học sinh trong lớp của bé (nếu là học sinh)
      const lessonsParams: any = { limit: 20 };
      const gamesParams: any = { limit: 20 };
      if (user?.id && user?.vaiTro === 'hocSinh') {
        lessonsParams.childId = user.id;
        gamesParams.childId = user.id;
      }

      const [lessonsResponse, gamesResponse] = await Promise.all([
        api.lessons.list(lessonsParams),
        api.games.list(gamesParams)
      ]);
      console.log('[PlayScreen] lessonsResponse', lessonsResponse?.data?.lessons?.map((l: any) => ({ id: l._id || l.id, completed: l.completed })));
      console.log('[PlayScreen] gamesResponse', gamesResponse?.data?.games?.map((g: any) => ({ id: g._id || g.id })));
      
      let gameResultsData: GameResult[] = [];
      let lessonDoneArray: string[] = [];
      let gameDoneArray: string[] = [];
      if (user?.id && user?.vaiTro === 'hocSinh') {
        try {
          const [lessonHistoryResponse, gameHistoryResponse] = await Promise.all([
            api.lessons.getHistory(user.id),
            api.games.getHistory(user.id)
          ]);
          
          let lessonResults: GameResult[] = [];
          if (lessonHistoryResponse.data?.data?.history || lessonHistoryResponse.data?.history) {
            const lessonHistory = lessonHistoryResponse.data?.data?.history || lessonHistoryResponse.data?.history || [];
            lessonResults = lessonHistory.map((item: any) => ({
              id: item.id || item._id,
              game: {
                id: item.lesson?.id || item.lesson?._id || item.lesson?._id,
                title: item.lesson?.title || item.lesson?.tieuDe || 'Bài học',
                type: 'lesson',
                category: item.lesson?.category || item.lesson?.danhMuc || 'unknown'
              },
              score: item.score || item.diemSo || 0,
              timeSpent: item.timeSpent || item.thoiGianDaDung || 0,
              answers: item.answers || [],
              achievements: item.achievements || [],
              completedAt: item.completedAt || item.ngayHoanThanh || item.createdAt || new Date().toISOString()
            }));

            // lưu tập bài học đã hoàn thành
            lessonDoneArray = lessonHistory
              .map((item: any) => item.lesson?.id || item.lesson?._id || item.lesson || item.baiHoc || item.lessonId)
              .filter(Boolean)
              .map((id: any) => id.toString());
            setCompletedLessonIds(new Set<string>(lessonDoneArray));
          }
          
          let gameResults: GameResult[] = [];
          if (gameHistoryResponse.data?.data?.history || gameHistoryResponse.data?.history) {
            const gameHistory = gameHistoryResponse.data?.data?.history || gameHistoryResponse.data?.history || [];
            gameResults = gameHistory.map((item: any) => ({
              id: item.id || item._id,
              game: {
                id: item.game?.id || item.game?._id,
                title: item.game?.title || 'Unknown Game',
                type: item.game?.type || 'unknown',
                category: item.game?.category || 'unknown'
              },
              score: item.score || 0,
              timeSpent: item.timeSpent || 0,
              answers: item.answers || [],
              achievements: item.achievements || [],
              completedAt: item.completedAt || item.createdAt || new Date().toISOString()
            }));

            gameDoneArray = gameHistory
              .map((item: any) => item.game?.id || item.game?._id || item.troChoi || item.gameId)
              .filter(Boolean)
              .map((id: any) => id.toString());
            setCompletedGameIds(new Set<string>(gameDoneArray));
          }
          
          gameResultsData = [...lessonResults, ...gameResults].sort((a, b) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          );

          console.log('[PlayScreen] lessonHistory ids', lessonDoneArray);
          console.log('[PlayScreen] gameHistory ids', gameDoneArray);
        } catch (error) {
          gameResultsData = [];
        }
      }
      
      const lessons = lessonsResponse.data?.lessons || [];
      
      // Transform lessons to handle both Vietnamese and English fields
      // Lấy thông tin lớp từ lesson data (đã được populate từ backend)
      const transformedLessons = lessons.map((lesson: any) => {
        // Lấy tên lớp từ lesson.lop (có thể là array hoặc object)
        let className = null;
        if (lesson.lop) {
          if (Array.isArray(lesson.lop) && lesson.lop.length > 0) {
            // Nếu là array, lấy lớp đầu tiên
            className = lesson.lop[0]?.tenLop || lesson.lop[0]?.name || null;
          } else if (typeof lesson.lop === 'object' && lesson.lop.tenLop) {
            // Nếu là object
            className = lesson.lop.tenLop || lesson.lop.name || null;
          }
        }
        
        return {
          ...lesson,
          id: lesson.id || lesson._id,
          title: lesson.title || lesson.tieuDe,
          description: lesson.description || lesson.moTa,
          category: lesson.category || lesson.danhMuc,
          level: lesson.level || lesson.capDo,
          imageUrl: lesson.imageUrl || lesson.anhDaiDien,
          estimatedTime: lesson.estimatedTime || lesson.thoiGianUocTinh,
          className: className, // Thêm tên lớp
          content: lesson.content || {
            exercises: lesson.noiDung?.baiTap || []
          }
        };
      });
      
      let lessonsWithCompletion: Lesson[] = [];
      if (user?.id && user?.vaiTro === 'hocSinh') {
        const completionPromises = transformedLessons.map(async (lesson: Lesson) => {
          try {
            const lessonId = (lesson as any)._id || lesson.id;
            if (!lessonId) {
              return {
                ...lesson,
                id: (lesson as any)._id,
                completed: false
              };
            }
            
            const completionResponse = await api.lessons.checkCompletion(lessonId, user.id);
            return {
              ...lesson,
              id: lessonId,
              completed: completionResponse.data.completed,
              progress: completionResponse.data.progress
            };
          } catch (error) {
            return {
              ...lesson,
              id: (lesson as any)._id,
              completed: false
            };
          }
        });

        lessonsWithCompletion = await Promise.all(completionPromises);
      } else {
        lessonsWithCompletion = (lessonsResponse.data?.lessons || []).map((lesson: any) => ({
          ...lesson,
          id: lesson._id || lesson.id
        }));
      }

      // Ẩn bài học đã hoàn thành (theo cờ completed hoặc history)
      const filteredLessons = user?.vaiTro === 'hocSinh'
        ? lessonsWithCompletion.filter(lesson => {
            const rawId = (lesson as any).id || (lesson as any)._id || '';
            const id = rawId ? rawId.toString() : '';
            const alreadyDone = (lesson as any).completed === true || (id && (completedLessonIds.has(id) || lessonDoneArray.includes(id)));
            return id && !alreadyDone;
          })
        : lessonsWithCompletion;

      console.log('[PlayScreen] filteredLessons ids', filteredLessons.map((l: any) => ({
        id: l.id || l._id,
        completedFlag: l.completed,
        completedIdSet: (l.id && completedLessonIds.has((l.id as any).toString())),
        inHistory: lessonDoneArray.includes((l.id as any)?.toString())
      })));
      setLessons(filteredLessons);

      const rawGames = gamesResponse.data?.games || [];
      const transformedGames: Game[] = rawGames.map((game: any) => {
        let className: string | null = null;
        const lop = game.lop;
        if (lop) {
          if (Array.isArray(lop) && lop.length > 0) {
            className = lop[0]?.tenLop || lop[0]?.name || null;
          } else if (typeof lop === 'object') {
            className = lop.tenLop || lop.name || null;
          }
        }

        // Chuẩn hóa type từ cả trường "type" (game admin) và "loai" (game lớp)
        const rawType = game.type || game.loai;
        const normalizedType =
          rawType === 'toMau' ? 'coloring' :
          rawType === 'xepHinh' ? 'puzzle' :
          rawType === 'ghepDoi' ? 'matching' :
          rawType === 'doan' || rawType === 'guess_action' ? 'guessing' :
          rawType;

        // Chuẩn hóa category từ cả "category" và "danhMuc"
        const rawCategory = game.category || game.danhMuc;
        const normalizedCategory =
          rawCategory === 'chuCai' ? 'letter' :
          rawCategory === 'so' ? 'number' :
          rawCategory === 'mauSac' ? 'color' :
          rawCategory === 'hanhDong' ? 'action' :
          rawCategory;

        return {
          ...game,
          id: game.id || game._id,
          title: game.title || game.tieuDe,
          description: game.description || game.moTa,
          type: normalizedType,
          category: normalizedCategory,
          level: game.level || game.capDo,
          imageUrl: game.imageUrl || game.anhDaiDien,
          estimatedTime: game.estimatedTime || game.thoiGianUocTinh,
          className: className || undefined
        } as Game;
      });

      setGames(transformedGames);
      // Ẩn game đã hoàn thành
      if (user?.vaiTro === 'hocSinh') {
        const filteredGames = transformedGames.filter(game => {
          const rawId = (game as any).id || (game as any)._id || '';
          const id = rawId ? rawId.toString() : '';
          const alreadyDone = id && (completedGameIds.has(id) || gameDoneArray.includes(id));
          return id && !alreadyDone;
        });
        setGames(filteredGames);
      } else {
        setGames(transformedGames);
      }
      setGameResults(gameResultsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
      setLessons([]);
      setGames([]);
      setGameResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStartLesson = async (lesson: Lesson) => {
    if (lesson.completed) {
      setSelectedLesson(lesson);
      setLessonScore(lesson.progress?.score || 0);
      setLessonTimeSpent(lesson.progress?.timeSpent || 0);
      setUserAnswers(lesson.progress?.answers?.reduce((acc, answer) => {
        acc[answer.exerciseId] = answer.answer;
        return acc;
      }, {} as {[key: string]: any}) || {});
      setLessonResultsVisible(true);
    } else {
      try {
        setLoading(true);
        const response = await api.lessons.getRandomExercises(lesson.id || (lesson as any)._id, 5);
        
        if (response.success && response.data.exercises.length > 0) {
          const randomLesson = {
            ...lesson,
            content: {
              ...lesson.content,
              exercises: response.data.exercises
            }
          };
          
          setSelectedLesson(randomLesson);
          setGameStartTime(Date.now());
          setCurrentExercise(response.data.exercises[0]);
          setCurrentExerciseIndex(0);
          setUserAnswers({});
          setLessonModalVisible(true);
        } else {
          Alert.alert('Thông báo', 'Bài học này chưa có câu hỏi hoặc không thể tải câu hỏi');
        }
      } catch (error) {
        console.error('Error loading random exercises:', error);
        Alert.alert('Lỗi', 'Không thể tải câu hỏi từ bài học');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartGame = (game: Game) => {
    
    setSelectedGame(game);
    setGameStartTime(Date.now());
    
    switch (game.type) {
      case 'puzzle':
        router.push({
          pathname: '/child/puzzle',
          params: {
            gameId: game.id || (game as any)._id,
            imageUrl: game.imageUrl || game.data?.originalImage || '',
            difficulty: game.level || 'easy'
          }
        });
        break;
      case 'coloring':
        router.push({
          pathname: '/child/games/coloring',
          params: {
            gameId: game.id || (game as any)._id,
            imageUrl: game.imageUrl || game.data?.coloringData?.outlineImage || '',
            colorAreas: JSON.stringify(game.data?.coloringData?.colorAreas || [])
          }
        });
        break;
      case 'matching':
        router.push({
          pathname: '/child/games/matching',
          params: {
            gameId: game.id || (game as any)._id,
            items: JSON.stringify(game.data?.matchingPairs || [])
          }
        });
        break;
      case 'guessing' as any:
        router.push({
          pathname: '/child/games/guessing',
          params: {
            gameId: game.id || (game as any)._id
          }
        });
        break;
      default:
        setGameModalVisible(true);
        break;
    }
  };

  const handleAnswerExercise = (exerciseId: string, answer: any) => {
    console.log('handleAnswerExercise called:', { exerciseId, answer, currentUserAnswers: userAnswers });
    const newAnswers = { ...userAnswers, [exerciseId]: answer };
    console.log('New answers:', newAnswers);
    setUserAnswers(newAnswers);
    
    const isCorrect = checkAnswer(exerciseId, answer);
    if (isCorrect) {
      playSound('correct');
    } else {
      playSound('failanswer');
    }
  };

  const handleNextExercise = () => {
    const exercises = getLessonExercises(selectedLesson);
    if (selectedLesson && exercises.length > 0) {
      const nextIndex = currentExerciseIndex + 1;
      if (nextIndex < exercises.length) {
        setCurrentExercise(exercises[nextIndex]);
        setCurrentExerciseIndex(nextIndex);
      } else {
        handleCompleteLesson();
      }
    }
  };

  const handleNavigateExercise = (targetIndex: number) => {
    const exercises = getLessonExercises(selectedLesson);
    if (selectedLesson && exercises.length > 0) {
      const targetExercise = exercises[targetIndex];
      if (!targetExercise) return;
      
      const targetExerciseId = (targetExercise as any)._id || targetExercise.id || `exercise-${targetIndex}`;
      
      if (userAnswers[targetExerciseId] !== undefined && userAnswers[targetExerciseId] !== null) {
        return;
      }
      
      setCurrentExercise(targetExercise);
      setCurrentExerciseIndex(targetIndex);
    }
  };

  const handleCompleteLesson = async () => {
    if (!selectedLesson || !user?.id) return;

    try {
      const score = calculateLessonScore();
      const lessonId = selectedLesson.id || (selectedLesson as any)._id;
      console.log('Completing lesson:', {
        lessonId,
        selectedLesson,
        childId: user.id,
        score,
        userAnswers,
        userAnswersKeys: Object.keys(userAnswers),
        userAnswersValues: Object.values(userAnswers)
      });
      
      if (!lessonId) {
        throw new Error('Lesson ID is required');
      }
      
      const answersToSave = Object.entries(userAnswers).map(([exerciseId, answer]) => {
          const isCorrect = checkAnswer(exerciseId, answer);
          const exercises = getLessonExercises(selectedLesson);
          const exercise = exercises.find(ex => 
            ex.id === exerciseId || (ex as any)._id === exerciseId
          );
          
          const convertedAnswer = convertAnswerToLetter(answer);
          
          console.log('Saving answer:', {
            exerciseId,
            answer,
            convertedAnswer,
            isCorrect,
            correctAnswer: exercise?.correctAnswer,
            exercise: exercise
          });
          return {
            exerciseId: exerciseId === 'undefined' ? 'unknown' : exerciseId,
            answer: convertedAnswer,
            isCorrect
          };
        });
      
      console.log('Sending answers to backend:', {
        userAnswers,
        answersToSave,
        answersLength: answersToSave.length
      });
      
      await api.progress.recordLessonResult({
        lessonId: lessonId,
        childId: user.id,
        score,
        timeSpent: Math.floor((Date.now() - gameStartTime) / 1000),
        answers: answersToSave
      });

      const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
      setLessonScore(score);
      setLessonTimeSpent(timeSpent);
      setLessonModalVisible(false);
      setLessonResultsVisible(true);
      
      // Refresh data to update lesson completion status
      await loadData();
      
      await loadData();
    } catch (error) {
      console.error('Error completing lesson:', error);
      Alert.alert('Lỗi', 'Không thể lưu kết quả bài học');
    }
  };

  const handleCompleteGame = async (score: number, answers: any[]) => {
    if (!selectedGame || !user?.id) return;

    try {
      const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
      await api.progress.recordGameResult({
        gameId: selectedGame.id,
        childId: user.id,
        score,
        timeSpent,
        answers
      });

      Alert.alert('Tuyệt vời!', `Bạn đã hoàn thành trò chơi với điểm ${score}/100`);
      setGameModalVisible(false);
      setSelectedGame(null);
      loadData();
    } catch (error) {
      console.error('Error completing game:', error);
      Alert.alert('Lỗi', 'Không thể lưu kết quả trò chơi');
    }
  };

  const calculateLessonScore = () => {
    const exercises = getLessonExercises(selectedLesson);
    if (!selectedLesson || exercises.length === 0) return 0;
    
    let correctAnswers = 0;
    exercises.forEach((exercise, index) => {
      const exerciseId = exercise.id || (exercise as any)._id || `exercise-${index}`;
      const userAnswer = userAnswers[exerciseId];
      const isCorrect = checkAnswer(exerciseId, userAnswer);
      console.log('calculateLessonScore - Exercise:', {
        exerciseId,
        userAnswer,
        correctAnswer: exercise.correctAnswer,
        isCorrect,
        allUserAnswers: userAnswers
      });
      if (isCorrect) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / exercises.length) * 100);
    console.log('calculateLessonScore - Final score:', score);
    return score;
  };

  const checkAnswer = (exerciseId: string, userAnswer: any) => {
    const exercises = getLessonExercises(selectedLesson);
    if (!selectedLesson || exercises.length === 0) return false;
    
    const exercise = exercises.find(ex => 
      ex.id === exerciseId || (ex as any)._id === exerciseId
    );
    if (!exercise) {
      console.log('Exercise not found for exerciseId:', exerciseId);
      return false;
    }

    if (exercise.type === 'multiple_choice' && exercise.options) {
      const isCorrect = checkAnswerCorrect(userAnswer, exercise.correctAnswer);
      
      console.log('Checking answer:', {
        userAnswer,
        correctAnswer: exercise.correctAnswer,
        correctAnswerType: typeof exercise.correctAnswer,
        options: exercise.options,
        isCorrect
      });
      
      return isCorrect;
    }

    return userAnswer === exercise.correctAnswer;
  };

  const handleLessonResultsClose = () => {
    setLessonResultsVisible(false);
    setSelectedLesson(null);
    setCurrentExercise(null);
    setCurrentExerciseIndex(0);
    setUserAnswers({});
    loadData();
  };

  const handleLessonRetry = () => {
    setLessonResultsVisible(false);
    setUserAnswers({});
    setCurrentExerciseIndex(0);
    const exercises = getLessonExercises(selectedLesson);
    if (selectedLesson && exercises.length > 0) {
      setCurrentExercise(exercises[0]);
    }
    setLessonModalVisible(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'letter': return '#4ECDC4';
      case 'number': return '#45B7D1';
      case 'color': return '#96CEB4';
      case 'action': return '#FFEAA7';
      default: return '#666';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'letter': return 'text';
      case 'number': return 'calculator';
      case 'color': return 'color-palette';
      case 'action': return 'walk';
      default: return 'book';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'letter': return 'Chữ cái';
      case 'number': return 'Số đếm';
      case 'color': return 'Màu sắc';
      case 'action': return 'Hành động';
      default: return 'Khác';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'puzzle': return '#FF6B6B';
      case 'coloring': return '#4ECDC4';
      case 'matching': return '#45B7D1';
      case 'memory': return '#96CEB4';
      case 'quiz': return '#FFEAA7';
      case 'guess_image': return '#DDA0DD';
      case 'guess_number': return '#98D8C8';
      default: return '#666';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'puzzle': return 'grid';
      case 'coloring': return 'color-palette';
      case 'matching': return 'link';
      case 'memory': return 'flash';
      case 'quiz': return 'help-circle';
      case 'guess_image': return 'image';
      case 'guess_number': return 'calculator';
      default: return 'game-controller';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'puzzle': return 'Xếp hình';
      case 'coloring': return 'Tô màu';
      case 'matching': return 'Ghép nối';
      case 'memory': return 'Trí nhớ';
      case 'quiz': return 'Câu hỏi';
      case 'guess_image': return 'Đoán hình';
      case 'guess_number': return 'Đoán số';
      default: return 'Trò chơi';
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Học và chơi</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => router.push('/child/lesson-history' as any)}
          >
            <Ionicons name="time" size={20} color="#fff" />
            <Text style={styles.historyButtonText}>Lịch sử</Text>
          </TouchableOpacity>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{lessons.length}</Text>
              <Text style={styles.statLabel}>Bài học</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{games.length}</Text>
              <Text style={styles.statLabel}>Trò chơi</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'lessons' && styles.tabActive]}
          onPress={() => setSelectedTab('lessons')}
        >
          <Ionicons 
            name="book" 
            size={20} 
            color={selectedTab === 'lessons' ? '#4CAF50' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'lessons' && styles.tabTextActive
          ]}>
            Bài học
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'games' && styles.tabActive]}
          onPress={() => setSelectedTab('games')}
        >
          <Ionicons 
            name="game-controller" 
            size={20} 
            color={selectedTab === 'games' ? '#4CAF50' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'games' && styles.tabTextActive
          ]}>
            Trò chơi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'results' && styles.tabActive]}
          onPress={() => setSelectedTab('results')}
        >
          <Ionicons 
            name="trophy" 
            size={20} 
            color={selectedTab === 'results' ? '#4CAF50' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'results' && styles.tabTextActive
          ]}>
            Kết quả
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'lessons' && (
          <LessonsList
            lessons={lessons}
            completedIds={completedLessonIds}
            onStartLesson={handleStartLesson}
          />
        )}
        {selectedTab === 'games' && (
          <GamesList
            games={games}
            completedIds={completedGameIds}
            onStartGame={handleStartGame}
          />
        )}
        {selectedTab === 'results' && (
          <ResultsList gameResults={gameResults} />
        )}
      </ScrollView>

      <LessonModal
        visible={lessonModalVisible}
        lesson={selectedLesson}
        currentExercise={currentExercise}
        currentExerciseIndex={currentExerciseIndex}
        userAnswers={userAnswers}
        onAnswer={handleAnswerExercise}
        onNext={handleNextExercise}
        onNavigate={handleNavigateExercise}
        onComplete={handleCompleteLesson}
        onClose={() => setLessonModalVisible(false)}
        checkAnswer={checkAnswer}
      />

      <GameModal
        visible={gameModalVisible}
        game={selectedGame}
        onComplete={handleCompleteGame}
        onClose={() => setGameModalVisible(false)}
      />

      {lessonResultsVisible && selectedLesson && (
        <LessonResults
          lesson={selectedLesson as any}
          userAnswers={userAnswers}
          score={lessonScore}
          timeSpent={lessonTimeSpent}
          onClose={handleLessonResultsClose}
          onRetry={handleLessonRetry}
        />
      )}
    </View>
  );
}

function LessonsList({ lessons, onStartLesson, completedIds }: {
  lessons: Lesson[];
  onStartLesson: (lesson: Lesson) => void;
  completedIds: Set<string>;
}) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'letter': return '#4ECDC4';
      case 'number': return '#45B7D1';
      case 'color': return '#96CEB4';
      case 'action': return '#FFEAA7';
      default: return '#666';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'letter': return 'text';
      case 'number': return 'calculator';
      case 'color': return 'color-palette';
      case 'action': return 'walk';
      default: return 'book';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'letter': return 'Chữ cái';
      case 'number': return 'Số đếm';
      case 'color': return 'Màu sắc';
      case 'action': return 'Hành động';
      default: return 'Khác';
    }
  };

  if (lessons.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="book" size={60} color="#ccc" />
        <Text style={styles.emptyText}>Chưa có bài học nào</Text>
        <Text style={styles.emptySubtext}>Hãy chờ phụ huynh thêm bài học cho bạn</Text>
      </View>
    );
  }

  const incompleteLessons = lessons.filter(lesson => {
    const rawId = lesson.id || (lesson as any)._id || '';
    const id = rawId ? rawId.toString() : '';
    const alreadyDone = (lesson as any).completed === true || (id && completedIds.has(id));
    return id && !alreadyDone;
  });
  
  console.log('Lessons filtering:', {
    total: lessons.length,
    incomplete: incompleteLessons.length,
    completed: lessons.length - incompleteLessons.length,
    lessons: lessons.map(l => ({ id: l.id || (l as any)._id || '', title: l.title || (l as any).tieuDe || '', completed: completedIds.has(l.id || (l as any)._id || '') }))
  });

  return (
    <View style={styles.listContainer}>
      {incompleteLessons.map((lesson) => (
        <TouchableOpacity
          key={lesson.id || (lesson as any)._id || Math.random().toString()}
          style={styles.lessonCard}
          onPress={() => onStartLesson(lesson)}
        >
          <View style={styles.lessonHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(lesson.category || (lesson as any).danhMuc) }]}>
              <Ionicons name={getCategoryIcon(lesson.category || (lesson as any).danhMuc) as any} size={20} color="#fff" />
            </View>
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonTitle}>{lesson.title || (lesson as any).tieuDe}</Text>
              <Text style={styles.lessonCategory}>{getCategoryName(lesson.category || (lesson as any).danhMuc)}</Text>
              <Text style={styles.lessonLevel}>
                {(lesson.level || (lesson as any).capDo) === 'beginner' || (lesson.level || (lesson as any).capDo) === 'coBan' ? 'Cơ bản' :
                 (lesson.level || (lesson as any).capDo) === 'intermediate' || (lesson.level || (lesson as any).capDo) === 'trungBinh' ? 'Trung bình' : 'Nâng cao'}
              </Text>
              {((lesson as any).className || (lesson as any).phongHoc) && (
                <Text style={styles.lessonClass}>
                  <Ionicons name="school" size={12} color="#666" /> {(lesson as any).className || (lesson as any).phongHoc}
                </Text>
              )}
            </View>
            <Ionicons 
              name="play-circle" 
              size={40} 
              color="#4CAF50" 
            />
          </View>
          {lesson.description && (
            <Text style={styles.lessonDescription} numberOfLines={2}>
              {lesson.description}
            </Text>
          )}
          <View style={styles.lessonFooter}>
            <Text style={styles.exerciseCount}>
              {(lesson.content?.exercises || (lesson as any).noiDung?.baiTap || []).length} bài tập
            </Text>
            <Text style={styles.estimatedTime}>
              {lesson.estimatedTime || (lesson as any).thoiGianUocTinh || 10} phút
            </Text>
          </View>
        </TouchableOpacity>
      ))}

    </View>
  );
}

function GamesList({ games, onStartGame, completedIds }: {
  games: Game[];
  onStartGame: (game: Game) => void;
  completedIds: Set<string>;
}) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'puzzle': return '#FF6B6B';
      case 'coloring': return '#4ECDC4';
      case 'matching': return '#45B7D1';
      case 'memory': return '#96CEB4';
      case 'quiz': return '#FFEAA7';
      case 'guess_image': return '#DDA0DD';
      case 'guess_number': return '#98D8C8';
      case 'guessing': return '#FFA726';
      default: return '#666';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'puzzle': return 'grid';
      case 'coloring': return 'color-palette';
      case 'matching': return 'link';
      case 'memory': return 'flash';
      case 'quiz': return 'help-circle';
      case 'guess_image': return 'image';
      case 'guess_number': return 'calculator';
      case 'guessing': return 'walk';
      default: return 'game-controller';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'puzzle': return 'Xếp hình';
      case 'coloring': return 'Tô màu';
      case 'matching': return 'Ghép nối';
      case 'memory': return 'Trí nhớ';
      case 'quiz': return 'Câu hỏi';
      case 'guess_image': return 'Đoán hình';
      case 'guess_number': return 'Đoán số';
      case 'guessing': return 'Đoán hành động';
      default: return 'Trò chơi';
    }
  };

  if (games.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="game-controller" size={60} color="#ccc" />
        <Text style={styles.emptyText}>Chưa có trò chơi nào</Text>
        <Text style={styles.emptySubtext}>Hãy chờ phụ huynh thêm trò chơi cho bạn</Text>
      </View>
    );
  }

  const playableGames = games.filter(game => {
    const id = game.id || (game as any)._id || '';
    return id && !completedIds.has(id);
  });

  return (
    <View style={styles.listContainer}>
      {playableGames.map((game) => (
        <TouchableOpacity
          key={game.id || (game as any)._id || Math.random().toString()}
          style={styles.gameCard}
          onPress={() => onStartGame(game)}
        >
          <View style={styles.gameHeader}>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(game.type) }]}>
              <Ionicons name={getTypeIcon(game.type) as any} size={20} color="#fff" />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameType}>{getTypeName(game.type)}</Text>
              <Text style={styles.gameCategory}>
                {game.category === 'letter' ? 'Chữ cái' :
                 game.category === 'number' ? 'Số đếm' :
                 game.category === 'color' ? 'Màu sắc' : 'Hành động'}
              </Text>
              {((game as any).className || (game as any).lop) && (
                <Text style={styles.lessonClass}>
                  <Ionicons name="school" size={12} color="#666" />{' '}
                  {((game as any).className) ||
                   (Array.isArray((game as any).lop)
                     ? (game as any).lop[0]?.tenLop || (game as any).lop[0]?.name || ''
                     : (game as any).lop?.tenLop || (game as any).lop?.name || '')}
                </Text>
              )}
            </View>
            <Ionicons name="play-circle" size={40} color="#FF9800" />
          </View>
          {game.description && (
            <Text style={styles.gameDescription} numberOfLines={2}>
              {game.description}
            </Text>
          )}
          <View style={styles.gameFooter}>
            <Text style={styles.estimatedTime}>
              {game.estimatedTime || 5} phút
            </Text>
            <Text style={styles.gameLevel}>
              {game.level === 'beginner' ? 'Cơ bản' :
               game.level === 'intermediate' ? 'Trung bình' : 'Nâng cao'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ResultsList({ gameResults }: { gameResults: GameResult[] }) {
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

  if (gameResults.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy" size={60} color="#ccc" />
        <Text style={styles.emptyText}>Chưa có kết quả nào</Text>
        <Text style={styles.emptySubtext}>Hãy chơi game để xem kết quả</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {gameResults.map((result) => (
        <View key={result.id || (result as any)._id || Math.random().toString()} style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{result.game.title}</Text>
              <Text style={styles.resultType}>
                {result.game.type === 'lesson' ? 'Bài học' :
                 result.game.type === 'puzzle' ? 'Xếp hình' :
                 result.game.type === 'coloring' ? 'Tô màu' :
                 result.game.type === 'matching' ? 'Ghép nối' :
                 result.game.type === 'memory' ? 'Trí nhớ' :
                 result.game.type === 'quiz' ? 'Câu hỏi' :
                 result.game.type === 'guess_image' ? 'Đoán hình' :
                 result.game.type === 'guess_number' ? 'Đoán số' : 'Hoạt động'}
              </Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreValue, { color: getScoreColor(result.score) }]}>
                {result.score}/100
              </Text>
            </View>
          </View>

          <View style={styles.resultDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={16} color="#666" />
              <Text style={styles.detailText}>
                {formatTime(result.timeSpent)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.detailText}>
                {result.answers.filter(a => a.isCorrect).length}/{result.answers.length} câu đúng
              </Text>
            </View>
          </View>

          {result.achievements.length > 0 && (
            <View style={styles.achievementsContainer}>
              <Text style={styles.achievementsLabel}>Thành tích:</Text>
              <View style={styles.achievementsList}>
                {result.achievements.map((achievement, index) => (
                  <View key={index} style={styles.achievementBadge}>
                    <Ionicons name="trophy" size={12} color="#FFD700" />
                    <Text style={styles.achievementText}>{achievement}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.resultDate}>
            {formatDate(result.completedAt)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function LessonModal({ visible, lesson, currentExercise, currentExerciseIndex, userAnswers, onAnswer, onNext, onNavigate, onComplete, onClose, checkAnswer }: {
  visible: boolean;
  lesson: Lesson | null;
  currentExercise: Exercise | null;
  currentExerciseIndex: number;
  userAnswers: {[key: string]: any};
  onAnswer: (exerciseId: string, answer: any) => void;
  onNext: () => void;
  onNavigate: (index: number) => void;
  onComplete: () => void;
  onClose: () => void;
  checkAnswer: (exerciseId: string, userAnswer: any) => boolean;
}) {
  if (!lesson || !currentExercise) return null;

  // Helper function to get exercises from lesson (supports both Vietnamese and English fields)
  const getExercises = (lesson: Lesson | null): Exercise[] => {
    if (!lesson) return [];
    const exercises = lesson.content?.exercises || (lesson as any).noiDung?.baiTap || [];
    // Transform Vietnamese exercise format to English format if needed
    return exercises.map((ex: any) => ({
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
      text: ex.vanBan || ex.text,
      blanks: ex.oTrong || ex.blanks
    }));
  };

  const exercises = getExercises(lesson);

  const handleAnswer = (answer: any) => {
    if (!isAnswered) {
      const exerciseId = (currentExercise as any)._id || currentExercise.id || `exercise-${currentExerciseIndex}`;
      
      const answerToSave = normalizeAnswerForBackend(answer);
      
      console.log('LessonModal handleAnswer:', { 
        exerciseId, 
        answer, 
        answerToSave, 
        currentExercise: currentExercise ? {
          id: currentExercise.id,
          correctAnswer: currentExercise.correctAnswer,
          options: currentExercise.options
        } : null
      });
      onAnswer(exerciseId, answerToSave);
    }
  };

  const handleNext = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      onNext();
    } else {
      onComplete();
    }
  };

  const exerciseId = (currentExercise as any)._id || currentExercise.id || `exercise-${currentExerciseIndex}`;
  const isAnswered = userAnswers[exerciseId] !== undefined && userAnswers[exerciseId] !== null;
  const userAnswer = userAnswers[exerciseId];
  const isCorrect = userAnswer !== undefined ? checkAnswer(exerciseId, userAnswer) : false;
  
  console.log('LessonModal - isCorrect calculation:', {
    exerciseId,
    userAnswer,
    userAnswerType: typeof userAnswer,
    isAnswered,
    isCorrect,
    checkAnswerResult: userAnswer ? checkAnswer(exerciseId, userAnswer) : false,
    userAnswers: userAnswers,
    currentExercise: currentExercise ? {
      id: currentExercise.id,
      correctAnswer: currentExercise.correctAnswer,
      correctAnswerType: typeof currentExercise.correctAnswer,
      options: currentExercise.options
    } : null
  });
  
  console.log('LessonModal - Exercise details:', {
    exerciseId,
    isAnswered,
    userAnswer,
    isCorrect,
    correctAnswer: currentExercise.correctAnswer,
    correctAnswerType: typeof currentExercise.correctAnswer,
    options: currentExercise.options,
    userAnswerType: typeof userAnswer
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{lesson.title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.questionNavigationContainer}>
            <Text style={styles.questionNavigationTitle}>Danh sách câu hỏi:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.questionNavigationScroll}
            >
              {exercises.map((exercise, index) => {
                const exId = (exercise as any)._id || exercise.id || `exercise-${index}`;
                const isAnsweredQuestion = userAnswers[exId] !== undefined && userAnswers[exId] !== null;
                const isCurrentQuestion = index === currentExerciseIndex;
                
                return (
                  <TouchableOpacity
                    key={exId || index}
                    style={[
                      styles.questionNavItem,
                      isCurrentQuestion && styles.questionNavItemActive,
                      isAnsweredQuestion && styles.questionNavItemDisabled
                    ]}
                    onPress={() => onNavigate(index)}
                    disabled={isAnsweredQuestion}
                  >
                    <View style={styles.questionNavItemContent}>
                      <Text style={[
                        styles.questionNavItemText,
                        isCurrentQuestion && styles.questionNavItemTextActive,
                        isAnsweredQuestion && styles.questionNavItemTextDisabled
                      ]}>
                        {index + 1}
                      </Text>
                      {isAnsweredQuestion && (
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseTitle}>
              Câu {currentExerciseIndex + 1}: {currentExercise.question}
            </Text>
          </View>

          {currentExercise.type === 'multiple_choice' && currentExercise.options && (
            <View style={styles.optionsContainer}>
              {currentExercise.options.map((option, index) => {
                const userAnswerIndex = convertAnswerToIndex(userAnswer);
                const isSelected = userAnswerIndex === index;
                
                const correctIndex = convertAnswerToIndex(currentExercise.correctAnswer);
                const isCorrectOption = index === correctIndex;
                const showResult = isAnswered;
                
                console.log('Option comparison:', {
                  index,
                  userAnswer,
                  userAnswerIndex,
                  isSelected,
                  correctAnswer: currentExercise.correctAnswer,
                  correctIndex,
                  isCorrectOption,
                  option: option,
                  showResult,
                  willShowGreen: showResult && isSelected && isCorrectOption,
                  willShowRed: showResult && isSelected && !isCorrectOption
                });
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                      showResult && isSelected && isCorrectOption && styles.optionButtonCorrect,
                      showResult && isSelected && !isCorrectOption && styles.optionButtonIncorrect
                    ]}
                    onPress={() => handleAnswer(index)}
                    disabled={isAnswered}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                      showResult && isSelected && isCorrectOption && styles.optionTextCorrect,
                      showResult && isSelected && !isCorrectOption && styles.optionTextIncorrect
                    ]}>
                      {typeof option === 'string' && option.includes(': ') 
                        ? option 
                        : `${String.fromCharCode(65 + index)}. ${option}`}
                    </Text>
                    {showResult && isSelected && isCorrectOption && (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.resultIcon} />
                    )}
                    {showResult && isSelected && !isCorrectOption && (
                      <Ionicons name="close-circle" size={20} color="#F44336" style={styles.resultIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
              
              {isAnswered && (
                <View style={[
                  styles.resultMessage,
                  isCorrect ? styles.resultMessageCorrect : styles.resultMessageIncorrect
                ]}>
                  <Ionicons 
                    name={isCorrect ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={isCorrect ? "#4CAF50" : "#F44336"} 
                  />
                  <Text style={[
                    styles.resultMessageText,
                    isCorrect ? styles.resultMessageTextCorrect : styles.resultMessageTextIncorrect
                  ]}>
                    {isCorrect ? "Chính xác! 🎉" : "Sai rồi! 😔"}
                  </Text>
                </View>
              )}
            </View>
          )}

          {currentExercise.type === 'fill_blank' && currentExercise.text && (
            <View style={styles.fillBlankContainer}>
              <Text style={styles.fillBlankText}>{currentExercise.text}</Text>
              <TextInput
                style={styles.fillBlankInput}
                placeholder="Nhập câu trả lời"
                value={userAnswers[exerciseId] || ''}
                onChangeText={handleAnswer}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Thoát</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.nextButton, !isAnswered && styles.nextButtonDisabled]} 
            onPress={handleNext}
            disabled={!isAnswered}
          >
            <Text style={styles.nextButtonText}>
              {currentExerciseIndex < exercises.length - 1 ? 'Tiếp theo' : 'Hoàn thành'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function GameModal({ visible, game, onComplete, onClose }: {
  visible: boolean;
  game: Game | null;
  onComplete: (score: number, answers: any[]) => void;
  onClose: () => void;
}) {
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);

  const handleComplete = () => {
    onComplete(score, answers);
  };

  if (!game) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{game.title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.gameDescription}>
            {game.description || 'Chúc bạn chơi vui vẻ!'}
          </Text>
          
          <View style={styles.gamePlaceholder}>
            <Ionicons name="game-controller" size={60} color="#ccc" />
            <Text style={styles.gamePlaceholderText}>
              Trò chơi {game.type} sẽ được triển khai ở đây
            </Text>
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Thoát</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleComplete}>
            <Text style={styles.nextButtonText}>Hoàn thành</Text>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  lessonCard: {
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
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  },
  lessonCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  lessonLevel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  lessonClass: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseCount: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#999',
  },
  gameCard: {
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
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  gameType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  gameCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  gameDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameLevel: {
    fontSize: 12,
    color: '#999',
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  resultDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  achievementsContainer: {
    marginBottom: 12,
  },
  achievementsLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  achievementText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  resultDate: {
    fontSize: 12,
    color: '#999',
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
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  modalContentContainer: {
    paddingBottom: 20,
  },
  exerciseHeader: {
    marginBottom: 20,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  exerciseProgress: {
    fontSize: 14,
    color: '#666',
  },
  questionNavigationContainer: {
    marginBottom: 20,
  },
  questionNavigationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  questionNavigationScroll: {
    flexDirection: 'row',
  },
  questionNavItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  questionNavItemActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  questionNavItemDisabled: {
    backgroundColor: '#e8e8e8',
    borderColor: '#ccc',
    opacity: 0.6,
  },
  questionNavItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  questionNavItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  questionNavItemTextActive: {
    color: '#4CAF50',
  },
  questionNavItemTextDisabled: {
    color: '#999',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  optionButtonCorrect: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  optionButtonIncorrect: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  optionTextCorrect: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: '#F44336',
    fontWeight: '600',
  },
  resultIcon: {
    marginLeft: 8,
  },
  fillBlankContainer: {
    marginBottom: 20,
  },
  fillBlankText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  fillBlankInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  gamePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gamePlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  resultMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  resultMessageCorrect: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  resultMessageIncorrect: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  resultMessageText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultMessageTextCorrect: {
    color: '#4CAF50',
  },
  resultMessageTextIncorrect: {
    color: '#F44336',
  },
});

