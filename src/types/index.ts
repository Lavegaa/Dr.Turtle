// 자세 분석 관련 타입
export interface PostureData {
  cva: number;
  distance: number;
  shoulderLevel: number;
  timestamp: number;
}

export interface PostureAnalysis {
  status: 'GOOD' | 'WARNING' | 'BAD';
  score: PostureData;
  confidence: number;
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