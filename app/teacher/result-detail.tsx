import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';

interface Answer {
	exerciseId: string;
	displayId?: string;
	questionLabel?: string;
	questionText?: string;
	correctAnswer?: string;
	answer: string;
	isCorrect: boolean;
}

interface StudentResult {
	studentId: string;
	studentName: string;
	className?: string;
	score: number;
	timeSpent: number;
	attempts: number;
	answers?: Answer[];
}

export default function ResultDetail() {
	const router = useRouter();
	const { type, itemId, title, studentId, studentName } = useLocalSearchParams();
	const [loading, setLoading] = useState(true);
	const [result, setResult] = useState<StudentResult | null>(null);
const [questionMap, setQuestionMap] = useState<Record<string, { question?: string; correctAnswer?: string; label?: string; options?: string[] }>>({});

	useEffect(() => {
		loadData();
	}, [type, itemId, studentId]);

	// Log để kiểm tra dữ liệu trả về
	useEffect(() => {
		if (result) {
			console.log('[ResultDetail] result', result);
			console.log('[ResultDetail] questionMap', questionMap);
		}
	}, [result, questionMap]);

	const loadData = async () => {
		try {
			setLoading(true);
			if (type === 'lesson') {
				const res = await api.lessons.getResults(itemId as string);
				const exercises: any[] = res.data.exercises || [];
				const qMap: Record<string, { question?: string; correctAnswer?: string; label?: string; options?: string[] }> = {};
				exercises.forEach((ex, idx) => {
					const id = ex.id?.toString();
					if (!id) return;
					qMap[id] = {
						question: ex.question,
						correctAnswer: ex.correctAnswer,
						label: `Câu ${idx + 1}`,
						options: Array.isArray(ex.options) ? ex.options : ex.phuongAn || []
					};
				});
				setQuestionMap(qMap);
				console.log('[ResultDetail] lesson qMap', qMap);
				const found = (res.data.submittedStudents || []).find((s: any) => s.studentId === studentId);
				if (found) {
					const enrichedAnswers = (found.answers || []).map((a: Answer, idx: number) => {
						const info = qMap[a.exerciseId] || {};
						return {
							...a,
							questionText: a.questionText || info.question,
							correctAnswer: a.correctAnswer || info.correctAnswer,
							questionLabel: a.questionLabel || info.label || `Câu ${idx + 1}`,
							displayId: a.displayId || a.questionLabel || info.label || `Câu ${idx + 1}`
						};
					});
					const merged = { ...found, answers: enrichedAnswers };
					setResult(merged);
					console.log('[ResultDetail] lesson enriched answers', merged);
				} else {
					setResult(null);
				}
			} else {
				const [res, gameDetail] = await Promise.all([
					api.games.getResults(itemId as string),
					api.games.get(itemId as string)
				]);

				const qMap: Record<string, { question?: string; correctAnswer?: string; label?: string; options?: string[] }> = {};
				const questions =
					gameDetail?.data?.duLieu?.cauHoi ||
					gameDetail?.data?.questions ||
					gameDetail?.data?.data?.questions ||
					gameDetail?.data?.data?.cauHoi ||
					[];
				if (Array.isArray(questions)) {
					questions.forEach((q: any, idx: number) => {
						const id = (q.id || q._id || q.questionId)?.toString();
						if (!id) return;
						qMap[id] = {
							question: q.cauHoi || q.question,
							correctAnswer: q.dapAnDung || q.correctAnswer,
							label: `Câu ${idx + 1}`,
							options: Array.isArray(q.options) ? q.options : q.phuongAn || []
						};
					});
				}
				setQuestionMap(qMap);
				console.log('[ResultDetail] game qMap', qMap);

				const found = (res.data.submittedStudents || []).find((s: any) => s.studentId === studentId);
				if (found) {
					const enrichedAnswers = (found.answers || []).map((a: Answer, idx: number) => {
						const info = qMap[a.exerciseId] || {};
						return {
							...a,
							questionText: a.questionText || info.question,
							correctAnswer: a.correctAnswer || info.correctAnswer,
							questionLabel: a.questionLabel || info.label || `Câu ${idx + 1}`,
							displayId: a.displayId || a.questionLabel || info.label || `Câu ${idx + 1}`
						};
					});
					const merged = { ...found, answers: enrichedAnswers };
					setResult(merged);
					console.log('[ResultDetail] game enriched answers', merged);
				} else {
					setResult(null);
				}
			}
		} catch (e: any) {
			setResult(null);
		} finally {
			setLoading(false);
		}
	};

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}p${s.toString().padStart(2, '0')}s`;
	};

	const renderAnswer = (a: Answer, idx: number) => {
		const info = questionMap[a.exerciseId] || {};
		const label = a.displayId || a.questionLabel || info.label || `Câu ${idx + 1}`;
		const question = a.questionText || info.question || '';
		const correct = a.correctAnswer || info.correctAnswer;
		const options = info.options;

		return (
			<View key={`${a.exerciseId}-${idx}`} style={styles.answerCard}>
				<View style={styles.answerHeader}>
					<Text style={styles.answerLabel}>{label}</Text>
					<Ionicons
						name={a.isCorrect ? 'checkmark-circle' : 'close-circle'}
						size={18}
						color={a.isCorrect ? '#4CAF50' : '#F44336'}
					/>
				</View>
				<Text style={styles.questionText}>
					{question || '(Chưa có nội dung câu hỏi)'}
				</Text>
				{Array.isArray(options) && options.length > 0 && (
					<View style={styles.optionsBox}>
						{options.map((opt, i) => (
							<Text key={`${a.exerciseId}-opt-${i}`} style={styles.optionText}>
								{opt}
							</Text>
						))}
					</View>
				)}
				<Text style={styles.answerText}>Đáp án của HS: {a.answer}</Text>
				{typeof correct !== 'undefined' && correct !== '' && (
					<Text style={styles.correctText}>Đáp án đúng: {correct}</Text>
				)}
			</View>
		);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#4CAF50" />
			</View>
		);
	}

	if (!result) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>Không tìm thấy kết quả</Text>
				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
					<Text style={styles.backButtonText}>Quay lại</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<LinearGradient colors={['#4CAF50', '#45A049']} style={styles.header}>
				<TouchableOpacity onPress={() => router.back()}>
					<Ionicons name="arrow-back" size={24} color="#fff" />
				</TouchableOpacity>
				<View style={{ flex: 1, alignItems: 'center' }}>
					<Text style={styles.headerTitle}>{title || 'Kết quả chi tiết'}</Text>
					<Text style={styles.headerSub}>{studentName || result.studentName}</Text>
				</View>
				<View style={{ width: 24 }} />
			</LinearGradient>

			<ScrollView style={styles.content}>
				<View style={styles.infoCard}>
					<Text style={styles.infoName}>{result.studentName}</Text>
					<Text style={styles.infoSub}>{result.className}</Text>
					<View style={styles.infoRow}>
						<Text style={styles.infoItem}>Điểm: <Text style={[styles.bold, { color: '#4CAF50' }]}>{result.score}%</Text></Text>
						<Text style={styles.infoItem}>Thời gian: {formatTime(result.timeSpent || 0)}</Text>
					</View>
					<Text style={styles.infoItem}>Lần thử: {result.attempts || 1}</Text>
				</View>

				<Text style={styles.sectionTitle}>Chi tiết câu hỏi</Text>
				{result.answers?.length ? (
					result.answers.map(renderAnswer)
				) : (
					<Text style={styles.emptyText}>Chưa có dữ liệu câu trả lời</Text>
				)}
			</ScrollView>
		</View>
	);
}

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
	headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
	headerSub: { color: '#e8f5e9', fontSize: 13, marginTop: 4 },
	content: { padding: 16 },
	infoCard: {
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
	infoName: { fontSize: 18, fontWeight: '700', color: '#333' },
	infoSub: { fontSize: 13, color: '#666', marginTop: 4 },
	infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
	infoItem: { fontSize: 14, color: '#444', marginTop: 4 },
	bold: { fontWeight: '700' },
	sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 12, marginBottom: 8 },
	answerCard: {
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 12,
		marginBottom: 10,
		borderLeftWidth: 3,
		borderLeftColor: '#4CAF50'
	},
	answerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	answerLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
	questionText: { fontSize: 13, color: '#555', marginTop: 6 },
	optionsBox: { marginTop: 6, gap: 2 },
	optionText: { fontSize: 12, color: '#444' },
	answerText: { fontSize: 13, color: '#333', marginTop: 6 },
	correctText: { fontSize: 13, color: '#4CAF50', marginTop: 4 },
	emptyText: { color: '#888' },
	errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
	errorText: { fontSize: 16, color: '#d32f2f', marginBottom: 12 },
	backButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		backgroundColor: '#4CAF50',
		borderRadius: 8
	},
	backButtonText: { color: '#fff', fontWeight: '700' }
});

