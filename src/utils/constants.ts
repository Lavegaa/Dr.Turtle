// MediaPipe Pose 랜드마크 상수
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  // 추가 랜드마크
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const;

// 자세 상태 상수
export const POSTURE_STATUS = {
  GOOD: 'GOOD',
  WARNING: 'WARNING',
  BAD: 'BAD',
} as const;

// 알림 레벨 상수
export const NOTIFICATION_LEVELS = {
  INFO: {
    priority: 1,
    color: '#10B981',
    icon: '🟢',
    duration: 3000,
  },
  WARNING: {
    priority: 2,
    color: '#F59E0B',
    icon: '🟡',
    duration: 5000,
  },
  DANGER: {
    priority: 3,
    color: '#EF4444',
    icon: '🔴',
    duration: 0,
  },
} as const;

// 기본 임계값 상수
export const DEFAULT_THRESHOLDS = {
  CVA_WARNING: 65,
  CVA_DANGER: 50,
  MIN_DISTANCE: 50,
  ALERT_DELAY: 30000, // 30초
  WARNING_DELAY: 60000, // 1분
} as const;

// 성능 최적화 상수
export const PERFORMANCE_CONFIG = {
  TARGET_FPS: 5,
  MAX_HISTORY_SIZE: 25, // 5초 * 5fps
  PROCESSING_TIMEOUT: 100,
} as const;

// 실제 얼굴 크기 상수 (cm)
export const FACE_MEASUREMENTS = {
  EYE_DISTANCE: 6.3,
  FACE_WIDTH: 14.0,
  FACE_HEIGHT: 20.0,
} as const;