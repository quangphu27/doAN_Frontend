import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { API } from '../../constants/config';

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
	teacherScore?: number | null;
	gradingStatus?: string;
	progressId?: string;
	resultImage?: string | null;
	comment?: string;
	timeSpent: number;
	attempts: number;
	answers?: Answer[];
}

export default function ResultDetail() {
	const router = useRouter();
	const { type, itemId, title, studentId, studentName, gameType, progressId, backTo } = useLocalSearchParams();
	const [loading, setLoading] = useState(true);
	const [result, setResult] = useState<StudentResult | null>(null);
	const [questionMap, setQuestionMap] = useState<Record<string, { question?: string; correctAnswer?: string; label?: string; options?: string[] }>>({});
	const [teacherScoreInput, setTeacherScoreInput] = useState<string>('');
	const [commentInput, setCommentInput] = useState<string>('');
	const [saving, setSaving] = useState(false);

	const isColoringGame = gameType === 'toMau' || gameType === 'coloring';

	const parsedBackTo = (() => {
		if (!backTo) return null;
		try {
			return JSON.parse(backTo as string);
		} catch (e) {
			return null;
		}
	})();

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
				const list = res.data.submittedStudents || [];
				const found = list.find((s: any) => s.studentId === studentId) || list[0];
				if (!found) {
					console.log('[ResultDetail] lesson no result found for studentId', studentId, 'list length', list.length);
					setResult(null);
					return;
				}

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
				const merged: StudentResult = { ...found, answers: enrichedAnswers };
				setResult(merged);
				console.log('[ResultDetail] lesson enriched answers', merged);
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

				const list = res.data.submittedStudents || [];
				const found = list.find((s: any) => s.studentId === studentId) || list[0];
				if (!found) {
					console.log('[ResultDetail] game no result found for studentId', studentId, 'list length', list.length);
					setResult(null);
					return;
				}

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
				const merged: StudentResult = { 
					...found, 
					answers: enrichedAnswers,
					progressId: (found as any).progressId || (progressId as string | undefined) || undefined
				};
				setResult(merged);
				setTeacherScoreInput(
					typeof merged.teacherScore === 'number' ? String(merged.teacherScore) : ''
				);
				setCommentInput((merged as any).comment || '');
				console.log('[ResultDetail] game enriched answers', merged);
			}
		} catch (e: any) {
			console.log('[ResultDetail] loadData error', e?.message || e);
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

	const buildImage = (path?: string | null) => {
		if (!path) return undefined;
		if (path.startsWith('http')) return path;

		let cleaned = path.replace(/\\/g, '/');
		cleaned = cleaned.replace(/^\/+/, '');
		cleaned = cleaned.replace(/^uploads\/+uploads\//, 'uploads/');

		if (!cleaned.startsWith('uploads/')) {
			cleaned = `uploads/${cleaned}`;
		}

		return `${API}/${cleaned}`;
	};

	const handleSaveGrade = async () => {
		if (!result || !result.progressId) return;
		const scoreValue = parseFloat(teacherScoreInput);
		if (Number.isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
			alert('Điểm phải từ 0 đến 100');
			return;
		}

		try {
			setSaving(true);
			const payload = {
				teacherScore: scoreValue,
				comment: commentInput
			};
			await api.games.gradeResult(result.progressId as any, payload);
			setResult(prev => prev ? { ...prev, teacherScore: scoreValue } : prev);
		} catch (e) {
			console.log('[ResultDetail] grade error', e);
		} finally {
			setSaving(false);
		}
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

	const teacherScoreValue = typeof result.teacherScore === 'number' ? result.teacherScore : null;
	const displayScore = isColoringGame 
		? (teacherScoreValue !== null ? teacherScoreValue : null)
		: (teacherScoreValue !== null ? teacherScoreValue : (result.score ?? 0));
	const resultImageUri = buildImage(
		result.resultImage ||
		(result as any).resultImagePath ||
		(result as any).tepKetQua ||
		''
	);

	const handleGoBack = () => {
		const fallbackDest = {
			pathname: '/teacher/item-results',
			params: {
				type,
				itemId,
				title
			}
		};

		const dest = (parsedBackTo && parsedBackTo.pathname) ? parsedBackTo : fallbackDest;
		router.replace(dest as any);
	};

	return (
		<View style={styles.container}>
			<LinearGradient colors={['#4CAF50', '#45A049']} style={styles.header}>
				<TouchableOpacity onPress={handleGoBack}>
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
						<Text style={styles.infoItem}>
							Điểm:{' '}
							{isColoringGame && displayScore === null ? (
								<Text style={[styles.bold, { color: '#999' }]}>Chưa có điểm</Text>
							) : (
								<Text style={[styles.bold, { color: '#4CAF50' }]}>{displayScore}</Text>
							)}
						</Text>
						<Text style={styles.infoItem}>Thời gian: {formatTime(result.timeSpent || 0)}</Text>
					</View>
					{isColoringGame && resultImageUri && (
						<Image
							source={{ uri: resultImageUri }}
							style={styles.coloringPreview}
							resizeMode="contain"
						/>
					)}
				</View>

				{isColoringGame && (
					<View style={styles.gradingCard}>
						<Text style={styles.sectionTitle}>Chấm điểm trò chơi tô màu</Text>
						<View style={styles.gradeRow}>
							<Text style={styles.gradeLabel}>Điểm (0-100):</Text>
							<TextInput
								style={styles.gradeInput}
								value={teacherScoreInput}
								onChangeText={setTeacherScoreInput}
								keyboardType="numeric"
								placeholder="Nhập điểm"
							/>
						</View>
		
						<TouchableOpacity
							style={[styles.saveButton, saving && { opacity: 0.6 }]}
							onPress={handleSaveGrade}
							disabled={saving}
						>
							<Text style={styles.saveButtonText}>{saving ? 'Đang lưu...' : 'Lưu chấm điểm'}</Text>
						</TouchableOpacity>
					</View>
				)}

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
	coloringPreview: {
		marginTop: 12,
		width: '100%',
		height: 260,
		borderRadius: 12,
		backgroundColor: '#eee'
	},
	gradingCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 14,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 3,
		elevation: 1
	},
	gradeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
		marginBottom: 8
	},
	gradeLabel: {
		fontSize: 14,
		color: '#444',
		marginRight: 8
	},
	gradeInput: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 8,
		fontSize: 14,
		backgroundColor: '#fafafa'
	},
	commentInput: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 8,
		fontSize: 14,
		backgroundColor: '#fafafa',
		minHeight: 60,
		textAlignVertical: 'top',
		marginTop: 6
	},
	saveButton: {
		marginTop: 12,
		backgroundColor: '#4CAF50',
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: 'center'
	},
	saveButtonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 15
	},
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

