export const API_URL = 'http://192.168.1.23:5000/api';
export const API = 'http://192.168.1.23:5000';
export const APP_NAME = 'Hỗ trợ học tập trẻ em';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info'
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  CHILDREN: {
    LIST: '/children',
    CREATE: '/children',
    GET: '/children/:id',
    UPDATE: '/children/:id',
    DELETE: '/children/:id',
    STATS: '/children/:id/stats',
    PROGRESS: '/children/:id/progress',
    ACTIVITIES: '/children/:childId/activities',
    GAME_RESULTS: '/children/:childId/game-results',
    INVITE: '/children/invite',
    INVITATIONS: '/children/invitations'
  },
  LESSONS: {
    LIST: '/lessons',
    GET: '/lessons/:id',
    CREATE: '/lessons',
    UPDATE: '/lessons/:id',
    DELETE: '/lessons/:id',
    SEARCH: '/lessons/search',
    BY_CATEGORY: '/lessons/category/:category',
    RECOMMENDED: '/lessons/child/:childId/recommended',
    COMPLETE: '/lessons/:id/complete'
  },
  GAMES: {
    LIST: '/games',
    GET: '/games/:id',
    CREATE: '/games',
    UPDATE: '/games/:id',
    DELETE: '/games/:id',
    PLAY: '/games/:id/play',
    UPLOAD_PUZZLE: '/games/upload/puzzle',
    UPLOAD_GUESS: '/games/upload/guess'
  },
  PROGRESS: {
    BY_CHILD: '/progress/child/:childId',
    UPDATE: '/progress/child/:childId',
    STATS: '/progress/stats/:userId',
    RECENT: '/progress/recent/:userId',
    GAME_RESULT: '/progress/game/result',
    LESSON_RESULT: '/progress/lesson/result',
    ACHIEVEMENTS: '/progress/child/:childId/achievements'
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
    UNREAD_COUNT: '/notifications/unread-count',
    DELETE: '/notifications/:id',
    SEND_TO_ALL: '/notifications/send-to-all',
    SEND_TO_CHILD: '/notifications/send-to-child',
    HISTORY: '/notifications/history'
  },
  REPORTS: {
    GENERATE: '/reports/generate',
    LIST: '/reports',
    GET: '/reports/:id',
    DELETE: '/reports/:id'
  },
  USERS: {
    LIST: '/users',
    GET: '/users/:id',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
    RESET_PASSWORD: '/users/:id/reset-password'
  },
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    CHILDREN: '/admin/children',
    REPORTS: '/admin/reports'
  }
};

export const GAME_TYPES = {
  PUZZLE: 'puzzle',
  COLORING: 'coloring',
  MATCHING: 'matching',
  MEMORY: 'memory',
  QUIZ: 'quiz',
  GUESS_IMAGE: 'guess_image',
  GUESS_NUMBER: 'guess_number'
};

export const LESSON_CATEGORIES = {
  LETTER: 'letter',
  NUMBER: 'number',
  COLOR: 'color',
  ACTION: 'action'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  PARENT: 'parent',
  CHILD: 'child'
};

export const NOTIFICATION_TYPES = {
  REMINDER: 'reminder',
  SUMMARY: 'summary',
  ACHIEVEMENT: 'achievement',
  SYSTEM: 'system',
  SCHEDULE: 'schedule'
};

export const LEARNING_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

export const EXERCISE_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  FILL_BLANK: 'fill_blank',
  DRAG_DROP: 'drag_drop',
  MATCHING: 'matching',
  COLORING: 'coloring'
};

export const COLORS = {
  PRIMARY: '#4CAF50',
  SECONDARY: '#2196F3',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  LIGHT: '#f8f9fa',
  DARK: '#333333',
  WHITE: '#ffffff',
  GRAY: '#666666',
  LIGHT_GRAY: '#cccccc'
};

export const DIMENSIONS = {
  BORDER_RADIUS: 8,
  BORDER_RADIUS_LARGE: 12,
  PADDING: 16,
  PADDING_LARGE: 20,
  MARGIN: 12,
  MARGIN_LARGE: 16
};

export const FONT_SIZES = {
  SMALL: 12,
  MEDIUM: 14,
  LARGE: 16,
  XLARGE: 18,
  XXLARGE: 20,
  TITLE: 24
};

export const FONT_WEIGHTS = {
  NORMAL: '400',
  MEDIUM: '500',
  SEMIBOLD: '600',
  BOLD: '700'
};