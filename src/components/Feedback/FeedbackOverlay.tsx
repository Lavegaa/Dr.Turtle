import { useEffect, useState } from 'react';
import type { FeedbackLevel } from '../../types/feedback';
import type { TurtleNeckAnalysis } from '../../services/mediapipe/PostureAnalyzer';

interface FeedbackEvent {
  level: FeedbackLevel;
  analysis: TurtleNeckAnalysis;
  timestamp: number;
}

interface FeedbackOverlayProps {
  isActive: boolean;
}

export default function FeedbackOverlay({ isActive }: FeedbackOverlayProps) {
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const handleFeedbackEvent = (event: CustomEvent<FeedbackEvent>) => {
      setCurrentFeedback(event.detail);
      setIsVisible(true);

      // 자동 숨김 타이머
      const hideDelay = getFeedbackDisplayDuration(event.detail.level);
      setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
    };

    window.addEventListener('posture-feedback', handleFeedbackEvent as EventListener);

    return () => {
      window.removeEventListener('posture-feedback', handleFeedbackEvent as EventListener);
    };
  }, [isActive]);

  const getFeedbackDisplayDuration = (level: FeedbackLevel): number => {
    switch (level) {
      case 'gentle': return 2000;   // 2초
      case 'active': return 4000;   // 4초
      case 'insistent': return 6000; // 6초
      case 'break': return 8000;    // 8초
      default: return 3000;
    }
  };

  const getFeedbackStyles = (level: FeedbackLevel) => {
    const baseStyles = 'fixed inset-0 pointer-events-none transition-all duration-500';
    
    switch (level) {
      case 'gentle':
        return {
          className: `${baseStyles} ${isVisible ? 'opacity-30' : 'opacity-0'}`,
          style: {
            background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1))',
            boxShadow: isVisible ? 'inset 0 0 100px rgba(59, 130, 246, 0.2)' : 'none'
          }
        };
      
      case 'active':
        return {
          className: `${baseStyles} ${isVisible ? 'opacity-50' : 'opacity-0'}`,
          style: {
            background: 'linear-gradient(45deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.15))',
            boxShadow: isVisible ? 'inset 0 0 120px rgba(245, 158, 11, 0.3)' : 'none'
          }
        };
      
      case 'insistent':
        return {
          className: `${baseStyles} ${isVisible ? 'opacity-70' : 'opacity-0'} ${
            isVisible ? 'animate-pulse' : ''
          }`,
          style: {
            background: 'linear-gradient(45deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.2))',
            boxShadow: isVisible ? 'inset 0 0 150px rgba(239, 68, 68, 0.4)' : 'none'
          }
        };
      
      case 'break':
        return {
          className: `${baseStyles} ${isVisible ? 'opacity-40' : 'opacity-0'}`,
          style: {
            background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1))',
            boxShadow: isVisible ? 'inset 0 0 100px rgba(16, 185, 129, 0.2)' : 'none'
          }
        };
      
      default:
        return {
          className: `${baseStyles} opacity-0`,
          style: {}
        };
    }
  };

  const getMessageStyles = (level: FeedbackLevel) => {
    const baseMessage = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        px-8 py-4 rounded-2xl font-semibold text-center max-w-md mx-auto
                        transition-all duration-500 pointer-events-auto z-50`;

    switch (level) {
      case 'gentle':
        return `${baseMessage} bg-blue-100 border-2 border-blue-300 text-blue-800 
                ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`;
      
      case 'active':
        return `${baseMessage} bg-yellow-100 border-2 border-yellow-400 text-yellow-800 
                ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`;
      
      case 'insistent':
        return `${baseMessage} bg-red-100 border-2 border-red-400 text-red-800 shadow-2xl
                ${isVisible ? 'opacity-100 scale-110' : 'opacity-0 scale-95'} ${
                  isVisible ? 'animate-bounce' : ''
                }`;
      
      case 'break':
        return `${baseMessage} bg-green-100 border-2 border-green-400 text-green-800 
                ${isVisible ? 'opacity-100 scale-105' : 'opacity-0 scale-95'}`;
      
      default:
        return `${baseMessage} opacity-0`;
    }
  };

  const getMessage = (level: FeedbackLevel, analysis: TurtleNeckAnalysis) => {
    const angle = analysis.angle.toFixed(1);
    
    switch (level) {
      case 'gentle':
        return {
          emoji: '😊',
          title: '자세 체크',
          message: `목이 조금 앞으로 나왔어요\n각도: ${angle}°`
        };
      
      case 'active':
        return {
          emoji: '⚠️',
          title: '자세 주의',
          message: `목을 뒤로 당겨보세요!\n현재 각도: ${angle}°`
        };
      
      case 'insistent':
        return {
          emoji: '🚨',
          title: '자세 경고',
          message: `즉시 자세를 바꿔주세요!\n위험 각도: ${angle}°`
        };
      
      case 'break':
        return {
          emoji: '🧘‍♀️',
          title: '휴식 시간',
          message: '5분 목 스트레칭을\n해보세요!'
        };
      
      default:
        return {
          emoji: '🐢',
          title: '',
          message: ''
        };
    }
  };

  if (!isActive || !currentFeedback) {
    return null;
  }

  const overlayStyles = getFeedbackStyles(currentFeedback.level);
  const messageStyles = getMessageStyles(currentFeedback.level);
  const messageContent = getMessage(currentFeedback.level, currentFeedback.analysis);

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className={overlayStyles.className}
        style={overlayStyles.style}
      />

      {/* 메시지 팝업 */}
      <div className={messageStyles}>
        <div className="text-4xl mb-2">{messageContent.emoji}</div>
        <div className="text-lg font-bold mb-1">{messageContent.title}</div>
        <div className="text-sm whitespace-pre-line">{messageContent.message}</div>
        
        {/* 진행 바 (시간 표시) */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div 
            className={`h-full transition-all ease-linear ${
              currentFeedback.level === 'gentle' ? 'bg-blue-500' :
              currentFeedback.level === 'active' ? 'bg-yellow-500' :
              currentFeedback.level === 'insistent' ? 'bg-red-500' :
              'bg-green-500'
            }`}
            style={{
              width: '100%',
              animation: `shrink ${getFeedbackDisplayDuration(currentFeedback.level)}ms linear`
            }}
          />
        </div>

        {/* 빠른 액션 버튼 */}
        {currentFeedback.level !== 'gentle' && (
          <div className="mt-3 flex gap-2 justify-center">
            <button
              onClick={() => setIsVisible(false)}
              className="px-3 py-1 text-xs bg-white bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
            >
              확인
            </button>
            {currentFeedback.level === 'break' && (
              <button
                onClick={() => {
                  // 운동 가이드 표시 로직
                  setIsVisible(false);
                }}
                className="px-3 py-1 text-xs bg-white bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
              >
                운동 가이드
              </button>
            )}
          </div>
        )}
      </div>

      {/* CSS 애니메이션 정의 */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </>
  );
}