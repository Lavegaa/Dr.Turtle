import type { 
  FeedbackMessage, 
  FeedbackAction,
  NotificationSettings, 
  NotificationType,
  FeedbackLevel 
} from '../types/feedback';

export class NotificationManager {
  private settings: NotificationSettings;
  private audioContext: AudioContext | null = null;
  private activeMessages: Map<string, FeedbackMessage> = new Map();

  constructor(settings: NotificationSettings) {
    this.settings = settings;
    this.initializeAudioContext();
    this.requestNotificationPermission();
  }

  private async initializeAudioContext() {
    if (this.settings.sound) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context initialization failed:', error);
      }
    }
  }

  private async requestNotificationPermission() {
    if (this.settings.browser && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  }

  updateSettings(newSettings: NotificationSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    if (newSettings.sound && !this.audioContext) {
      this.initializeAudioContext();
    }
    
    if (newSettings.browser) {
      this.requestNotificationPermission();
    }
  }

  // 메인 알림 메서드
  async notify(message: FeedbackMessage) {
    if (!this.settings.enabled) return;

    // 중복 메시지 방지
    if (this.activeMessages.has(message.id)) {
      return;
    }

    this.activeMessages.set(message.id, message);

    // 동시 실행
    const promises: Promise<void>[] = [];

    if (this.settings.sound) {
      promises.push(this.playNotificationSound(message.type));
    }

    if (this.settings.browser) {
      promises.push(this.showBrowserNotification(message));
    }

    // 진동 (모바일)
    if ('vibrator' in navigator && message.type === 'danger') {
      promises.push(this.triggerVibration());
    }

    await Promise.allSettled(promises);

    // 자동 제거
    if (message.duration) {
      setTimeout(() => {
        this.dismissMessage(message.id);
      }, message.duration);
    }
  }

  // 상황별 메시지 생성
  createContextualMessage(
    level: FeedbackLevel, 
    angle: number, 
    duration: number
  ): FeedbackMessage {
    const messages = this.getContextualMessages();
    const timeOfDay = this.getTimeOfDay();
    
    let type: NotificationType;
    let title: string;
    let message: string;

    switch (level) {
      case 'gentle':
        type = 'info';
        title = '자세 알림';
        message = messages.gentle[timeOfDay] || messages.gentle.default;
        break;
        
      case 'active':
        type = 'warning';
        title = '자세 주의';
        message = messages.active[timeOfDay] || messages.active.default;
        break;
        
      case 'insistent':
        type = 'danger';
        title = '자세 경고';
        message = messages.insistent[timeOfDay] || messages.insistent.default;
        break;
        
      case 'break':
        type = 'info';
        title = '휴식 시간';
        message = messages.break[timeOfDay] || messages.break.default;
        break;
        
      default:
        type = 'info';
        title = '자세 알림';
        message = '자세를 확인해주세요.';
    }

    // 개인화된 메시지 추가
    message = message
      .replace('{angle}', angle.toFixed(1))
      .replace('{duration}', Math.floor(duration / 60).toString());

    return {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      duration: this.getMessageDuration(level),
      actions: this.getMessageActions(level)
    };
  }

  private getContextualMessages() {
    return {
      gentle: {
        morning: '좋은 아침이에요! 목을 살짝 뒤로 당겨보세요 ☀️',
        afternoon: '점심 후 졸음이 오나요? 자세도 함께 체크해보세요 🍽️',
        evening: '하루 종일 수고하셨어요. 목을 펴볼까요? 🌅',
        night: '야근 중이시군요. 건강한 자세로 마무리해요 🌙',
        default: '목이 조금 앞으로 나왔어요. 살짝 뒤로 당겨보세요 😊'
      },
      active: {
        morning: '업무 시작과 함께 올바른 자세도 시작해요! 💼',
        afternoon: '집중하다 보니 자세가 흐트러졌네요. 잠깐 조정해볼까요? 🎯',
        evening: '마무리 작업 중이시죠? 자세도 함께 마무리해요 📝',
        night: '늦은 시간 작업 중이시네요. 목 건강 챙기세요 ⏰',
        default: '잠깐! 목을 뒤로 당겨보세요. 각도가 {angle}°입니다 🚨'
      },
      insistent: {
        morning: '하루 시작부터 목에 무리가 가고 있어요! 즉시 조정하세요 ⚡',
        afternoon: '지금 자세가 매우 위험해요! 목을 즉시 바로잡아주세요 🆘',
        evening: '목 건강이 심각하게 위험한 상태입니다! 📢',
        night: '야간 작업으로 목이 매우 위험한 상태예요! 즉시 휴식하세요 🚨',
        default: '목 건강이 위험해요! 즉시 자세를 바꿔주세요 (각도: {angle}°) ⚠️'
      },
      break: {
        morning: '모닝 스트레칭 시간이에요! 5분 목 운동 어떠세요? 🧘‍♀️',
        afternoon: '점심 후 목 스트레칭으로 오후를 시작해봐요 🤸‍♂️',
        evening: '퇴근 전 목 운동으로 하루의 피로를 풀어보세요 🏃‍♀️',
        night: '장시간 작업 후엔 꼭 휴식이 필요해요. 목 운동을 해보세요 💤',
        default: '휴식 시간입니다. 5분 목 운동을 해보세요 ({duration}분간 지속됨) 🏃‍♂️'
      }
    };
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private getMessageDuration(level: FeedbackLevel): number {
    switch (level) {
      case 'gentle': return 3000;   // 3초
      case 'active': return 5000;   // 5초
      case 'insistent': return 8000; // 8초
      case 'break': return 10000;   // 10초
      default: return 5000;
    }
  }

  private getMessageActions(level: FeedbackLevel): FeedbackAction[] {
    const baseActions: FeedbackAction[] = [
      { label: '확인', action: 'dismiss' as const },
      { label: '5분 후', action: 'snooze' as const, payload: { minutes: 5 } }
    ];

    if (level === 'break') {
      baseActions.push(
        { label: '운동 가이드', action: 'exercise' as const },
        { label: '설정', action: 'settings' as const }
      );
    }

    return baseActions;
  }

  private async playNotificationSound(type: NotificationType) {
    if (!this.audioContext || !this.settings.sound) return;

    try {
      const frequency = this.getSoundFrequency(type);
      const duration = this.getSoundDuration(type);
      const volume = this.settings.volume / 100;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }

  private getSoundFrequency(type: NotificationType): number {
    switch (type) {
      case 'info': return 800;
      case 'warning': return 1000;
      case 'danger': return 1200;
      case 'success': return 600;
      default: return 800;
    }
  }

  private getSoundDuration(type: NotificationType): number {
    switch (type) {
      case 'info': return 0.3;
      case 'warning': return 0.5;
      case 'danger': return 0.8;
      case 'success': return 0.4;
      default: return 0.3;
    }
  }

  private async showBrowserNotification(message: FeedbackMessage) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(message.title, {
        body: message.message,
        icon: this.getNotificationIcon(message.type),
        badge: '/turtle-icon.png',
        tag: message.id,
        requireInteraction: message.type === 'danger',
        silent: !this.settings.sound
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        this.dismissMessage(message.id);
      };

      // 자동 닫기
      setTimeout(() => {
        notification.close();
      }, message.duration || 5000);

    } catch (error) {
      console.warn('Browser notification failed:', error);
    }
  }

  private getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'info': return '🐢';
      case 'warning': return '⚠️';
      case 'danger': return '🚨';
      case 'success': return '✅';
      default: return '🐢';
    }
  }

  private async triggerVibration() {
    if ('vibrator' in navigator) {
      try {
        // 패턴: [진동시간, 정지시간, 진동시간, ...]
        await (navigator as any).vibrate([200, 100, 200]);
      } catch (error) {
        console.warn('Vibration failed:', error);
      }
    }
  }

  dismissMessage(messageId: string) {
    this.activeMessages.delete(messageId);
  }

  dismissAllMessages() {
    this.activeMessages.clear();
  }

  getActiveMessages(): FeedbackMessage[] {
    return Array.from(this.activeMessages.values());
  }

  // 스누즈 기능
  snoozeNotifications(minutes: number) {
    const snoozeUntil = Date.now() + (minutes * 60 * 1000);
    this.settings = { ...this.settings, enabled: false };
    
    setTimeout(() => {
      this.settings = { ...this.settings, enabled: true };
    }, minutes * 60 * 1000);

    return snoozeUntil;
  }
}