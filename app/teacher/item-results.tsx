import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { API } from '../../constants/config';

interface StudentResult {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  classId?: string;
  className?: string;
  score: number;
  timeSpent: number;
  completedAt?: string;
  attempts: number;
  resultImage?: string | null;
  answers?: Array<{
    exerciseId: string;
    displayId?: string;
    questionLabel?: string;
    questionText?: string;
    answer: string;
    isCorrect: boolean;
  }>;
}

export default function ItemResults() {
  const router = useRouter();
  const { type, itemId, title } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState<StudentResult[]>([]);
  const [notSubmitted, setNotSubmitted] = useState<StudentResult[]>([]);
  const [summary, setSummary] = useState<{ totalStudents: number; submittedCount: number; notSubmittedCount: number; averageScore: number }>({
    totalStudents: 0,
    submittedCount: 0,
    notSubmittedCount: 0,
    averageScore: 0
  });
  const [itemInfo, setItemInfo] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [itemId, type]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (type === 'lesson') {
        const res = await api.lessons.getResults(itemId as string);
        setItemInfo(res.data.lesson);
        setSubmitted(res.data.submittedStudents || []);
        setNotSubmitted(res.data.notSubmittedStudents || []);
        setSummary(res.data.summary || summary);
      } else {
        const res = await api.games.getResults(itemId as string);
        setItemInfo(res.data.game);
        setSubmitted(res.data.submittedStudents || []);
        setNotSubmitted(res.data.notSubmittedStudents || []);
        setSummary(res.data.summary || summary);
      }
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}p${s.toString().padStart(2, '0')}s`;
  };

  const goDetail = (studentId: string, studentName?: string) => {
    router.push({
      pathname: '/result-detail',
      params: {
        type,
        itemId,
        title: title || itemInfo?.title || itemInfo?.tieuDe,
        studentId,
        studentName: studentName || '',
      }
    } as any);
  };

  const buildImage = (path?: string | null) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${API}/${path}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || itemInfo?.title || itemInfo?.tieuDe || 'Kết quả'}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalStudents}</Text>
            <Text style={styles.summaryLabel}>Tổng HS</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.submittedCount}</Text>
            <Text style={styles.summaryLabel}>Đã nộp</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.notSubmittedCount}</Text>
            <Text style={styles.summaryLabel}>Chưa nộp</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: getScoreColor(summary.averageScore) }]}>{summary.averageScore}%</Text>
            <Text style={styles.summaryLabel}>Điểm TB</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Học sinh đã nộp ({submitted.length})</Text>
        {submitted.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có học sinh nào nộp</Text>
        ) : (
          submitted.map((s) => (
            <View key={s.studentId} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle" size={36} color="#4CAF50" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.name}>{s.studentName}</Text>
                  <Text style={styles.sub}>{s.className}</Text>
                </View>
                <Text style={[styles.score, { color: getScoreColor(s.score) }]}>{s.score}%</Text>
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.statText}>Thời gian: {formatTime(s.timeSpent || 0)}</Text>
                <Text style={styles.statText}>Lần thử: {s.attempts || 1}</Text>
              </View>
              {s.resultImage && (
                <Image source={{ uri: buildImage(s.resultImage) }} style={styles.preview} resizeMode="cover" />
              )}
              <TouchableOpacity style={styles.detailBtn} onPress={() => goDetail(s.studentId, s.studentName)}>
                <Text style={styles.detailText}>Xem chi tiết</Text>
                <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Học sinh chưa nộp ({notSubmitted.length})</Text>
        {notSubmitted.length === 0 ? (
          <Text style={styles.emptyText}>Tất cả học sinh đã nộp</Text>
        ) : (
          notSubmitted.map((s) => (
            <View key={s.studentId} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle-outline" size={36} color="#999" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.name}>{s.studentName}</Text>
                  <Text style={styles.sub}>{s.className}</Text>
                </View>
                <Text style={styles.pendingText}>Chưa nộp</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getScoreColor = (score: number) => {
  if (score >= 90) return '#4CAF50';
  if (score >= 70) return '#FF9800';
  if (score >= 50) return '#FF5722';
  return '#F44336';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  content: { padding: 16 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    marginBottom: 16
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#333' },
  summaryLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyText: { color: '#888', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#333' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  score: { fontSize: 18, fontWeight: '700' },
  pendingText: { fontSize: 14, color: '#F44336', fontWeight: '600' },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  statText: { fontSize: 13, color: '#444' },
  preview: { marginTop: 10, height: 180, borderRadius: 10, backgroundColor: '#eee' },
  detailBtn: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 14, color: '#4CAF50', fontWeight: '600' }
});

