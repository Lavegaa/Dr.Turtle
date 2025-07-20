import { useRef, useEffect, useState, useCallback } from 'react';

interface CameraConfig {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  isActive: boolean;
  isVideoReady: () => boolean;
  isVideoFullyReady: () => boolean;
}

export const useCamera = (config: CameraConfig = { 
  width: 640, 
  height: 480, 
  facingMode: 'user' 
}): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  // 비디오 준비 상태 확인 헬퍼 함수
  const isVideoReady = (): boolean => {
    const video = videoRef.current;
    return !!(video && 
           video.readyState >= 2 && // HAVE_CURRENT_DATA 이상
           video.videoWidth > 0 && 
           video.videoHeight > 0 &&
           !video.paused &&
           !video.ended &&
           video.srcObject); // 스트림이 연결되어 있는지 확인
  };

  // 비디오 완전 준비 상태 확인 (캘리브레이션용)
  const isVideoFullyReady = (): boolean => {
    const video = videoRef.current;
    return !!(video && 
           video.readyState >= 3 && // HAVE_FUTURE_DATA 이상
           video.videoWidth > 0 && 
           video.videoHeight > 0 &&
           !video.paused &&
           !video.ended &&
           video.srcObject &&
           video.currentTime > 0); // 실제로 재생되고 있는지 확인
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 기존 스트림이 있다면 정리
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // 비디오 엘리먼트 초기화
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load(); // 비디오 엘리먼트 재설정
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: config.width,
          height: config.height,
          facingMode: config.facingMode
        }
      });

      if (videoRef.current) {
        // 비디오 엘리먼트 설정
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;

        // 추가 안정성 설정
        videoRef.current.controls = false;
        videoRef.current.preload = 'auto';

        // 비디오 메타데이터 로딩 대기
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('비디오 엘리먼트를 찾을 수 없습니다.'));
            return;
          }

          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };

          const onError = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('비디오 메타데이터 로딩 실패'));
          };

          if (video.readyState >= 1) {
            // 이미 메타데이터가 로딩된 경우
            resolve();
          } else {
            video.addEventListener('loadedmetadata', onLoadedMetadata);
            video.addEventListener('error', onError);
          }
        });

        // 비디오 재생 시작 (안정성 개선)
        try {
          // 기존 play() 요청이 있다면 중단
          if (videoRef.current.currentTime > 0 && !videoRef.current.paused) {
            videoRef.current.pause();
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          await videoRef.current.play();
          console.log('비디오 재생 성공');
        } catch (playError) {
          console.warn('비디오 자동 재생 실패, 사용자 상호작용 필요:', playError);
          // 자동 재생 실패는 치명적이지 않음 (사용자가 나중에 클릭하면 재생됨)
        }
      }

      setStream(mediaStream);
      setIsActive(true);
      
      console.log('카메라 시작 성공:', {
        width: videoRef.current?.videoWidth,
        height: videoRef.current?.videoHeight,
        readyState: videoRef.current?.readyState
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '카메라 접근 실패';
      setError(errorMessage);
      console.error('카메라 시작 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.load(); // 비디오 엘리먼트 완전 재설정
    }
    
    setIsActive(false);
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    stream,
    isLoading,
    error,
    startCamera,
    stopCamera,
    isActive,
    isVideoReady,
    isVideoFullyReady
  };
};