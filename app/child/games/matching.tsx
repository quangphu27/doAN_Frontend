import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../lib/api';
import { getImageSource } from '../../../utils/imageUtils';
import { useSound } from '../../../hooks/useSound';
import { useAuth } from '../../../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface MatchItem {
  id: string;
  type: 'image' | 'text';
  content: string;
  imageUrl?: string;
  x: number;
  y: number;
  isMatched: boolean;
  matchedWith?: string;
}

interface Connection {
  id: string;
  fromId: string;
  toId: string;
  isCorrect: boolean;
  isVisible: boolean;
}

export default function MatchingGame() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { playSound } = useSound();
  const gameId = (params.gameId as string) || '';
  const itemsParam = params.items as string;
  const [gameItems, setGameItems] = useState<MatchItem[]>([]);
  const [initialItems, setInitialItems] = useState<MatchItem[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [correctPairs, setCorrectPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setStartTime(Date.now());
    
    try {
      const parsedItems = JSON.parse(itemsParam || '[]');
      
      const matchItems: MatchItem[] = parsedItems.map((pair: any, index: number) => ({
        id: pair.id || `item_${index}`,
        type: pair.imageUrl ? 'image' : 'text',
        content: pair.text || pair.content || '',
        imageUrl: pair.imageUrl || '',
        x: pair.position?.x || 0,
        y: pair.position?.y || 0,
        isMatched: false,
        matchedWith: null
      }));
      
      setGameItems(matchItems);
      setInitialItems(matchItems);
      const imageItems = matchItems.filter(i => i.type === 'image').length;
      const textItems = matchItems.filter(i => i.type === 'text').length;
      setTotalPairs(Math.min(imageItems, textItems));
    } catch (error) {
      const defaultItems: MatchItem[] = [
        { id: 'img1', type: 'image', content: '', imageUrl: '', x: 0, y: 0, isMatched: false, matchedWith: undefined },
        { id: 'text1', type: 'text', content: 'A', imageUrl: '', x: 0, y: 0, isMatched: false, matchedWith: undefined },
        { id: 'img2', type: 'image', content: '', imageUrl: '', x: 0, y: 0, isMatched: false, matchedWith: undefined },
        { id: 'text2', type: 'text', content: 'B', imageUrl: '', x: 0, y: 0, isMatched: false, matchedWith: undefined },
      ];
      setGameItems(defaultItems);
      setInitialItems(defaultItems);
      setTotalPairs(2);
    }
  }, [itemsParam]);

  const handleItemPress = (itemId: string) => {
    const item = gameItems.find(i => i.id === itemId);
    if (!item || item.isMatched) return;

    if (selectedItem === null) {
      setSelectedItem(itemId);
    } else {
      const firstItem = gameItems.find(i => i.id === selectedItem);
      if (firstItem && firstItem.type !== item.type) {
        const isCorrect = checkMatch(firstItem, item);
        
        if (isCorrect) {
          setCorrectPairs(prev => prev + 1);
          setTotalPairs(prev => prev + 1);
          setGameItems(prevItems =>
            prevItems.map(i =>
              i.id === firstItem.id || i.id === item.id
                ? { ...i, isMatched: true, matchedWith: i.id === firstItem.id ? item.id : firstItem.id }
                : i
            )
          );

          const connectionId = `${firstItem.id}-${item.id}`;
          setConnections(prev => [...prev, {
            id: connectionId,
            fromId: firstItem.id,
            toId: item.id,
            isCorrect: true,
            isVisible: true
          }]);

          playSound('correct');

          const updatedItems = gameItems.map(i =>
            i.id === firstItem.id || i.id === item.id
              ? { ...i, isMatched: true, matchedWith: i.id === firstItem.id ? item.id : firstItem.id }
              : i
          );
          const allMatched = updatedItems.every(i => i.isMatched);

          if (allMatched) {
            handleGameComplete();
          }
        } else {
          setWrongAttempts(prev => prev + 1);
          setTotalPairs(prev => prev + 1);
          
          playSound('failanswer');
          
          const connectionId = `${firstItem.id}-${item.id}`;
          setConnections(prev => [...prev, {
            id: connectionId,
            fromId: firstItem.id,
            toId: item.id,
            isCorrect: false,
            isVisible: true
          }]);

          setTimeout(() => {
            setConnections(prev => prev.filter(c => c.id !== connectionId));
          }, 1000);
        }
      }
      
      setSelectedItem(null);
    }
  };

  const checkMatch = (item1: MatchItem, item2: MatchItem): boolean => {
    const imageItems = gameItems.filter(i => i.type === 'image');
    const textItems = gameItems.filter(i => i.type === 'text');
    
    if (imageItems.length !== textItems.length) return false;
    
    const imageIndex = imageItems.findIndex(i => i.id === item1.id || i.id === item2.id);
    const textIndex = textItems.findIndex(i => i.id === item1.id || i.id === item2.id);
    
    return imageIndex === textIndex;
  };

  const handleGameComplete = async () => {
    const completionTime = Math.round((Date.now() - startTime) / 1000);
    setIsCompleted(true);
    setShowCelebration(true);

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

    const finalScore = totalPairs > 0 ? Math.max(0, Math.round((correctPairs / totalPairs) * 100)) : 0;
    try {
      await api.games.saveResult({
        gameId,
        userId: user?.id || '', 
        score: finalScore,
        timeSpent: completionTime,
        gameType: 'matching',
        resultData: {
          correctPairs,
          totalPairs,
          wrongAttempts,
          completionTime
        }
      });
    } catch (error) {
    }

    setTimeout(() => {
      Alert.alert(
        '🎉 Chúc mừng!',
        `Bạn đã hoàn thành trò chơi nối hình!\n\n📊 Kết quả:\n• Cặp đúng: ${correctPairs}/${totalPairs}\n• Số lần sai: ${wrongAttempts}\n• Thời gian: ${completionTime} giây\n• Điểm: ${finalScore}/100`,
        [
          {
            text: 'Chơi lại',
            onPress: () => {
              setShowCelebration(false);
              setIsCompleted(false);
              setGameItems(initialItems.map(item => ({ ...item, isMatched: false, matchedWith: undefined })));
              setConnections([]);
              setWrongAttempts(0);
              setCorrectPairs(0);
            }
          },
          {
            text: 'Quay lại',
            onPress: () => router.back()
          }
        ]
      );
    }, 2000);
  };

  const renderItem = (item: MatchItem) => {
    const isSelected = selectedItem === item.id;
    const isMatched = item.isMatched;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.item,
          {
            left: item.x,
            top: item.y,
            backgroundColor: isSelected ? '#FFD700' : isMatched ? '#90EE90' : '#fff',
            borderColor: isSelected ? '#FFA500' : isMatched ? '#32CD32' : '#ddd',
            transform: [{ scale: isSelected ? 1.05 : 1 }]
          }
        ]}
        onPress={() => handleItemPress(item.id)}
      >
        {item.type === 'image' && item.imageUrl ? (
          <Image
            source={getImageSource(item.imageUrl)}
            style={styles.itemImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.itemText}>{item.content}</Text>
        )}
        {isMatched && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={20} color="#32CD32" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderConnection = (connection: Connection) => {
    const fromItem = gameItems.find(i => i.id === connection.fromId);
    const toItem = gameItems.find(i => i.id === connection.toId);
    
    if (!fromItem || !toItem) return null;

    const fromX = fromItem.x + 50;
    const fromY = fromItem.y + 50;
    const toX = toItem.x + 50;
    const toY = toItem.y + 50;

    return (
      <View
        key={connection.id}
        style={[
          styles.connection,
          {
            left: Math.min(fromX, toX),
            top: Math.min(fromY, toY),
            width: Math.abs(toX - fromX),
            height: Math.abs(toY - fromY),
            borderColor: connection.isCorrect ? '#32CD32' : '#FF6B6B',
            opacity: connection.isVisible ? 1 : 0
          }
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nối hình với chữ/số</Text>
        <View style={styles.headerRight}>
          <View style={styles.scoreContainer}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.scoreText}>{correctPairs}/{totalPairs}</Text>
          </View>
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={16} color="#fff" />
            <Text style={styles.timerText}>
              {Math.round((Date.now() - startTime) / 1000)}s
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Chạm vào hình ảnh và chữ/số tương ứng để nối chúng lại!
        </Text>
        <Text style={styles.statsText}>
          Số lần sai: {wrongAttempts}
        </Text>
      </View>

      <View style={styles.gameArea}>
        <View style={styles.leftColumn}>
          <Text style={styles.columnTitle}>Hình ảnh</Text>
          {(gameItems || []).filter(item => item.type === 'image').map(renderItem)}
        </View>

        <View style={styles.rightColumn}>
          <Text style={styles.columnTitle}>Nội dung</Text>
          {(gameItems || []).filter(item => item.type === 'text').map(renderItem)}
        </View>

        {(connections || []).map(renderConnection)}
      </View>

      {showCelebration && (
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

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            setShowCelebration(false);
            setIsCompleted(false);
            setGameItems([]);
            setConnections([]);
            setWrongAttempts(0);
          }}
        >
          <Ionicons name="refresh" size={20} color="#2196F3" />
          <Text style={styles.controlButtonText}>Chơi lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => router.back()}
        >
          <Ionicons name="home" size={20} color="#4CAF50" />
          <Text style={styles.controlButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
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
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    margin: 20,
    flexDirection: 'row',
  },
  leftColumn: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  item: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  connection: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 2,
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
    color: '#2196F3',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
