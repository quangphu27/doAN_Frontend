import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { getImageSource } from '../../utils/imageUtils';

const { width } = Dimensions.get('window');

interface Game {
  id: string;
  title: string;
  type: 'puzzle' | 'coloring' | 'matching' | 'memory' | 'quiz';
  category: 'letter' | 'number' | 'color' | 'action';
  level: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  description?: string;
  estimatedTime: number;
  ageRange: {
    min: number;
    max: number;
  };
}

export default function GamesScreen() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const gameTypes = [
    { id: 'all', name: 'Tất cả', icon: 'apps', color: '#FF6B6B' },
    { id: 'puzzle', name: 'Ghép hình', icon: 'grid', color: '#4ECDC4' },
    { id: 'coloring', name: 'Tô màu', icon: 'color-palette', color: '#45B7D1' },
    { id: 'matching', name: 'Nối hình', icon: 'link', color: '#96CEB4' },
    { id: 'memory', name: 'Trí nhớ', icon: 'flash', color: '#FFEAA7' },
    { id: 'quiz', name: 'Câu hỏi', icon: 'help-circle', color: '#FFB6C1' }
  ];

  useEffect(() => {
    loadGames();
  }, [selectedType]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 20 };
      if (selectedType !== 'all') {
        params.type = selectedType;
      }
      const response = await api.games.list(params);
      setGames(response.data.games || []);
    } catch (error) {
      console.error('Error loading games:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách trò chơi');
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGames();
    setRefreshing(false);
  };

  const handleGamePress = (game: Game) => {
    Alert.alert('Trò chơi', `Bắt đầu chơi "${game.title}"!`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải trò chơi...</Text>
      </View>
    );
  }

  const getTypeColor = (type: string) => {
    const gameType = gameTypes.find(t => t.id === type);
    return gameType?.color || '#666';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FF9800';
      case 'advanced':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Dễ';
      case 'intermediate':
        return 'Trung bình';
      case 'advanced':
        return 'Khó';
      default:
        return level;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải trò chơi...</Text>
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
        colors={['#FF6B6B', '#E53E3E']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Trò chơi vui nhộn</Text>
            <Text style={styles.headerSubtitle}>Học mà chơi, chơi mà học</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loại trò chơi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesContainer}>
          {gameTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                selectedType === type.id && styles.typeCardActive,
                { backgroundColor: type.color }
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Ionicons name={type.icon as any} size={30} color="#fff" />
              <Text style={styles.typeText}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Trò chơi {selectedType !== 'all' ? gameTypes.find(t => t.id === selectedType)?.name : ''}
        </Text>
        
        {games.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="game-controller" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>Chưa có trò chơi nào</Text>
            <Text style={styles.emptyStateSubtext}>Các trò chơi mới sẽ xuất hiện ở đây</Text>
          </View>
        ) : (
          <View style={styles.gamesGrid}>
            {games.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => handleGamePress(game)}
              >
                <View style={styles.gameImageContainer}>
                  {game.imageUrl ? (
                    <Image source={getImageSource(game.imageUrl)} style={styles.gameImage} />
                  ) : (
                    <View style={[styles.gameImagePlaceholder, { backgroundColor: getTypeColor(game.type) }]}>
                      <Ionicons name="game-controller" size={40} color="#fff" />
                    </View>
                  )}
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(game.level) }]}>
                    <Text style={styles.levelText}>{getLevelText(game.level)}</Text>
                  </View>
                  <View style={styles.ageBadge}>
                    <Text style={styles.ageText}>{game.ageRange.min}-{game.ageRange.max} tuổi</Text>
                  </View>
                </View>
                
                <View style={styles.gameContent}>
                  <Text style={styles.gameTitle}>{game.title}</Text>
                  {game.description && (
                    <Text style={styles.gameDescription}>{game.description}</Text>
                  )}
                  
                  <View style={styles.gameFooter}>
                    <View style={styles.gameTime}>
                      <Ionicons name="time" size={14} color="#666" />
                      <Text style={styles.gameTimeText}>{game.estimatedTime} phút</Text>
                    </View>
                    <View style={styles.gameType}>
                      <Ionicons name="pricetag" size={14} color="#666" />
                      <Text style={styles.gameTypeText}>
                        {gameTypes.find(t => t.id === game.type)?.name}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trò chơi nổi bật</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredContainer}>
          {[
            { id: '1', title: 'Ghép hình chữ cái', type: 'puzzle', color: '#4ECDC4' },
            { id: '2', title: 'Tô màu số đếm', type: 'coloring', color: '#45B7D1' },
            { id: '3', title: 'Nối hình - chữ', type: 'matching', color: '#96CEB4' },
            { id: '4', title: 'Trò chơi trí nhớ', type: 'memory', color: '#FFEAA7' }
          ].map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.featuredCard, { backgroundColor: game.color }]}
            >
              <Ionicons name="star" size={24} color="#fff" />
              <Text style={styles.featuredTitle}>{game.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.quickActionText}>Yêu thích</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="trophy" size={24} color="#FF6B6B" />
            <Text style={styles.quickActionText}>Thành tích</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="refresh" size={24} color="#4CAF50" />
            <Text style={styles.quickActionText}>Làm lại</Text>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFE5E5',
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  typesContainer: {
    marginBottom: 10,
  },
  typeCard: {
    width: 100,
    height: 100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeCardActive: {
    transform: [{ scale: 1.05 }],
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  gameImageContainer: {
    position: 'relative',
    height: 120,
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  gameImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ageBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ageText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gameContent: {
    padding: 16,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 12,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameTimeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  gameType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameTypeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  featuredContainer: {
    marginBottom: 10,
  },
  featuredCard: {
    width: 150,
    height: 100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
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
  quickActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});
