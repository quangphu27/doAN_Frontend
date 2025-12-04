import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface GameTypeSelectionProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: 'coloring' | 'puzzle' | 'guessing') => void;
}

export default function GameTypeSelection({ visible, onClose, onSelectType }: GameTypeSelectionProps) {
  const gameTypes = [
    {
      type: 'coloring' as const,
      title: 'Game Tô Màu',
      description: 'Tạo game tô màu với ảnh trắng đen và bảng màu gợi ý',
      icon: 'color-palette',
      color: '#4ECDC4',
      features: ['Ảnh trắng đen', 'Bảng màu gợi ý', 'Lưu trạng thái tô màu']
    },
    {
      type: 'puzzle' as const,
      title: 'Game Xếp Hình',
      description: 'Tạo game xếp hình với ảnh gốc và số mảnh tùy chọn',
      icon: 'grid',
      color: '#FF6B6B',
      features: ['Ảnh gốc', 'Số mảnh 2x2 đến 5x5', 'Hệ thống gợi ý']
    },
    {
      type: 'guessing' as const,
      title: 'Game Đoán Hành Động',
      description: 'Tạo game đoán hành động với hình ảnh/video/gif và 4 đáp án',
      icon: 'eye',
      color: '#9B59B6',
      features: ['Hình ảnh/Video/GIF', '4 đáp án cho mỗi câu', 'Nhiều câu hỏi']
    }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#FF6B6B', '#E53E3E']}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Chọn loại game</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Chọn loại game bạn muốn tạo để bắt đầu thiết lập
            </Text>

            <View style={styles.gameTypesContainer}>
              {gameTypes.map((gameType) => (
                <TouchableOpacity
                  key={gameType.type}
                  style={[styles.gameTypeCard, { borderColor: gameType.color }]}
                  onPress={() => onSelectType(gameType.type)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: gameType.color }]}>
                    <Ionicons name={gameType.icon as any} size={32} color="#fff" />
                  </View>
                  
                  <View style={styles.gameTypeInfo}>
                    <Text style={styles.gameTypeTitle}>{gameType.title}</Text>
                    <Text style={styles.gameTypeDescription}>{gameType.description}</Text>
                    
                    <View style={styles.featuresContainer}>
                      {gameType.features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <Ionicons name="checkmark-circle" size={14} color={gameType.color} />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  gameTypesContainer: {
    gap: 16,
  },
  gameTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  gameTypeInfo: {
    flex: 1,
  },
  gameTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  gameTypeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  featuresContainer: {
    gap: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
  },
  arrowContainer: {
    padding: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});
