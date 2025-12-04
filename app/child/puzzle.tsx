import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { getImageSource } from '../../utils/imageUtils';
import PuzzleGame from './games/puzzle';

export default function PuzzleGameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gameId = params.gameId as string;
  const imageUrl = params.imageUrl as string;
  const difficulty = (params.difficulty as 'easy' | 'medium' | 'hard') || 'easy';

  useEffect(() => {
    loadGameData();
  }, [gameId]);

  const loadGameData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!gameId) {
        throw new Error('Game ID không hợp lệ');
      }
      const response = await api.games.get(gameId);
      
      if (response && response.data) {
        setGameData(response.data);
      } else {
        throw new Error('Không thể tải dữ liệu game');
      }
    } catch (err) {
      console.error('Error loading game data:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      Alert.alert('Lỗi', 'Không thể tải dữ liệu game. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = () => {
    let rawImageUrl = '';
    
    if (imageUrl) {
      rawImageUrl = imageUrl;
    } else if (gameData?.imageUrl) {
      rawImageUrl = gameData.imageUrl;
    } else if (gameData?.originalImage) {
      rawImageUrl = gameData.originalImage;
    }
    
    console.log('Puzzle game image URL processing:', {
      imageUrl,
      gameDataImageUrl: gameData?.imageUrl,
      gameDataOriginalImage: gameData?.originalImage,
      rawImageUrl,
      gameData
    });
    
    return rawImageUrl;
  };

  const getDifficulty = () => {
    if (difficulty) return difficulty;
    if (gameData?.difficulty) return gameData.difficulty;
    return 'easy';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải game...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const finalImageUrl = getImageUrl();
  const finalDifficulty = getDifficulty();

  if (!finalImageUrl) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy ảnh game</Text>
      </View>
    );
  }

  return (
    <PuzzleGame
      gameId={gameId}
      imageUrl={finalImageUrl}
      difficulty={finalDifficulty}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
});
