import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';

interface Class {
  _id: string;
  tenLop: string;
  moTa?: string;
  maLop: string;
  giaoVien: {
    _id: string;
    hoTen: string;
    email: string;
  };
  hocSinh: Array<{
    _id: string;
    hoTen: string;
    ngaySinh?: string;
    gioiTinh: string;
  }>;
  baiTap: Array<{
    _id: string;
    tieuDe: string;
    danhMuc: string;
  }>;
  troChoi: Array<{
    _id: string;
    tieuDe: string;
    loai: string;
  }>;
}

export default function ClassDetails() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassDetails();
  }, []);

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
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin lớp</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã lớp:</Text>
              <Text style={styles.infoValue}>{classData.maLop}</Text>
            </View>
            {classData.moTa && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mô tả:</Text>
                <Text style={styles.infoValue}>{classData.moTa}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giáo viên:</Text>
              <Text style={styles.infoValue}>{classData.giaoVien.hoTen}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Học sinh ({classData.hocSinh.length})</Text>
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
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bài tập ({classData.baiTap.length})</Text>
          {classData.baiTap.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Chưa có bài tập nào</Text>
            </View>
          ) : (
            classData.baiTap.map((lesson) => (
              <View key={lesson._id} style={styles.lessonCard}>
                <Ionicons name="book" size={24} color="#FF9800" />
                <Text style={styles.lessonTitle}>{lesson.tieuDe}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trò chơi ({classData.troChoi.length})</Text>
          {classData.troChoi.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Chưa có trò chơi nào</Text>
            </View>
          ) : (
            classData.troChoi.map((game) => (
              <View key={game._id} style={styles.gameCard}>
                <Ionicons name="game-controller" size={24} color="#F44336" />
                <Text style={styles.gameTitle}>{game.tieuDe}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
  placeholder: {
    width: 24
  },
  content: {
    flex: 1
  },
  section: {
    margin: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center'
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
  lessonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  lessonTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  gameTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1
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
  }
});

