import type { Landmark } from '../../types';

export type EarSelection = 'auto' | 'left' | 'right';

export interface PostureThresholds {
  mildThreshold: number;    // 경미한 거북목 시작 각도 (예: -1도, 음수가 거북목)
  severeThreshold: number;  // 심한 거북목 시작 각도 (예: -3도, 더 음수가 심함)
}

export interface TurtleNeckAnalysis {
  angle: number;
  status: 'normal' | 'mild' | 'severe';
  statusText: string;
  confidence: number;
  shoulderCenter: { x: number; y: number } | null;
  selectedEar: EarSelection;
  earPosition: { x: number; y: number } | null;
  thresholds: PostureThresholds;
}

export class PostureAnalyzer {
  // 거북목 분석 (선택된 귀 기준)
  analyzeTurtleNeck(
    landmarks: Landmark[], 
    earSelection: EarSelection = 'auto',
    thresholds: PostureThresholds = { mildThreshold: -1, severeThreshold: -3 }
  ): TurtleNeckAnalysis {
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    // 어깨 확인
    if (!leftShoulder || !rightShoulder || 
        (leftShoulder.visibility ?? 0) < 0.3 || (rightShoulder.visibility ?? 0) < 0.3) {
      return {
        angle: 0,
        status: 'normal',
        statusText: '어깨 감지 불가',
        confidence: 0,
        shoulderCenter: null,
        selectedEar: earSelection,
        earPosition: null,
        thresholds
      };
    }

    // 어깨 중점 계산
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };

    // 귀 선택 로직
    let selectedEar: Landmark | null = null;
    let actualEarSelection: EarSelection = earSelection;

    if (earSelection === 'left') {
      selectedEar = leftEar && (leftEar.visibility ?? 0) > 0.3 ? leftEar : null;
    } else if (earSelection === 'right') {
      selectedEar = rightEar && (rightEar.visibility ?? 0) > 0.3 ? rightEar : null;
    } else { // auto
      // 자동 선택: visibility가 더 높은 귀 선택
      const leftValid = leftEar && (leftEar.visibility ?? 0) > 0.3;
      const rightValid = rightEar && (rightEar.visibility ?? 0) > 0.3;
      
      if (leftValid && rightValid) {
        if ((leftEar.visibility ?? 0) >= (rightEar.visibility ?? 0)) {
          selectedEar = leftEar;
          actualEarSelection = 'left';
        } else {
          selectedEar = rightEar;
          actualEarSelection = 'right';
        }
      } else if (leftValid) {
        selectedEar = leftEar;
        actualEarSelection = 'left';
      } else if (rightValid) {
        selectedEar = rightEar;
        actualEarSelection = 'right';
      }
    }

    if (!selectedEar) {
      return {
        angle: 0,
        status: 'normal',
        statusText: '귀 감지 불가',
        confidence: 0,
        shoulderCenter,
        selectedEar: actualEarSelection,
        earPosition: null,
        thresholds
      };
    }

    const earPosition = { x: selectedEar.x, y: selectedEar.y };

    // 목 각도 계산 (선택된 귀에서 어깨 중점으로의 벡터)
    const deltaX = shoulderCenter.x - selectedEar.x;
    const deltaY = shoulderCenter.y - selectedEar.y;
    const angleRadians = Math.atan2(deltaX, deltaY);
    const angleDegrees = angleRadians * 180 / Math.PI;

    // 거북목 상태 판단 (음수가 거북목, 더 음수일수록 심함)
    let status: 'normal' | 'mild' | 'severe' = 'normal';
    let statusText = '정상';

    if (angleDegrees <= thresholds.severeThreshold) {
      status = 'severe';
      statusText = '심한 거북목';
    } else if (angleDegrees <= thresholds.mildThreshold) {
      status = 'mild';
      statusText = '경미한 거북목';
    } else {
      status = 'normal';
      statusText = '좋은 자세';
    }

    // 신뢰도 계산
    const confidence = ((selectedEar.visibility ?? 0) + (leftShoulder.visibility ?? 0) + (rightShoulder.visibility ?? 0)) / 3;

    return {
      angle: angleDegrees,
      status,
      statusText,
      confidence,
      shoulderCenter,
      selectedEar: actualEarSelection,
      earPosition,
      thresholds
    };
  }

  // 기존 메서드 유지 (호환성을 위해)
  analyzeBasicPosture(landmarks: Landmark[]) {
    const corePoints = {
      leftEar: landmarks[7] || null,
      rightEar: landmarks[8] || null,
      leftShoulder: landmarks[11] || null,
      rightShoulder: landmarks[12] || null
    };

    const visibilityInfo = {
      leftEar: corePoints.leftEar?.visibility || 0,
      rightEar: corePoints.rightEar?.visibility || 0,
      leftShoulder: corePoints.leftShoulder?.visibility || 0,
      rightShoulder: corePoints.rightShoulder?.visibility || 0
    };

    return {
      landmarks: corePoints,
      visibility: visibilityInfo,
      timestamp: Date.now()
    };
  }
}