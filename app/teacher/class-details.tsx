import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';
import CreateGame from '../../app/admin/create-game';
import GameTypeSelection from '../../app/admin/game-type-selection';
import { GameModal, type Game } from '../../app/admin/games';

interface Class {
  _id: string;
  tenLop: string;
  moTa?: string;
  maLop: string;
  hocSinh: Array<{
    _id: string;
    hoTen: string;
    ngaySinh?: string;
    gioiTinh: string;
  }>;
  baiTap: Array<{
    _id: string;
    tieuDe: string;
  }>;
  troChoi: Array<{
    _id: string;
    tieuDe: string;
    loai?: string;
    type?: string;
  }>;
}

export default function TeacherClassDetails() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [emailHocSinh, setEmailHocSinh] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'lessons' | 'games' | 'progress'>('students');
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [gameTypeModalVisible, setGameTypeModalVisible] = useState(false);
  const [createGameModalVisible, setCreateGameModalVisible] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<'coloring' | 'puzzle' | 'guessing' | null>(null);
  const [lessonModalMode, setLessonModalMode] = useState<'create' | 'edit'>('create');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [gameEditorVisible, setGameEditorVisible] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [loadingGameDetail, setLoadingGameDetail] = useState(false);

  useEffect(() => {
    if (classId) {
      loadClassDetails();
    }
  }, [classId]);

  const loadClassDetails = async () => {
    try {
      setLoading(true);
      const response = await api.classes.get(classId as string);
      setClassData(response.data);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải chi tiết lớp');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!emailHocSinh) {
      Alert.alert('Lỗi', 'Vui lòng nhập email học sinh');
      return;
    }

    try {
      await api.classes.addStudent(classId as string, emailHocSinh);
      Alert.alert('Thành công', 'Đã thêm học sinh vào lớp');
      setModalVisible(false);
      setEmailHocSinh('');
      loadClassDetails();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể thêm học sinh');
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa học sinh này khỏi lớp?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.classes.removeStudent(classId as string, studentId);
            Alert.alert('Thành công', 'Đã xóa học sinh khỏi lớp');
            loadClassDetails();
          } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể xóa học sinh');
          }
        }
      }
    ]);
  };

  const openLessonModal = (mode: 'create' | 'edit', lessonId?: string) => {
    setLessonModalMode(mode);
    setEditingLessonId(lessonId || null);
    setLessonModalVisible(true);
  };

  const handleDeleteLesson = (lessonId: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa bài học này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.lessons.delete(lessonId);
            Alert.alert('Thành công', 'Đã xóa bài học');
            loadClassDetails();
          } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể xóa bài học');
          }
        }
      }
    ]);
  };

  const handleEditGame = async (gameId: string) => {
    try {
      setLoadingGameDetail(true);
      const response = await api.games.get(gameId);
      const gameData = response.data?.game || response.data;
      if (!gameData) {
        throw new Error('Không tìm thấy dữ liệu trò chơi');
      }
      
      // Normalize dữ liệu game để đảm bảo format đúng
      const normalized: Game = {
        id: (gameData as any).id || (gameData as any)._id || gameId,
        key: (gameData as any).key || (gameData as any)._id || gameId,
        title: gameData.tieuDe || gameData.title || '',
        type: (gameData.loai || gameData.type || 'coloring') as any,
        category: (gameData.danhMuc || gameData.category || 'letter') as any,
        level: (gameData.capDo || gameData.level || 'beginner') as any,
        description: gameData.moTa || gameData.description || '',
        imageUrl: gameData.anhDaiDien || gameData.imageUrl || 
                  (gameData.data?.coloringData?.outlineImage) || 
                  (gameData.data?.imageUrl) || undefined,
        estimatedTime: gameData.thoiGianUocTinh || gameData.estimatedTime || 5,
        data: gameData.noiDung || gameData.data || {},
      };
      
      setEditingGame(normalized);
      setGameEditorVisible(true);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải trò chơi');
    } finally {
      setLoadingGameDetail(false);
    }
  };

  const handleDeleteGame = (gameId: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa trò chơi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.games.delete(gameId);
            Alert.alert('Thành công', 'Đã xóa trò chơi');
            loadClassDetails();
          } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể xóa trò chơi');
          }
        }
      }
    ]);
  };

  const handleViewProgress = () => {
    router.push({
      pathname: '/teacher/class-progress',
      params: { classId: classId as string }
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!classData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy lớp</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{classData.tenLop}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'students' && styles.tabActive]}
          onPress={() => setActiveTab('students')}
        >
          <Text style={[styles.tabText, activeTab === 'students' && styles.tabTextActive]}>
            Học sinh
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lessons' && styles.tabActive]}
          onPress={() => setActiveTab('lessons')}
        >
          <Text style={[styles.tabText, activeTab === 'lessons' && styles.tabTextActive]}>
            Bài học
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'games' && styles.tabActive]}
          onPress={() => setActiveTab('games')}
        >
          <Text style={[styles.tabText, activeTab === 'games' && styles.tabTextActive]}>
            Trò chơi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
          onPress={() => {
            setActiveTab('progress');
            handleViewProgress();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
            Kết quả
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'students' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Học sinh ({classData.hocSinh.length})
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
              >
                <Ionicons name="add-circle" size={28} color="#4CAF50" />
                <Text style={styles.addButtonText}>Thêm học sinh</Text>
              </TouchableOpacity>
            </View>

            {classData.hocSinh.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Chưa có học sinh nào</Text>
              </View>
            ) : (
              classData.hocSinh.map((student) => (
                <View key={student._id} style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <Ionicons name="person-circle" size={40} color="#4CAF50" />
                    <View style={styles.studentDetails}>
                      <Text style={styles.studentName}>{student.hoTen}</Text>
                      <Text style={styles.studentMeta}>
                        {student.gioiTinh === 'nam' ? 'Nam' : 'Nữ'}
                        {student.ngaySinh && ` • ${new Date(student.ngaySinh).toLocaleDateString('vi-VN')}`}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveStudent(student._id)}
                  >
                    <Ionicons name="trash" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'lessons' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Bài học ({classData.baiTap?.length || 0})
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openLessonModal('create')}
              >
                <Ionicons name="add-circle" size={28} color="#4CAF50" />
                <Text style={styles.addButtonText}>Thêm bài tập</Text>
              </TouchableOpacity>
            </View>

            {!classData.baiTap || classData.baiTap.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Chưa có bài học nào</Text>
              </View>
            ) : (
              classData.baiTap.map((lesson) => (
                <View key={lesson._id} style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <Ionicons name="book" size={40} color="#FF9800" />
                    <View style={styles.studentDetails}>
                      <Text style={styles.studentName}>{lesson.tieuDe}</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => openLessonModal('edit', lesson._id)}
                    >
                      <Ionicons name="create" size={20} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => handleDeleteLesson(lesson._id)}
                    >
                      <Ionicons name="trash" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'games' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Trò chơi ({classData.troChoi?.length || 0})
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setGameTypeModalVisible(true);
                }}
              >
                <Ionicons name="add-circle" size={28} color="#4CAF50" />
                <Text style={styles.addButtonText}>Thêm trò chơi</Text>
              </TouchableOpacity>
            </View>

            {loadingGameDetail && (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.inlineLoadingText}>Đang tải trò chơi...</Text>
              </View>
            )}

            {!classData.troChoi || classData.troChoi.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Chưa có trò chơi nào</Text>
              </View>
            ) : (
              classData.troChoi.map((game) => (
                <View key={game._id} style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <Ionicons name="game-controller" size={40} color="#F44336" />
                    <View style={styles.studentDetails}>
                      <Text style={styles.studentName}>{game.tieuDe}</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => handleEditGame(game._id)}
                    >
                      <Ionicons name="create" size={20} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => handleDeleteGame(game._id)}
                    >
                      <Ionicons name="trash" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm học sinh</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email học sinh *</Text>
                <TextInput
                  style={styles.input}
                  value={emailHocSinh}
                  onChangeText={setEmailHocSinh}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddStudent}
                >
                  <Text style={styles.saveButtonText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal tạo bài học */}
      <LessonEditorModal
        visible={lessonModalVisible}
        classId={classId as string}
        mode={lessonModalMode}
        lessonId={editingLessonId || undefined}
        onClose={() => setLessonModalVisible(false)}
        onSuccess={() => {
          setLessonModalVisible(false);
          setEditingLessonId(null);
          loadClassDetails();
        }}
      />

      {/* Modal chọn loại game */}
      <GameTypeSelectionModal
        visible={gameTypeModalVisible}
        onClose={() => setGameTypeModalVisible(false)}
        onSelectType={(type) => {
          setSelectedGameType(type);
          setGameTypeModalVisible(false);
          setCreateGameModalVisible(true);
        }}
      />

      {/* Modal tạo game */}
      {selectedGameType && createGameModalVisible && (
        <GameCreateModal
          visible={createGameModalVisible}
          gameType={selectedGameType}
          classId={classId as string}
          onClose={() => {
            setCreateGameModalVisible(false);
            setSelectedGameType(null);
          }}
          onSuccess={() => {
            setCreateGameModalVisible(false);
            setSelectedGameType(null);
            loadClassDetails();
          }}
        />
      )}

      <GameModal
        visible={gameEditorVisible}
        game={editingGame}
        onClose={() => {
          setGameEditorVisible(false);
          setEditingGame(null);
        }}
        onSave={() => {
          setGameEditorVisible(false);
          setEditingGame(null);
          loadClassDetails();
        }}
      />
    </View>
  );
}

// Component tạo bài học - sử dụng form đầy đủ từ admin
function LessonEditorModal({ visible, classId, onClose, onSuccess, mode = 'create', lessonId }: {
  visible: boolean;
  classId: string;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  lessonId?: string;
}) {
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

  const [exercises, setExercises] = useState<any[]>([]);
  const [currentExercise, setCurrentExercise] = useState<any | null>(null);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'chuCai',
      level: 'coBan',
      estimatedTime: 10
    });
    setExercises([]);
    setCurrentExercise(null);
    setCurrentLessonId(null);
  };

  useEffect(() => {
    if (!visible) {
      resetForm();
      setInitializing(false);
      return;
    }
    if (mode === 'edit' && lessonId) {
      setCurrentLessonId(lessonId);
      loadLessonDetail(lessonId);
    } else {
      resetForm();
    }
  }, [visible, mode, lessonId]);

  const loadLessonDetail = async (id: string) => {
    try {
      setInitializing(true);
      const response = await api.lessons.get(id);
      const lesson = response.data?.lesson || response.data;
      if (!lesson) {
        throw new Error('Không tìm thấy bài học');
      }
      const category = (lesson.danhMuc || lesson.category || 'chuCai') as any;
      const level = (lesson.capDo || lesson.level || 'coBan') as any;
      setFormData({
        title: lesson.tieuDe || lesson.title || '',
        description: lesson.moTa || lesson.description || '',
        category: (['chuCai', 'so', 'mauSac', 'hanhDong'].includes(category) ? category : 'chuCai') as 'chuCai' | 'so' | 'mauSac' | 'hanhDong',
        level: (['coBan', 'trungBinh', 'nangCao'].includes(level) ? level : 'coBan') as 'coBan' | 'trungBinh' | 'nangCao',
        estimatedTime: lesson.thoiGianUocTinh || lesson.estimatedTime || 10
      });
      const lessonExercises = (lesson.noiDung?.baiTap || lesson.exercises || []).map((exercise: any, index: number) => ({
        id: exercise._id || exercise.id || `exercise-${index}`,
        type: mapExerciseType(exercise.loai || exercise.type),
        question: exercise.cauHoi || exercise.question || '',
        options: exercise.phuongAn || exercise.options || [],
        correctAnswer: exercise.dapAnDung || exercise.correctAnswer || '',
        imageUrl: exercise.anhDaiDien || exercise.imageUrl,
        text: exercise.vanBan || exercise.text,
        blanks: exercise.oTrong || exercise.blanks || []
      }));
      setExercises(lessonExercises);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải bài học');
      onClose();
    } finally {
      setInitializing(false);
    }
  };

  const handleAddExercise = () => {
    setCurrentExercise(null);
    setExerciseModalVisible(true);
  };

  const handleEditExercise = (exercise: any) => {
    setCurrentExercise(exercise);
    setExerciseModalVisible(true);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  const handleSaveExercise = (exercise: any) => {
    if (currentExercise) {
      setExercises(exercises.map(ex => ex.id === exercise.id ? exercise : ex));
    } else {
      setExercises([...exercises, { ...exercise, id: Date.now().toString() }]);
    }
    setExerciseModalVisible(false);
  };

  const handleSave = async () => {
    if (!formData.title) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên bài học');
      return;
    }

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
            oTrong: ex.blanks?.map((blank: any) => ({
              viTri: blank.position,
              dapAnDung: blank.correctAnswer,
              phuongAn: blank.options
            }))
          }))
        }
      };

      if (mode === 'edit' && (lessonId || currentLessonId)) {
        await api.classes.updateLessonInClass(classId, lessonId || currentLessonId!, lessonData);
        Alert.alert('Thành công', 'Đã cập nhật bài học');
      } else {
        await api.classes.createLesson(classId, lessonData);
        Alert.alert('Thành công', 'Đã tạo bài học');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      Alert.alert('Lỗi', `Không thể lưu bài học: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={lessonModalStyles.modalContainer}>
          <View style={lessonModalStyles.modalHeader}>
            <Text style={lessonModalStyles.modalTitle}>Tạo bài học mới</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={lessonModalStyles.modalContent}>
            <View style={lessonModalStyles.inputGroup}>
              <Text style={lessonModalStyles.inputLabel}>Tên bài học *</Text>
              <TextInput
                style={lessonModalStyles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Nhập tên bài học"
              />
            </View>

            <View style={lessonModalStyles.inputGroup}>
              <Text style={lessonModalStyles.inputLabel}>Mô tả</Text>
              <TextInput
                style={[lessonModalStyles.input, lessonModalStyles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Nhập mô tả bài học"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={lessonModalStyles.inputGroup}>
              <Text style={lessonModalStyles.inputLabel}>Danh mục *</Text>
              <View style={lessonModalStyles.categorySelector}>
                {(['chuCai', 'so', 'mauSac', 'hanhDong'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      lessonModalStyles.categoryOption,
                      formData.category === cat && lessonModalStyles.categoryOptionActive
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text style={[
                      lessonModalStyles.categoryOptionText,
                      formData.category === cat && lessonModalStyles.categoryOptionTextActive
                    ]}>
                      {cat === 'chuCai' ? 'Chữ cái' : cat === 'so' ? 'Số' : cat === 'mauSac' ? 'Màu sắc' : 'Hành động'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={lessonModalStyles.inputGroup}>
              <Text style={lessonModalStyles.inputLabel}>Cấp độ *</Text>
              <View style={lessonModalStyles.levelSelector}>
                {(['coBan', 'trungBinh', 'nangCao'] as const).map((lev) => (
                  <TouchableOpacity
                    key={lev}
                    style={[
                      lessonModalStyles.levelOption,
                      formData.level === lev && lessonModalStyles.levelOptionActive
                    ]}
                    onPress={() => setFormData({ ...formData, level: lev })}
                  >
                    <Text style={[
                      lessonModalStyles.levelOptionText,
                      formData.level === lev && lessonModalStyles.levelOptionTextActive
                    ]}>
                      {lev === 'coBan' ? 'Cơ bản' : lev === 'trungBinh' ? 'Trung bình' : 'Nâng cao'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={lessonModalStyles.inputGroup}>
              <Text style={lessonModalStyles.inputLabel}>Thời gian ước tính (phút)</Text>
              <TextInput
                style={lessonModalStyles.input}
                value={formData.estimatedTime.toString()}
                onChangeText={(text) => setFormData({ ...formData, estimatedTime: parseInt(text) || 10 })}
                placeholder="10"
                keyboardType="numeric"
              />
            </View>

            <View style={lessonModalStyles.inputGroup}>
              <View style={lessonModalStyles.exercisesHeader}>
                <Text style={lessonModalStyles.inputLabel}>Bài tập ({exercises.length})</Text>
                <TouchableOpacity style={lessonModalStyles.addExerciseButton} onPress={handleAddExercise}>
                  <Ionicons name="add" size={20} color="#4CAF50" />
                  <Text style={lessonModalStyles.addExerciseText}>Thêm bài tập</Text>
                </TouchableOpacity>
              </View>
              
              {exercises.map((exercise, index) => (
                <View key={exercise.id || `exercise-${index}`} style={lessonModalStyles.exerciseItem}>
                  <View style={lessonModalStyles.exerciseInfo}>
                    <Text style={lessonModalStyles.exerciseTitle}>
                      {index + 1}. {exercise.question}
                    </Text>
                    <Text style={lessonModalStyles.exerciseType}>
                      {exercise.type === 'multiple_choice' ? 'Trắc nghiệm' : 
                       exercise.type === 'fill_blank' ? 'Điền khuyết' :
                       exercise.type === 'drag_drop' ? 'Kéo thả' :
                       exercise.type === 'matching' ? 'Ghép đôi' : 'Tô màu'}
                    </Text>
                  </View>
                  <View style={lessonModalStyles.exerciseActions}>
                    <TouchableOpacity
                      style={lessonModalStyles.exerciseActionButton}
                      onPress={() => handleEditExercise(exercise)}
                    >
                      <Ionicons name="create" size={16} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={lessonModalStyles.exerciseActionButton}
                      onPress={() => handleDeleteExercise(exercise.id)}
                    >
                      <Ionicons name="trash" size={16} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={lessonModalStyles.modalActions}>
            <TouchableOpacity style={lessonModalStyles.cancelButton} onPress={onClose}>
              <Text style={lessonModalStyles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={lessonModalStyles.saveButton} onPress={handleSave}>
              <Text style={lessonModalStyles.saveButtonText}>Lưu</Text>
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

// Component tạo bài tập - copy từ admin
function ExerciseModal({ visible, exercise, onClose, onSave }: {
  visible: boolean;
  exercise: any | null;
  onClose: () => void;
  onSave: (exercise: any) => void;
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
        processedOptions = exercise.options.map((option: string) => {
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

  const handleSave = () => {
    const processedOptions = formData.options.map((option, index) => {
      const letter = String.fromCharCode(65 + index);
      return option.trim() ? `${letter}: ${option.trim()}` : '';
    }).filter(option => option !== '');
    
    const exerciseData = {
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
      <View style={lessonModalStyles.modalContainer}>
        <View style={lessonModalStyles.modalHeader}>
          <Text style={lessonModalStyles.modalTitle}>
            {exercise ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={lessonModalStyles.modalContent}>
          <View style={lessonModalStyles.inputGroup}>
            <Text style={lessonModalStyles.inputLabel}>Câu hỏi *</Text>
            <TextInput
              style={[lessonModalStyles.input, lessonModalStyles.textArea]}
              value={formData.question}
              onChangeText={(text) => setFormData({ ...formData, question: text })}
              placeholder="Nhập câu hỏi"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={lessonModalStyles.inputGroup}>
            <Text style={lessonModalStyles.inputLabel}>Các lựa chọn</Text>
            {formData.options.map((option, index) => (
              <View key={index} style={lessonModalStyles.optionInput}>
                <Text style={lessonModalStyles.optionLabel}>{String.fromCharCode(65 + index)}.</Text>
                <TextInput
                  style={[lessonModalStyles.input, lessonModalStyles.optionTextInput]}
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

          <View style={lessonModalStyles.inputGroup}>
            <Text style={lessonModalStyles.inputLabel}>Đáp án đúng</Text>
            <TextInput
              style={lessonModalStyles.input}
              value={formData.correctAnswer}
              onChangeText={(text) => setFormData({ ...formData, correctAnswer: text })}
              placeholder="Nhập đáp án đúng (A, B, C, hoặc D)"
            />
          </View>
        </ScrollView>

        <View style={lessonModalStyles.modalActions}>
          <TouchableOpacity style={lessonModalStyles.cancelButton} onPress={onClose}>
            <Text style={lessonModalStyles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={lessonModalStyles.saveButton} onPress={handleSave}>
            <Text style={lessonModalStyles.saveButtonText}>Lưu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Component chọn loại game
function GameTypeSelectionModal({ visible, onClose, onSelectType }: {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: 'coloring' | 'puzzle' | 'guessing') => void;
}) {
  const gameTypes = [
    { type: 'coloring' as const, title: 'Game Tô Màu', icon: 'color-palette', color: '#4ECDC4' },
    { type: 'puzzle' as const, title: 'Game Xếp Hình', icon: 'grid', color: '#FF6B6B' },
    { type: 'guessing' as const, title: 'Game Đoán', icon: 'eye', color: '#9B59B6' }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn loại game</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            {gameTypes.map((gt) => (
              <TouchableOpacity
                key={gt.type}
                style={[styles.gameTypeCard, { borderLeftColor: gt.color, borderLeftWidth: 4 }]}
                onPress={() => onSelectType(gt.type)}
              >
                <Ionicons name={gt.icon as any} size={32} color={gt.color} />
                <Text style={styles.gameTypeTitle}>{gt.title}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Component tạo game - sử dụng CreateGame từ admin
function GameCreateModal({ visible, gameType, classId, onClose, onSuccess }: {
  visible: boolean;
  gameType: 'coloring' | 'puzzle' | 'guessing';
  classId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  if (!visible) return null;
  
  return (
    <CreateGame
      gameType={gameType}
      classId={classId}
      onClose={onClose}
      onSuccess={onSuccess}
      visible={visible}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginBottom: 20
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center'
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: '#4CAF50'
  },
  tabText: {
    fontSize: 16,
    color: '#666'
  },
  tabTextActive: {
    color: '#4CAF50',
    fontWeight: '600'
  },
  content: {
    flex: 1
  },
  section: {
    padding: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    gap: 6
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32'
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#999'
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8
  },
  cardActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5'
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  inlineLoadingText: {
    fontSize: 14,
    color: '#666'
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  studentDetails: {
    marginLeft: 12,
    flex: 1
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  studentMeta: {
    fontSize: 14,
    color: '#666'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  form: {
    gap: 16
  },
  inputGroup: {
    gap: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f5f5f5'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  saveButton: {
    backgroundColor: '#4CAF50'
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  optionButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50'
  },
  optionText: {
    fontSize: 14,
    color: '#666'
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  gameTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
    gap: 12
  },
  gameTypeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top'
  }
});

// Styles cho LessonModal (copy từ admin)
const lessonModalStyles = StyleSheet.create({
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
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

