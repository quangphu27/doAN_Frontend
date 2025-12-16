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
  TextInput,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { api } from '../../lib/api';
import * as ImagePicker from 'expo-image-picker';
import CreateGame from './create-game';
import GameTypeSelection from './game-type-selection';
import { API } from '../../constants/config';
import { getFullImageUrl } from '../../utils/imageUtils';

const { width } = Dimensions.get('window');

export interface Game {
  id: string;
  key: string;
  title: string;
  type: 'puzzle' | 'coloring' | 'matching' | 'memory' | 'quiz' | 'guess_image' | 'guess_number' | 'guess_action' | 'guessing';
  category: 'letter' | 'number' | 'color' | 'action';
  level: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  imageUrl?: string;
  data: any;
  estimatedTime?: number;
  ageRange?: {
    min: number;
    max: number;
  };
}

export default function GameManagement() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [createGameVisible, setCreateGameVisible] = useState(false);
  const [gameTypeSelectionVisible, setGameTypeSelectionVisible] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<'coloring' | 'puzzle' | 'guessing' | null>(null);

  useEffect(() => {
    loadGames();
  }, [selectedType, searchText]);

  // Tải danh sách trò chơi từ API với các bộ lọc
  // Nếu selectedType !== 'all': thêm filter theo loại trò chơi (coloring, puzzle, guess_action)
  // Nếu có searchText: thêm filter tìm kiếm theo tên trò chơi
  // Giới hạn 20 trò chơi mỗi trang
  // Hiển thị loading indicator và thông báo lỗi nếu có
  const loadGames = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 20 };
      if (selectedType !== 'all') params.type = selectedType;
      if (searchText) params.search = searchText;

      const response = await api.games.list(params);
      setGames(response.data.games || []);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách trò chơi');
    } finally {
      setLoading(false);
    }
  };

  // Làm mới danh sách trò chơi khi người dùng kéo xuống
  // Đặt refreshing = true để hiển thị loading indicator
  // Gọi lại loadGames() để tải lại dữ liệu
  // Sau khi hoàn thành, đặt refreshing = false
  const onRefresh = async () => {
    setRefreshing(true);
    await loadGames();
    setRefreshing(false);
  };

  // Mở modal để chỉnh sửa trò chơi
  // Lưu trò chơi cần chỉnh sửa vào editingGame để load dữ liệu vào form
  // Hiển thị GameModal với dữ liệu đã điền sẵn
  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setModalVisible(true);
  };

  // Xóa trò chơi khỏi hệ thống
  // Hiển thị Alert xác nhận trước khi xóa
  // Nếu người dùng xác nhận: gọi API delete, refresh danh sách, và hiển thị thông báo thành công
  const handleDeleteGame = (gameId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa trò chơi này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.games.delete(gameId);
              await loadGames();
              Alert.alert('Thành công', 'Đã xóa trò chơi');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa trò chơi');
            }
          }
        }
      ]
    );
  };

  // Admin chỉ xem danh sách, không tạo mới
  // const handleCreateGame = () => {
  //   setGameTypeSelectionVisible(true);
  // };

  // Xử lý khi người dùng chọn loại trò chơi
  // Lưu loại trò chơi đã chọn vào selectedGameType
  // Đóng GameTypeSelection modal và mở CreateGame modal với loại trò chơi đã chọn
  const handleSelectGameType = (gameType: 'coloring' | 'puzzle' | 'guessing') => {
    setSelectedGameType(gameType);
    setGameTypeSelectionVisible(false);
    setCreateGameVisible(true);
  };

  // Xử lý sau khi tạo trò chơi thành công
  // Đóng CreateGame modal, reset selectedGameType về null
  // Refresh danh sách trò chơi để hiển thị trò chơi mới
  const handleCreateGameSuccess = () => {
    setCreateGameVisible(false);
    setSelectedGameType(null);
    loadGames();
  };

  // Đóng modal tạo trò chơi khi người dùng hủy
  // Đóng CreateGame modal và reset selectedGameType về null
  const handleCreateGameClose = () => {
    setCreateGameVisible(false);
    setSelectedGameType(null);
  };

  // Đóng modal chọn loại trò chơi
  // Ẩn GameTypeSelection modal
  const handleGameTypeSelectionClose = () => {
    setGameTypeSelectionVisible(false);
  };

  // Lấy màu sắc tương ứng với loại trò chơi
  // Coloring: xanh ngọc, Puzzle: đỏ, Guess action: cam, các loại khác: xám
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'coloring': return '#4ECDC4';
      case 'puzzle': return '#FF6B6B';
      case 'matching': return '#45B7D1';
      case 'guess_action':
      case 'guessing': return '#FFA726';
      default: return '#666';
    }
  };

  // Lấy icon tương ứng với loại trò chơi
  // Coloring: color-palette, Puzzle: grid, Matching: link, Guess action: walk, các loại khác: game-controller
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'coloring': return 'color-palette';
      case 'puzzle': return 'grid';
      case 'matching': return 'link';
      case 'guess_action':
      case 'guessing': return 'walk';
      default: return 'game-controller';
    }
  };

  // Lấy tên hiển thị tiếng Việt tương ứng với loại trò chơi
  // Coloring: "Tô màu", Puzzle: "Xếp hình", Matching: "Ghép nối", Guess action: "Đoán hành động", các loại khác: "Trò chơi"
  const getTypeName = (type: string) => {
    switch (type) {
      case 'coloring': return 'Tô màu';
      case 'puzzle': return 'Xếp hình';
      case 'matching': return 'Ghép nối';
      case 'guess_action':
      case 'guessing': return 'Đoán hành động';
      default: return 'Trò chơi';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải danh sách trò chơi...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#E53E3E']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Quản lý trò chơi</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm trò chơi..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'coloring', 'puzzle', 'guess_action'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                selectedType === type && styles.filterButtonActive,
                { backgroundColor: selectedType === type ? getTypeColor(type) : '#f5f5f5' }
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Ionicons 
                name={getTypeIcon(type) as any} 
                size={16} 
                color={selectedType === type ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.filterButtonText,
                selectedType === type && styles.filterButtonTextActive
              ]}>
                {type === 'all' ? 'Tất cả' : getTypeName(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Admin chỉ xem danh sách, không tạo mới */}

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {games.map((game) => (
          <View key={game.id || (game as any)._id} style={styles.gameCard}>
            <View style={styles.gameInfo}>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(game.type) }]}>
                <Ionicons name={getTypeIcon(game.type) as any} size={20} color="#fff" />
              </View>
              <View style={styles.gameDetails}>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.gameType}>{getTypeName(game.type)}</Text>
                {game.description && (
                  <Text style={styles.gameDescription} numberOfLines={2}>
                    {game.description}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.gameActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditGame(game)}
              >
                <Ionicons name="create" size={20} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteGame(game.id || (game as any)._id)}
              >
                <Ionicons name="trash" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <GameModal
        visible={modalVisible}
        game={editingGame}
        onClose={() => setModalVisible(false)}
        onSave={loadGames}
      />

      <GameTypeSelection
        visible={gameTypeSelectionVisible}
        onClose={handleGameTypeSelectionClose}
        onSelectType={handleSelectGameType}
      />

      {/* Admin chỉ xem danh sách, không tạo mới */}
    </View>
  );
}

export function GameModal({ visible, game, onClose, onSave }: {
  visible: boolean;
  game: Game | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    description: '',
    estimatedTime: 5,
  });

  const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // State cho puzzle rows/cols
  const [puzzleRows, setPuzzleRows] = useState<number>(3);
  const [puzzleCols, setPuzzleCols] = useState<number>(3);
  
  const [guessingQuestions, setGuessingQuestions] = useState<Array<{
    id?: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    mediaUrl?: string;
    mediaType?: string;
  }>>([]);
  const [selectedMediaUris, setSelectedMediaUris] = useState<(string | null)[]>([]);

  useEffect(() => {
    if (game) {
      setFormData({
        title: game.title || '',
        level: game.level || 'beginner',
        description: game.description || '',
        estimatedTime: game.estimatedTime || 5,
      });
      
      let imageToShow: string | null = null;
      
      // Xử lý cho game Puzzle - lấy originalImage từ data
      if (game.type === 'puzzle' && game.data?.originalImage) {
        imageToShow = getFullImageUrl(game.data.originalImage) || null;
        // Load rows/cols từ data
        setPuzzleRows(game.data.rows || 3);
        setPuzzleCols(game.data.cols || 3);
      } else if (game.type === 'puzzle') {
        // Reset về mặc định nếu không có data
        setPuzzleRows(3);
        setPuzzleCols(3);
      } 
      // Xử lý cho game Coloring - lấy imageUrl hoặc outlineImage từ coloringData
      else if (game.type === 'coloring') {
        if (game.imageUrl) {
          imageToShow = getFullImageUrl(game.imageUrl) || null;
        } else if (game.data?.coloringData?.outlineImage) {
          imageToShow = getFullImageUrl(game.data.coloringData.outlineImage) || null;
        }
      }
      // Xử lý cho game Guessing - lấy thumbnail và questions
      else if (game.type === 'guess_action' || game.type === 'guessing') {
        // Lấy thumbnail (có thể là ảnh hoặc video/GIF)
        if (game.imageUrl) {
          imageToShow = getFullImageUrl(game.imageUrl) || null;
        }
        
        // Load questions
        if (game.data?.questions && Array.isArray(game.data.questions) && game.data.questions.length > 0) {
          const loadedQuestions = game.data.questions.map((q: any) => ({
            id: q.id || `question_${Date.now()}_${Math.random()}`,
            options: Array.isArray(q.options) && q.options.length >= 4 
              ? q.options 
              : (q.options && q.options.length < 4 
                  ? [...q.options, ...Array(4 - q.options.length).fill('')]
                  : ['', '', '', '']),
            correctAnswer: q.correctAnswer || q.dapAnDung || '',
            explanation: q.explanation || q.giaiThich || '',
            mediaUrl: q.mediaUrl || q.anhUrl || q.videoUrl,
            mediaType: q.mediaType || q.loaiMedia || 'image'
          }));
          setGuessingQuestions(loadedQuestions);
          setSelectedMediaUris(new Array(loadedQuestions.length).fill(null));
        } else {
          // Nếu không có questions, tạo một câu hỏi mặc định
          setGuessingQuestions([{
            options: ['', '', '', ''],
            correctAnswer: '',
            explanation: ''
          }]);
          setSelectedMediaUris([null]);
        }
      } 
      // Xử lý cho các game khác - lấy imageUrl
      else if (game.imageUrl) {
        imageToShow = getFullImageUrl(game.imageUrl) || null;
      }
      
      if (imageToShow) {
        setOriginalImageUri(imageToShow);
      } else {
        setOriginalImageUri(null);
      }
      setNewImageUri(null);
    } else {
      setFormData({
        title: '',
        level: 'beginner',
        description: '',
        estimatedTime: 5,
      });
      setOriginalImageUri(null);
      setNewImageUri(null);
      setGuessingQuestions([]);
      setSelectedMediaUris([]);
      setPuzzleRows(3);
      setPuzzleCols(3);
    }
  }, [game]);

  // Chọn ảnh/video mới cho trò chơi (thumbnail hoặc ảnh chính)
  // Quy trình:
  // 1. Kiểm tra quyền truy cập thư viện ảnh/video, nếu không có thì yêu cầu và hiển thị thông báo
  // 2. Xác định loại media được phép chọn dựa trên loại trò chơi:
  //    - Puzzle/Coloring: chỉ cho phép chọn ảnh (Images), cho phép chỉnh sửa, tỷ lệ 1:1
  //    - Guess action: cho phép chọn tất cả (ảnh/video/GIF), không cho phép chỉnh sửa, không giới hạn tỷ lệ
  // 3. Mở ImagePicker để người dùng chọn file
  // 4. Lưu URI của file đã chọn vào newImageUri để hiển thị preview và upload sau này
  const pickImage = async () => {
    try {
      if (!game) return;
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh/video để chọn file');
        return;
      }

      let mediaTypes: ImagePicker.MediaTypeOptions;
      let allowsEditing = true;
      let aspect: [number, number] | undefined = [1, 1];
      
      if (game.type === 'puzzle' || game.type === 'coloring') {
        mediaTypes = ImagePicker.MediaTypeOptions.Images;
      } else if (game.type === 'guess_action' || game.type === 'guessing') {
        mediaTypes = ImagePicker.MediaTypeOptions.All;
        allowsEditing = false;
        aspect = undefined;
      } else {
        mediaTypes = ImagePicker.MediaTypeOptions.Images;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing,
        aspect,
        quality: 1,
      });

      if (!result.canceled) {
        setNewImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh/video');
    }
  };

  // Chọn ảnh/video/GIF cho một câu hỏi cụ thể trong game Đoán hành động
  // Quy trình:
  // 1. Kiểm tra quyền truy cập thư viện, nếu không có thì yêu cầu
  // 2. Mở ImagePicker cho phép chọn tất cả loại media (ảnh/video/GIF)
  // 3. Lưu URI của file đã chọn vào selectedMediaUris tại vị trí questionIndex
  // 4. File này sẽ được upload khi lưu trò chơi và thay thế media cũ của câu hỏi
  const handleMediaPickerForQuestion = async (questionIndex: number) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh/video để chọn file');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const newUris = [...selectedMediaUris];
        newUris[questionIndex] = result.assets[0].uri;
        setSelectedMediaUris(newUris);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh/video');
    }
  };

  // Thêm câu hỏi mới vào danh sách câu hỏi của game Đoán hành động
  // Tạo câu hỏi mới với: 4 options rỗng, correctAnswer rỗng, explanation rỗng
  // Thêm null vào selectedMediaUris để đánh dấu chưa có media mới cho câu hỏi này
  const addGuessingQuestion = () => {
    setGuessingQuestions(prev => [...prev, {
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: ''
    }]);
    setSelectedMediaUris(prev => [...prev, null]);
  };

  // Xóa câu hỏi khỏi danh sách
  // Kiểm tra: phải có ít nhất 1 câu hỏi (không cho phép xóa hết)
  // Nếu hợp lệ: xóa câu hỏi tại index và xóa media URI tương ứng
  const removeGuessingQuestion = (index: number) => {
    if (guessingQuestions.length > 1) {
      setGuessingQuestions(prev => prev.filter((_, i) => i !== index));
      setSelectedMediaUris(prev => prev.filter((_, i) => i !== index));
    } else {
      Alert.alert('Lỗi', 'Cần ít nhất một câu hỏi');
    }
  };

  // Cập nhật một trường cụ thể của câu hỏi (options, correctAnswer, hoặc explanation)
  // Tìm câu hỏi tại index và cập nhật field tương ứng với value mới
  // Giữ nguyên các câu hỏi khác
  const updateGuessingQuestion = (index: number, field: 'options' | 'correctAnswer' | 'explanation', value: any) => {
    setGuessingQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  // Cập nhật một option cụ thể trong danh sách options của câu hỏi
  // Tìm câu hỏi tại questionIndex, tìm option tại optionIndex và thay thế bằng value mới
  // Giữ nguyên các option khác
  const updateGuessingOption = (questionIndex: number, optionIndex: number, value: string) => {
    setGuessingQuestions(prev => prev.map((q, i) => 
      i === questionIndex ? {
        ...q,
        options: q.options.map((opt, oi) => oi === optionIndex ? value : opt)
      } : q
    ));
  };

  // Upload ảnh cho game Puzzle (xếp hình)
  // Quy trình:
  // 1. Kiểm tra URI hợp lệ (phải bắt đầu bằng file://, http://, hoặc https://)
  // 2. Xác định MIME type và tên file dựa trên extension (.png, .jpg, .gif, .jpeg)
  // 3. Tạo FormData với: image file, rows=3, cols=3 (để cắt thành 9 mảnh)
  // 4. Gọi API uploadPuzzle để upload và xử lý ảnh (cắt thành các mảnh puzzle)
  // 5. Xử lý lỗi: kiểm tra network error, parse JSON error response, hoặc hiển thị error message từ server
  // 6. Trả về data chứa originalImage và danh sách pieces đã được cắt
  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      if (!uri || (!uri.startsWith('file://') && !uri.startsWith('http://') && !uri.startsWith('https://'))) {
        throw new Error('Invalid image URI format');
      }

      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      let mimeType = 'image/jpeg';
      let fileName = 'image.jpg';
      
      if (fileExtension === 'png') {
        mimeType = 'image/png';
        fileName = 'image.png';
      } else if (fileExtension === 'gif') {
        mimeType = 'image/gif';
        fileName = 'image.gif';
      } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
        mimeType = 'image/jpeg';
        fileName = `image.${fileExtension}`;
      } else {
        mimeType = `image/${fileExtension}`;
        fileName = `image.${fileExtension}`;
      }

      const formData = new FormData();
      const fileData = {
        uri,
        type: mimeType,
        name: fileName,
      } as any;
      
      formData.append('image', fileData);
      formData.append('rows', puzzleRows.toString());
      formData.append('cols', puzzleCols.toString());
      
      let response;
      try {
        response = await api.games.uploadPuzzle(formData);
      } catch (fetchError: any) {
        if (fetchError?.message === 'Network request failed') {
          throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang chạy.');
        }
        throw fetchError;
      }
      
      if (!response.ok) {
        let errorMessage = `Upload failed (${response.status || 'unknown'})`;
        try {
          const contentType = response.headers?.get?.('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            try {
              await response.text();
            } catch (textError) {
            }
          }
        } catch (parseError) {
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      return result.data;
    } catch (error: any) {
      if (error.message === 'Network request failed') {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      }
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Upload media (ảnh/video/GIF) cho các loại game khác
  // Quy trình:
  // 1. Kiểm tra URI hợp lệ
  // 2. Xác định MIME type dựa trên extension (.mp4, .mov, .gif, .png, .jpg, .jpeg)
  // 3. Nếu gameType là guess_action/guessing/coloring: sử dụng uploadGuess (chỉ upload file, không xử lý)
  // 4. Nếu gameType khác: sử dụng uploadPuzzle (cắt thành pieces)
  // 5. Xử lý lỗi và trả về filename hoặc data tương ứng
  const uploadMedia = async (uri: string, gameType: string) => {
    setUploading(true);
    try {
      if (!uri || (!uri.startsWith('file://') && !uri.startsWith('http://') && !uri.startsWith('https://'))) {
        throw new Error('Invalid media URI format');
      }

      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      let mimeType = 'image/jpeg';
      let fileName = 'media.jpg';
      
      if (fileExtension === 'mp4' || fileExtension === 'mov') {
        mimeType = 'video/mp4';
        fileName = `media.${fileExtension}`;
      } else if (fileExtension === 'gif') {
        mimeType = 'image/gif';
        fileName = 'media.gif';
      } else if (fileExtension === 'png') {
        mimeType = 'image/png';
        fileName = 'media.png';
      } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
        mimeType = 'image/jpeg';
        fileName = `media.${fileExtension}`;
      } else {
        mimeType = `image/${fileExtension}`;
        fileName = `media.${fileExtension}`;
      }

      const formData = new FormData();
      
      if (gameType === 'guess_action' || gameType === 'guessing' || gameType === 'coloring') {
        const fileData = {
          uri,
          type: mimeType,
          name: fileName
        } as any;
        
        formData.append('image', fileData);
        
        let response;
        try {
          response = await api.games.uploadGuess(formData);
        } catch (fetchError: any) {
          if (fetchError?.message === 'Network request failed') {
            throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang chạy.');
          }
          throw fetchError;
        }
        
        if (!response.ok) {
          let errorMessage = `Upload failed (${response.status || 'unknown'})`;
          try {
            const contentType = response.headers?.get?.('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } else {
              try {
                await response.text();
              } catch (textError) {
              }
            }
          } catch (parseError) {
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Upload failed');
        }
        
        return { 
          imageUrl: result.data?.filename || result.data?.imageUrl || fileName,
          filename: result.data?.filename || result.data?.imageUrl || fileName
        };
      } else {
      formData.append('image', {
        uri,
          type: mimeType,
          name: fileName
      } as any);
      formData.append('rows', '3');
      formData.append('cols', '3');

      const response = await api.games.uploadPuzzle(formData);
        
        if (!response.ok) {
          let errorMessage = `Upload failed (${response.status || 'unknown'})`;
          try {
            const contentType = response.headers?.get?.('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } else {
              try {
                await response.text();
              } catch (textError) {
              }
            }
          } catch (parseError) {
          }
          throw new Error(errorMessage);
        }
        
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      return result.data;
      }
    } catch (error: any) {
      if (error.message === 'Network request failed') {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      }
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Lưu trò chơi (chỉ hỗ trợ cập nhật, không hỗ trợ tạo mới từ form này)
  // Quy trình:
  // 1. Kiểm tra game tồn tại, nếu không thì báo lỗi
  // 2. Tạo gameData từ formData (title, level, description, estimatedTime)
  // 3. Nếu có ảnh/video mới (newImageUri):
  //    - Puzzle: upload và cắt thành pieces, cập nhật originalImage và pieces
  //    - Coloring: upload ảnh trực tiếp, cập nhật imageUrl và outlineImage trong coloringData
  //    - Guess action: upload thumbnail, cập nhật imageUrl
  //    - Guess image/number: upload ảnh, cập nhật imageUrl trong data
  // 4. Nếu không có ảnh mới: giữ nguyên data hiện tại
  // 5. Với game Đoán hành động:
  //    - Validate: phải có ít nhất 1 câu hỏi, mỗi câu hỏi phải có đủ 4 options và correctAnswer hợp lệ
  //    - Upload media mới cho các câu hỏi có selectedMediaUris (xác định mediaType từ extension)
  //    - Cập nhật danh sách questions với media mới
  //    - Nếu chưa có thumbnail: dùng media của câu hỏi đầu tiên làm thumbnail
  // 6. Chuẩn hóa originalImage path (loại bỏ domain, chỉ giữ filename)
  // 7. Gọi API update để lưu trò chơi
  // 8. Xử lý lỗi và hiển thị thông báo thành công/thất bại
  const handleSave = async () => {
    try {
      if (!game) {
        Alert.alert('Lỗi', 'Không thể tạo game từ form này. Vui lòng sử dụng form tạo game.');
        return;
      }

      let gameData: any = { ...formData };
      
      // Xử lý Puzzle
      if (game.type === 'puzzle') {
        if (newImageUri) {
          // Có ảnh mới, upload với rows/cols mới
          const uploadResult = await uploadImage(newImageUri);
          gameData.data = {
            ...(game.data || {}),
            originalImage: uploadResult.originalImage,
            pieces: uploadResult.pieces,
            rows: puzzleRows,
            cols: puzzleCols
          };
        } else {
          // Không có ảnh mới
          const rowsChanged = game.data?.rows !== puzzleRows;
          const colsChanged = game.data?.cols !== puzzleCols;
          
          if (rowsChanged || colsChanged) {
            // Nếu thay đổi rows/cols, cần upload lại ảnh cũ
            const originalImageUrl = game.data?.originalImage;
            if (originalImageUrl) {
              const fullImageUrl = getFullImageUrl(originalImageUrl);
              if (fullImageUrl && (fullImageUrl.startsWith('http://') || fullImageUrl.startsWith('https://'))) {
                // Nếu là URL từ server, cần download về trước (phức tạp)
                // Tạm thời chỉ cập nhật rows/cols, backend sẽ xử lý
                Alert.alert(
                  'Lưu ý', 
                  'Đã thay đổi số mảnh ghép. Vui lòng upload lại ảnh để áp dụng thay đổi, hoặc backend sẽ tự động cắt lại ảnh.'
                );
              }
              // Upload lại ảnh cũ với rows/cols mới
              try {
                const uploadResult = await uploadImage(fullImageUrl || originalImageUrl);
                gameData.data = {
                  ...(game.data || {}),
                  originalImage: uploadResult.originalImage,
                  pieces: uploadResult.pieces,
                  rows: puzzleRows,
                  cols: puzzleCols
                };
              } catch (error) {
                // Nếu không upload được (ví dụ URL không hợp lệ), chỉ cập nhật rows/cols
                gameData.data = {
                  ...(game.data || {}),
                  rows: puzzleRows,
                  cols: puzzleCols
                };
              }
            } else {
              // Không có ảnh, chỉ cập nhật rows/cols
              gameData.data = {
                ...(game.data || {}),
                rows: puzzleRows,
                cols: puzzleCols
              };
            }
          } else {
            // Không thay đổi gì, giữ nguyên
            gameData.data = game.data || {};
          }
        }
      } else if (newImageUri) {
        if (game.type === 'coloring') {
          const uploadResult = await uploadMedia(newImageUri, 'coloring');
          const filename = uploadResult.imageUrl || uploadResult.filename;
          gameData.imageUrl = filename;
          if (game.data) {
        gameData.data = {
              ...game.data,
              coloringData: {
                ...(game.data.coloringData || {}),
                outlineImage: filename
              }
            };
          } else {
            gameData.data = {
              coloringData: {
                outlineImage: filename,
                suggestedColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
                colorAreas: []
              }
            };
          }
        } else if (game.type === 'guess_action' || game.type === 'guessing') {
          const uploadResult = await uploadMedia(newImageUri, game.type);
          gameData.imageUrl = uploadResult.imageUrl || uploadResult.originalImage;
        } else if (game.type === 'guess_image' || game.type === 'guess_number') {
          const uploadResult = await uploadImage(newImageUri);
          gameData.data = {
            ...(game.data || {}),
          imageUrl: uploadResult.imageUrl,
            questions: game.data?.questions || []
          };
        }
      } else {
        // Với các game khác (không phải puzzle), giữ nguyên data
        if (game.data) {
          // Puzzle đã được xử lý ở trên, chỉ xử lý các game khác
          if (game.type === 'coloring' || game.type === 'guess_action' || game.type === 'guessing' || 
              game.type === 'matching' || game.type === 'memory' || game.type === 'quiz' ||
              game.type === 'guess_image' || game.type === 'guess_number') {
            gameData.data = game.data;
          }
        }
      }

      if (game.type === 'guess_action' || game.type === 'guessing') {
        if (guessingQuestions.length === 0) {
          Alert.alert('Lỗi', 'Cần ít nhất một câu hỏi');
          return;
        }

        const allQuestionsValid = guessingQuestions.every(q => 
          q.options.every(opt => opt.trim()) && 
          q.correctAnswer.trim() &&
          q.options.includes(q.correctAnswer)
        );
        if (!allQuestionsValid) {
          Alert.alert('Lỗi', 'Vui lòng điền đầy đủ 4 đáp án và chọn đáp án đúng cho mỗi câu hỏi');
          return;
        }

        const updatedQuestions = await Promise.all(
          guessingQuestions.map(async (question, index) => {
            let mediaUrl = question.mediaUrl;
            let mediaType = question.mediaType || 'image';

            if (selectedMediaUris[index]) {
              const uploadResult = await uploadMedia(selectedMediaUris[index]!, game.type);
              mediaUrl = uploadResult.imageUrl || uploadResult.filename;
              
              const uri = selectedMediaUris[index]!.toLowerCase();
              if (uri.endsWith('.mp4') || uri.endsWith('.mov')) {
                mediaType = 'video';
              } else if (uri.endsWith('.gif')) {
                mediaType = 'gif';
              } else {
                mediaType = 'image';
              }
            }

            return {
              id: question.id || `question_${index}`,
              mediaUrl: mediaUrl,
              mediaType: mediaType,
              imageUrl: mediaType === 'image' ? mediaUrl : null,
              options: question.options,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation || ''
            };
          })
        );

        gameData.data = {
          ...(game.data || {}),
          questions: updatedQuestions
        };

        if (!gameData.imageUrl && updatedQuestions.length > 0 && updatedQuestions[0].mediaUrl) {
          gameData.imageUrl = updatedQuestions[0].mediaUrl;
        }
      }


      if (gameData.data?.originalImage) {
        const originalImage = gameData.data.originalImage;
        if (originalImage.includes('/uploads/games/')) {
          gameData.data.originalImage = originalImage.replace(/^.*\/uploads\/games\//, '');
        } else if (originalImage.startsWith('/uploads/games/')) {
          gameData.data.originalImage = originalImage.replace(/^\/uploads\/games\//, '');
        } else if (originalImage.startsWith('uploads/games/')) {
          gameData.data.originalImage = originalImage.replace(/^uploads\/games\//, '');
        } else if (originalImage.startsWith('http://') || originalImage.startsWith('https://')) {
          try {
            const url = new URL(originalImage);
            const pathMatch = url.pathname.match(/\/uploads\/games\/(.+)$/);
            if (pathMatch) {
              gameData.data.originalImage = pathMatch[1];
            }
          } catch (e) {
          }
        }
      }

        const gameId = game.id || (game as any)._id;
      const response = await api.games.update(gameId, gameData);
      
      if (!response.ok) {
        let errorMessage = `Lỗi ${response.status || 'unknown'}: ${response.statusText || 'Unknown error'}`;
        try {
          const contentType = response.headers?.get?.('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
      } else {
            if (response.text && typeof response.text === 'function') {
              try {
                await response.text();
                errorMessage = `Lỗi server (${response.status || 'unknown'})`;
              } catch (textError) {
                errorMessage = `Lỗi server (${response.status || 'unknown'})`;
              }
            } else {
              errorMessage = `Lỗi server (${response.status || 'unknown'})`;
            }
          }
        } catch (parseError) {
          errorMessage = `Lỗi khi cập nhật game (${response.status || 'unknown'})`;
        }
        throw new Error(errorMessage);
      }
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Không thể đọc phản hồi từ server');
      }
      
      onSave();
      onClose();
      Alert.alert('Thành công', 'Đã cập nhật trò chơi');
    } catch (error: any) {
      Alert.alert('Lỗi', `Không thể lưu trò chơi: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Chỉnh sửa trò chơi
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên trò chơi *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Nhập tên trò chơi"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mức độ *</Text>
            <View style={styles.levelSelector}>
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelOption,
                    formData.level === level && styles.levelOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, level: level as any })}
                >
                  <Text style={[
                    styles.levelOptionText,
                    formData.level === level && styles.levelOptionTextActive
                  ]}>
                    {level === 'beginner' ? 'Cơ bản' :
                     level === 'intermediate' ? 'Trung bình' : 'Nâng cao'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Nhập mô tả trò chơi"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {game && (game.type === 'guess_action' || game.type === 'guessing') 
                ? 'Video/GIF' 
                : 'Ảnh'}
            </Text>
            
            {originalImageUri && (
              <View style={styles.originalMediaContainer}>
                {game && (game.type === 'guess_action' || game.type === 'guessing') && 
                 (originalImageUri.toLowerCase().endsWith('.mp4') || 
                  originalImageUri.toLowerCase().endsWith('.mov')) ? (
                  <Video
                    source={{ uri: originalImageUri }}
                    style={styles.previewImage}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={false}
                    isLooping={false}
                  />
                ) : (
                  <Image 
                    source={{ uri: originalImageUri }} 
                    style={styles.previewImage}
                    resizeMode="contain"
                    onError={() => {
                    }}
                  />
                )}
                <Text style={styles.originalMediaLabel}>
                  {game && (game.type === 'guess_action' || game.type === 'guessing') 
                    ? 'Thumbnail hiện tại' 
                    : game && game.type === 'puzzle'
                      ? `Ảnh hiện tại (${puzzleRows}x${puzzleCols} mảnh)`
                      : game && game.type === 'coloring'
                      ? 'Ảnh outline hiện tại'
                      : 'Ảnh hiện tại'}
                </Text>
              </View>
            )}
            
            {/* UI chọn số mảnh ghép cho Puzzle */}
            {game && game.type === 'puzzle' && (
              <View style={styles.puzzleConfigContainer}>
                <Text style={styles.inputLabel}>Số mảnh ghép</Text>
                <View style={styles.puzzleConfigRow}>
                  <View style={styles.puzzleConfigItem}>
                    <Text style={styles.puzzleConfigLabel}>Hàng (Rows)</Text>
                    <View style={styles.puzzleConfigButtons}>
                      {[2, 3, 4, 5].map((num) => (
                        <TouchableOpacity
                          key={`row-${num}`}
                          style={[
                            styles.puzzleConfigButton,
                            puzzleRows === num && styles.puzzleConfigButtonActive
                          ]}
                          onPress={() => setPuzzleRows(num)}
                        >
                          <Text style={[
                            styles.puzzleConfigButtonText,
                            puzzleRows === num && styles.puzzleConfigButtonTextActive
                          ]}>
                            {num}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.puzzleConfigItem}>
                    <Text style={styles.puzzleConfigLabel}>Cột (Cols)</Text>
                    <View style={styles.puzzleConfigButtons}>
                      {[2, 3, 4, 5].map((num) => (
                        <TouchableOpacity
                          key={`col-${num}`}
                          style={[
                            styles.puzzleConfigButton,
                            puzzleCols === num && styles.puzzleConfigButtonActive
                          ]}
                          onPress={() => setPuzzleCols(num)}
                        >
                          <Text style={[
                            styles.puzzleConfigButtonText,
                            puzzleCols === num && styles.puzzleConfigButtonTextActive
                          ]}>
                            {num}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.puzzleConfigHint}>
                  Tổng số mảnh: {puzzleRows * puzzleCols} mảnh
                  {((game.data?.rows !== puzzleRows) || (game.data?.cols !== puzzleCols)) && 
                   !newImageUri && 
                   ' (Sẽ cắt lại ảnh hiện tại với số mảnh mới khi lưu)'}
                  {newImageUri && ' (Sẽ áp dụng khi upload ảnh mới)'}
                </Text>
              </View>
            )}
            
            {game && (game.type === 'guess_action' || game.type === 'guessing') && (
              <View style={styles.questionsSection}>
                <Text style={styles.sectionTitle}>Câu hỏi đoán hành động ({guessingQuestions.length})</Text>
                {guessingQuestions.map((question, qIndex) => {
                  const mediaUri = selectedMediaUris[qIndex] || (question.mediaUrl ? getFullImageUrl(question.mediaUrl) : null);
                  const hasNewMedia = !!selectedMediaUris[qIndex];
                  
                  // Xác định mediaType
                  let mediaType = question.mediaType || 'image';
                  if (mediaUri) {
                    if (hasNewMedia) {
                      // Nếu có media mới, xác định từ URI
                      const uri = mediaUri.toLowerCase();
                      if (uri.endsWith('.mp4') || uri.endsWith('.mov')) {
                        mediaType = 'video';
                      } else if (uri.endsWith('.gif')) {
                        mediaType = 'gif';
                      } else {
                        mediaType = 'image';
                      }
                    } else if (question.mediaUrl) {
                      // Nếu không có media mới, xác định từ URL cũ
                      const url = question.mediaUrl.toLowerCase();
                      if (url.endsWith('.mp4') || url.endsWith('.mov')) {
                        mediaType = 'video';
                      } else if (url.endsWith('.gif')) {
                        mediaType = 'gif';
                      } else if (!question.mediaType || question.mediaType === 'image') {
                        mediaType = 'image';
                      }
                    }
                  }
                  
                  const isVideo = mediaType === 'video';
                  const isGif = mediaType === 'gif';
                  
                  return (
                    <View key={qIndex} style={styles.questionCard}>
                      <View style={styles.questionHeader}>
                        <Text style={styles.questionNumber}>Câu {qIndex + 1}</Text>
                        {guessingQuestions.length > 1 && (
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeGuessingQuestion(qIndex)}
                          >
                            <Ionicons name="trash" size={20} color="#F44336" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={styles.label}>Hình ảnh/Video/GIF</Text>
                      {mediaUri ? (
                        <>
                          {isVideo ? (
                            <View style={styles.videoContainer}>
                              <Video
                                source={{ uri: mediaUri }}
                                style={styles.videoPlayer}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay={false}
                                isLooping={false}
                              />
                            </View>
                          ) : (
                            <View style={styles.imageContainer}>
                              <Image 
                                source={{ uri: mediaUri }} 
                                style={styles.selectedImage}
                                resizeMode="contain"
                              />
                              {isGif && (
                                <View style={styles.gifBadge}>
                                  <Text style={styles.gifBadgeText}>GIF</Text>
                                </View>
                              )}
                            </View>
                          )}
                          <TouchableOpacity
                            style={styles.changeMediaButton}
                            onPress={() => handleMediaPickerForQuestion(qIndex)}
                          >
                            <Ionicons name="refresh" size={16} color="#2196F3" />
                            <Text style={styles.changeMediaText}>
                              {selectedMediaUris[qIndex] ? 'Thay đổi media' : 'Chọn media mới'}
                            </Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity 
                          style={styles.imageButton} 
                          onPress={() => handleMediaPickerForQuestion(qIndex)}
                          activeOpacity={0.8}
                        >
                <View style={styles.imagePlaceholder}>
                            <Ionicons name="images" size={40} color="#ccc" />
                            <Text style={styles.imagePlaceholderText}>Chọn ảnh/video/gif</Text>
                </View>
                        </TouchableOpacity>
                      )}

                      <Text style={styles.label}>4 Đáp án (chọn 1 đáp án đúng)</Text>
                      {question.options.map((option, oIndex) => (
                        <View key={oIndex} style={styles.optionRow}>
                          <TouchableOpacity
                            style={[
                              styles.radioButton,
                              question.correctAnswer === option && styles.radioButtonSelected
                            ]}
                            onPress={() => updateGuessingQuestion(qIndex, 'correctAnswer', option)}
                          >
                            {question.correctAnswer === option && (
                              <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </TouchableOpacity>
                          <TextInput
                            style={styles.optionInput}
                            placeholder={`Đáp án ${oIndex + 1}`}
                            value={option}
                            onChangeText={(text) => {
                              updateGuessingOption(qIndex, oIndex, text);
                              if (question.correctAnswer === option) {
                                updateGuessingQuestion(qIndex, 'correctAnswer', text);
                              }
                            }}
                          />
                        </View>
                      ))}

                      <Text style={styles.label}>Giải thích</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Giải thích cho đáp án đúng..."
                        value={question.explanation}
                        onChangeText={(text) => updateGuessingQuestion(qIndex, 'explanation', text)}
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  );
                })}
                <TouchableOpacity style={styles.addButton} onPress={addGuessingQuestion}>
                  <Ionicons name="add" size={20} color="#4CAF50" />
                  <Text style={styles.addButtonText}>Thêm câu hỏi</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {newImageUri && (
              <View style={styles.newMediaContainer}>
                <Image source={{ uri: newImageUri }} style={styles.previewImage} />
                <Text style={styles.newMediaLabel}>
                  {game && (game.type === 'guess_action' || game.type === 'guessing') 
                    ? 'Video/GIF mới (sẽ thay thế video/GIF hiện tại khi lưu)' 
                    : 'Ảnh mới (sẽ thay thế ảnh hiện tại khi lưu)'}
                </Text>
                <View style={styles.newImageActions}>
                  <TouchableOpacity 
                    style={styles.changeImageButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="refresh" size={20} color="#2196F3" />
                    <Text style={styles.changeImageText}>Chọn lại</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setNewImageUri(null)}
                  >
                    <Ionicons name="close-circle" size={20} color="#F44336" />
                    <Text style={styles.removeImageText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.imagePicker, newImageUri && styles.imagePickerWithNew]} 
              onPress={pickImage}
            >
              {!newImageUri ? (
                <View style={styles.imagePlaceholder}>
                  <Ionicons 
                    name={game && (game.type === 'guess_action' || game.type === 'guessing') 
                      ? 'videocam' 
                      : 'camera'} 
                    size={40} 
                    color="#666" 
                  />
                  <Text style={styles.imagePlaceholderText}>
                    {game && (game.type === 'guess_action' || game.type === 'guessing') 
                      ? 'Chọn video/GIF mới' 
                      : 'Chọn ảnh mới'}
                  </Text>
                  {game && (game.type === 'puzzle' || game.type === 'coloring') && (
                    <Text style={styles.mediaTypeHint}>Chỉ chọn ảnh</Text>
                  )}
                  {game && (game.type === 'guess_action' || game.type === 'guessing') && (
                    <Text style={styles.mediaTypeHint}>Chọn video hoặc GIF</Text>
                  )}
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons 
                    name={game && (game.type === 'guess_action' || game.type === 'guessing') 
                      ? 'videocam' 
                      : 'camera'} 
                    size={30} 
                    color="#2196F3" 
                  />
                  <Text style={[styles.imagePlaceholderText, { color: '#2196F3', marginTop: 4 }]}>
                    Chọn ảnh/video khác
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Thời gian ước tính (phút)</Text>
            <TextInput
              style={styles.input}
              value={formData.estimatedTime.toString()}
              onChangeText={(text) => setFormData({ ...formData, estimatedTime: parseInt(text) || 5 })}
              placeholder="5"
              keyboardType="numeric"
            />
          </View>

        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveButton, uploading && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Lưu</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'puzzle': return 'grid';
    case 'coloring': return 'color-palette';
    case 'matching': return 'link';
    case 'memory': return 'flash';
    case 'quiz': return 'help-circle';
    case 'guess_image': return 'image';
    case 'guess_number': return 'calculator';
    case 'guess_action':
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
    case 'guess_action':
    case 'guessing': return 'Đoán hành động';
    default: return 'Trò chơi';
  }
};

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
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterButtonActive: {
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
    padding: 20,
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gameDetails: {
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
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  gameActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
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
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 8,
    minWidth: 100,
  },
  typeOptionActive: {
    backgroundColor: '#FF6B6B',
  },
  typeOptionText: {
    fontSize: 12,
    color: '#666',
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  categoryOptionActive: {
    backgroundColor: '#4CAF50',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#666',
  },
  categoryOptionTextActive: {
    color: '#fff',
  },
  levelSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  levelOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  levelOptionActive: {
    backgroundColor: '#2196F3',
  },
  levelOptionText: {
    fontSize: 14,
    color: '#666',
  },
  levelOptionTextActive: {
    color: '#fff',
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  imagePickerWithNew: {
    borderColor: '#2196F3',
    borderStyle: 'solid',
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  mediaTypeHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  originalMediaContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 220,
  },
  originalMediaLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  newMediaContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    minHeight: 220,
  },
  newMediaLabel: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  newImageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  changeImageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  changeImageText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 6,
    fontWeight: '600',
  },
  removeImageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  removeImageText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 6,
    fontWeight: '600',
  },
  questionsSection: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  questionMediaContainer: {
    marginBottom: 10,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionMediaImage: {
    width: '100%',
    height: 150,
    borderRadius: 6,
  },
  mediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mediaLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  questionInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  imageButton: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  changeMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
    marginBottom: 12,
    gap: 6,
  },
  changeMediaText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  radioButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  ageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ageInput: {
    flex: 1,
  },
  ageSeparator: {
    fontSize: 18,
    color: '#666',
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
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  createGameContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  createGameButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createGameGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  createGameButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  puzzleConfigContainer: {
    marginTop: 15,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  puzzleConfigRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  puzzleConfigItem: {
    flex: 1,
  },
  puzzleConfigLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  puzzleConfigButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  puzzleConfigButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  puzzleConfigButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  puzzleConfigButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  puzzleConfigButtonTextActive: {
    color: '#fff',
  },
  puzzleConfigHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  gifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  gifBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
