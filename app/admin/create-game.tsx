import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Image,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

interface CreateGameProps {
  gameType: 'coloring' | 'puzzle' | 'guessing';
  onClose: () => void;
  onSuccess: () => void;
  classId?: string; // Optional: nếu có thì tạo game trong lớp
  visible?: boolean; // Optional: điều khiển việc hiển thị Modal
}

export default function CreateGame({ gameType, onClose, onSuccess, classId, visible = true }: CreateGameProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimatedTime: 10
  });
  
  const [coloringData, setColoringData] = useState({
    suggestedColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
  });
  
  const [puzzleData, setPuzzleData] = useState({
    rows: 3,
    cols: 3
  });
  
  
  const [guessingData, setGuessingData] = useState({
    questions: [{
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: ''
    }]
  });
  
  const [selectedImages, setSelectedImages] = useState<(string | null)[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Chọn ảnh từ thư viện thiết bị
  // Quy trình:
  // 1. Yêu cầu quyền truy cập thư viện ảnh, nếu không được cấp thì hiển thị thông báo và dừng
  // 2. Mở ImagePicker với cấu hình: chỉ cho phép chọn ảnh, cho phép chỉnh sửa, tỷ lệ 1:1, chất lượng 0.8
  // 3. Lưu URI của ảnh đã chọn vào selectedImage để hiển thị preview và upload sau này
  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  // Xử lý submit form tạo trò chơi
  // Quy trình:
  // 1. Validate: kiểm tra title không rỗng, và ảnh đã chọn (trừ game guessing)
  // 2. Với game guessing: validate số lượng câu hỏi, số lượng ảnh/video phải khớp, và tất cả câu hỏi hợp lệ
  // 3. Gọi hàm tạo game tương ứng dựa trên gameType (createColoringGame, createPuzzleGame, hoặc createGuessingGame)
  // 4. Hiển thị loading indicator trong quá trình tạo
  // 5. Xử lý lỗi và hiển thị thông báo
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên game');
      return;
    }

    if (gameType !== 'guessing' && !selectedImage) {
      Alert.alert('Lỗi', 'Vui lòng chọn ảnh');
      return;
    }

    if (gameType === 'guessing') {
      if (guessingData.questions.length === 0) {
        Alert.alert('Lỗi', 'Vui lòng thêm ít nhất một câu hỏi');
        return;
      }
      if (selectedImages.length !== guessingData.questions.length) {
        Alert.alert('Lỗi', `Số lượng ảnh/video phải khớp với số lượng câu hỏi (${guessingData.questions.length})`);
        return;
      }
      const allQuestionsValid = guessingData.questions.every(q => 
        q.options.every(opt => opt.trim()) && 
        q.correctAnswer.trim() &&
        q.options.includes(q.correctAnswer)
      );
      if (!allQuestionsValid) {
        Alert.alert('Lỗi', 'Vui lòng điền đầy đủ 4 đáp án và chọn đáp án đúng cho mỗi câu hỏi');
        return;
      }
    }

    setLoading(true);
    try {
      if (gameType === 'coloring') {
        await createColoringGame();
      } else if (gameType === 'puzzle') {
        await createPuzzleGame();
      } else if (gameType === 'guessing') {
        await createGuessingGame();
      }
    } catch (error) {
      console.error('Error creating game:', error);
      Alert.alert('Lỗi', 'Không thể tạo game');
    } finally {
      setLoading(false);
    }
  };

  // Tạo game Tô màu
  // Quy trình:
  // 1. Tạo FormData với: title, description, level, estimatedTime, và danh sách suggestedColors (JSON string)
  // 2. Nếu có ảnh đã chọn: thêm outlineImage vào FormData (file ảnh với type image/jpeg)
  // 3. Gọi API createColoring để tạo game trên server
  // 4. Kiểm tra response.ok, nếu thành công thì hiển thị thông báo và gọi onSuccess()
  // 5. Nếu lỗi: parse error message từ response và hiển thị thông báo lỗi
  const createColoringGame = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('level', formData.level);
    formDataToSend.append('estimatedTime', formData.estimatedTime.toString());
    formDataToSend.append('suggestedColors', JSON.stringify(coloringData.suggestedColors));
    
    if (selectedImage) {
      formDataToSend.append('outlineImage', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'outline.jpg'
      } as any);
    }

    let response;
    if (classId) {
      let uploadedFilename: string | null = null;

      if (selectedImage) {
        try {
          const uploadForm = new FormData();
          uploadForm.append('image', {
            uri: selectedImage,
            type: 'image/jpeg',
            name: 'outline.jpg'
          } as any);

          const uploadResponse = await api.games.uploadGuess(uploadForm) as any;

          if (uploadResponse && uploadResponse.ok) {
            const uploadJson = await uploadResponse.json();
            uploadedFilename = uploadJson.data?.filename || uploadJson.data?.imageUrl || null;
          } else {
            try {
              const errorJson = await uploadResponse.json();
              console.error('Upload coloring image error:', errorJson);
            } catch (e) {
            }
          }
        } catch (e) {
          console.error('Upload coloring image exception:', e);
        }
      }

      const gameData = {
        ma: `toMau_${Date.now()}`,
        loai: 'toMau',
        tieuDe: formData.title,
        moTa: formData.description,
        danhMuc: 'chuCai',
        capDo: formData.level === 'beginner' ? 'coBan' : formData.level === 'intermediate' ? 'trungBinh' : 'nangCao',
        duLieu: {
          duLieuToMau: {
            mauGợiY: coloringData.suggestedColors,
            ...(uploadedFilename ? { anhVien: uploadedFilename } : {})
          }
        },
        ...(uploadedFilename ? { anhDaiDien: uploadedFilename } : {})
      };
      response = await api.classes.createGame(classId, gameData);
      if (response && response.success) {
        Alert.alert('Thành công', 'Game tô màu đã được tạo!');
        onSuccess();
        return;
      }
    } else {
      // Admin tạo game (giữ nguyên logic cũ)
      response = await api.games.createColoring(formDataToSend) as any;
      console.log('Coloring game response:', response);
      if (response && response.ok) {
        Alert.alert('Thành công', 'Game tô màu đã được tạo!');
        onSuccess();
        return;
      }
    }
    console.error('Failed to create coloring game:', response);
    throw new Error('Failed to create coloring game');
  };

  // Tạo game Xếp hình
  // Quy trình:
  // 1. Tạo FormData với: title, description, level, estimatedTime, rows, và cols
  // 2. Nếu có ảnh đã chọn: thêm originalImage vào FormData (file ảnh với type image/jpeg)
  // 3. Gọi API createPuzzle để tạo game và cắt ảnh thành các mảnh puzzle trên server
  // 4. Kiểm tra response.ok, nếu thành công thì hiển thị thông báo và gọi onSuccess()
  // 5. Nếu lỗi: hiển thị thông báo lỗi
  const createPuzzleGame = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('level', formData.level);
    formDataToSend.append('estimatedTime', formData.estimatedTime.toString());
    formDataToSend.append('rows', puzzleData.rows.toString());
    formDataToSend.append('cols', puzzleData.cols.toString());
    
    if (selectedImage) {
      formDataToSend.append('originalImage', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'original.jpg'
      } as any);
    }

    let response;
    if (classId) {
      let uploadData: any = null;

      if (selectedImage) {
        try {
          const uploadForm = new FormData();
          uploadForm.append('image', {
            uri: selectedImage,
            type: 'image/jpeg',
            name: 'original.jpg'
          } as any);

          const uploadResponse = await api.games.uploadPuzzle(uploadForm) as any;

          if (uploadResponse && uploadResponse.ok) {
            const uploadJson = await uploadResponse.json();
            uploadData = uploadJson.data || null;
          } else {
            try {
              const errorJson = await uploadResponse.json();
              console.error('Upload puzzle image error:', errorJson);
            } catch (e) {
            }
          }
        } catch (e) {
          console.error('Upload puzzle image exception:', e);
        }
      }

      const gameData: any = {
        ma: `xepHinh_${Date.now()}`,
        loai: 'xepHinh',
        tieuDe: formData.title,
        moTa: formData.description,
        danhMuc: 'chuCai',
        capDo: formData.level === 'beginner' ? 'coBan' : formData.level === 'intermediate' ? 'trungBinh' : 'nangCao',
        duLieu: {
          hang: uploadData?.rows || puzzleData.rows,
          cot: uploadData?.cols || puzzleData.cols,
          ...(uploadData?.originalImage ? { anhGoc: uploadData.originalImage } : {}),
          ...(uploadData?.pieces ? { manh: uploadData.pieces } : {})
        }
      };

      if (uploadData?.originalImage) {
        gameData.anhDaiDien = uploadData.originalImage;
      }

      response = await api.classes.createGame(classId, gameData);
      if (response && response.success) {
        Alert.alert('Thành công', 'Game xếp hình đã được tạo!');
        onSuccess();
        return;
      }
    } else {
      // Admin tạo game (giữ nguyên logic cũ)
      response = await api.games.createPuzzle(formDataToSend) as any;
      console.log('Puzzle game response:', response);
      if (response && response.ok) {
        Alert.alert('Thành công', 'Game xếp hình đã được tạo!');
        onSuccess();
        return;
      }
    }
    console.error('Failed to create puzzle game:', response);
    throw new Error('Failed to create puzzle game');
  };

  // Tạo game Đoán hành động
  // Quy trình:
  // 1. Tạo FormData với: title, description, level, estimatedTime, và danh sách questions (JSON string)
  // 2. Với mỗi ảnh/video/GIF trong selectedImages: xác định MIME type từ extension và thêm vào FormData
  // 3. Gọi API createGuessing để tạo game trên server
  // 4. Parse JSON response, kiểm tra success, nếu thành công thì hiển thị thông báo và gọi onSuccess()
  // 5. Nếu lỗi: parse error message từ response và hiển thị thông báo lỗi chi tiết
  const createGuessingGame = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('level', formData.level);
    formDataToSend.append('estimatedTime', formData.estimatedTime.toString());
    
    const questionsData = guessingData.questions.map(q => ({
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ''
    }));
    formDataToSend.append('questions', JSON.stringify(questionsData));

    selectedImages.forEach((imageUri, index) => {
      if (imageUri) {
        const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        let mimeType = 'image/jpeg';
        if (fileExtension === 'mp4' || fileExtension === 'mov') {
          mimeType = 'video/mp4';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        }
        
        formDataToSend.append('media', {
          uri: imageUri,
          type: mimeType,
          name: `question_${index}.${fileExtension}`
        } as any);
      }
    });

    let response;
    let errorMessage = 'Không thể tạo game đoán hành động';
    
    if (classId) {
      const uploadedMedia: (string | null)[] = await Promise.all(
        selectedImages.map(async (uri) => {
          if (!uri) return null;
          try {
            const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
            let mimeType = 'image/jpeg';
            if (fileExtension === 'mp4' || fileExtension === 'mov') {
              mimeType = 'video/mp4';
            } else if (fileExtension === 'gif') {
              mimeType = 'image/gif';
            }

            const form = new FormData();
            form.append('image', {
              uri,
              type: mimeType,
              name: `question_${Date.now()}.${fileExtension}`
            } as any);

            const uploadResponse = await api.games.uploadGuess(form) as any;

            if (uploadResponse && uploadResponse.ok) {
              const uploadJson = await uploadResponse.json();
              return uploadJson.data?.filename || uploadJson.data?.imageUrl || null;
            } else {
              try {
                const errorJson = await uploadResponse.json();
                console.error('Upload guessing media error:', errorJson);
              } catch (e) {
              }
            }
          } catch (e) {
            console.error('Upload guessing media exception:', e);
          }
          return null;
        })
      );

      const gameData = {
        ma: `doan_${Date.now()}`,
        loai: 'doan',
        tieuDe: formData.title,
        moTa: formData.description,
        danhMuc: 'hanhDong',
        capDo: formData.level === 'beginner' ? 'coBan' : formData.level === 'intermediate' ? 'trungBinh' : 'nangCao',
        duLieu: {
          cauHoi: guessingData.questions.map((q, index) => {
            const originalUri = selectedImages[index];
            const uploaded = uploadedMedia[index];
            const filePath = uploaded || originalUri || '';

            const lower = (originalUri || '').toLowerCase();
            const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov');
            const isGif = lower.endsWith('.gif');

            return {
              id: `q${index}`,
              phuongTien: filePath,
              loaiPhuongTien: isVideo ? 'video' : isGif ? 'gif' : 'anh',
              cauHoi: `Quan sát hình ảnh / video và chọn hành động đúng`,
              phuongAn: q.options,
              dapAnDung: q.correctAnswer,
              giaiThich: q.explanation && q.explanation.trim()
                ? q.explanation
                : 'Không có giải thích'
            };
          })
        }
      };
      response = await api.classes.createGame(classId, gameData);
      if (response && response.success) {
        Alert.alert('Thành công', 'Game đoán hành động đã được tạo!');
        onSuccess();
        return;
      } else {
        errorMessage = response?.message || errorMessage;
      }
    } else {
      // Admin tạo game (giữ nguyên logic cũ)
      response = await api.games.createGuessing(formDataToSend) as any;
      console.log('Guessing game response:', response);
      
      if (response && response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.success) {
          Alert.alert('Thành công', 'Game đoán hành động đã được tạo!');
          onSuccess();
          return;
        } else {
          errorMessage = jsonResponse.message || errorMessage;
        }
      } else {
        try {
          const errorResponse = await response.json();
          errorMessage = errorResponse.message || errorResponse.error || errorMessage;
          console.error('Server error response:', errorResponse);
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorMessage = `Lỗi server (${response?.status || 'unknown'})`;
        }
      }
    }
    
    throw new Error(errorMessage);
  };

  // Chọn ảnh/video/GIF cho một câu hỏi cụ thể trong game Đoán hành động
  // Quy trình:
  // 1. Yêu cầu quyền truy cập thư viện, nếu không được cấp thì hiển thị thông báo và dừng
  // 2. Mở ImagePicker cho phép chọn tất cả loại media (ảnh/video/GIF), không cho phép chỉnh sửa
  // 3. Lưu URI của file đã chọn vào selectedImages tại vị trí questionIndex
  const handleMediaPicker = async (questionIndex: number) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh/video');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...selectedImages];
        newImages[questionIndex] = result.assets[0].uri;
        setSelectedImages(newImages);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh/video');
    }
  };

  // Thêm câu hỏi mới vào danh sách câu hỏi của game Đoán hành động
  // Tạo câu hỏi mới với: 4 options rỗng, correctAnswer rỗng, explanation rỗng
  // Thêm null vào selectedImages để đánh dấu chưa có media cho câu hỏi này
  const addGuessingQuestion = () => {
    setGuessingData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: ''
      }]
    }));
    setSelectedImages(prev => [...prev, null]);
  };

  // Xóa câu hỏi khỏi danh sách
  // Kiểm tra: phải có ít nhất 1 câu hỏi (không cho phép xóa hết)
  // Nếu hợp lệ: xóa câu hỏi tại index và xóa media URI tương ứng
  const removeGuessingQuestion = (index: number) => {
    if (guessingData.questions.length > 1) {
      setGuessingData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Cập nhật một trường cụ thể của câu hỏi (options, correctAnswer, hoặc explanation)
  // Tìm câu hỏi tại index và cập nhật field tương ứng với value mới
  // Giữ nguyên các câu hỏi khác
  const updateGuessingQuestion = (index: number, field: 'options' | 'correctAnswer' | 'explanation', value: any) => {
    setGuessingData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  // Cập nhật một option cụ thể trong danh sách options của câu hỏi
  // Tìm câu hỏi tại questionIndex, tìm option tại optionIndex và thay thế bằng value mới
  // Giữ nguyên các option khác
  const updateGuessingOption = (questionIndex: number, optionIndex: number, value: string) => {
    setGuessingData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          options: q.options.map((opt, oi) => oi === optionIndex ? value : opt)
        } : q
      )
    }));
  };

  const getGameTypeName = () => {
    switch (gameType) {
      case 'coloring': return 'Tô màu';
      case 'puzzle': return 'Xếp hình';
      case 'guessing': return 'Đoán hành động';
      default: return 'Game';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E8E']}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo game {getGameTypeName()}</Text>
        </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Tên game"
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
          />
          
          <View>
            <Text style={styles.label}>Độ khó</Text>
            <View style={styles.buttonGroup}>
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelButton,
                    formData.level === level && styles.levelButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, level: level as any }))}
                >
                  <Text style={[
                    styles.levelButtonText,
                    formData.level === level && styles.levelButtonTextActive
                  ]}>
                    {level === 'beginner' ? 'Cơ bản' :
                     level === 'intermediate' ? 'Trung bình' : 'Nâng cao'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {gameType !== 'guessing' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ảnh</Text>
            <TouchableOpacity style={styles.imageButton} onPress={handleImagePicker}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={40} color="#ccc" />
                  <Text style={styles.imagePlaceholderText}>
                    {gameType === 'coloring' ? 'Chọn ảnh trắng đen' : 'Chọn ảnh gốc'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {gameType === 'coloring' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Màu gợi ý</Text>
            <View style={styles.colorContainer}>
              {coloringData.suggestedColors.map((color, index) => (
                <View key={index} style={styles.colorItem}>
                  <View style={[styles.colorBox, { backgroundColor: color }]} />
                  <TextInput
                    style={styles.colorInput}
                    value={color}
                    onChangeText={(text) => {
                      const newColors = [...coloringData.suggestedColors];
                      newColors[index] = text;
                      setColoringData(prev => ({ ...prev, suggestedColors: newColors }));
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {gameType === 'puzzle' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Số mảnh</Text>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Hàng</Text>
                <View style={styles.numberInput}>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => setPuzzleData(prev => ({ ...prev, rows: Math.max(2, prev.rows - 1) }))}
                  >
                    <Ionicons name="remove" size={20} color="#666" />
                  </TouchableOpacity>
                  <Text style={styles.numberText}>{puzzleData.rows}</Text>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => setPuzzleData(prev => ({ ...prev, rows: Math.min(5, prev.rows + 1) }))}
                  >
                    <Ionicons name="add" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Cột</Text>
                <View style={styles.numberInput}>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => setPuzzleData(prev => ({ ...prev, cols: Math.max(2, prev.cols - 1) }))}
                  >
                    <Ionicons name="remove" size={20} color="#666" />
                  </TouchableOpacity>
                  <Text style={styles.numberText}>{puzzleData.cols}</Text>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => setPuzzleData(prev => ({ ...prev, cols: Math.min(5, prev.cols + 1) }))}
                  >
                    <Ionicons name="add" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Text style={styles.infoText}>
              Tổng số mảnh: {puzzleData.rows * puzzleData.cols}
            </Text>
          </View>
        )}

        {gameType === 'guessing' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Câu hỏi đoán hành động</Text>
            {guessingData.questions.map((question, qIndex) => (
              <View key={qIndex} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Câu {qIndex + 1}</Text>
                  {guessingData.questions.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeGuessingQuestion(qIndex)}
                    >
                      <Ionicons name="trash" size={20} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.label}>Hình ảnh/Video/GIF</Text>
                <TouchableOpacity 
                  style={styles.imageButton} 
                  onPress={() => handleMediaPicker(qIndex)}
                >
                  {selectedImages[qIndex] ? (
                    <Image source={{ uri: selectedImages[qIndex]! }} style={styles.selectedImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="images" size={40} color="#ccc" />
                      <Text style={styles.imagePlaceholderText}>Chọn ảnh/video/gif</Text>
                    </View>
                  )}
                </TouchableOpacity>

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

                <Text style={styles.label}>Giải thích (tùy chọn)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Giải thích cho đáp án đúng..."
                  value={question.explanation}
                  onChangeText={(text) => updateGuessingQuestion(qIndex, 'explanation', text)}
                  multiline
                  numberOfLines={2}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addGuessingQuestion}>
              <Ionicons name="add" size={20} color="#4CAF50" />
              <Text style={styles.addButtonText}>Thêm câu hỏi</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Đang tạo...' : 'Tạo game'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
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
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  levelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  levelButtonActive: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  levelButtonText: {
    fontSize: 12,
    color: '#666',
  },
  levelButtonTextActive: {
    color: '#fff',
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
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorBox: {
    width: 30,
    height: 30,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorInput: {
    width: 80,
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  numberButton: {
    padding: 12,
  },
  numberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  infoText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  pairItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pairInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeButton: {
    padding: 12,
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
  },
  addButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
