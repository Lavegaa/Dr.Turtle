import { useEffect, useRef, useState, useCallback } from 'react';
import { PostureDetector } from '../services/mediapipe/PostureDetector';
import { PostureAnalyzer, type TurtleNeckAnalysis, type EarSelection, type PostureThresholds } from '../services/mediapipe/PostureAnalyzer';
import { PERFORMANCE_CONFIG } from '../utils/constants';

interface UsePostureDetectionProps {
  videoElement: HTMLVideoElement | null;
  isActive: boolean;
  onError: (error: string) => void;
  earSelection?: EarSelection;
  thresholds?: PostureThresholds;
}

interface UsePostureDetectionReturn {
  isInitialized: boolean;
  isProcessing: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  landmarkCount: number;
  lastUpdateTime: string;
  turtleNeckAnalysis: TurtleNeckAnalysis | null;
}

export const usePostureDetection = ({
  videoElement,
  isActive,
  onError,
  earSelection = 'auto',
  thresholds = { mildThreshold: -1, severeThreshold: -3 }
}: UsePostureDetectionProps): UsePostureDetectionReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  const [turtleNeckAnalysis, setTurtleNeckAnalysis] = useState<TurtleNeckAnalysis | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<PostureDetector | null>(null);
  const analyzerRef = useRef<PostureAnalyzer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastProcessTimeRef = useRef<number>(0);

  // MediaPipe 초기화
  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        detectorRef.current = new PostureDetector();
        analyzerRef.current = new PostureAnalyzer();
        await detectorRef.current.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('MediaPipe 초기화 실패:', error);
        onError('MediaPipe 초기화에 실패했습니다.');
      }
    };

    initializeMediaPipe();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onError]);

  // 단순 랜드마크 감지 및 시각화 루프
  const processFrame = useCallback(async () => {
    if (!videoElement || !detectorRef.current || !isActive) {
      return;
    }

    // 비디오 준비 상태 엄격 확인
    if (videoElement.readyState < 2 || 
        videoElement.videoWidth === 0 || 
        videoElement.videoHeight === 0 ||
        videoElement.paused ||
        videoElement.ended ||
        !videoElement.srcObject) {
      // 비디오가 준비되지 않았으면 다음 프레임에서 다시 시도
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = performance.now();
    const timeSinceLastProcess = now - lastProcessTimeRef.current;
    const targetInterval = 1000 / PERFORMANCE_CONFIG.TARGET_FPS;

    // FPS 제한
    if (timeSinceLastProcess < targetInterval) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      setIsProcessing(true);
      lastProcessTimeRef.current = now;

      // 포즈 감지
      const poseResult = await detectorRef.current.detectPose(videoElement);
      
      if (poseResult && poseResult.landmarks.length > 0) {
        // 거북목 분석용 핵심 랜드마크 체크 (양쪽 귀, 양쪽 어깨)
        const coreIndices = [7, 8, 11, 12];
        const detectedCount = coreIndices.filter(i => 
          (poseResult.landmarks[i]?.visibility ?? 0) > 0.3
        ).length;
        
        setLandmarkCount(detectedCount);
        setLastUpdateTime(new Date().toLocaleTimeString());

        // 거북목 분석 수행
        let currentAnalysis = null;
        if (analyzerRef.current) {
          currentAnalysis = analyzerRef.current.analyzeTurtleNeck(poseResult.landmarks, earSelection, thresholds);
          setTurtleNeckAnalysis(currentAnalysis);
        }

        // 캔버스에 랜드마크 그리기
        if (canvasRef.current) {
          detectorRef.current.drawLandmarks(
            canvasRef.current,
            poseResult.landmarks,
            earSelection,
            currentAnalysis?.earPosition || null,
            thresholds
          );
        }
      }
    } catch (error) {
      console.error('포즈 처리 실패:', error);
      onError('포즈 감지 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }

    // 다음 프레임 예약
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [videoElement, isActive, onError, earSelection, thresholds]);

  // 감지 시작/중지
  useEffect(() => {
    if (isActive && isInitialized && videoElement) {
      processFrame();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, isInitialized, videoElement, processFrame]);

  return {
    isInitialized,
    isProcessing,
    canvasRef,
    landmarkCount,
    lastUpdateTime,
    turtleNeckAnalysis
  };
};