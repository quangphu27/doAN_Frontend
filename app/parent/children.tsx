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

interface Child {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  avatarUrl?: string;
  learningLevel: 'beginner' | 'intermediate' | 'advanced';
  preferences: string[];
  isActive: boolean;
  createdAt: string;
  classes?: Array<{
    id: string;
    name: string;
    description?: string;
    teacherName?: string;
  }>;
}

interface GameResult {
  id: string;
  game: {
    id: string;
    title: string;
    type: string;
  };
  score: number;
  timeSpent: number;
  completedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
  childName?: string;
  parentName?: string;
  message?: string;
}

export default function ChildManagement() {
  const [children, setChildren] = useState<Child[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [gameResultsModalVisible, setGameResultsModalVisible] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [loadingGameResults, setLoadingGameResults] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading children and invitations...');
      const [childrenResponse, invitationsResponse] = await Promise.all([
        api.children.list(),
        api.children.getInvitations()
      ]);
      console.log('Children response:', childrenResponse);
      console.log('Invitations response:', invitationsResponse);
      
      const childrenData = childrenResponse.data || [];
        const mappedChildren = childrenData.map((child: any) => ({
        id: child._id || child.id,
        name: child.hoTen || child.name || 'Trẻ',
        email: child.email || '',
        age: child.ngaySinh ? new Date().getFullYear() - new Date(child.ngaySinh).getFullYear() : 5,
        gender: (child.gioiTinh === 'nu' ? 'female' : 'male') as 'male' | 'female' | 'other',
        avatarUrl: child.anhDaiDien || undefined,
        learningLevel: (child.capDoHocTap === 'trungBinh' ? 'intermediate' : child.capDoHocTap === 'nangCao' ? 'advanced' : 'beginner') as any,
        preferences: [],
        isActive: child.trangThai ?? true,
        createdAt: child.createdAt || new Date().toISOString(),
        classes: (child.lop || child.classes || []).map((cls: any) => ({
          id: cls._id || cls.id,
          name: cls.tenLop || 'Lớp học',
          description: cls.moTa || cls.moTaChiTiet || '',
          teacherName: cls.giaoVien?.hoTen || cls.giaoVien?.name || undefined
        }))
      }));
      
      setChildren(mappedChildren);
      
      const invitationsData = invitationsResponse.data?.invitations || [];
      const mappedInvitations = invitationsData.map((invitation: any) => ({
        ...invitation,
        id: invitation._id || invitation.id
      }));
      
      setInvitations(mappedInvitations);
      console.log('Data loaded successfully');
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', `Không thể tải dữ liệu: ${error.message || 'Lỗi không xác định'}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddChild = () => {
    setModalVisible(true);
  };

  const handleInviteChild = () => {
    setInviteModalVisible(true);
  };

  const handleViewChildClasses = (child: Child) => {
    setSelectedChild(child);
    setClassModalVisible(true);
  };

  const handleViewGameResults = async (child: Child) => {
    setSelectedChild(child);
    setGameResultsModalVisible(true);
    await loadGameResults(child.id);
  };

  const loadGameResults = async (childId: string) => {
    try {
      setLoadingGameResults(true);
      const response = await api.children.getGameResults(childId, { limit: 50 });
      
      let results: GameResult[] = [];
      if (response.data?.gameResults) {
        const gameResultsData = response.data.gameResults || [];
        results = gameResultsData.map((item: any) => ({
          id: item._id || item.id,
          game: {
            id: item.troChoi?._id || item.troChoi?.id || item.troChoi,
            title: item.troChoi?.tieuDe || 'Trò chơi',
            type: item.troChoi?.loai || 'unknown'
          },
          score: item.diemSo || 0,
          timeSpent: item.thoiGianDaDung || 0,
          completedAt: item.ngayHoanThanh || item.createdAt || item.updatedAt || new Date().toISOString()
        }));
      }
      
      setGameResults(results.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ));
    } catch (error: any) {
      console.error('Error loading game results:', error);
      setGameResults([]);
    } finally {
      setLoadingGameResults(false);
    }
  };


  const handleDeleteChild = (childId: string) => {
    if (!childId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID của trẻ');
      return;
    }
    
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa trẻ này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting child with ID:', childId);
              await api.children.delete(childId);
              await loadData();
              Alert.alert('Thành công', 'Đã xóa trẻ');
            } catch (error: any) {
              console.error('Error deleting child:', error);
              Alert.alert('Lỗi', 'Không thể xóa trẻ');
            }
          }
        }
      ]
    );
  };

  const handleDeleteInvitation = (invitationId: string) => {
    if (!invitationId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID của lời mời');
      return;
    }
    
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa lời mời này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting invitation with ID:', invitationId);
              setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
              Alert.alert('Thành công', 'Đã xóa lời mời');
            } catch (error: any) {
              console.error('Error deleting invitation:', error);
              Alert.alert('Lỗi', 'Không thể xóa lời mời');
            }
          }
        }
      ]
    );
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male': return '#2196F3';
      case 'female': return '#E91E63';
      case 'other': return '#9C27B0';
      default: return '#666';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return 'male';
      case 'female': return 'female';
      case 'other': return 'person';
      default: return 'person';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Cơ bản';
      case 'intermediate': return 'Trung bình';
      case 'advanced': return 'Nâng cao';
      default: return 'Không xác định';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#4CAF50';
      case 'expired': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ phản hồi';
      case 'accepted': return 'Đã chấp nhận';
      case 'expired': return 'Hết hạn';
      default: return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải danh sách trẻ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Quản lý trẻ</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.inviteButton} onPress={handleInviteChild}>
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={styles.inviteButtonText}>Mời qua email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddChild}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trẻ đã thêm ({children.length})</Text>
          {children.map((child, index) => (
            <View key={child.id || `child-${index}`} style={styles.childCard}>
              <View style={styles.childInfo}>
                <View style={[styles.genderBadge, { backgroundColor: getGenderColor(child.gender) }]}>
                  <Ionicons name={getGenderIcon(child.gender) as any} size={20} color="#fff" />
                </View>
                <View style={styles.childDetails}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childEmail}>{child.email}</Text>
                  <Text style={styles.childAge}>{child.age} tuổi</Text>
                  <View style={styles.childLevel}>
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(child.learningLevel) }]}>
                      <Text style={styles.levelText}>{getLevelText(child.learningLevel)}</Text>
                    </View>
                  </View>
                  {child.classes && child.classes.length > 0 && (
                    <View style={styles.classList}>
                      {child.classes.map((cls, idx) => (
                        <View key={cls.id || `class-${idx}`} style={styles.classChip}>
                          <Ionicons name="school" size={14} color="#1976D2" />
                          <Text style={styles.classChipText}>
                            {cls.name}
                            {cls.teacherName ? ` • GV: ${cls.teacherName}` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.childActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleViewChildClasses(child)}
                >
                  <Ionicons name="school" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleViewGameResults(child)}
                >
                  <Ionicons name="game-controller" size={20} color="#FF6B6B" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteChild(child.id)}
                >
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {invitations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lời mời đã gửi ({invitations.length})</Text>
            {invitations.map((invitation, index) => (
              <View key={invitation.id || `invitation-${index}`} style={styles.invitationCard}>
                <View style={styles.invitationInfo}>
                  <Ionicons name="mail" size={20} color="#666" />
                  <View style={styles.invitationDetails}>
                    <Text style={styles.invitationEmail}>{invitation.email}</Text>
                    {invitation.childName && (
                      <Text style={styles.invitationChildName}>Tên trẻ: {invitation.childName}</Text>
                    )}
                    {invitation.parentName && (
                      <Text style={styles.invitationParentName}>Phụ huynh: {invitation.parentName}</Text>
                    )}
                    {invitation.message && (
                      <Text style={styles.invitationMessage} numberOfLines={2}>
                        Lời nhắn: {invitation.message}
                      </Text>
                    )}
                    <Text style={styles.invitationDate}>
                      Gửi lúc: {new Date(invitation.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    <Text style={styles.invitationExpiry}>
                      Hết hạn: {new Date(invitation.expiresAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.invitationActions}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invitation.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(invitation.status)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteInvitationButton}
                    onPress={() => handleDeleteInvitation(invitation.id)}
                  >
                    <Ionicons name="trash" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {children.length === 0 && invitations.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có trẻ nào</Text>
            <Text style={styles.emptySubtext}>Thêm trẻ hoặc mời qua email để bắt đầu</Text>
          </View>
        )}
      </ScrollView>

      <ChildModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={loadData}
      />

      <InviteChildModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        onSend={loadData}
      />

      <ClassListModal
        visible={classModalVisible}
        child={selectedChild}
        onClose={() => setClassModalVisible(false)}
      />

      <GameResultsModal
        visible={gameResultsModalVisible}
        child={selectedChild}
        gameResults={gameResults}
        loading={loadingGameResults}
        onClose={() => setGameResultsModalVisible(false)}
        onRefresh={() => selectedChild && loadGameResults(selectedChild.id)}
      />
    </View>
  );
}

function GameResultsModal({ visible, child, gameResults, loading, onClose, onRefresh }: {
  visible: boolean;
  child: Child | null;
  gameResults: GameResult[];
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  if (!visible || !child) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'puzzle': return 'grid';
      case 'coloring': return 'color-palette';
      case 'matching': return 'link';
      case 'guessing': return 'help-circle';
      default: return 'game-controller';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'puzzle': return '#FF6B6B';
      case 'coloring': return '#FF9800';
      case 'matching': return '#9C27B0';
      case 'guessing': return '#2196F3';
      default: return '#666';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'puzzle': return 'Xếp hình';
      case 'coloring': return 'Tô màu';
      case 'matching': return 'Nối hình';
      case 'guessing': return 'Đoán hành động';
      default: return 'Trò chơi';
    }
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Kết quả trò chơi - {child.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.modalContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
        >
          {loading && gameResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.emptyText}>Đang tải kết quả...</Text>
            </View>
          ) : gameResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="game-controller-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có kết quả trò chơi</Text>
              <Text style={styles.emptySubtext}>Trẻ chưa chơi trò chơi nào</Text>
            </View>
          ) : (
            gameResults.map((result) => (
              <View key={result.id} style={styles.gameResultCard}>
                <View style={styles.gameResultHeader}>
                  <View style={[styles.gameResultIconContainer, { backgroundColor: getTypeColor(result.game.type) + '20' }]}>
                    <Ionicons 
                      name={getTypeIcon(result.game.type) as any} 
                      size={24} 
                      color={getTypeColor(result.game.type)} 
                    />
                  </View>
                  <View style={styles.gameResultInfo}>
                    <Text style={styles.gameResultTitle}>{result.game.title}</Text>
                    <Text style={styles.gameResultType}>{getTypeText(result.game.type)}</Text>
                  </View>
                  <View style={styles.gameResultScore}>
                    <Text style={styles.gameResultScoreText}>{result.score}</Text>
                    <Text style={styles.gameResultScoreLabel}>điểm</Text>
                  </View>
                </View>
                
                <View style={styles.gameResultDetails}>
                  <View style={styles.gameResultDetailItem}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.gameResultDetailText}>{result.timeSpent}s</Text>
                  </View>
                  <View style={styles.gameResultDetailItem}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.gameResultDetailText}>{formatDate(result.completedAt)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ClassListModal({ visible, child, onClose }: {
  visible: boolean;
  child: Child | null;
  onClose: () => void;
}) {
  if (!visible || !child) return null;

  const classes = child.classes || [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Lớp của {child.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {classes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="school" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Trẻ chưa được xếp vào lớp nào</Text>
            </View>
          ) : (
            classes.map((cls, idx) => (
              <View key={cls.id || `class-${idx}`} style={styles.classCard}>
                <View style={styles.classIcon}>
                  <Ionicons name="school" size={24} color="#1976D2" />
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  {cls.teacherName ? (
                    <Text style={styles.classTeacher}>Giáo viên chủ nhiệm: {cls.teacherName}</Text>
                  ) : null}
                  {cls.description ? (
                    <Text style={styles.classDescription}>{cls.description}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ChildModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: 5,
    gender: 'male' as 'male' | 'female' | 'other',
    learningLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    preferences: [] as string[]
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      name: '',
      email: '',
      age: 5,
      gender: 'male',
      learningLevel: 'beginner',
      preferences: []
    });
  }, [visible]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và email');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        hoTen: formData.name,
        email: formData.email,
        ngaySinh: undefined,
        gioiTinh: formData.gender === 'female' ? 'nu' : 'nam',
        capDoHocTap:
          formData.learningLevel === 'intermediate'
            ? 'trungBinh'
            : formData.learningLevel === 'advanced'
              ? 'nangCao'
              : 'coBan'
      };
      const response = await api.children.create(payload);
      await onSave();
      onClose();
      
      const message = response.message || 'Đã thêm trẻ thành công';
      Alert.alert('Thành công', message);
    } catch (error: any) {
      console.error('Error saving child:', error);
      
      const errorMessage = error.message || 'Lỗi không xác định';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Thêm trẻ</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Hệ thống sẽ kiểm tra email. Nếu trẻ đã tồn tại, sẽ gắn vào tài khoản của bạn.
          </Text>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên trẻ *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nhập tên trẻ"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Nhập email trẻ"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tuổi *</Text>
            <TextInput
              style={styles.input}
              value={formData.age.toString()}
              onChangeText={(text) => setFormData({ ...formData, age: parseInt(text) || 5 })}
              placeholder="5"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Giới tính *</Text>
            <View style={styles.genderSelector}>
              {['male', 'female', 'other'].map((gender, index) => (
                <TouchableOpacity
                  key={gender || `gender-${index}`}
                  style={[
                    styles.genderOption,
                    formData.gender === gender && styles.genderOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, gender: gender as any })}
                >
                  <Text style={[
                    styles.genderOptionText,
                    formData.gender === gender && styles.genderOptionTextActive
                  ]}>
                    {gender === 'male' ? 'Nam' : 
                     gender === 'female' ? 'Nữ' : 'Khác'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mức độ học tập *</Text>
            <View style={styles.levelSelector}>
              {['beginner', 'intermediate', 'advanced'].map((level, index) => (
                <TouchableOpacity
                  key={level || `level-${index}`}
                  style={[
                    styles.levelOption,
                    formData.learningLevel === level && styles.levelOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, learningLevel: level as any })}
                >
                  <Text style={[
                    styles.levelOptionText,
                    formData.learningLevel === level && styles.levelOptionTextActive
                  ]}>
                    {level === 'beginner' ? 'Cơ bản' :
                     level === 'intermediate' ? 'Trung bình' : 'Nâng cao'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
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

function InviteChildModal({ visible, onClose, onSend }: {
  visible: boolean;
  onClose: () => void;
  onSend: () => void;
}) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    try {
      setSending(true);
      await api.children.inviteByEmail(email);
      Alert.alert('Thành công', 'Đã gửi lời mời qua email');
      setEmail('');
      onClose();
      onSend();
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể gửi lời mời');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Mời trẻ qua email</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email trẻ *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email trẻ"
              keyboardType="email-address"
            />
            <Text style={styles.helpText}>
              Trẻ sẽ nhận được email mời tham gia hệ thống học tập
            </Text>
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveButton, sending && styles.saveButtonDisabled]} 
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Gửi lời mời</Text>
            )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
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
  childCard: {
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
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  genderBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  childEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  childAge: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  childLevel: {
    marginTop: 4,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  levelText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  childActions: {
    flexDirection: 'row',
    gap: 8,
  },
  classList: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    marginRight: 6,
    marginTop: 4,
    gap: 4,
  },
  classChipText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  classTeacher: {
    fontSize: 13,
    color: '#1976D2',
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 13,
    color: '#666',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  invitationCard: {
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
  invitationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invitationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  invitationEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  invitationChildName: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 2,
  },
  invitationParentName: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 2,
  },
  invitationMessage: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  invitationDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  invitationExpiry: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteInvitationButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
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
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  genderSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: '#2196F3',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#666',
  },
  genderOptionTextActive: {
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
    backgroundColor: '#4CAF50',
  },
  levelOptionText: {
    fontSize: 14,
    color: '#666',
  },
  levelOptionTextActive: {
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
    lineHeight: 20,
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
    backgroundColor: '#2196F3',
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
  gameResultCard: {
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
  gameResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameResultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gameResultInfo: {
    flex: 1,
  },
  gameResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  gameResultType: {
    fontSize: 12,
    color: '#666',
  },
  gameResultScore: {
    alignItems: 'center',
  },
  gameResultScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  gameResultScoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  gameResultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameResultDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameResultDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});
