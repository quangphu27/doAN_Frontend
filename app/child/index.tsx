import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Alert,
  Dimensions,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  completedGames: number;
  averageScore: number;
  totalTimeSpent: number;
}

interface Lesson {
  id: string;
  title: string;
  category: string;
  level: string;
  imageUrl?: string;
}

interface Game {
  id: string;
  title: string;
  type: string;
  category: string;
  level: string;
  imageUrl?: string;
}

export default function ChildHome() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [recentProgress, setRecentProgress] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProgressStats(),
        loadLessons(),
        loadGames(),
        loadRecentProgress()
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadProgressStats = async () => {
    try {
      if (user?.id && user?.vaiTro === 'hocSinh') {
        const [lessonHistoryResponse, gameHistoryResponse] = await Promise.all([
          api.lessons.getHistory(user.id),
          api.games.getHistory(user.id)
        ]);
        
        const lessonHistory = lessonHistoryResponse.data?.data?.history || lessonHistoryResponse.data?.history || [];
        const gameHistory = gameHistoryResponse.data?.data?.history || gameHistoryResponse.data?.history || [];
        
        const totalLessons = lessonHistory.length;
        const completedLessons = lessonHistory.filter((item: any) => item.lesson).length;
        const completedGames = gameHistory.length;
        const allScores = [...lessonHistory, ...gameHistory].map((item: any) => item.score || 0);
        const averageScore = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
        const totalTimeSpent = [...lessonHistory, ...gameHistory].reduce((sum, item) => sum + (item.timeSpent || 0), 0);
        
        setProgressStats({
          totalLessons,
          completedLessons,
          completedGames,
          averageScore: Math.round(averageScore),
          totalTimeSpent: Math.round(totalTimeSpent / 60)
        });
      } else {
        setProgressStats({
          totalLessons: 0,
          completedLessons: 0,
          completedGames: 0,
          averageScore: 0,
          totalTimeSpent: 0
        });
      }
    } catch (error) {
      setProgressStats({
        totalLessons: 0,
        completedLessons: 0,
        completedGames: 0,
        averageScore: 0,
        totalTimeSpent: 0
      });
    }
  };

  const loadLessons = async () => {
    try {
      const params: any = { limit: 10 };
      if (user?.id && user?.vaiTro === 'hocSinh') {
        params.childId = user.id;
      }
      const response = await api.lessons.list(params);
      setLessons(response.data?.lessons || []);
    } catch (error) {
      setLessons([]);
    }
  };

  const loadGames = async () => {
    try {
      const params: any = { limit: 8 };
      if (user?.id && user?.vaiTro === 'hocSinh') {
        params.childId = user.id;
      }
      const response = await api.games.list(params);
      setGames(response.data?.games || []);
    } catch (error) {
      setGames([]);
    }
  };

  const loadRecentProgress = async () => {
    try {
      if (user?.id && user?.vaiTro === 'hocSinh') {
        const response = await api.progress.getRecent(user.id);
        setRecentProgress(response.data || []);
      } else {
        setRecentProgress([]);
      }
    } catch (error) {
      setRecentProgress([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGameIcon = (type: string) => {
    switch (type) {
      case 'puzzle': return 'grid';
      case 'coloring': return 'color-palette';
      case 'matching': return 'link';
      case 'memory': return 'flash';
      case 'quiz': return 'help-circle';
      case 'guessing': return 'walk';
      default: return 'game-controller';
    }
  };

  const getGameColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    return colors[index % colors.length];
  };

  const getProgressPercentage = (gameId: string) => {
    const progress = recentProgress.find(p => p.game === gameId);
    return progress ? Math.round((progress.score || 0) / 100 * 100) : 0;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 17) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const handleGamePress = (game: Game) => {
    router.push('/child/play');
  };

  const handleLessonPress = (lesson: Lesson) => {
    router.push('/child/play');
  };

  const handlePlayGames = () => {
    router.push('/child/play');
  };

  const handleViewResults = () => {
    router.push('/child/results');
  };

  const handleViewAchievements = () => {
    router.push('/child/achievements');
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
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{user?.hoTen}!</Text>
            <Text style={styles.time}>
              {currentTime.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarContainer}>
            <Ionicons name="happy" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Tiến độ học tập hôm nay</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressItem}>
            <Ionicons name="book" size={24} color="#4CAF50" />
            <Text style={styles.progressLabel}>Bài học</Text>
            <Text style={styles.progressValue}>
              {progressStats ? `${progressStats.completedLessons}/${progressStats.totalLessons}` : '0/0'}
            </Text>
          </View>
          <View style={styles.progressItem}>
            <Ionicons name="game-controller" size={24} color="#FF6B6B" />
            <Text style={styles.progressLabel}>Trò chơi</Text>
            <Text style={styles.progressValue}>
              {progressStats ? progressStats.completedGames : 0}
            </Text>
          </View>
          <View style={styles.progressItem}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.progressLabel}>Điểm TB</Text>
            <Text style={styles.progressValue}>
              {progressStats ? progressStats.averageScore : 0}
            </Text>
          </View>
          <View style={styles.progressItem}>
            <Ionicons name="time" size={24} color="#4ECDC4" />
            <Text style={styles.progressLabel}>Thời gian</Text>
            <Text style={styles.progressValue}>
              {progressStats ? `${progressStats.totalTimeSpent}ph` : '0ph'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bài học gần đây</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lessonsContainer}>
          {lessons.slice(0, 5).map((lesson, index) => (
            <TouchableOpacity
              key={lesson.id || (lesson as any)._id || index}
              style={[styles.lessonCard, { backgroundColor: getGameColor(index) }]}
              onPress={() => handleLessonPress(lesson)}
            >
              <Ionicons name="book" size={30} color="#fff" />
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonCategory}>{lesson.category}</Text>
              {((lesson as any).lop && ((lesson as any).lop.length > 0 || (lesson as any).lop.tenLop)) && (
                <Text style={styles.lessonClass}>
                  <Ionicons name="school" size={10} color="#fff" /> {
                    Array.isArray((lesson as any).lop) 
                      ? (lesson as any).lop[0]?.tenLop || (lesson as any).lop[0]?.name || ''
                      : (lesson as any).lop?.tenLop || (lesson as any).lop?.name || ''
                  }
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trò chơi vui nhộn</Text>
        <View style={styles.gamesGrid}>
          {games.slice(0, 4).map((game, index) => (
            <TouchableOpacity
              key={game.id || (game as any)._id || index}
              style={[styles.gameCard, { backgroundColor: getGameColor(index) }]}
              onPress={() => handleGamePress(game)}
            >
              <Ionicons name={getGameIcon(game.type) as any} size={40} color="#fff" />
              <Text style={styles.gameTitle}>{game.title}</Text>
              {((game as any).lop) && (
                <Text style={styles.lessonClass}>
                  <Ionicons name="school" size={10} color="#fff" />{' '}
                  {Array.isArray((game as any).lop)
                    ? (game as any).lop[0]?.tenLop || (game as any).lop[0]?.name || ''
                    : (game as any).lop?.tenLop || (game as any).lop?.name || ''}
                </Text>
              )}
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getProgressPercentage(game.id)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{getProgressPercentage(game.id)}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thành tích của bạn</Text>
        <View style={styles.achievementsContainer}>
          <View style={styles.achievementCard}>
            <Ionicons name="trophy" size={30} color="#FFD700" />
            <Text style={styles.achievementTitle}>Học giỏi</Text>
          </View>
          <View style={styles.achievementCard}>
            <Ionicons name="star" size={30} color="#FF6B6B" />
            <Text style={styles.achievementTitle}>Chăm chỉ</Text>
          </View>
          <View style={styles.achievementCard}>
            <Ionicons name="bulb" size={30} color="#4ECDC4" />
            <Text style={styles.achievementTitle}>Sáng tạo</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={handlePlayGames}>
            <Ionicons name="book" size={24} color="#4CAF50" />
            <Text style={styles.quickActionText}>Học bài</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={handlePlayGames}>
            <Ionicons name="game-controller" size={24} color="#FF6B6B" />
            <Text style={styles.quickActionText}>Chơi game</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleViewResults}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.quickActionText}>Kết quả</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleViewAchievements}>
            <Ionicons name="star" size={24} color="#FF9800" />
            <Text style={styles.quickActionText}>Thành tích</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={logout}>
            <Ionicons name="log-out" size={24} color="#F44336" />
            <Text style={styles.quickActionText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  time: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  progressSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    width: (width - 60) / 2,
    height: 120,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  achievementCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  lessonsContainer: {
    marginBottom: 10,
  },
  lessonCard: {
    width: 120,
    height: 100,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  lessonCategory: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
  },
  lessonClass: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
});


