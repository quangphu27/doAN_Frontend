import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { useRouter } from 'expo-router';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export default function AchievementsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Loading achievements for user:', user.id);
      
      const [lessonHistoryResponse, gameHistoryResponse] = await Promise.all([
        api.lessons.getHistory(user.id),
        api.games.getHistory(user.id)
      ]);
      
      const lessonHistory = lessonHistoryResponse.data?.data?.history || lessonHistoryResponse.data?.history || [];
      const gameHistory = gameHistoryResponse.data?.data?.history || gameHistoryResponse.data?.history || [];
      
      const totalLessons = lessonHistory.length;
      const totalGames = gameHistory.length;
      const totalScore = [...lessonHistory, ...gameHistory].reduce((sum, item) => sum + (item.score || 0), 0);
      const averageScore = totalScore > 0 ? totalScore / (totalLessons + totalGames) : 0;
      const totalTimeSpent = [...lessonHistory, ...gameHistory].reduce((sum, item) => sum + (item.timeSpent || 0), 0);
      
      setStats({
        totalLessons,
        totalGames,
        totalScore,
        averageScore,
        totalTimeSpent
      });
      
      const allAchievements: Achievement[] = [
        {
          id: 'first_lesson',
          title: 'Bước đầu học tập',
          description: 'Hoàn thành bài học đầu tiên',
          icon: 'book',
          color: '#4CAF50',
          unlocked: totalLessons >= 1,
          unlockedAt: totalLessons >= 1 ? lessonHistory[0]?.completedAt : undefined,
          progress: Math.min(totalLessons, 1),
          maxProgress: 1
        },
        {
          id: 'first_game',
          title: 'Game thủ mới',
          description: 'Hoàn thành trò chơi đầu tiên',
          icon: 'game-controller',
          color: '#FF6B6B',
          unlocked: totalGames >= 1,
          unlockedAt: totalGames >= 1 ? gameHistory[0]?.completedAt : undefined,
          progress: Math.min(totalGames, 1),
          maxProgress: 1
        },
        {
          id: 'lesson_master',
          title: 'Bậc thầy bài học',
          description: 'Hoàn thành 5 bài học',
          icon: 'school',
          color: '#2196F3',
          unlocked: totalLessons >= 5,
          unlockedAt: totalLessons >= 5 ? lessonHistory[4]?.completedAt : undefined,
          progress: Math.min(totalLessons, 5),
          maxProgress: 5
        },
        {
          id: 'game_master',
          title: 'Game thủ chuyên nghiệp',
          description: 'Hoàn thành 5 trò chơi',
          icon: 'trophy',
          color: '#FF9800',
          unlocked: totalGames >= 5,
          unlockedAt: totalGames >= 5 ? gameHistory[4]?.completedAt : undefined,
          progress: Math.min(totalGames, 5),
          maxProgress: 5
        },
        {
          id: 'high_scorer',
          title: 'Điểm cao',
          description: 'Đạt điểm trung bình trên 80',
          icon: 'star',
          color: '#FFD700',
          unlocked: averageScore >= 80,
          unlockedAt: averageScore >= 80 ? new Date().toISOString() : undefined,
          progress: Math.min(averageScore, 80),
          maxProgress: 80
        },
        {
          id: 'perfectionist',
          title: 'Hoàn hảo',
          description: 'Đạt điểm 100 trong một bài học',
          icon: 'diamond',
          color: '#9C27B0',
          unlocked: lessonHistory.some((item: any) => item.score >= 100),
          unlockedAt: lessonHistory.find((item: any) => item.score >= 100)?.completedAt,
          progress: lessonHistory.some((item: any) => item.score >= 100) ? 1 : 0,
          maxProgress: 1
        },
        {
          id: 'dedicated_learner',
          title: 'Học sinh chăm chỉ',
          description: 'Học tập trong 30 phút',
          icon: 'time',
          color: '#4ECDC4',
          unlocked: totalTimeSpent >= 1800, 
          unlockedAt: totalTimeSpent >= 1800 ? new Date().toISOString() : undefined,
          progress: Math.min(totalTimeSpent, 1800),
          maxProgress: 1800
        },
        {
          id: 'all_rounder',
          title: 'Toàn diện',
          description: 'Hoàn thành cả bài học và trò chơi',
          icon: 'medal',
          color: '#E91E63',
          unlocked: totalLessons >= 1 && totalGames >= 1,
          unlockedAt: (totalLessons >= 1 && totalGames >= 1) ? new Date().toISOString() : undefined,
          progress: (totalLessons >= 1 ? 1 : 0) + (totalGames >= 1 ? 1 : 0),
          maxProgress: 2
        }
      ];
      
      setAchievements(allAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
      Alert.alert('Lỗi', 'Không thể tải thành tích');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}ph`;
    }
    return `${minutes}ph`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải thành tích...</Text>
      </View>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thành tích</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{unlockedAchievements.length}</Text>
          <Text style={styles.statLabel}>Thành tích đã mở khóa</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{achievements.length}</Text>
          <Text style={styles.statLabel}>Tổng thành tích</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Hoàn thành</Text>
        </View>
      </View>

      <ScrollView
        style={styles.achievementsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {unlockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đã mở khóa ({unlockedAchievements.length})</Text>
            {unlockedAchievements.map((achievement) => (
              <View key={achievement.id} style={[styles.achievementCard, styles.achievementUnlocked]}>
                <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
                  <Ionicons name={achievement.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  {achievement.unlockedAt && (
                    <Text style={styles.achievementDate}>
                      Mở khóa: {formatDate(achievement.unlockedAt)}
                    </Text>
                  )}
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            ))}
          </View>
        )}

        {lockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chưa mở khóa ({lockedAchievements.length})</Text>
            {lockedAchievements.map((achievement) => (
              <View key={achievement.id} style={[styles.achievementCard, styles.achievementLocked]}>
                <View style={[styles.achievementIcon, { backgroundColor: '#ccc' }]}>
                  <Ionicons name={achievement.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, styles.achievementTitleLocked]}>{achievement.title}</Text>
                  <Text style={[styles.achievementDescription, styles.achievementDescriptionLocked]}>
                    {achievement.description}
                  </Text>
                  {achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${(achievement.progress / achievement.maxProgress) * 100}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {achievement.progress}/{achievement.maxProgress}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons name="lock-closed" size={24} color="#ccc" />
              </View>
            ))}
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
  },
  headerContent: {
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginTop: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  achievementsContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  achievementUnlocked: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: '#999',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  achievementDescriptionLocked: {
    color: '#ccc',
  },
  achievementDate: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});
