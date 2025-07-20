import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { Landmark, PoseDetectionResult } from '../../types';
import type { EarSelection, PostureThresholds } from './PostureAnalyzer';

export class PostureDetector {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitialized = false;
  private isProcessing = false;

  async initialize(): Promise<void> {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );

      // GPU 초기화 시도, 실패 시 CPU로 폴백
      let delegate = 'GPU';
      let poseLandmarker: PoseLandmarker | null = null;
      
      try {
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false
        });
        console.log('MediaPipe GPU 초기화 성공');
      } catch (gpuError) {
        console.warn('GPU 초기화 실패, CPU로 폴백:', gpuError);
        delegate = 'CPU';
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false
        });
        console.log('MediaPipe CPU 초기화 성공');
      }

      this.poseLandmarker = poseLandmarker;
      this.isInitialized = true;
      console.log(`MediaPipe Pose 초기화 완료 (${delegate})`);
    } catch (error) {
      console.error('MediaPipe 초기화 실패:', error);
      throw error;
    }
  }

  async detectPose(videoElement: HTMLVideoElement): Promise<PoseDetectionResult | null> {
    if (!this.isInitialized || !this.poseLandmarker || this.isProcessing) {
      return null;
    }

    try {
      this.isProcessing = true;
      const startTimeMs = performance.now();
      
      const results = this.poseLandmarker.detectForVideo(videoElement, startTimeMs);
      
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        return {
          landmarks: landmarks.map(landmark => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z,
            visibility: landmark.visibility
          })),
          worldLandmarks: [],
          confidence: this.calculateBasicConfidence(landmarks),
          timestamp: Date.now()
        };
      }
      
      return null;
    } catch (error) {
      console.error('포즈 감지 실패:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  private calculateBasicConfidence(landmarks: Landmark[]): number {
    // 7개 핵심 랜드마크의 visibility 평균
    const coreIndices = [0, 7, 8, 9, 10, 11, 12];
    const visibilitySum = coreIndices.reduce((sum, index) => {
      return sum + (landmarks[index]?.visibility || 0);
    }, 0);
    return visibilitySum / coreIndices.length;
  }

  drawLandmarks(
    canvas: HTMLCanvasElement,
    landmarks: Landmark[],
    earSelection: EarSelection = 'auto',
    selectedEarPosition: { x: number; y: number } | null = null,
    thresholds: PostureThresholds = { mildThreshold: -1, severeThreshold: -3 }
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 실제 표시되는 비디오 크기 가져오기 (CSS 크기)
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // 캔버스 크기를 실제 표시 크기에 맞춤
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // 캔버스 지우기
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    // 디버깅용 - 캔버스가 보이는지 확인 (반투명 배경)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // 좌표 변환 함수 (MediaPipe는 0-1 범위의 정규화된 좌표)
    const transformX = (x: number) => x * displayWidth;
    const transformY = (y: number) => y * displayHeight;

    // 디버깅용 - 캔버스 경계선 그리기 (매우 두껍게)
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, displayWidth, displayHeight);
    
    // 디버깅용 - 중앙에 X 표시
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(displayWidth/2 - 20, displayHeight/2 - 20);
    ctx.lineTo(displayWidth/2 + 20, displayHeight/2 + 20);
    ctx.moveTo(displayWidth/2 + 20, displayHeight/2 - 20);
    ctx.lineTo(displayWidth/2 - 20, displayHeight/2 + 20);
    ctx.stroke();

    // 거북목 판단용 핵심 랜드마크 정의 (선택된 귀 + 어깨)
    const corePoints = [
      { index: 11, name: '왼어깨', color: '#0000FF', size: 10 },
      { index: 12, name: '오른어깨', color: '#0000FF', size: 10 }
    ];

    // 귀 선택에 따라 표시할 귀 추가
    if (earSelection === 'left' || earSelection === 'auto') {
      const leftEar = landmarks[7];
      if (leftEar && (leftEar.visibility ?? 0) > 0.3) {
        corePoints.push({ index: 7, name: '왼귀', color: '#FFFF00', size: 8 });
      }
    }
    if (earSelection === 'right' || earSelection === 'auto') {
      const rightEar = landmarks[8];
      if (rightEar && (rightEar.visibility ?? 0) > 0.3) {
        corePoints.push({ index: 8, name: '오른귀', color: '#FFFF00', size: 8 });
      }
    }

    // 어깨 중점 계산
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    let shoulderCenter = null;

    if (leftShoulder && rightShoulder && (leftShoulder.visibility ?? 0) > 0.3 && (rightShoulder.visibility ?? 0) > 0.3) {
      shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2,
        visibility: Math.min(leftShoulder.visibility ?? 0, rightShoulder.visibility ?? 0)
      };
      
      console.log('어깨 중점:', {
        왼어깨: { x: leftShoulder.x, y: leftShoulder.y },
        오른어깨: { x: rightShoulder.x, y: rightShoulder.y },
        중점: { x: shoulderCenter.x, y: shoulderCenter.y }
      });
    }

    // 랜드마크 시각화
    corePoints.forEach(({ index, name, color, size }) => {
      const landmark = landmarks[index];
      
      if (landmark) {
        // 원시 좌표값 콘솔 출력
        console.log(`${name} (${index}):`, {
          raw: { x: landmark.x, y: landmark.y },
          transformed: { x: transformX(landmark.x), y: transformY(landmark.y) },
          visibility: landmark.visibility
        });
        
        if ((landmark.visibility ?? 0) > 0.1) { // 임계값 낮춤
          const pixelX = transformX(landmark.x);
          const pixelY = transformY(landmark.y);
          
          // 매우 눈에 띄는 점 그리기
          // 외곽선
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(pixelX, pixelY, size + 2, 0, 2 * Math.PI);
          ctx.stroke();
          
          // 내부 색상
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(pixelX, pixelY, size, 0, 2 * Math.PI);
          ctx.fill();
          
          // 중앙 흰색 점
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(pixelX, pixelY, 2, 0, 2 * Math.PI);
          ctx.fill();
          
          // 라벨과 정보 표시
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px Arial';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          
          const labelX = pixelX + size + 5;
          const labelY = pixelY - 5;
          const text = `${name}: ${(landmark.visibility ?? 0).toFixed(2)}`;
          
          // 테두리가 있는 텍스트
          ctx.strokeText(text, labelX, labelY);
          ctx.fillText(text, labelX, labelY);
          
          // 좌표 정보 (원시값과 변환값 모두 표시)
          const coordText = `Raw:(${landmark.x.toFixed(3)}, ${landmark.y.toFixed(3)})`;
          const pixelText = `Pixel:(${pixelX.toFixed(0)}, ${pixelY.toFixed(0)})`;
          ctx.strokeText(coordText, labelX, labelY + 15);
          ctx.fillText(coordText, labelX, labelY + 15);
          ctx.strokeText(pixelText, labelX, labelY + 30);
          ctx.fillText(pixelText, labelX, labelY + 30);
        }
      }
    });

    // 선택된 귀와 어깨 중점 시각화 및 거북목 분석
    if (selectedEarPosition && shoulderCenter) {
      const earX = transformX(selectedEarPosition.x);
      const earY = transformY(selectedEarPosition.y);
      const shoulderCenterX = transformX(shoulderCenter.x);
      const shoulderCenterY = transformY(shoulderCenter.y);

      // 선택된 귀 강조 표시 (주황색 테두리)
      ctx.strokeStyle = '#FF8800';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(earX, earY, 12, 0, 2 * Math.PI);
      ctx.stroke();

      // 어깨 중점 그리기 (초록색)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(shoulderCenterX, shoulderCenterY, 12, 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.arc(shoulderCenterX, shoulderCenterY, 8, 0, 2 * Math.PI);
      ctx.fill();

      // 수직 기준선 그리기 (회색 점선)
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(earX, earY - 100);
      ctx.lineTo(earX, earY + 100);
      ctx.stroke();
      ctx.setLineDash([]);

      // 목 라인 그리기 (노란색 실선) - 선택된 귀에서 어깨 중점으로
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(earX, earY);
      ctx.lineTo(shoulderCenterX, shoulderCenterY);
      ctx.stroke();

      // 목 각도 계산 (선택된 귀 기준) - PostureAnalyzer와 동일한 로직
      const deltaX = shoulderCenterX - earX;
      const deltaY = shoulderCenterY - earY;
      const angleRadians = Math.atan2(deltaX, deltaY);
      const angleDegrees = angleRadians * 180 / Math.PI;
      
      // 각도 표시 호 그리기 (색상으로 상태 구분)
      let arcColor = '#00FF00'; // 기본 초록색 (좋은 자세)
      if (angleDegrees <= thresholds.severeThreshold) {
        arcColor = '#FF0000'; // 빨간색 (심한 거북목)
      } else if (angleDegrees <= thresholds.mildThreshold) {
        arcColor = '#FFAA00'; // 주황색 (경미한 거북목)
      }
      
      ctx.strokeStyle = arcColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const startAngle = -Math.PI/2; // 수직 기준
      const endAngle = angleRadians; // 목 라인 각도
      ctx.arc(earX, earY, 40, startAngle, endAngle);
      ctx.stroke();

      console.log(`목 각도 (${earSelection === 'left' ? '왼쪽' : earSelection === 'right' ? '오른쪽' : '자동'} 귀 기준):`, {
        angleDegrees: angleDegrees.toFixed(1),
        status: angleDegrees <= thresholds.severeThreshold ? '심한 거북목' : 
                angleDegrees <= thresholds.mildThreshold ? '경미한 거북목' : '좋은 자세',
        thresholds: `경미함(≤${thresholds.mildThreshold}°), 심함(≤${thresholds.severeThreshold}°)`
      });

      // 각도 텍스트 표시
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      const angleText = `목 각도: ${angleDegrees.toFixed(1)}°`;
      ctx.strokeText(angleText, earX + 50, earY - 10);
      ctx.fillText(angleText, earX + 50, earY - 10);

      // 거북목 상태 판단 및 표시
      let status = '';
      let statusColor = '';
      
      if (angleDegrees <= thresholds.severeThreshold) {
        status = '심한 거북목';
        statusColor = '#FF0000';
      } else if (angleDegrees <= thresholds.mildThreshold) {
        status = '경미한 거북목';
        statusColor = '#FFAA00';
      } else {
        status = '좋은 자세';
        statusColor = '#00FF00';
      }

      ctx.fillStyle = statusColor;
      ctx.font = '18px Arial';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      const statusText = `상태: ${status}`;
      ctx.strokeText(statusText, earX + 50, earY + 15);
      ctx.fillText(statusText, earX + 50, earY + 15);

      // 선택된 귀 정보 표시
      const earLabel = earSelection === 'left' ? '왼쪽 귀' : 
                      earSelection === 'right' ? '오른쪽 귀' : 
                      '자동 선택 귀';
      ctx.fillStyle = '#FF8800';
      ctx.font = '14px Arial';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText(earLabel, earX + 50, earY + 35);
      ctx.fillText(earLabel, earX + 50, earY + 35);
    }

    // 전체 정보 표시
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    
    const detectedCount = corePoints.filter(p => (landmarks[p.index]?.visibility ?? 0) > 0.3).length;
    const infoText = `감지된 랜드마크: ${detectedCount}/${corePoints.length}${selectedEarPosition && shoulderCenter ? ' + 분석 완료' : ''}`;
    ctx.strokeText(infoText, 10, 25);
    ctx.fillText(infoText, 10, 25);
    
    // 실시간 업데이트 표시
    const timeText = new Date().toLocaleTimeString();
    ctx.strokeText(timeText, 10, 45);
    ctx.fillText(timeText, 10, 45);
  }

  dispose(): void {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    this.isInitialized = false;
  }
}