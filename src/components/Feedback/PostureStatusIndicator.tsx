import { useEffect, useState } from 'react';
import type { TurtleNeckAnalysis } from '../../services/mediapipe/PostureAnalyzer';
import type { FeedbackLevel } from '../../types/feedback';

interface PostureStatusIndicatorProps {
  analysis: TurtleNeckAnalysis | null;
  isActive: boolean;
  className?: string;
}

export default function PostureStatusIndicator({ 
  analysis, 
  isActive, 
  className = '' 
}: PostureStatusIndicatorProps) {
  const [currentLevel, setCurrentLevel] = useState<FeedbackLevel | null>(null);
  const [lastGoodTime, setLastGoodTime] = useState<Date | null>(null);
  const [streakDuration, setStreakDuration] = useState(0);

  useEffect(() => {
    if (!isActive || !analysis) return;

    // 자세 상태에 따른 레벨 업데이트
    if (analysis.status === 'normal') {
      setCurrentLevel(null);
      if (!lastGoodTime) {
        setLastGoodTime(new Date());
      }
    } else {
      if (lastGoodTime) {
        setLastGoodTime(null);
      }
    }

    // 스트릭 시간 업데이트
    const interval = setInterval(() => {
      if (lastGoodTime) {
        setStreakDuration(Date.now() - lastGoodTime.getTime());
      } else {
        setStreakDuration(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [analysis, isActive, lastGoodTime]);

  useEffect(() => {
    // 피드백 이벤트 리스닝
    const handleFeedbackEvent = (event: CustomEvent) => {
      setCurrentLevel(event.detail.level);
    };

    window.addEventListener('posture-feedback', handleFeedbackEvent as EventListener);
    return () => {
      window.removeEventListener('posture-feedback', handleFeedbackEvent as EventListener);
    };
  }, []);

  const getStatusIcon = () => {
    if (!analysis || !isActive) return '⚪';
    
    switch (analysis.status) {
      case 'normal': return '🟢';
      case 'mild': return '🟡';
      case 'severe': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    if (!analysis || !isActive) return '비활성';
    
    switch (analysis.status) {
      case 'normal': return '좋은 자세';
      case 'mild': return '경미한 거북목';
      case 'severe': return '심한 거북목';
      default: return '감지 중';
    }
  };

  const getStatusColor = () => {
    if (!analysis || !isActive) return 'text-gray-500';
    
    switch (analysis.status) {
      case 'normal': return 'text-green-600';
      case 'mild': return 'text-yellow-600';
      case 'severe': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getBorderColor = () => {
    if (!analysis || !isActive) return 'border-gray-300';
    
    if (currentLevel) {
      switch (currentLevel) {
        case 'gentle': return 'border-blue-400 shadow-blue-200';
        case 'active': return 'border-yellow-400 shadow-yellow-200';
        case 'insistent': return 'border-red-400 shadow-red-200 animate-pulse';
        case 'break': return 'border-green-400 shadow-green-200';
        default: return 'border-gray-300';
      }
    }

    switch (analysis.status) {
      case 'normal': return 'border-green-400 shadow-green-200';
      case 'mild': return 'border-yellow-400 shadow-yellow-200';
      case 'severe': return 'border-red-400 shadow-red-200';
      default: return 'border-gray-300';
    }
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    } else {
      return `${seconds}초`;
    }
  };

  const getPostureAdvice = () => {
    if (!analysis || analysis.status === 'normal') return null;

    const angle = analysis.angle;
    const adviceList = [];

    if (angle < -5) {
      adviceList.push('목을 뒤로 당겨보세요');
      adviceList.push('어깨를 펴고 가슴을 열어보세요');
    } else if (angle < -2) {
      adviceList.push('모니터 높이를 조정해보세요');
      adviceList.push('등받이에 기대어 앉아보세요');
    }

    if (analysis.confidence < 0.7) {
      adviceList.push('카메라 각도를 조정해보세요');
    }

    return adviceList.length > 0 ? adviceList[0] : '자세를 바르게 유지해보세요';
  };

  return (
    <div className={`bg-white rounded-xl border-2 p-4 transition-all duration-300 shadow-sm ${getBorderColor()} ${className}`}>
      {/* 메인 상태 표시 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <div className={`font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            {analysis && (
              <div className="text-sm text-gray-600">
                각도: {analysis.angle.toFixed(1)}° | 신뢰도: {(analysis.confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>
        </div>

        {/* 현재 알림 레벨 표시 */}
        {currentLevel && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            currentLevel === 'gentle' ? 'bg-blue-100 text-blue-800' :
            currentLevel === 'active' ? 'bg-yellow-100 text-yellow-800' :
            currentLevel === 'insistent' ? 'bg-red-100 text-red-800' :
            'bg-green-100 text-green-800'
          }`}>
            {currentLevel === 'gentle' ? '알림' :
             currentLevel === 'active' ? '주의' :
             currentLevel === 'insistent' ? '경고' : '휴식'}
          </div>
        )}
      </div>

      {/* 스트릭 정보 */}
      {isActive && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            {analysis?.status === 'normal' ? (
              <span className="text-green-600">
                ✨ 좋은 자세: {formatDuration(streakDuration)}
              </span>
            ) : (
              <span className="text-gray-500">
                좋은 자세를 유지해보세요
              </span>
            )}
          </div>
          
          {/* 미니 자세 개선 팁 */}
          {getPostureAdvice() && (
            <div className="text-blue-600 text-xs max-w-xs text-right">
              💡 {getPostureAdvice()}
            </div>
          )}
        </div>
      )}

      {/* 진행 상황 바 (좋은 자세 유지 시) */}
      {isActive && analysis?.status === 'normal' && streakDuration > 0 && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">좋은 자세 유지 중</span>
            <span className="text-xs text-green-600 font-medium">
              목표: 30분
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-1000"
              style={{ 
                width: `${Math.min((streakDuration / (30 * 60 * 1000)) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* 빠른 액션 버튼들 */}
      {isActive && analysis?.status !== 'normal' && (
        <div className="mt-3 flex gap-2">
          <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs py-2 px-3 rounded-lg transition-colors">
            자세 가이드
          </button>
          <button className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs py-2 px-3 rounded-lg transition-colors">
            목 운동
          </button>
        </div>
      )}
    </div>
  );
}