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
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';

interface Lesson {
  id?: string;
  _id?: string;
  title?: string;
  tieuDe?: string;
  category?: 'letter' | 'number' | 'color' | 'action' | 'chuCai' | 'so' | 'mauSac' | 'hanhDong';
  danhMuc?: 'chuCai' | 'so' | 'mauSac' | 'hanhDong';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'coBan' | 'trungBinh' | 'nangCao';
  capDo?: 'coBan' | 'trungBinh' | 'nangCao';
  description?: string;
  moTa?: string;
  imageUrl?: string;
  anhDaiDien?: string;
  content?: {
    text?: string;
    examples?: string[];
    exercises?: Exercise[];
  };
  noiDung?: {
    vanBan?: string;
    viDu?: string[];
    baiTap?: any[];
  };
  estimatedTime?: number;
  thoiGianUocTinh?: number;
  order?: number;
  thuTu?: number;
}

interface Exercise {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'drag_drop' | 'matching' | 'coloring';
  question: string;
  options?: string[];
  correctAnswer: any;
  imageUrl?: string;
  text?: string;
  blanks?: Blank[];
}

interface Blank {
  position: number;
  correctAnswer: string;
  options?: string[];
}

export default function LessonManagement() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadLessons();
  }, [searchText]);

  // Tải danh sách bài học với tìm kiếm
  const loadLessons = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 20 };
      if (searchText) params.search = searchText;

      const response = await api.lessons.list(params);
      const lessonsData = (response.data.lessons || []).map((lesson: any) => ({
        ...lesson,
        id: lesson.id || lesson._id,
        title: lesson.title || lesson.tieuDe,
        description: lesson.description || lesson.moTa,
        category: lesson.category || lesson.danhMuc,
        level: lesson.level || lesson.capDo,
        imageUrl: lesson.imageUrl || lesson.anhDaiDien,
        estimatedTime: lesson.estimatedTime || lesson.thoiGianUocTinh,
        order: lesson.order || lesson.thuTu,
        content: lesson.content || {
          exercises: lesson.noiDung?.baiTap || []
        }
      }));
      setLessons(lessonsData);
    } catch (error) {
      console.error('Error loading lessons:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách bài học');
    } finally {
      setLoading(false);
    }
  };

  // Làm mới danh sách bài học khi kéo xuống
  const onRefresh = async () => {
    setRefreshing(true);
    await loadLessons();
    setRefreshing(false);
  };

  // Admin chỉ xem danh sách, không tạo mới
  // const handleAddLesson = () => {
  //   setEditingLesson(null);
  //   setModalVisible(true);
  // };

  // Mở modal để chỉnh sửa bài học
  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setModalVisible(true);
  };

  // Xóa bài học
  const handleDeleteLesson = (lessonId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa bài học này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.lessons.delete(lessonId);
              await loadLessons();
              Alert.alert('Thành công', 'Đã xóa bài học');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa bài học');
            }
          }
        }
      ]
    );
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải danh sách bài học...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Quản lý bài học</Text>
        {/* Admin chỉ xem danh sách, không tạo mới */}
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bài học..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {lessons.map((lesson) => {
          const lessonData = lesson as any;
          const title = lesson.title || lessonData.tieuDe || '';
          const description = lesson.description || lessonData.moTa || '';
          const exercises = lesson.content?.exercises || lessonData.noiDung?.baiTap || [];
          const exerciseCount = Array.isArray(exercises) ? exercises.length : 0;
          
          return (
            <View key={lesson.id || lessonData._id} style={styles.lessonCard}>
              <View style={styles.lessonInfo}>
                <View style={styles.lessonDetails}>
                  <Text style={styles.lessonTitle}>{title}</Text>
                  {description && (
                    <Text style={styles.lessonDescription} numberOfLines={2}>
                      {description}
                    </Text>
                  )}
                  <Text style={styles.exerciseCount}>
                    {exerciseCount} bài tập
                  </Text>
                  {((lesson as any).lop && ((lesson as any).lop.length > 0 || (lesson as any).lop.tenLop)) && (
                    <Text style={styles.lessonClass}>
                      <Ionicons name="school" size={12} color="#666" /> {
                        Array.isArray((lesson as any).lop) 
                          ? (lesson as any).lop[0]?.tenLop || (lesson as any).lop[0]?.name || ''
                          : (lesson as any).lop?.tenLop || (lesson as any).lop?.name || ''
                      }
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.lessonActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditLesson(lesson)}
                >
                  <Ionicons name="create" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteLesson(lesson.id || lessonData._id)}
                >
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Admin chỉ xem danh sách, không tạo/sửa */}
    </View>
  );
}

function LessonModal({ visible, lesson, onClose, onSave }: {
  visible: boolean;
  lesson: Lesson | null;
  onClose: () => void;
  onSave: () => void;
}) {
  // Helper function to map exercise type
  const mapExerciseType = (type: string): 'multiple_choice' | 'fill_blank' | 'drag_drop' | 'matching' | 'coloring' => {
    const typeMap: Record<string, 'multiple_choice' | 'fill_blank' | 'drag_drop' | 'matching' | 'coloring'> = {
      'tracNghiem': 'multiple_choice',
      'dienKhuyet': 'fill_blank',
      'keoTha': 'drag_drop',
      'ghepDoi': 'matching',
      'toMau': 'coloring',
      'multiple_choice': 'multiple_choice',
      'fill_blank': 'fill_blank',
      'drag_drop': 'drag_drop',
      'matching': 'matching',
      'coloring': 'coloring'
    };
    return typeMap[type] || 'multiple_choice';
  };

  // Helper function to map exercise type to Vietnamese
  const mapExerciseTypeToVietnamese = (type: string): string => {
    const typeMap: Record<string, string> = {
      'multiple_choice': 'tracNghiem',
      'fill_blank': 'dienKhuyet',
      'drag_drop': 'keoTha',
      'matching': 'ghepDoi',
      'coloring': 'toMau',
      'tracNghiem': 'tracNghiem',
      'dienKhuyet': 'dienKhuyet',
      'keoTha': 'keoTha',
      'ghepDoi': 'ghepDoi',
      'toMau': 'toMau'
    };
    return typeMap[type] || 'tracNghiem';
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'chuCai' as 'chuCai' | 'so' | 'mauSac' | 'hanhDong',
    level: 'coBan' as 'coBan' | 'trungBinh' | 'nangCao',
    estimatedTime: 10
  });

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || (lesson as any).tieuDe || '',
        description: lesson.description || (lesson as any).moTa || '',
        category: (lesson as any).danhMuc || lesson.category || 'chuCai',
        level: (lesson as any).capDo || lesson.level || 'coBan',
        estimatedTime: lesson.estimatedTime || (lesson as any).thoiGianUocTinh || 10
      });
      setExercises((lesson.content?.exercises || (lesson as any).noiDung?.baiTap || []).map((ex: any) => ({
        id: ex._id || ex.id,
        type: mapExerciseType(ex.loai || ex.type),
        question: ex.cauHoi || ex.question,
        options: ex.phuongAn || ex.options,
        correctAnswer: ex.dapAnDung || ex.correctAnswer,
        imageUrl: ex.anhDaiDien || ex.imageUrl,
        text: ex.vanBan || ex.text,
        blanks: ex.oTrong || ex.blanks
      })));
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'chuCai',
        level: 'coBan',
        estimatedTime: 10
      });
      setExercises([]);
    }
  }, [lesson]);

  // Mở modal để thêm bài tập mới
  // Đặt currentExercise = null để báo hiệu đây là thao tác thêm mới (không phải chỉnh sửa)
  // Hiển thị ExerciseModal để người dùng nhập thông tin bài tập
  const handleAddExercise = () => {
    setCurrentExercise(null);
    setExerciseModalVisible(true);
  };

  // Mở modal để chỉnh sửa bài tập đã có
  // Lưu bài tập cần chỉnh sửa vào currentExercise để load dữ liệu vào form
  // Hiển thị ExerciseModal với dữ liệu đã điền sẵn
  const handleEditExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setExerciseModalVisible(true);
  };

  // Xóa bài tập khỏi danh sách
  // Sử dụng filter để loại bỏ bài tập có id trùng với exerciseId
  // Cập nhật state exercises với danh sách mới (không chứa bài tập đã xóa)
  const handleDeleteExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  // Lưu bài tập (thêm mới hoặc cập nhật)
  // Nếu currentExercise tồn tại: cập nhật bài tập trong danh sách (tìm theo id và thay thế)
  // Nếu currentExercise = null: thêm bài tập mới vào cuối danh sách với id được tạo từ Date.now()
  // Đóng ExerciseModal sau khi lưu thành công
  const handleSaveExercise = (exercise: Exercise) => {
    if (currentExercise) {
      setExercises(exercises.map(ex => ex.id === exercise.id ? exercise : ex));
    } else {
      setExercises([...exercises, { ...exercise, id: Date.now().toString() }]);
    }
    setExerciseModalVisible(false);
  };

  // Lưu bài học (tạo mới hoặc cập nhật)
  // Tạo object lessonData chứa: tieuDe, moTa, danhMuc, capDo, thoiGianUocTinh, và danh sách baiTap
  // Nếu lesson tồn tại: gọi API update để cập nhật bài học đã có
  // Nếu lesson = null: gọi API create để tạo bài học mới
  // Sau khi lưu thành công: gọi onSave() để refresh danh sách, đóng modal, và hiển thị thông báo
  const handleSave = async () => {
    try {
      const lessonData = {
        tieuDe: formData.title,
        moTa: formData.description,
        danhMuc: formData.category,
        capDo: formData.level,
        thoiGianUocTinh: formData.estimatedTime,
        noiDung: {
          baiTap: exercises.map(ex => ({
            loai: mapExerciseTypeToVietnamese(ex.type),
            cauHoi: ex.question,
            phuongAn: ex.options,
            dapAnDung: ex.correctAnswer,
            anhDaiDien: ex.imageUrl,
            vanBan: ex.text,
            oTrong: ex.blanks?.map(blank => ({
              viTri: blank.position,
              dapAnDung: blank.correctAnswer,
              phuongAn: blank.options
            }))
          }))
        }
      };

      console.log('Saving lesson data:', lessonData);

      if (lesson) {
        const lessonId = lesson.id || (lesson as any)._id;
        console.log('Updating lesson:', lessonId);
        const response = await api.lessons.update(lessonId, lessonData);
        console.log('Update response:', response);
      } else {
        console.log('Creating new lesson');
        const response = await api.lessons.create(lessonData);
        console.log('Create response:', response);
      }
      
      onSave();
      onClose();
      Alert.alert('Thành công', lesson ? 'Đã cập nhật bài học' : 'Đã tạo bài học');
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      Alert.alert('Lỗi', `Không thể lưu bài học: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {lesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên bài học *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Nhập tên bài học"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Nhập mô tả bài học"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Danh mục *</Text>
            <View style={styles.categorySelector}>
              {(['chuCai', 'so', 'mauSac', 'hanhDong'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    formData.category === cat && styles.categoryOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    formData.category === cat && styles.categoryOptionTextActive
                  ]}>
                    {cat === 'chuCai' ? 'Chữ cái' : cat === 'so' ? 'Số' : cat === 'mauSac' ? 'Màu sắc' : 'Hành động'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cấp độ *</Text>
            <View style={styles.levelSelector}>
              {(['coBan', 'trungBinh', 'nangCao'] as const).map((lev) => (
                <TouchableOpacity
                  key={lev}
                  style={[
                    styles.levelOption,
                    formData.level === lev && styles.levelOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, level: lev })}
                >
                  <Text style={[
                    styles.levelOptionText,
                    formData.level === lev && styles.levelOptionTextActive
                  ]}>
                    {lev === 'coBan' ? 'Cơ bản' : lev === 'trungBinh' ? 'Trung bình' : 'Nâng cao'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Thời gian ước tính (phút)</Text>
            <TextInput
              style={styles.input}
              value={formData.estimatedTime.toString()}
              onChangeText={(text) => setFormData({ ...formData, estimatedTime: parseInt(text) || 10 })}
              placeholder="10"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.exercisesHeader}>
              <Text style={styles.inputLabel}>Bài tập ({exercises.length})</Text>
              <TouchableOpacity style={styles.addExerciseButton} onPress={handleAddExercise}>
                <Ionicons name="add" size={20} color="#4CAF50" />
                <Text style={styles.addExerciseText}>Thêm bài tập</Text>
              </TouchableOpacity>
            </View>
            
            {exercises.map((exercise, index) => (
              <View key={exercise.id || `exercise-${index}`} style={styles.exerciseItem}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>
                    {index + 1}. {exercise.question}
                  </Text>
                  <Text style={styles.exerciseType}>
                    Trắc nghiệm
                  </Text>
                </View>
                <View style={styles.exerciseActions}>
                  <TouchableOpacity
                    style={styles.exerciseActionButton}
                    onPress={() => handleEditExercise(exercise)}
                  >
                    <Ionicons name="create" size={16} color="#2196F3" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.exerciseActionButton}
                    onPress={() => handleDeleteExercise(exercise.id)}
                  >
                    <Ionicons name="trash" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Lưu</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ExerciseModal
        visible={exerciseModalVisible}
        exercise={currentExercise}
        onClose={() => setExerciseModalVisible(false)}
        onSave={handleSaveExercise}
      />
    </Modal>
  );
}

function ExerciseModal({ visible, exercise, onClose, onSave }: {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
}) {
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: ''
  });

  useEffect(() => {
    if (exercise) {
      let processedOptions = exercise.options || ['', '', '', ''];
      let processedCorrectAnswer = exercise.correctAnswer || '';
      
      if (exercise.options) {
        processedOptions = exercise.options.map(option => {
          if (typeof option === 'string' && option.includes(': ')) {
            return option.split(': ').slice(1).join(': ').trim();
          }
          return option;
        });
        
        processedCorrectAnswer = exercise.correctAnswer;
      }
      
      setFormData({
        question: exercise.question,
        options: processedOptions,
        correctAnswer: processedCorrectAnswer
      });
    } else {
      setFormData({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: ''
      });
    }
  }, [exercise]);

  // Lưu bài tập (trắc nghiệm)
  // Xử lý các lựa chọn: thêm prefix chữ cái (A, B, C, D) vào đầu mỗi option
  // Loại bỏ các option rỗng sau khi xử lý
  // Tạo object exerciseData với: id (lấy từ exercise hiện tại hoặc tạo mới), type = 'multiple_choice', question, options đã xử lý, và correctAnswer
  // Gọi onSave() để truyền dữ liệu về component cha (LessonModal)
  const handleSave = () => {
    const processedOptions = formData.options.map((option, index) => {
      const letter = String.fromCharCode(65 + index);
      return option.trim() ? `${letter}: ${option.trim()}` : '';
    }).filter(option => option !== '');
    
    const exerciseData: Exercise = {
      id: exercise?.id || Date.now().toString(),
      type: 'multiple_choice',
      question: formData.question,
      options: processedOptions,
      correctAnswer: formData.correctAnswer
    };
    onSave(exerciseData);
  };


  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {exercise ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Câu hỏi *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.question}
              onChangeText={(text) => setFormData({ ...formData, question: text })}
              placeholder="Nhập câu hỏi"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Các lựa chọn</Text>
            {formData.options.map((option, index) => (
              <View key={index} style={styles.optionInput}>
                <Text style={styles.optionLabel}>{String.fromCharCode(65 + index)}.</Text>
                <TextInput
                  style={[styles.input, styles.optionTextInput]}
                  value={option}
                  onChangeText={(text) => {
                    const newOptions = [...formData.options];
                    newOptions[index] = text;
                    setFormData({ ...formData, options: newOptions });
                  }}
                  placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                />
              </View>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Đáp án đúng</Text>
            <TextInput
              style={styles.input}
              value={formData.correctAnswer}
              onChangeText={(text) => setFormData({ ...formData, correctAnswer: text })}
              placeholder="Nhập đáp án đúng (A, B, C, hoặc D)"
            />
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Lưu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
  lessonCard: {
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
  lessonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonDetails: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lessonCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  lessonLevel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  lessonDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  exerciseCount: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '600',
  },
  lessonClass: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonActions: {
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
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#E8F5E8',
    gap: 6,
  },
  addExerciseText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  exerciseType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseActionButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  exerciseTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  exerciseTypeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  exerciseTypeOptionActive: {
    backgroundColor: '#4CAF50',
  },
  exerciseTypeOptionText: {
    fontSize: 12,
    color: '#666',
  },
  exerciseTypeOptionTextActive: {
    color: '#fff',
  },
  optionInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
    minWidth: 20,
  },
  optionTextInput: {
    flex: 1,
  },
  blankInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  blankPositionInput: {
    width: 60,
  },
  blankAnswerInput: {
    flex: 1,
  },
  removeBlankButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#ffebee',
  },
  addBlankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#E8F5E8',
    gap: 6,
    alignSelf: 'flex-start',
  },
  addBlankText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
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
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
