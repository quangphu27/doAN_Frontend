import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';

const { width } = Dimensions.get('window');

interface Lesson {
  id: string;
  title: string;
  category: 'letter' | 'number' | 'color' | 'action';
  level: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  description?: string;
  estimatedTime: number;
}

export default function LearningScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { id: 'all', name: 'Tất cả', icon: 'apps', color: '#FF6B6B' },
    { id: 'letter', name: 'Chữ cái', icon: 'text', color: '#4ECDC4' },
    { id: 'number', name: 'Số đếm', icon: 'calculator', color: '#45B7D1' },
    { id: 'color', name: 'Màu sắc', icon: 'color-palette', color: '#96CEB4' },
    { id: 'action', name: 'Hành động', icon: 'walk', color: '#FFEAA7' }
  ];

  useEffect(() => {
    loadLessons();
  }, [selectedCategory]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 20 };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      const response = await api.lessons.list(params);
      setLessons(response.data.lessons || []);
    } catch (error) {
      console.error('Error loading lessons:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách bài học');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLessons();
    setRefreshing(false);
  };

  const handleLessonPress = (lesson: Lesson) => {
    Alert.alert('Bài học', `Bắt đầu học "${lesson.title}"!`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải bài học...</Text>
      </View>
    );
  }

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.color || '#666';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FF9800';
      case 'advanced':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Cơ bản';
      case 'intermediate':
        return 'Trung bình';
      case 'advanced':
        return 'Nâng cao';
      default:
        return level;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải bài học...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Học tập vui vẻ</Text>
            <Text style={styles.headerSubtitle}>Khám phá thế giới tri thức</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chọn chủ đề</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.categoryCardActive,
                { backgroundColor: category.color }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons name={category.icon as any} size={30} color="#fff" />
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Bài học {selectedCategory !== 'all' ? categories.find(c => c.id === selectedCategory)?.name : ''}
        </Text>
        
        {lessons.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>Chưa có bài học nào</Text>
            <Text style={styles.emptyStateSubtext}>Các bài học mới sẽ xuất hiện ở đây</Text>
          </View>
        ) : (
          <View style={styles.lessonsGrid}>
            {lessons.map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={styles.lessonCard}
                onPress={() => handleLessonPress(lesson)}
              >
                <View style={styles.lessonImageContainer}>
                  {lesson.imageUrl ? (
                    <Image source={{ uri: lesson.imageUrl }} style={styles.lessonImage} />
                  ) : (
                    <View style={[styles.lessonImagePlaceholder, { backgroundColor: getCategoryColor(lesson.category) }]}>
                      <Ionicons name="book" size={40} color="#fff" />
                    </View>
                  )}
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(lesson.level) }]}>
                    <Text style={styles.levelText}>{getLevelText(lesson.level)}</Text>
                  </View>
                </View>
                
                <View style={styles.lessonContent}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  {lesson.description && (
                    <Text style={styles.lessonDescription}>{lesson.description}</Text>
                  )}
                  
                  <View style={styles.lessonFooter}>
                    <View style={styles.lessonTime}>
                      <Ionicons name="time" size={14} color="#666" />
                      <Text style={styles.lessonTimeText}>{lesson.estimatedTime} phút</Text>
                    </View>
                    <View style={styles.lessonCategory}>
                      <Ionicons name="pricetag" size={14} color="#666" />
                      <Text style={styles.lessonCategoryText}>
                        {categories.find(c => c.id === lesson.category)?.name}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.quickActionText}>Bài học yêu thích</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="trophy" size={24} color="#FF6B6B" />
            <Text style={styles.quickActionText}>Thành tích</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="refresh" size={24} color="#4CAF50" />
            <Text style={styles.quickActionText}>Làm lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoryCard: {
    width: 100,
    height: 100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryCardActive: {
    transform: [{ scale: 1.05 }],
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  lessonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  lessonCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  lessonImageContainer: {
    position: 'relative',
    height: 120,
  },
  lessonImage: {
    width: '100%',
    height: '100%',
  },
  lessonImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  lessonContent: {
    padding: 16,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  lessonDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 12,
  },
  lessonClass: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonTimeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  lessonCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonCategoryText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});
