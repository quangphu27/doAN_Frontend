
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
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../lib/api';
import { getImageSource } from '../../../utils/imageUtils';
import { useAuth } from '../../../context/AuthContext';
import { useSound } from '../../../hooks/useSound';
import { captureRef } from 'react-native-view-shot';

const { width, height } = Dimensions.get('window');

interface DrawingPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

interface ColoringGameProps {
  gameId?: string;
  imageUrl?: string;
  suggestedColors?: string[];
}

const PASTEL_COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#FFB3E6', '#C7CEEA', '#FFD1DC', '#E6E6FA', '#F0E68C',
  '#98FB98', '#F5DEB3', '#FFA07A', '#20B2AA', '#87CEEB',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
  '#A9DFBF', '#F9E79F', '#FADBD8', '#D5DBDB', '#AED6F1',
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
  '#00FFFF', '#000000', '#FFFFFF', '#808080', '#800000',
  '#008000', '#000080', '#808000', '#800080', '#008080'
];

export default function ColoringGame() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { playSound } = useSound();
  const { user } = useAuth();
  const gameId = params.gameId as string;
  const imageUrl = params.imageUrl as string;
  const suggestedColors = params.suggestedColors ? JSON.parse(params.suggestedColors as string) : PASTEL_COLORS;
  
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);
  const [drawingPoints, setDrawingPoints] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameData, setGameData] = useState<any>(null);
  const [brushSize, setBrushSize] = useState(5);
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const imageContainerRef = useRef<View>(null);

  useEffect(() => {
    setStartTime(Date.now());
    loadGameData(); 
  }, [gameId]);

  useEffect(() => {
  }, [selectedColor]);

  const loadGameData = async () => {
    if (!gameId) {
      return;
    }
    
    try {
      const response = await api.games.get(gameId);
      
      if (response && response.data) {
        console.log('[ColoringGame] loadGameData response', {
          gameId,
          responseDataKeys: Object.keys(response.data || {}),
          raw: response.data
        });
        setGameData(response.data);
      }
    } catch (error) {
      console.log('[ColoringGame] loadGameData error', error);
    }
  };

  const getImageUrl = () => {
    console.log('[ColoringGame] getImageUrl params', {
      gameId,
      paramImageUrl: imageUrl,
      hasGameData: !!gameData,
      duLieuToMau: gameData?.duLieu?.duLieuToMau,
      coloringData: gameData?.data?.coloringData,
      imageUrl: gameData?.imageUrl,
      originalImage: gameData?.data?.originalImage,
      anhDaiDien: gameData?.anhDaiDien
    });

    if (imageUrl) return imageUrl;

    if (gameData?.data?.coloringData?.outlineImage) {
      const url = gameData.data.coloringData.outlineImage;
      console.log('[ColoringGame] use coloringData.outlineImage', url);
      return url;
    }

    if (gameData?.duLieu?.duLieuToMau?.anhVien) {
      const url = gameData.duLieu.duLieuToMau.anhVien;
      console.log('[ColoringGame] use duLieu.duLieuToMau.anhVien', url);
      return url;
    }

    if (gameData?.imageUrl) {
      const url = gameData.imageUrl;
      console.log('[ColoringGame] use imageUrl', url);
      return url;
    }

    if (gameData?.data?.originalImage) {
      const url = gameData.data.originalImage;
      console.log('[ColoringGame] use data.originalImage', url);
      return url;
    }

    if (gameData?.anhDaiDien) {
      const url = gameData.anhDaiDien;
      console.log('[ColoringGame] use anhDaiDien', url);
      return url;
    }

    console.log('[ColoringGame] getImageUrl fallback empty');
    return '';
  };

  const getColors = () => {
    if (suggestedColors && suggestedColors.length > 0) return suggestedColors;

    if (gameData?.data?.coloringData?.suggestedColors && gameData.data.coloringData.suggestedColors.length > 0) {
      return gameData.data.coloringData.suggestedColors;
    }

    if (gameData?.duLieu?.duLieuToMau && Array.isArray(gameData.duLieu.duLieuToMau['mauGợiY']) && gameData.duLieu.duLieuToMau['mauGợiY'].length > 0) {
      return gameData.duLieu.duLieuToMau['mauGợiY'];
    }

    return PASTEL_COLORS;
  };


  const handleTouchStart = (event: any) => {
    const { locationX, locationY, pageX, pageY } = event.nativeEvent;
    
    const drawingArea = event.currentTarget;
    const rect = drawingArea.getBoundingClientRect?.() || { left: 0, top: 0 };
    
    let x = locationX;
    let y = locationY;
    
    if (x === undefined || y === undefined || x < 0 || y < 0) {
      x = pageX - rect.left;
      y = pageY - rect.top;
    }
    
    setIsDrawing(true);
    
    const newPoint: DrawingPoint = {
      x: Math.max(0, Math.min(300, x)), 
      y: Math.max(0, Math.min(300, y)),
      color: selectedColor,
      size: brushSize
    };
    
    setDrawingPoints(prev => [...prev, newPoint]);
  };

  const handleTouchMove = (event: any) => {
    if (!isDrawing) return;
    
    const { locationX, locationY, pageX, pageY } = event.nativeEvent;
    
    const drawingArea = event.currentTarget;
    const rect = drawingArea.getBoundingClientRect?.() || { left: 0, top: 0 };
    
    let x = locationX;
    let y = locationY;
    
    if (x === undefined || y === undefined || x < 0 || y < 0) {
      x = pageX - rect.left;
      y = pageY - rect.top;
    }
    
    const newPoint: DrawingPoint = {
      x: Math.max(0, Math.min(300, x)), 
      y: Math.max(0, Math.min(300, y)),
      color: selectedColor,
      size: brushSize
    };
    
    setDrawingPoints(prev => [...prev, newPoint]);
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    setDrawingPoints([]);
  };

  const handleColoringComplete = async () => {
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

    const currentState = {
      drawingPoints: drawingPoints,
      completionTime,
      colorsUsed: [...new Set(drawingPoints.map(point => point.color))],
      totalPoints: drawingPoints.length,
      brushSizes: [...new Set(drawingPoints.map(point => point.size))]
    };

    try {
      const resultImageBase64 = await captureResultImage();
      
      const payload: any = {
        gameId,
        userId: user?.id || '',
        score: 0,
        timeSpent: completionTime,
        gameType: 'coloring',
        resultData: {
          drawingData: JSON.stringify(currentState.drawingPoints), 
          colorsUsed: currentState.colorsUsed
        }
      };

      if (resultImageBase64) {
        payload.resultImageBase64 = resultImageBase64;
      }

      await api.games.saveResult(payload);
    } catch (error) {
      console.error('Error saving result:', error);
    }

    setTimeout(() => {
      Alert.alert(
        '🎨 Tuyệt vời!',
        `Bạn đã hoàn thành tác phẩm tô màu!\n\n📊 Kết quả:\n• Số nét vẽ: ${currentState.totalPoints}\n• Màu sử dụng: ${currentState.colorsUsed.length}\n• Thời gian: ${completionTime} giây\n• Điểm: ${Math.min(100, Math.round((drawingPoints.length / 50) * 100))}/100`,
        [
          {
            text: 'Vẽ lại',
            onPress: () => {
              setShowCelebration(false);
              setIsCompleted(false);
              clearDrawing();
            }
          },
          {
            text: 'Lưu tác phẩm',
            onPress: handleSaveArtwork
          },
          {
            text: 'Quay lại',
            onPress: () => router.back()
          }
        ]
      );
    }, 2000);
  };

  const captureResultImage = async (): Promise<string | null> => {
    try {
      if (!imageContainerRef.current) {
        return null;
      }

      // Giảm dung lượng ảnh để tránh lỗi "request entity too large" khi gửi lên server
      const uri = await captureRef(imageContainerRef.current, {
        format: 'jpg',
        quality: 0.5,
        result: 'base64',
        width: 256,
        height: 256
      });

      return `data:image/jpeg;base64,${uri}`;
    } catch (error) {
      console.error('Error capturing image:', error);
      return null;
    }
  };

  const handleSaveArtwork = async () => {
    try {
      Alert.alert('Đang xử lý...', 'Vui lòng đợi trong giây lát', [], { cancelable: false });

      const resultImageBase64 = await captureResultImage();
      
      if (!gameId) {
        const altGameId = params.id || params.game_id || params.gameId;
        
        if (!altGameId) {
          Alert.alert('Lỗi', 'Không tìm thấy game ID. Vui lòng thử lại.');
          return;
        }
        
        const resultData = {
          drawingData: JSON.stringify(drawingPoints),
          colorsUsed: Array.from(new Set(drawingPoints.map(p => p.color))),
          totalPoints: drawingPoints.length,
          brushSizes: Array.from(new Set(drawingPoints.map(p => p.size))),
          completionTime: Math.round((Date.now() - startTime) / 1000)
        };

        const payload: any = {
          gameId: altGameId as string,
          userId: user?.id || '',
          // Backend yêu cầu score, tạm gửi 0 (giáo viên chấm lại sau)
          score: 0,
          timeSpent: Math.round((Date.now() - startTime) / 1000),
          gameType: 'coloring',
          resultData: resultData
        };

        if (resultImageBase64) {
          payload.resultImageBase64 = resultImageBase64;
        }

        // Nếu không ném lỗi là đã lưu thành công (request() đã kiểm tra res.ok)
        await api.games.saveResult(payload);
        Alert.alert('Thành công', 'Tác phẩm đã được lưu vào hồ sơ học tập!');
        router.back();
        return;
      }

      const resultData = {
        drawingData: JSON.stringify(drawingPoints),
        colorsUsed: Array.from(new Set(drawingPoints.map(p => p.color))),
        totalPoints: drawingPoints.length,
        brushSizes: Array.from(new Set(drawingPoints.map(p => p.size))),
        completionTime: Math.round((Date.now() - startTime) / 1000)
      };

      const payload: any = {
        gameId: gameId,
        userId: user?.id || '',
        // Backend yêu cầu score, tạm gửi 0 (giáo viên chấm lại sau)
        score: 0,
        timeSpent: Math.round((Date.now() - startTime) / 1000),
        gameType: 'coloring',
        resultData: resultData
      };

      if (resultImageBase64) {
        payload.resultImageBase64 = resultImageBase64;
      }

      // Nếu không ném lỗi là đã lưu thành công
      await api.games.saveResult(payload);
      Alert.alert('Thành công', 'Tác phẩm đã được lưu vào hồ sơ học tập!');
      router.back();
    } catch (error) {
      console.error('Error saving artwork:', error);
      Alert.alert('Lỗi', 'Không thể lưu tác phẩm');
    }
  };

  const renderColorPalette = () => {
    const colors = getColors();
    
    return (
      <View style={styles.colorPalette}>
        <Text style={styles.paletteTitle}>Chọn màu ({colors.length} màu):</Text>
        <ScrollView 
          horizontal={true} 
          showsHorizontalScrollIndicator={false}
          style={styles.colorScrollView}
        >
          <View style={styles.colorGrid}>
            {colors.map((color: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.colorButton,
                {
                  backgroundColor: color,
                  borderWidth: selectedColor === color ? 3 : 1,
                  borderColor: selectedColor === color ? '#333' : '#ddd',
                  transform: [{ scale: selectedColor === color ? 1.1 : 1 }]
                }
              ]}
              onPress={() => {
                setSelectedColor(color);
              }}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={16} color="#333" />
              )}
            </TouchableOpacity>
          ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderColoringArea = () => {
    const currentImageUrl = getImageUrl();
    
    return (
      <View style={styles.coloringContainer}>
        <View ref={imageContainerRef} style={styles.imageContainer} collapsable={false}>
          {currentImageUrl ? (
            <Image
              source={getImageSource(currentImageUrl)}
              style={styles.baseImage}
              resizeMode="contain"
              onError={(error) => {}}
              onLoad={(event) => {}}
            />
          ) : (
            <View style={[styles.baseImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={60} color="#ccc" />
              <Text style={styles.placeholderText}>Không có ảnh</Text>
            </View>
          )}
          
          <View
            style={styles.drawingArea}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onLayout={(event) => {}}
          >            
            {drawingPoints.map((point, index) => {
              return (
                <View
                  key={`point-${index}-${point.x}-${point.y}`}
                  style={[
                    styles.drawingPoint,
                    {
                      left: point.x - point.size / 2,
                      top: point.y - point.size / 2,
                      width: point.size,
                      height: point.size,
                      backgroundColor: point.color,
                      borderRadius: point.size / 2,
                    }
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E8E']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trò chơi tô màu</Text>
        <View style={styles.timerContainer}>
          <Ionicons name="time" size={16} color="#fff" />
          <Text style={styles.timerText}>
            {Math.round((Date.now() - startTime) / 1000)}s
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Chọn màu và vẽ tự do!
        </Text>
      </View>

      {renderColoringArea()}

      {renderColorPalette()}

      <View style={styles.brushControls}>
        <Text style={styles.brushTitle}>Kích thước cọ:</Text>
        <View style={styles.brushSizes}>
            {[3, 5, 8, 12].map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.brushSizeButton,
                {
                  backgroundColor: brushSize === size ? selectedColor : '#f0f0f0',
                  borderWidth: brushSize === size ? 3 : 1,
                  borderColor: brushSize === size ? '#333' : '#ddd',
                }
              ]}
              onPress={() => setBrushSize(size)}
            >
              <View
                style={[
                  styles.brushSizeIndicator,
                  {
                    width: size,
                    height: size,
                    backgroundColor: brushSize === size ? '#fff' : '#333',
                  }
                ]}
              />
            </TouchableOpacity>
          ))}
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
            <Text style={styles.celebrationText}>🎨</Text>
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
            clearDrawing();
          }}
        >
          <Ionicons name="refresh" size={20} color="#FF6B6B" />
          <Text style={styles.controlButtonText}>Vẽ lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSaveArtwork}
        >
          <Ionicons name="save" size={20} color="#4CAF50" />
          <Text style={styles.controlButtonText}>Lưu tác phẩm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => router.back()}
        >
          <Ionicons name="home" size={20} color="#2196F3" />
          <Text style={styles.controlButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff5f5',
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
  instructionsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  coloringContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  imageContainer: {
    position: 'relative',
    width: 300,
    height: 300,
    alignSelf: 'center',
  },
  baseImage: {
    width: 300,
    height: 300,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
  drawingArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  drawingPoint: {
    position: 'absolute',
    zIndex: 10,
  },
  colorPalette: {
    backgroundColor: '#fff',
    padding: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  paletteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  colorScrollView: {
    maxHeight: 80,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 5,
  },
  colorButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1001,
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
    color: '#FF6B6B',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  brushControls: {
    backgroundColor: '#fff',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  brushTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  brushSizes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  brushSizeButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  brushSizeIndicator: {
    borderRadius: 50,
  },
});
