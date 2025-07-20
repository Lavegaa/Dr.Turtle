// 피드백 시스템 타입 정의

export type FeedbackLevel = 'gentle' | 'active' | 'insistent' | 'break';
export type NotificationType = 'info' | 'warning' | 'danger' | 'success';

export interface FeedbackTrigger {
  level: FeedbackLevel;
  trigger: string;
  duration: number; // seconds
  action: string;
  message: string;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  browser: boolean;
  frequency: 'low' | 'medium' | 'high';
  volume: number; // 0-100
}

export interface FeedbackState {
  currentLevel: FeedbackLevel | null;
  lastTriggerTime: number;
  consecutiveBadPostureTime: number;
  consecutiveGoodPostureTime: number;
  isActive: boolean;
  settings: NotificationSettings;
}

export interface ProgressiveIntervention {
  gentle: FeedbackTrigger;
  active: FeedbackTrigger;
  insistent: FeedbackTrigger;
  break: FeedbackTrigger;
}

export interface FeedbackMessage {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  duration?: number; // auto-dismiss after ms
  actions?: FeedbackAction[];
}

export interface FeedbackAction {
  label: string;
  action: 'dismiss' | 'snooze' | 'settings' | 'exercise';
  payload?: any;
}

export interface UserProfile {
  workPattern: 'office' | 'home' | 'hybrid';
  sensitivity: number; // 1-10
  customThresholds: {
    mildDuration: number; // seconds before mild warning
    severeDuration: number; // seconds before severe warning
    breakReminder: number; // minutes between break suggestions
  };
  preferences: {
    motivationalMessages: boolean;
    contextualTips: boolean;
    exerciseReminders: boolean;
  };
}

export interface FeedbackAnalytics {
  totalAlerts: number;
  alertsResponded: number;
  averageResponseTime: number;
  mostEffectiveType: FeedbackLevel;
  postureImprovementRate: number;
  streaks: {
    longestGoodPosture: number;
    currentGoodPosture: number;
  };
}