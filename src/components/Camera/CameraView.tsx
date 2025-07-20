import { useEffect, useState, useRef } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { usePostureDetection } from '../../hooks/usePostureDetection';
import { FeedbackOrchestrator } from '../../services/FeedbackOrchestrator';
import FeedbackOverlay from '../Feedback/FeedbackOverlay';
import PostureStatusIndicator from '../Feedback/PostureStatusIndicator';
import type { EarSelection, PostureThresholds } from '../../services/mediapipe/PostureAnalyzer';
import type { NotificationSettings } from '../../types/feedback';

interface CameraViewProps {
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  onError: (error: string) => void;
}

export default function CameraView({ 
  isMonitoring, 
  onToggleMonitoring, 
  onError
}: CameraViewProps) {
  const [earSelection, setEarSelection] = useState<EarSelection>('auto');
  const [thresholds, setThresholds] = useState<PostureThresholds>({
    mildThreshold: -1,
    severeThreshold: -3
  });
  const [feedbackSettings, setFeedbackSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true,
    browser: false,
    frequency: 'medium',
    volume: 70
  });
  
  const feedbackOrchestratorRef = useRef<FeedbackOrchestrator | null>(null);
  const {
    videoRef,
    isLoading: cameraLoading,
    error: cameraError,
    startCamera,
    stopCamera,
    isActive: cameraActive,
    isVideoReady,
    isVideoFullyReady
  } = useCamera();

  const {
    isInitialized,
    isProcessing,
    canvasRef,
    landmarkCount,
    lastUpdateTime,
    turtleNeckAnalysis
  } = usePostureDetection({
    videoElement: videoRef.current,
    isActive: isMonitoring && cameraActive,
    onError,
    earSelection,
    thresholds
  });

  // 카메라 시작/중지 (에러 시 무한 재시작 방지)
  useEffect(() => {
    if (isMonitoring && !cameraActive && !cameraError && !cameraLoading) {
      startCamera();
    } else if (!isMonitoring && cameraActive) {
      stopCamera();
    }
  }, [isMonitoring, cameraActive, !!cameraError, cameraLoading, startCamera, stopCamera]);

  // 피드백 시스템 초기화
  useEffect(() => {
    if (!feedbackOrchestratorRef.current) {
      feedbackOrchestratorRef.current = new FeedbackOrchestrator(feedbackSettings);
    }
    
    return () => {
      if (feedbackOrchestratorRef.current) {
        feedbackOrchestratorRef.current.stop();
      }
    };
  }, []);

  // 피드백 설정 업데이트
  useEffect(() => {
    if (feedbackOrchestratorRef.current) {
      feedbackOrchestratorRef.current.updateSettings(feedbackSettings);
    }
  }, [feedbackSettings]);

  // 모니터링 상태에 따른 피드백 시작/중지
  useEffect(() => {
    if (feedbackOrchestratorRef.current) {
      if (isMonitoring && cameraActive) {
        feedbackOrchestratorRef.current.start();
      } else {
        feedbackOrchestratorRef.current.stop();
      }
    }
  }, [isMonitoring, cameraActive]);

  // 거북목 분석 결과를 피드백 시스템에 전달
  useEffect(() => {
    if (feedbackOrchestratorRef.current && turtleNeckAnalysis && isMonitoring) {
      feedbackOrchestratorRef.current.processPostureAnalysis(turtleNeckAnalysis);
    }
  }, [turtleNeckAnalysis, isMonitoring]);

  // 에러 처리
  useEffect(() => {
    if (cameraError) {
      onError(cameraError);
    }
  }, [cameraError, onError]);

  const getStatusMessage = () => {
    if (!isInitialized) return 'MediaPipe 초기화 중...';
    if (cameraLoading) return '카메라 시작 중...';
    if (!cameraActive) return '모니터링을 시작하려면 버튼을 클릭하세요';
    
    // 비디오 준비 상태 확인
    if (cameraActive) {
      if (!isVideoReady()) return '비디오 로딩 중...';
      if (!isVideoFullyReady()) return '비디오 초기화 중...';
    }
    
    if (isProcessing) return `📍 랜드마크 감지 중... (${landmarkCount}/4개 감지됨)`;
    
    if (turtleNeckAnalysis && turtleNeckAnalysis.confidence > 0) {
      return `🐢 거북목 분석 중 - ${turtleNeckAnalysis.statusText} (각도: ${turtleNeckAnalysis.angle.toFixed(1)}°)`;
    }
    
    return `📍 4개 핵심 랜드마크 추적 중 (최근 업데이트: ${lastUpdateTime})`;
  };

  return (
    <div className="lg:col-span-2">
      <div className="card p-6">
        {/* 자세 상태 표시기 */}
        <PostureStatusIndicator 
          analysis={turtleNeckAnalysis}
          isActive={isMonitoring && cameraActive}
          className="mb-4"
        />

        <div className="camera-container aspect-video mb-4 relative">
          {/* 비디오 엘리먼트 */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover rounded-lg"
            playsInline
            muted
          />
          
          {/* 랜드마크 오버레이 캔버스 */}
          {cameraActive && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full rounded-lg"
              style={{ pointerEvents: 'none' }}
            />
          )}
          
          {/* 상태 메시지 오버레이 */}
          {!cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-lg">MediaPipe 랜드마크 감지</p>
                <p className="text-sm text-gray-400">7개 핵심 포인트 실시간 추적</p>
              </div>
            </div>
          )}
          
          {/* 상태 정보 */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
              {getStatusMessage()}
            </div>
          </div>
          
          {/* 거북목 분석 정보 패널 */}
          {isMonitoring && cameraActive && (
            <div className="absolute top-4 right-4">
              <div className="bg-black bg-opacity-70 text-white p-3 rounded-lg text-xs">
                <div className="font-semibold mb-2">🐢 거북목 분석</div>
                <div className="space-y-1">
                  <div>감지: {landmarkCount}/4</div>
                  <div>업데이트: {lastUpdateTime}</div>
                  
                  {turtleNeckAnalysis && turtleNeckAnalysis.confidence > 0 ? (
                    <div className="mt-2 pt-2 border-t border-gray-500">
                      <div className={`font-semibold ${
                        turtleNeckAnalysis.status === 'normal' ? 'text-green-400' :
                        turtleNeckAnalysis.status === 'mild' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {turtleNeckAnalysis.statusText}
                      </div>
                      <div>각도: {turtleNeckAnalysis.angle.toFixed(1)}°</div>
                      <div>신뢰도: {(turtleNeckAnalysis.confidence * 100).toFixed(0)}%</div>
                    </div>
                  ) : (
                    <div className="mt-2 pt-2 border-t border-gray-500 text-gray-400">
                      분석 대기 중...
                    </div>
                  )}
                  
                  <div className="text-gray-300 mt-2">
                    <div>🟡 귀 | 🟠 귀중점 | 🟢 어깨중점 | 🔵 어깨</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 피드백 오버레이 */}
        <FeedbackOverlay isActive={isMonitoring && cameraActive} />
        
        {/* 설정 옵션들 */}
        <div className="mb-4 space-y-4">
          {/* 피드백 설정 */}
          <div className="text-center">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-3">🔔 피드백 설정</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-800">피드백 활성화</span>
                  <button 
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      feedbackSettings.enabled ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                    onClick={() => setFeedbackSettings(prev => ({
                      ...prev,
                      enabled: !prev.enabled
                    }))}
                  >
                    <div 
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        feedbackSettings.enabled ? 'transform translate-x-7' : 'transform translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-800">소리 알림</span>
                  <button 
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      feedbackSettings.sound ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                    onClick={() => setFeedbackSettings(prev => ({
                      ...prev,
                      sound: !prev.sound
                    }))}
                  >
                    <div 
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        feedbackSettings.sound ? 'transform translate-x-7' : 'transform translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-800">브라우저 알림</span>
                  <button 
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      feedbackSettings.browser ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                    onClick={() => setFeedbackSettings(prev => ({
                      ...prev,
                      browser: !prev.browser
                    }))}
                  >
                    <div 
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        feedbackSettings.browser ? 'transform translate-x-7' : 'transform translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-purple-800">알림 빈도</span>
                    <span className="text-purple-600">
                      {feedbackSettings.frequency === 'low' ? '낮음' :
                       feedbackSettings.frequency === 'medium' ? '보통' : '높음'}
                    </span>
                  </div>
                  <select 
                    value={feedbackSettings.frequency}
                    onChange={(e) => setFeedbackSettings(prev => ({
                      ...prev,
                      frequency: e.target.value as 'low' | 'medium' | 'high'
                    }))}
                    className="w-full px-3 py-1 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="low">낮음 (덜 자주)</option>
                    <option value="medium">보통</option>
                    <option value="high">높음 (자주)</option>
                  </select>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-purple-800">음량</span>
                    <span className="text-purple-600">{feedbackSettings.volume}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={feedbackSettings.volume}
                    onChange={(e) => setFeedbackSettings(prev => ({
                      ...prev,
                      volume: Number(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* 귀 선택 옵션 */}
          <div className="text-center">
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">📍 측정 기준 귀 선택</h3>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setEarSelection('auto')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    earSelection === 'auto' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  🤖 자동 선택
                </button>
                <button
                  onClick={() => setEarSelection('left')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    earSelection === 'left' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ← 왼쪽 귀
                </button>
                <button
                  onClick={() => setEarSelection('right')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    earSelection === 'right' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  오른쪽 귀 →
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {earSelection === 'auto' 
                  ? '🤖 visibility가 높은 귀를 자동으로 선택합니다' 
                  : earSelection === 'left'
                  ? '← 항상 왼쪽 귀를 기준으로 측정합니다'
                  : '→ 항상 오른쪽 귀를 기준으로 측정합니다'
                }
              </p>
              {turtleNeckAnalysis?.selectedEar && (
                <p className="text-xs text-blue-600 mt-1">
                  현재 선택된 귀: {turtleNeckAnalysis.selectedEar === 'left' ? '왼쪽' : '오른쪽'} 귀
                </p>
              )}
            </div>
          </div>

          {/* 임계값 설정 */}
          <div className="text-center">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-3">⚙️ 거북목 판단 기준 설정</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-2">
                    ⚠️ 경미한 거북목 (도)
                  </label>
                  <input
                    type="number"
                    value={thresholds.mildThreshold}
                    onChange={(e) => setThresholds(prev => ({
                      ...prev,
                      mildThreshold: Number(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="-10"
                    max="5"
                    step="0.5"
                  />
                  <p className="text-xs text-orange-600 mt-1">음수일수록 거북목</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-2">
                    🚨 심한 거북목 (도)
                  </label>
                  <input
                    type="number"
                    value={thresholds.severeThreshold}
                    onChange={(e) => setThresholds(prev => ({
                      ...prev,
                      severeThreshold: Number(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="-15"
                    max="0"
                    step="0.5"
                  />
                  <p className="text-xs text-orange-600 mt-1">더 음수일수록 심함</p>
                </div>
              </div>
              <p className="text-sm text-orange-700 mt-3">
                현재 기준: 좋은 자세({'>'}-{thresholds.mildThreshold}°), 경미함({'>'}-{thresholds.mildThreshold}°), 심함({'>'}-{thresholds.severeThreshold}°)
              </p>
              {turtleNeckAnalysis && (
                <p className="text-xs text-orange-600 mt-1">
                  현재 각도: {turtleNeckAnalysis.angle.toFixed(1)}° - {turtleNeckAnalysis.statusText}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          <button 
            className="btn-primary"
            onClick={onToggleMonitoring}
            disabled={!isInitialized || cameraLoading}
          >
            {isMonitoring ? '감지 중지' : '거북목 분석 시작'}
          </button>
          
          <button 
            className="btn-secondary"
            onClick={() => {
              if (cameraActive) {
                stopCamera();
                setTimeout(startCamera, 500);
              }
            }}
            disabled={!isInitialized || cameraLoading}
          >
            카메라 재시작
          </button>
        </div>
        
        {/* 상태 정보 */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <div className="flex justify-center items-center gap-4">
            <span className={`inline-flex items-center gap-1 ${isInitialized ? 'text-green-600' : 'text-gray-400'}`}>
              {isInitialized ? '✓' : '○'} MediaPipe
            </span>
            <span className={`inline-flex items-center gap-1 ${cameraActive ? 'text-green-600' : 'text-gray-400'}`}>
              {cameraActive ? '✓' : '○'} 카메라
            </span>
            <span className={`inline-flex items-center gap-1 ${turtleNeckAnalysis && turtleNeckAnalysis.confidence > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {turtleNeckAnalysis && turtleNeckAnalysis.confidence > 0 ? '✓' : '○'} 거북목 분석
            </span>
          </div>
          
          {isMonitoring && (
            <div className="mt-2 text-xs text-gray-500">
              💡 {earSelection === 'auto' ? '최적의' : earSelection === 'left' ? '왼쪽' : '오른쪽'} 귀를 기준으로 측정 중입니다. 노란색(귀), 주황색 테두리(선택된 귀), 초록색(어깨 중점), 파란색(어깨)과 노란색 목 라인을 확인하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}