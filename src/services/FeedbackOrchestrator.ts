import { NotificationManager } from './NotificationManager';
import type { 
  TurtleNeckAnalysis 
} from './mediapipe/PostureAnalyzer';
import type { 
  FeedbackState, 
  FeedbackLevel, 
  NotificationSettings,
  UserProfile,
  FeedbackAnalytics,
  FeedbackMessage
} from '../types/feedback';

export class FeedbackOrchestrator {
  private notificationManager: NotificationManager;
  private state: FeedbackState;
  private userProfile: UserProfile;
  private analytics: FeedbackAnalytics;
  private lastAnalysis: TurtleNeckAnalysis | null = null;
  private postureStartTime: number = 0;
  private currentPostureStatus: 'good' | 'bad' = 'good';

  constructor(
    notificationSettings: NotificationSettings,
    userProfile?: Partial<UserProfile>
  ) {
    this.notificationManager = new NotificationManager(notificationSettings);
    
    this.state = {
      currentLevel: null,
      lastTriggerTime: 0,
      consecutiveBadPostureTime: 0,
      consecutiveGoodPostureTime: 0,
      isActive: false,
      settings: notificationSettings
    };

    this.userProfile = {
      workPattern: 'office',
      sensitivity: 5,
      customThresholds: {
        mildDuration: 300,    // 5분
        severeDuration: 180,  // 3분
        breakReminder: 60     // 60분
      },
      preferences: {
        motivationalMessages: true,
        contextualTips: true,
        exerciseReminders: true
      },
      ...userProfile
    };

    this.analytics = {
      totalAlerts: 0,
      alertsResponded: 0,
      averageResponseTime: 0,
      mostEffectiveType: 'gentle',
      postureImprovementRate: 0,
      streaks: {
        longestGoodPosture: 0,
        currentGoodPosture: 0
      }
    };

    this.postureStartTime = Date.now();
  }

  // 메인 분석 및 피드백 메서드
  async processPostureAnalysis(analysis: TurtleNeckAnalysis) {
    if (!this.state.isActive) return;

    this.lastAnalysis = analysis;
    const now = Date.now();
    const currentStatus = analysis.status === 'normal' ? 'good' : 'bad';

    // 자세 상태 변경 감지
    if (currentStatus !== this.currentPostureStatus) {
      this.handlePostureChange(currentStatus, now);
    }

    // 연속 시간 업데이트
    this.updateConsecutiveTime(currentStatus, now);

    // 개입 필요성 판단 및 실행
    await this.evaluateAndTriggerIntervention(analysis, now);

    // 분석 데이터 업데이트
    this.updateAnalytics(analysis);
  }

  private handlePostureChange(newStatus: 'good' | 'bad', timestamp: number) {
    const previousDuration = timestamp - this.postureStartTime;

    if (this.currentPostureStatus === 'good') {
      // 좋은 자세 종료
      this.analytics.streaks.currentGoodPosture = Math.floor(previousDuration / 1000);
      if (this.analytics.streaks.currentGoodPosture > this.analytics.streaks.longestGoodPosture) {
        this.analytics.streaks.longestGoodPosture = this.analytics.streaks.currentGoodPosture;
      }

      // 좋은 자세 유지에 대한 격려
      if (previousDuration > 30 * 60 * 1000) { // 30분 이상
        this.sendPositiveReinforcement(previousDuration);
      }
    }

    this.currentPostureStatus = newStatus;
    this.postureStartTime = timestamp;

    // 상태 리셋
    this.state.consecutiveBadPostureTime = 0;
    this.state.consecutiveGoodPostureTime = 0;
  }

  private updateConsecutiveTime(status: 'good' | 'bad', timestamp: number) {
    const duration = timestamp - this.postureStartTime;

    if (status === 'good') {
      this.state.consecutiveGoodPostureTime = duration;
      this.state.consecutiveBadPostureTime = 0;
    } else {
      this.state.consecutiveBadPostureTime = duration;
      this.state.consecutiveGoodPostureTime = 0;
    }
  }

  private async evaluateAndTriggerIntervention(analysis: TurtleNeckAnalysis, timestamp: number) {
    if (analysis.status === 'normal') {
      // 좋은 자세일 때는 현재 레벨 리셋
      this.state.currentLevel = null;
      return;
    }

    const badPostureDuration = this.state.consecutiveBadPostureTime / 1000; // 초 단위
    const requiredLevel = this.determineRequiredLevel(analysis, badPostureDuration);

    // 레벨이 변경되었거나 일정 시간이 지났을 때만 알림
    if (this.shouldTriggerNotification(requiredLevel, timestamp)) {
      await this.triggerIntervention(requiredLevel, analysis, badPostureDuration);
      this.state.currentLevel = requiredLevel;
      this.state.lastTriggerTime = timestamp;
    }
  }

  private determineRequiredLevel(analysis: TurtleNeckAnalysis, duration: number): FeedbackLevel {
    const { sensitivity } = this.userProfile;
    const { customThresholds } = this.userProfile;

    // 민감도 기반 임계값 조정 (1-10 스케일)
    const sensitivityMultiplier = (11 - sensitivity) / 10; // 높은 민감도 = 낮은 multiplier
    
    const adjustedMildDuration = customThresholds.mildDuration * sensitivityMultiplier;
    const adjustedSevereDuration = customThresholds.severeDuration * sensitivityMultiplier;
    const breakDuration = customThresholds.breakReminder * 60; // 분을 초로 변환

    // 심각도와 지속 시간 기반 레벨 결정
    if (duration > breakDuration) {
      return 'break';
    } else if (analysis.status === 'severe') {
      if (duration > adjustedSevereDuration) {
        return 'insistent';
      } else if (duration > adjustedSevereDuration / 2) {
        return 'active';
      } else {
        return 'gentle';
      }
    } else if (analysis.status === 'mild') {
      if (duration > adjustedMildDuration * 2) {
        return 'active';
      } else if (duration > adjustedMildDuration) {
        return 'gentle';
      }
    }

    return 'gentle';
  }

  private shouldTriggerNotification(level: FeedbackLevel, timestamp: number): boolean {
    const timeSinceLastTrigger = timestamp - this.state.lastTriggerTime;
    const cooldownPeriods = {
      gentle: 60000,    // 1분
      active: 45000,    // 45초
      insistent: 30000, // 30초
      break: 120000     // 2분
    };

    // 레벨이 상승했거나 쿨다운 시간이 지났을 때
    return (
      this.state.currentLevel !== level ||
      timeSinceLastTrigger > cooldownPeriods[level]
    );
  }

  private async triggerIntervention(
    level: FeedbackLevel, 
    analysis: TurtleNeckAnalysis, 
    duration: number
  ) {
    this.analytics.totalAlerts++;

    const message = this.notificationManager.createContextualMessage(
      level, 
      analysis.angle, 
      duration
    );

    await this.notificationManager.notify(message);

    // 레벨별 추가 액션
    switch (level) {
      case 'gentle':
        this.triggerVisualFeedback('gentle', analysis);
        break;
      case 'active':
        this.triggerVisualFeedback('active', analysis);
        break;
      case 'insistent':
        this.triggerVisualFeedback('insistent', analysis);
        this.scheduleFollowUp(level, 30000); // 30초 후 follow-up
        break;
      case 'break':
        this.triggerVisualFeedback('break', analysis);
        this.suggestExercise();
        break;
    }
  }

  private triggerVisualFeedback(level: FeedbackLevel, analysis: TurtleNeckAnalysis) {
    // DOM 이벤트를 통해 시각적 피드백 트리거
    const event = new CustomEvent('posture-feedback', {
      detail: {
        level,
        analysis,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }

  private async sendPositiveReinforcement(duration: number) {
    if (!this.userProfile.preferences.motivationalMessages) return;

    const minutes = Math.floor(duration / (60 * 1000));
    const messages = [
      `훌륭해요! ${minutes}분간 좋은 자세를 유지하셨네요! 🎉`,
      `최고예요! ${minutes}분 동안 완벽한 자세였어요! ⭐`,
      `대단합니다! ${minutes}분간 목 건강을 잘 지키셨어요! 💪`,
      `완벽한 자세 유지! ${minutes}분의 기록을 달성했어요! 🏆`
    ];

    const message: FeedbackMessage = {
      id: `positive_${Date.now()}`,
      type: 'success',
      title: '자세 칭찬',
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: Date.now(),
      duration: 5000
    };

    await this.notificationManager.notify(message);
  }

  private scheduleFollowUp(level: FeedbackLevel, delay: number) {
    setTimeout(async () => {
      if (this.state.currentLevel === level && this.lastAnalysis?.status !== 'normal') {
        // 여전히 나쁜 자세라면 follow-up 메시지
        const followUpMessage: FeedbackMessage = {
          id: `followup_${Date.now()}`,
          type: 'warning',
          title: '자세 재확인',
          message: '아직도 거북목 상태입니다. 지금 바로 자세를 바꿔주세요!',
          timestamp: Date.now(),
          duration: 6000
        };
        
        await this.notificationManager.notify(followUpMessage);
      }
    }, delay);
  }

  private suggestExercise() {
    if (!this.userProfile.preferences.exerciseReminders) return;

    const exercises = [
      '목을 천천히 좌우로 돌려보세요 (각 방향 5회)',
      '어깨를 뒤로 돌리며 가슴을 펴보세요 (10회)',
      '목을 앞뒤로 천천히 움직여보세요 (5회)',
      '어깨를 위아래로 으쓱해보세요 (10회)',
      '목을 한쪽으로 기울여 15초간 유지해보세요'
    ];

    const exercise = exercises[Math.floor(Math.random() * exercises.length)];
    
    const exerciseMessage: FeedbackMessage = {
      id: `exercise_${Date.now()}`,
      type: 'info',
      title: '목 스트레칭 가이드',
      message: `💪 ${exercise}`,
      timestamp: Date.now(),
      duration: 15000,
      actions: [
        { label: '완료', action: 'dismiss' },
        { label: '다른 운동', action: 'exercise' }
      ]
    };

    this.notificationManager.notify(exerciseMessage);
  }

  private updateAnalytics(analysis: TurtleNeckAnalysis) {
    // 자세 개선율 계산 (간단한 이동 평균)
    const isGoodPosture = analysis.status === 'normal' ? 1 : 0;
    this.analytics.postureImprovementRate = 
      (this.analytics.postureImprovementRate * 0.9) + (isGoodPosture * 0.1);
  }


  // 공개 메서드들
  start() {
    this.state.isActive = true;
    this.postureStartTime = Date.now();
  }

  stop() {
    this.state.isActive = false;
    this.state.currentLevel = null;
  }

  updateSettings(settings: Partial<NotificationSettings>) {
    this.state.settings = { ...this.state.settings, ...settings };
    this.notificationManager.updateSettings(this.state.settings);
  }

  updateUserProfile(profile: Partial<UserProfile>) {
    this.userProfile = { ...this.userProfile, ...profile };
  }

  snooze(minutes: number) {
    return this.notificationManager.snoozeNotifications(minutes);
  }

  getAnalytics(): FeedbackAnalytics {
    return { ...this.analytics };
  }

  getCurrentState(): FeedbackState {
    return { ...this.state };
  }

  getActiveMessages() {
    return this.notificationManager.getActiveMessages();
  }

  dismissMessage(messageId: string) {
    this.notificationManager.dismissMessage(messageId);
    this.analytics.alertsResponded++;
  }

  dismissAllMessages() {
    this.notificationManager.dismissAllMessages();
  }
}