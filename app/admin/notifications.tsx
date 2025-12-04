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

interface NotificationHistory {
  id: string;
  _id?: string;
  type: 'reminder' | 'summary' | 'achievement' | 'system' | 'schedule';
  title: string;
  content: string;
  targetRole: 'all' | 'parent' | 'child';
  recipientCount: number;
  status: 'sent' | 'scheduled' | 'failed';
  scheduledAt: string;
  createdAt: string;
}

export default function NotificationManagement() {
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  // Tải lịch sử thông báo từ API
  // Gọi API getHistory để lấy danh sách các thông báo đã gửi
  // Hiển thị loading indicator và thông báo lỗi nếu có
  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await api.notifications.getHistory();
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Error loading notification history:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử thông báo');
    } finally {
      setLoading(false);
    }
  };

  // Làm mới lịch sử thông báo khi người dùng kéo xuống
  // Đặt refreshing = true để hiển thị loading indicator
  // Gọi lại loadHistory() để tải lại dữ liệu
  // Sau khi hoàn thành, đặt refreshing = false
  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  // Lấy màu sắc tương ứng với loại thông báo
  // Reminder: cam, Summary: xanh dương, Achievement: xanh lá, System: tím, Schedule: đỏ cam, các loại khác: xám
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reminder': return '#FF9800';
      case 'summary': return '#2196F3';
      case 'achievement': return '#4CAF50';
      case 'system': return '#9C27B0';
      case 'schedule': return '#FF5722';
      default: return '#666';
    }
  };

  // Lấy icon tương ứng với loại thông báo
  // Reminder: time, Summary: bar-chart, Achievement: trophy, System: settings, Schedule: calendar, các loại khác: notifications
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return 'time';
      case 'summary': return 'bar-chart';
      case 'achievement': return 'trophy';
      case 'system': return 'settings';
      case 'schedule': return 'calendar';
      default: return 'notifications';
    }
  };

  // Lấy màu sắc tương ứng với trạng thái thông báo
  // Sent: xanh lá, Scheduled: cam, Failed: đỏ, các trạng thái khác: xám
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return '#4CAF50';
      case 'scheduled': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#666';
    }
  };

  // Lấy text hiển thị tiếng Việt tương ứng với trạng thái thông báo
  // Sent: "Đã gửi", Scheduled: "Đã lên lịch", Failed: "Thất bại", các trạng thái khác: "Không xác định"
  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Đã gửi';
      case 'scheduled': return 'Đã lên lịch';
      case 'failed': return 'Thất bại';
      default: return 'Không xác định';
    }
  };

  // Định dạng ngày tháng từ chuỗi ISO sang định dạng dễ đọc
  // Ví dụ: "2024-01-15T10:30:00Z" -> "15/01/2024, 10:30"
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9C27B0" />
        <Text style={styles.loadingText}>Đang tải thông báo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#9C27B0', '#7B1FA2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Quản lý thông báo</Text>
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="send" size={20} color="#fff" />
          <Text style={styles.sendButtonText}>Gửi thông báo</Text>
        </TouchableOpacity>
      </LinearGradient>


      <ScrollView
        style={styles.historyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        ) : (
          history.map((notification, index) => (
            <View key={notification.id || notification._id || `notification-${index}`} style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(notification.type) }]}>
                  <Ionicons name={getTypeIcon(notification.type) as any} size={16} color="#fff" />
                </View>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationType}>
                    {notification.type === 'reminder' ? 'Nhắc nhở' :
                     notification.type === 'summary' ? 'Tóm tắt' :
                     notification.type === 'achievement' ? 'Thành tích' :
                     notification.type === 'system' ? 'Hệ thống' : 'Lịch trình'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(notification.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(notification.status)}</Text>
                </View>
              </View>
              <Text style={styles.notificationContent} numberOfLines={3}>
                {notification.content}
              </Text>
              <View style={styles.notificationFooter}>
                <Text style={styles.recipientCount}>
                  {notification.recipientCount} người nhận
                </Text>
                <Text style={styles.notificationDate}>
                  {formatDate(notification.scheduledAt)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <SendNotificationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSend={loadHistory}
      />
    </View>
  );
}


function SendNotificationModal({ visible, onClose, onSend }: {
  visible: boolean;
  onClose: () => void;
  onSend: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'system' as 'reminder' | 'summary' | 'achievement' | 'system' | 'schedule',
    title: '',
    content: '',
    targetRole: 'all' as 'all' | 'parent' | 'child'
  });

  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề và nội dung thông báo');
      return;
    }

    try {
      setSending(true);
      await api.notifications.sendToAll(formData);
      Alert.alert('Thành công', 'Đã gửi thông báo thành công');
      onClose();
      onSend();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi thông báo');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Gửi thông báo</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Loại thông báo *</Text>
            <View style={styles.typeSelector}>
              {['system', 'reminder', 'summary', 'achievement', 'schedule'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    formData.type === type && styles.typeOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, type: type as any })}
                >
                  <Ionicons 
                    name={getTypeIcon(type) as any} 
                    size={16} 
                    color={formData.type === type ? '#fff' : '#666'} 
                  />
                  <Text style={[
                    styles.typeOptionText,
                    formData.type === type && styles.typeOptionTextActive
                  ]}>
                    {type === 'system' ? 'Hệ thống' :
                     type === 'reminder' ? 'Nhắc nhở' :
                     type === 'summary' ? 'Tóm tắt' :
                     type === 'achievement' ? 'Thành tích' : 'Lịch trình'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Đối tượng nhận *</Text>
            <View style={styles.targetSelector}>
              {['all', 'parent', 'child'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.targetOption,
                    formData.targetRole === role && styles.targetOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, targetRole: role as any })}
                >
                  <Text style={[
                    styles.targetOptionText,
                    formData.targetRole === role && styles.targetOptionTextActive
                  ]}>
                    {role === 'all' ? 'Tất cả' :
                     role === 'parent' ? 'Phụ huynh' : 'Trẻ em'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tiêu đề *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Nhập tiêu đề thông báo"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nội dung *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              placeholder="Nhập nội dung thông báo"
              multiline
              numberOfLines={6}
            />
          </View>
        </ScrollView>

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
              <Text style={styles.saveButtonText}>Gửi thông báo</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'reminder': return 'time';
    case 'summary': return 'bar-chart';
    case 'achievement': return 'trophy';
    case 'system': return 'settings';
    case 'schedule': return 'calendar';
    default: return 'notifications';
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  historyContainer: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  notificationCard: {
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
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  notificationContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipientCount: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
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
    height: 120,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  typeOptionActive: {
    backgroundColor: '#9C27B0',
  },
  typeOptionText: {
    fontSize: 12,
    color: '#666',
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  targetSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  targetOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  targetOptionActive: {
    backgroundColor: '#9C27B0',
  },
  targetOptionText: {
    fontSize: 14,
    color: '#666',
  },
  targetOptionTextActive: {
    color: '#fff',
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
    backgroundColor: '#9C27B0',
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
});
