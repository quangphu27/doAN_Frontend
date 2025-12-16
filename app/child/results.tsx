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
  completedAt: string;
}

export default function ResultsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [results, setResults] = useState<GameResult[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'games'>('all');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Loading results for user:', user.id);
      
      const gameHistoryResponse = await api.games.getHistory(user.id, { limit: 100 });
      
      console.log('Game history response:', gameHistoryResponse);
            
      let gameResults: GameResult[] = [];
      if (gameHistoryResponse.data?.data?.history || gameHistoryResponse.data?.history || Array.isArray(gameHistoryResponse.data)) {
        const gameHistory = gameHistoryResponse.data?.data?.history || gameHistoryResponse.data?.history || gameHistoryResponse.data || [];
        console.log('[Results] raw game history', gameHistory);
        gameResults = gameHistory
          .filter((item: any) => {
            const type = (item.game?.type || item.gameType || item.loai || '').toLowerCase();
            const gameId = item.game?.id || item.game?._id || item.troChoi?._id || item.troChoi?.id;
            const keep = type !== 'lesson' && !!gameId;
            if (!keep) {
              console.log('[Results] filtered out', { type, gameId, item });
            }
            return keep;
          })
          .map((item: any) => ({
            id: item.id || item._id,
            game: {
              id: item.game?.id || item.game?._id || item.troChoi?._id || item.troChoi?.id,
              title: item.game?.title || item.game?.tieuDe || item.troChoi?.tieuDe || 'Trò chơi',
              type: item.game?.type || item.gameType || item.loai || 'unknown',
              category: item.game?.category || item.game?.danhMuc || 'unknown'
            },
            score: item.score || item.diemSo || 0,
            timeSpent: item.timeSpent || item.thoiGian || 0,
            completedAt: item.completedAt || item.createdAt || item.ngayHoanThanh || new Date().toISOString()
          }));
      }
      const gamesOnly = gameResults.filter(r => (r.game.type || '').toLowerCase() !== 'lesson' && !!r.game.id);
      const allResults = [...gamesOnly].sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
      
      console.log('[Results] final games', allResults);
      setResults(allResults);
    } catch (error) {
      console.error('Error loading results:', error);
      Alert.alert('Lỗi', 'Không thể tải kết quả học tập');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  };

  const getFilteredResults = () => {
    return selectedTab === 'games'
      ? results.filter(result => result.game.type !== 'lesson')
      : results;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return 'book';
      case 'puzzle': return 'grid';
      case 'coloring': return 'color-palette';
      case 'matching': return 'link';
      default: return 'game-controller';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return '#4CAF50';
      case 'puzzle': return '#FF6B6B';
      case 'coloring': return '#FF9800';
      case 'matching': return '#9C27B0';
      default: return '#666';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'letter':
      case 'chuCai':
        return 'Chữ cái';
      case 'number':
      case 'so':
        return 'Số';
      case 'color':
      case 'mauSac':
        return 'Màu sắc';
      case 'action':
      case 'hanhDong':
        return 'Hành động';
      default:
        return 'Khác';
    }
  };

  const formatDuration = (seconds: number) => {
    const totalSeconds = seconds || 0;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}p${secs.toString().padStart(2, '0')}s`;
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
        <Text style={styles.loadingText}>Đang tải kết quả...</Text>
      </View>
    );
  }

  const filteredResults = getFilteredResults();

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
          <Text style={styles.headerTitle}>Kết quả học tập</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            Tất cả ({results.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'games' && styles.tabActive]}
          onPress={() => setSelectedTab('games')}
        >
          <Text style={[styles.tabText, selectedTab === 'games' && styles.tabTextActive]}>
            Trò chơi
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.resultsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có kết quả nào</Text>
            <Text style={styles.emptySubtext}>Hãy bắt đầu học bài và chơi game để xem kết quả!</Text>
          </View>
        ) : (
          filteredResults.map((result) => (
            <View key={result.id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultIconContainer}>
                  <Ionicons 
                    name={getTypeIcon(result.game.type) as any} 
                    size={24} 
                    color={getTypeColor(result.game.type)} 
                  />
                </View>
                <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>{result.game.title}</Text>
                <Text style={styles.resultType}>
                  {getCategoryName(result.game.category)}
                </Text>
                </View>
                <View style={styles.resultScore}>
                  <Text style={styles.scoreText}>{result.score}</Text>
                  <Text style={styles.scoreLabel}>điểm</Text>
                </View>
              </View>
              
              <View style={styles.resultDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.detailText}>{formatDuration(result.timeSpent)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.detailText}>{formatDate(result.completedAt)}</Text>
                </View>
              </View>
            </View>
          ))
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginTop: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
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
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resultType: {
    fontSize: 12,
    color: '#666',
  },
  resultScore: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});
