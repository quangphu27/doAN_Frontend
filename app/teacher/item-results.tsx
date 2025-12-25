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
  teacherScore?: number | null;
  gradingStatus?: string;
  progressId?: string;
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
  const { type, itemId, title, backTo } = useLocalSearchParams();

  const parsedBackTo = (() => {
    if (!backTo) return null;
    try {
      return JSON.parse(backTo as string);
    } catch (e) {
      return null;
    }
  })();
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
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, [itemId, type]);

  const loadData = async () => {
    try {
      setLoading(true);
      const normalizeScores = (list: any[]) =>
        list.map((s) => {
          const teacherScore =
            typeof s.teacherScore === 'number'
              ? s.teacherScore
              : typeof s.diemGiaoVien === 'number'
                ? s.diemGiaoVien
                : typeof s.score === 'number'
                  ? s.score
                  : null;
          return { ...s, teacherScore };
        });

      const calcAverage = (list: any[], currentItemInfo: any) => {
        if (!list || list.length === 0) return 0;
        const isColoring = type === 'game' && (currentItemInfo?.type === 'toMau' || currentItemInfo?.loai === 'toMau');
        if (isColoring) {
          const validScores = list.filter(s => typeof s.teacherScore === 'number');
          if (validScores.length === 0) return 0;
          const total = validScores.reduce((sum, s) => sum + (s.teacherScore || 0), 0);
          return Math.round(total / validScores.length);
        }
        const total = list.reduce((sum, s) => {
          const score = typeof s.teacherScore === 'number' ? s.teacherScore : s.score || 0;
          return sum + score;
        }, 0);
        return Math.round(total / list.length);
      };

      if (type === 'lesson') {
        const res = await api.lessons.getResults(itemId as string);
        setItemInfo(res.data.lesson);
        const sub = normalizeScores(res.data.submittedStudents || []);
        setSubmitted(sub);
        setNotSubmitted(res.data.notSubmittedStudents || []);
        const avg = calcAverage(sub, res.data.lesson);
        setSummary({
          totalStudents: res.data.summary?.totalStudents || sub.length + (res.data.notSubmittedStudents?.length || 0),
          submittedCount: sub.length,
          notSubmittedCount: res.data.notSubmittedStudents?.length || 0,
          averageScore: avg
        });
      } else {
        const res = await api.games.getResults(itemId as string);
        setItemInfo(res.data.game);
        const sub = normalizeScores(res.data.submittedStudents || []);
        setSubmitted(sub);
        setNotSubmitted(res.data.notSubmittedStudents || []);
        const avg = calcAverage(sub, res.data.game);
        setSummary({
          totalStudents: res.data.summary?.totalStudents || sub.length + (res.data.notSubmittedStudents?.length || 0),
          submittedCount: sub.length,
          notSubmittedCount: res.data.notSubmittedStudents?.length || 0,
          averageScore: avg
        });
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

  const goDetail = (student: StudentResult) => {
    const backTo = {
      pathname: '/teacher/item-results',
      params: {
        type,
        itemId,
        title: title || itemInfo?.title || itemInfo?.tieuDe
      }
    };
    router.push({
      pathname: '/result-detail',
      params: {
        type,
        itemId,
        title: title || itemInfo?.title || itemInfo?.tieuDe,
        studentId: student.studentId,
        studentName: student.studentName || '',
        gameType: itemInfo?.type || itemInfo?.loai || '',
        progressId: student.progressId || '',
        backTo: JSON.stringify(backTo)
      }
    } as any);
  };

  const buildImage = (path?: string | null) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    let cleaned = path.replace(/\\/g, '/');
    cleaned = cleaned.replace(/^\/+/, '');
    cleaned = cleaned.replace(/^uploads\/+uploads\//, 'uploads/');
    if (!cleaned.startsWith('uploads/')) cleaned = `uploads/${cleaned}`;
    return `${API}/${cleaned}`;
  };

  const handleSendReportEmail = async () => {
    try {
      if (!itemId || !type) return;
      setSending(true);
      if (type === 'lesson') {
        await api.lessons.sendResultsReportEmail(itemId as string);
      } else {
        await api.games.sendResultsReportEmail(itemId as string);
      }
      alert('Đã gửi báo cáo PDF về email của giáo viên.');
    } catch (e: any) {
      alert(e?.message || 'Không thể gửi báo cáo qua email');
    } finally {
      setSending(false);
    }
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
        <TouchableOpacity
          onPress={() => {
            if (parsedBackTo && parsedBackTo.pathname) {
              router.replace(parsedBackTo as any);
            } else if (itemId && type && backTo) {
              // fallback nếu có backTo truyền vào
              router.replace(backTo as any);
            } else if ((useLocalSearchParams() as any).classId) {
              const classIdParam = (useLocalSearchParams() as any).classId;
              router.replace({
                pathname: '/teacher/class-progress',
                params: { classId: classIdParam }
              } as any);
            } else {
              router.back();
            }
          }}
        >
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
            <Text style={[styles.summaryValue, { color: getScoreColor(summary.averageScore) }]}>
              {summary.averageScore}
            </Text>
            <Text style={styles.summaryLabel}>Điểm TB</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50', marginBottom: 16 }]}
          onPress={handleSendReportEmail}
          disabled={sending}
        >
          <Ionicons name="send-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>
            {sending ? 'Đang gửi...' : 'Gửi báo cáo qua email'}
          </Text>
        </TouchableOpacity>

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
                {(() => {
                  const isColoring = type === 'game' && (itemInfo?.type === 'toMau' || itemInfo?.loai === 'toMau');
                  if (isColoring) {
                    if (typeof s.teacherScore === 'number') {
                      return (
                        <Text style={[styles.score, { color: getScoreColor(s.teacherScore) }]}>
                          {s.teacherScore}
                        </Text>
                      );
                    } else {
                      return (
                        <Text style={[styles.score, { color: '#999' }]}>
                          Chưa có điểm
                        </Text>
                      );
                    }
                  } else {
                    const scoreValue = typeof s.teacherScore === 'number' ? s.teacherScore : s.score;
                    return (
                      <Text style={[styles.score, { color: getScoreColor(scoreValue) }]}>
                        {scoreValue}
                      </Text>
                    );
                  }
                })()}
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.statText}>Thời gian: {formatTime(s.timeSpent || 0)}</Text>
              </View>
              {s.resultImage && (
                <Image source={{ uri: buildImage(s.resultImage) }} style={styles.preview} resizeMode="cover" />
              )}
              <TouchableOpacity style={styles.detailBtn} onPress={() => goDetail(s)}>
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
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
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
  detailText: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
});

