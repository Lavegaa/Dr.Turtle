// 자세 분석 관련 타입
export interface PostureMetrics {
  // 기존 지표
  cva: number;
  distance: number;
  shoulderLevel: number;
  
  // 새로운 다중 지표
  hfd: number;              // Head Forward Distance
  neckAngle: number;        // 목 기울기
  shoulderAngle: number;    // 어깨 기울기
  headTilt: number;         // 머리 기울기
  
  // 새로운 정렬 지표
  chestNeckChinAlignment: number;  // 가슴-목-턱 정렬
  
  // 메타데이터
  timestamp: number;
  confidence: number;
}

export interface PostureAnalysis {
  status: 'GOOD' | 'WARNING' | 'BAD';
  metrics: PostureMetrics;
  compositeScore: number;   // 0-100 종합 점수
  improvements: string[];   // 개선 제안사항
}

// 자세 이력 추적용
export interface PostureHistory {
  timestamp: number;
  metrics: PostureMetrics;
  status: 'GOOD' | 'WARNING' | 'BAD';
  duration: number;         // 해당 상태 지속 시간 (ms)
}

// 레거시 호환성을 위한 타입 (기존 코드 유지)
export interface PostureData {
  cva: number;
  distance: number;
  shoulderLevel: number;
  timestamp: number;
}

// 알림 관련 타입
export interface NotificationData {
  id: string;
  level: 'INFO' | 'WARNING' | 'DANGER';
  title: string;
  message: string;
  suggestions?: string[];
  timestamp: number;
  duration?: number;
}

// 설정 관련 타입
export interface UserSettings {
  thresholds: {
    cvaWarning: number;
    cvaDanger: number;
    minDistance: number;
    alertDelay: number;
  };
  notifications: {
    visual: boolean;
    audio: boolean;
    browser: boolean;
    vibration: boolean;
    volume: number;
  };
  workingHours: {
    start: string;
    end: string;
    enabled: boolean;
  };
  personalInfo: {
    name: string;
    calibrationData?: CalibrationData;
  };
}

// 캘리브레이션 관련 타입
export interface CalibrationData {
  focalLength: number;
  goodPostureReference: PostureData;
  personalThresholds: {
    cvaWarning: number;
    cvaDanger: number;
    minDistance: number;
  };
}

// 통계 관련 타입
export interface PostureStats {
  date: string;
  totalTime: number;
  goodTime: number;
  warningTime: number;
  badTime: number;
  sessionsCount: number;
  improvements: number;
}

// 카메라 관련 타입
export interface CameraConfig {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
  deviceId?: string;
}

// MediaPipe 관련 타입
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseDetectionResult {
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
  confidence: number;
  timestamp: number;
}