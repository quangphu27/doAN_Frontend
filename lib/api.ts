import { API_URL } from '../constants/config';

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
	accessToken = token;
}

async function request(path: string, options: RequestInit = {}) {
	const headers: any = { 'Content-Type': 'application/json', ...(options.headers || {}) };
	if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
	
	const res = await fetch(`${API_URL}${path}`, { ...options, headers });
	const json = await res.json().catch(() => ({}));
	
	if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
	return json;
}

export const api = {
	auth: {
		login: (email: string, matKhau: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, matKhau }) }),
		register: (hoTen: string, email: string, matKhau: string, vaiTro: 'phuHuynh' | 'hocSinh') => request('/auth/register', { method: 'POST', body: JSON.stringify({ hoTen, email, matKhau, vaiTro }) }),
		logout: () => request('/auth/logout', { method: 'POST' }),
		refresh: (refreshToken: string) => request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
		// route ở FE
		forgot: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
		verifyOTP: (email: string, otp: string) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
		reset: (email: string, otp: string, matKhauMoi: string) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword: matKhauMoi }) }),
		
		getProfile: () => request('/auth/profile'),
		updateProfile: (payload: any) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
		changePassword: (matKhauHienTai: string, matKhauMoi: string) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify({ matKhauHienTai, matKhauMoi }) })
	},
	children: {
		list: () => request('/children'),
		create: (payload: any) => request('/children', { method: 'POST', body: JSON.stringify(payload) }),
		get: (id: string) => request(`/children/${id}`),
		update: (id: string, payload: any) => request(`/children/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
		delete: (id: string) => request(`/children/${id}`, { method: 'DELETE' }),
		getStats: (id: string) => request(`/children/${id}/stats`),
		getProgress: (id: string) => request(`/children/${id}/progress`),
		getActivities: (childId: string, params?: any) => request(`/children/${childId}/activities${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		getGameResults: (childId: string, params?: any) => request(`/children/${childId}/game-results${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		inviteByEmail: (email: string) => request('/children/invite', { method: 'POST', body: JSON.stringify({ email }) }),
		getInvitations: () => request('/children/invitations')
	},
	lessons: {
		list: (params?: any) => request(`/lessons${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		get: (id: string) => request(`/lessons/${id}`),
		getRandomExercises: (lessonId: string, count: number = 5) => request(`/lessons/${lessonId}/random-exercises?count=${count}`),
		create: (payload: any) => request('/lessons', { method: 'POST', body: JSON.stringify(payload) }),
		update: (id: string, payload: any) => request(`/lessons/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
		delete: (id: string) => request(`/lessons/${id}`, { method: 'DELETE' }),
		search: (params: any) => request(`/lessons/search?${new URLSearchParams(params).toString()}`),
		getByCategory: (category: string, params?: any) => request(`/lessons/category/${category}${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		getRecommended: (childId: string) => request(`/lessons/child/${childId}/recommended`),
		complete: (id: string, childId: string) => request(`/lessons/${id}/complete`, { method: 'POST', body: JSON.stringify({ childId }) }),
		checkCompletion: (lessonId: string, childId: string) => request(`/lessons/${lessonId}/completion/${childId}`),
		getHistory: (childId: string, params?: any) => request(`/lessons/child/${childId}/history${params ? '?' + new URLSearchParams(params).toString() : ''}`)
	},
	progress: {
		get: (id: string) => request(`/progress/${id}`),
		getByChild: (childId: string) => request(`/progress/child/${childId}`),
		update: (childId: string, payload: any) => request(`/progress/child/${childId}`, { method: 'PUT', body: JSON.stringify(payload) }),
		getStats: (userId: string) => request(`/progress/stats/${userId}`),
		getRecent: (userId: string) => request(`/progress/recent/${userId}`),
		recordGameResult: (payload: any) => request('/progress/game', { method: 'POST', body: JSON.stringify(payload) }),
		recordLessonResult: (payload: any) => request('/progress/lesson', { method: 'POST', body: JSON.stringify(payload) }),
		getAchievements: (childId: string) => request(`/progress/child/${childId}/achievements`),
		getDetailReport: (childId: string) => request(`/progress/child/${childId}/detail`)
	},
	reports: {
		generate: (payload: any) => request('/reports/generate', { method: 'POST', body: JSON.stringify(payload) }),
		list: (params?: any) => request(`/reports${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		get: (id: string) => request(`/reports/${id}`),
		delete: (id: string) => request(`/reports/${id}`, { method: 'DELETE' })
	},
	notifications: {
		list: () => request('/notifications'),
		markAsRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
		markAllAsRead: () => request('/notifications/read-all', { method: 'PUT' }),
		getUnreadCount: () => request('/notifications/unread-count'),
		delete: (id: string) => request(`/notifications/${id}`, { method: 'DELETE' }),
		sendToAll: (payload: any) => request('/notifications/send-to-all', { method: 'POST', body: JSON.stringify(payload) }),
		sendToChild: (payload: any) => request('/notifications/send-to-child', { method: 'POST', body: JSON.stringify(payload) }),
		getHistory: (params?: any) => request(`/notifications/history${params ? '?' + new URLSearchParams(params).toString() : ''}`)
	},
	admin: {
		stats: () => request('/admin/stats'),
		users: (params?: any) => request(`/admin/users${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		children: (params?: any) => request(`/admin/children${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		reports: (params?: any) => request(`/admin/reports${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		trialAccounts: (params?: any) => request(`/admin/trial-accounts${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		trialStats: () => request('/admin/trial-stats'),
		activateTrialAccount: (userId: string) => request(`/admin/trial-accounts/${userId}/activate`, { method: 'POST' }),
		deactivateTrialAccount: (userId: string) => request(`/admin/trial-accounts/${userId}/deactivate`, { method: 'POST' }),
		extendTrialPeriod: (userId: string, days: number) => request(`/admin/trial-accounts/${userId}/extend`, { method: 'POST', body: JSON.stringify({ days }) })
	},
	users: {
		list: (params?: any) => request(`/users${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		get: (id: string) => request(`/users/${id}`),
		create: (payload: any) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
		update: (id: string, payload: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
		delete: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
		resetPassword: (id: string, payload: any) => request(`/users/${id}/reset-password`, { method: 'PUT', body: JSON.stringify(payload) })
	},
		games: {
		list: (params?: any) => request(`/games${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		get: (id: string) => request(`/games/${id}`),
		create: (payload: any) => request('/games', { method: 'POST', body: JSON.stringify(payload) }),
		update: (id: string, payload: any) => {
			const headers: any = { 'Content-Type': 'application/json' };
			if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
			return fetch(`${API_URL}/games/${id}`, { method: 'PUT', body: JSON.stringify(payload), headers });
		},
		delete: (id: string) => request(`/games/${id}`, { method: 'DELETE' }),
		uploadPuzzle: (formData: FormData) => {
			const headers: any = {};
			if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
			return fetch(`${API_URL}/games/upload/puzzle`, { method: 'POST', body: formData, headers });
		},
		uploadGuess: (formData: FormData) => {
			const headers: any = {};
			if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
			return fetch(`${API_URL}/games/upload/guess`, { method: 'POST', body: formData, headers });
		},
		play: (id: string, payload: any) => request(`/games/${id}/play`, { method: 'POST', body: JSON.stringify(payload) }),
		createColoring: (formData: FormData) => {
			const headers: any = {};
			if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
			return fetch(`${API_URL}/games/create/coloring`, { method: 'POST', body: formData, headers });
		},
		createPuzzle: (formData: FormData) => {
			const headers: any = {};
			if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
			return fetch(`${API_URL}/games/create/puzzle`, { method: 'POST', body: formData, headers });
		},
		createMatching: (payload: any) => request('/games/create/matching', { method: 'POST', body: JSON.stringify(payload) }),
		createGuessing: (formData: FormData) => {
			const headers: any = {};
			if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
			return fetch(`${API_URL}/games/create/guessing`, { method: 'POST', body: formData, headers });
		},
		saveResult: (payload: any) => request('/games/result', { method: 'POST', body: JSON.stringify(payload) }),
		getHistory: (childId: string, params?: any) => request(`/games/child/${childId}/history${params ? '?' + new URLSearchParams(params).toString() : ''}`)
	},
	appSessions: {
		start: (childId: string) => request('/app-sessions/start', { method: 'POST', body: JSON.stringify({ childId }) }),
		end: (childId: string) => request('/app-sessions/end', { method: 'POST', body: JSON.stringify({ childId }) }),
		getChildSessions: (childId: string, params?: any) => request(`/app-sessions/child/${childId}${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		getTotalUsageTime: (childId: string, params?: any) => request(`/app-sessions/child/${childId}/total-time${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		getLastActivityTime: (childId: string) => request(`/app-sessions/child/${childId}/last-activity`)
	},
	classes: {
		list: (params?: any) => request(`/classes${params ? '?' + new URLSearchParams(params).toString() : ''}`),
		get: (id: string) => request(`/classes/${id}`),
		create: (payload: any) => request('/classes', { method: 'POST', body: JSON.stringify(payload) }),
		update: (id: string, payload: any) => request(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
		delete: (id: string) => request(`/classes/${id}`, { method: 'DELETE' }),
		addTeacher: (id: string, emailGiaoVien: string) => request(`/classes/${id}/teacher`, { method: 'POST', body: JSON.stringify({ emailGiaoVien }) }),
		addStudent: (id: string, emailHocSinh: string) => request(`/classes/${id}/students`, { method: 'POST', body: JSON.stringify({ emailHocSinh }) }),
		removeStudent: (id: string, studentId: string) => request(`/classes/${id}/students/${studentId}`, { method: 'DELETE' }),
		getProgress: (id: string) => request(`/classes/${id}/progress`),
		getStudentProgress: (id: string, studentId: string) => request(`/classes/${id}/students/${studentId}/progress`),
		createLesson: (classId: string, payload: any) => request(`/classes/${classId}/lessons`, { method: 'POST', body: JSON.stringify(payload) }),
		createGame: (classId: string, payload: any) => request(`/classes/${classId}/games`, { method: 'POST', body: JSON.stringify(payload) })
	}
};
