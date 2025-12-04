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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { api } from '../../../lib/api';
import { getImageSource } from '../../../utils/imageUtils';
import { useAuth } from '../../../context/AuthContext';
import { useSound } from '../../../hooks/useSound';

const { width, height } = Dimensions.get('window');

interface PuzzlePiece {
  id: number;
  row: number;
  col: number;
  correctRow: number;
  correctCol: number;
  image: string;
  isPlaced: boolean;
}

interface PuzzleGameProps {
  gameId: string;
  imageUrl: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function PuzzleGame({ gameId, imageUrl, difficulty }: PuzzleGameProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { playSound } = useSound();
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [score, setScore] = useState(100);
  const [showSampleImage, setShowSampleImage] = useState(true);
  const [showCheckResult, setShowCheckResult] = useState(false);
  const [sampleImagePieces, setSampleImagePieces] = useState<PuzzlePiece[]>([]);
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;


  const puzzleSize = 300;
  
  const rows = gameData?.data?.rows || 3;
  const cols = gameData?.data?.cols || 3;
  const gridSize = Math.max(rows, cols);
  const pieceSize = puzzleSize / gridSize;
  
  const getSampleImageSize = () => {
    return {
      width: 120,
      height: 120
    };
  };

  useEffect(() => {
    loadGameData();
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (gameData) {
      initializePuzzle();
      initializeSampleImage();
    }
  }, [gameData]);

  const loadGameData = async () => {
    try {
      setLoading(true);
      const response = await api.games.get(gameId);
      
      if (response && response.data) {
        setGameData(response.data);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const initializePuzzle = () => {
    
    const newPieces: PuzzlePiece[] = [];
    let pieceId = 0;

    const correctPositions: { row: number; col: number }[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        correctPositions.push({ row, col });
      }
    }

    const shuffledPositions = [...correctPositions].sort(() => Math.random() - 0.5);

    for (let i = 0; i < rows * cols; i++) {
      const correctPos = correctPositions[i];
      const currentPos = shuffledPositions[i];
      
      newPieces.push({
        id: pieceId++,
        row: currentPos.row,
        col: currentPos.col,
        correctRow: correctPos.row,
        correctCol: correctPos.col,
        image: imageUrl,
        isPlaced: false
      });
    }

    setPieces(newPieces);
  };

  const initializeSampleImage = () => {
    setSampleImagePieces([]);
  };

  const handlePieceClick = (pieceId: number) => {
    if (selectedPiece === null) {
      setSelectedPiece(pieceId);
    } else if (selectedPiece === pieceId) {
      setSelectedPiece(null);
    } else {
      swapPieces(selectedPiece, pieceId);
      setSelectedPiece(null);
    }
  };

  const swapPieces = (pieceId1: number, pieceId2: number) => {
    setPieces(prevPieces => {
      const newPieces = [...prevPieces];
      const piece1 = newPieces.find(p => p.id === pieceId1);
      const piece2 = newPieces.find(p => p.id === pieceId2);
      
      if (piece1 && piece2) {
        const tempRow = piece1.row;
        const tempCol = piece1.col;
        piece1.row = piece2.row;
        piece1.col = piece2.col;
        piece2.row = tempRow;
        piece2.col = tempCol;

        piece1.isPlaced = (piece1.row === piece1.correctRow && piece1.col === piece1.correctCol);
        piece2.isPlaced = (piece2.row === piece2.correctRow && piece2.col === piece2.correctCol);

      }
      
      return newPieces;
    });
  };

  const handleHint = () => {
    if (hintCount >= 3) {
      Alert.alert('Hết gợi ý', 'Bạn đã sử dụng hết 3 gợi ý!');
      return;
    }

    const misplacedPiece = pieces.find(p => !p.isPlaced);
    if (misplacedPiece) {
      setShowHint(true);
      setHintCount(prev => prev + 1);
      setScore(prev => Math.max(0, prev - 10)); 

      setTimeout(() => {
        setShowHint(false);
      }, 2000);
      
      Alert.alert(
        '💡 Gợi ý',
        `Mảnh số ${misplacedPiece.id} cần được đặt ở vị trí (${misplacedPiece.correctRow + 1}, ${misplacedPiece.correctCol + 1})`,
        [{ text: 'OK' }]
      );
    }
  };

  const checkPuzzleCompletion = () => {
    const allCorrect = pieces.every(piece => 
      piece.row === piece.correctRow && piece.col === piece.correctCol
    );
    
    if (allCorrect) {
      handlePuzzleComplete();
    } else {
      setShowCheckResult(true);
      Alert.alert(
        '❌ Chưa đúng vị trí',
        'Bạn chưa xếp đúng vị trí các mảnh ghép. Hãy xem hình mẫu ở góc trên để tham khảo!',
        [
          {
            text: 'Tiếp tục',
            onPress: () => setShowCheckResult(false)
          }
        ]
      );
    }
  };

  const handlePuzzleComplete = async () => {
    const completionTime = Math.round((Date.now() - startTime) / 1000);
    setIsCompleted(true);
    setShowCelebration(true);
    
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

    const finalScore = Math.max(0, score - Math.floor(completionTime / 10)); 
    
    try {
      const response = await api.games.saveResult({
        gameId,
        userId: user?.id || '',
        score: finalScore,
        timeSpent: completionTime,
        gameType: 'puzzle',
        resultData: {
          isCompleted: true,
          difficulty,
          piecesPlaced: pieces.length,
          hintsUsed: hintCount,
          finalScore
        }
      });
      
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu kết quả game. Vui lòng thử lại.');
    }

    setTimeout(() => {
      Alert.alert(
        '🎉 Tuyệt vời!',
        `Bạn đã hoàn thành trò chơi xếp hình trong ${completionTime} giây!\nĐiểm số: ${finalScore}/100`,
        [
          {
            text: 'Chơi lại',
            onPress: () => {
              setShowCelebration(false);
              setIsCompleted(false);
              initializePuzzle();
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


  const renderPuzzlePiece = (piece: PuzzlePiece) => {
    const isSelected = selectedPiece === piece.id;
    const isCorrect = piece.isPlaced;
    
    const imageSource = getImageSource(piece.image);
    
    return (
      <TouchableOpacity
        key={piece.id}
        style={[
          styles.puzzlePiece,
          {
            left: piece.col * pieceSize,
            top: piece.row * pieceSize,
            width: pieceSize,
            height: pieceSize,
            opacity: isCorrect ? 0.8 : 1,
            transform: [{ scale: isCorrect ? 0.95 : 1 }],
            borderColor: isSelected ? '#FF6B6B' : isCorrect ? '#4CAF50' : '#ddd',
            borderWidth: isSelected ? 3 : 2,
            backgroundColor: isSelected ? 'rgba(255, 107, 107, 0.2)' : 'transparent'
          }
        ]}
        onPress={() => handlePieceClick(piece.id)}
      >
        <View style={styles.pieceImageContainer}>
          <Image
            source={imageSource}
            style={[
              styles.pieceImage,
              {
                width: puzzleSize, 
                height: puzzleSize, 
                left: -piece.correctCol * pieceSize,
                top: -piece.correctRow * pieceSize 
              }
            ]}
            resizeMode="cover"
            onError={() => {}}
            onLoad={() => {}}
          />
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#FF6B6B" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải trò chơi...</Text>
        </View>
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trò chơi xếp hình</Text>
        <View style={styles.headerRight}>
          <View style={styles.scoreContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
          <TouchableOpacity style={styles.hintButton} onPress={handleHint}>
            <Ionicons name="bulb" size={20} color="#fff" />
            <Text style={styles.hintText}>{3 - hintCount}</Text>
          </TouchableOpacity>
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={16} color="#fff" />
            <Text style={styles.timerText}>
              {Math.round((Date.now() - startTime) / 1000)}s
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.instructionsContainer}>
      </View>

      <View style={styles.puzzleContainer}>
        <View style={styles.puzzleFrameContainer}>
          <Text style={styles.frameTitle}>Trò chơi xếp hình</Text>
          
          <View style={styles.sampleImageContainer}>
            <Text style={styles.sampleImageLabel}>Hình mẫu</Text>
            <View style={[styles.sampleImageWrapper, getSampleImageSize()]}>
              <Image
                source={getImageSource(imageUrl)}
                style={[styles.sampleImageFull, getSampleImageSize()]}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={[styles.puzzleFrame, { width: puzzleSize, height: puzzleSize }]}>
            <View style={styles.piecesContainer}>
              {(pieces || []).map(renderPuzzlePiece)}
            </View>
          </View>
        </View>
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
          style={[styles.controlButton, styles.checkButton]}
          onPress={checkPuzzleCompletion}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={[styles.controlButtonText, styles.checkButtonText]}>Kiểm tra</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.restartButton]}
          onPress={() => {
            setShowCelebration(false);
            setIsCompleted(false);
            initializePuzzle();
          }}
        >
          <Ionicons name="refresh" size={18} color="#FF6B6B" />
          <Text style={styles.controlButtonText}>Chơi lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.homeButton]}
          onPress={() => router.back()}
        >
          <Ionicons name="home" size={18} color="#2196F3" />
          <Text style={styles.controlButtonText}>Trang chủ</Text>
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
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  hintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionsContainer: {
    padding: 20,
    alignItems: 'flex-start',
    paddingLeft: 30,
    height: 60,
    justifyContent: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    fontWeight: '500',
  },
  puzzleContainer: {
    flex: 1,
    padding: 20,
    paddingLeft: 30,
    alignItems: 'flex-start',
  },
  puzzleFrameContainer: {
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 1,
    marginTop: 30,
  },
  frameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'left',
  },
  puzzleFrame: {
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  sampleImageContainer: {
    position: 'absolute',
    top: -100,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sampleImageTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  sampleImageWrapper: {
    position: 'relative',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4CAF50',
    overflow: 'hidden',
  },
  sampleImage: {
    borderRadius: 2,
  },
  sampleImageGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  sampleImageGridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sampleImageText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  sampleImageLabel: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 8,
    textAlign: 'center',
  },
  sampleImagePiecesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  sampleImagePiece: {
    position: 'absolute',
    overflow: 'hidden',
  },
  sampleImagePieceImage: {
    position: 'absolute',
  },
  sampleImageFull: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  piecesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  puzzlePiece: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pieceImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pieceImage: {
    position: 'absolute',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
  },
  selectedText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 5,
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
    color: '#4CAF50',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  restartButton: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  homeButton: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  checkButtonText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#4CAF50',
    marginTop: 20,
    fontWeight: '600',
  },
});
