# Dr.Turtle 시스템 설계서

## 📋 프로젝트 개요

**프로젝트명**: Dr.Turtle (거북목 자세 교정 웹 애플리케이션)  
**목적**: 웹캠을 이용한 실시간 거북목 감지 및 자세 교정 알림 시스템  
**대상**: 장시간 컴퓨터 작업을 하는 사용자  
**플랫폼**: 웹 브라우저 (추후 데스크톱/모바일 앱 확장 예정)

## 🏗️ 시스템 아키텍처

### 전체 시스템 구조
```
┌─────────────────────────────────────────────────────────────┐
│                     Dr.Turtle Web App                      │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (React Components)                     │
│  ├─ MainApp                                                │
│  ├─ CameraView                                             │
│  ├─ SettingsPanel                                          │
│  ├─ NotificationSystem                                     │
│  └─ StatsDashboard                                         │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                      │
│  ├─ PostureAnalyzer                                        │
│  ├─ NotificationManager                                    │
│  ├─ SettingsManager                                        │
│  └─ DataLogger                                             │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ├─ MediaPipe Integration                                  │
│  ├─ WebRTC Camera API                                      │
│  ├─ LocalStorage                                           │
│  └─ IndexedDB (통계 데이터)                                │
└─────────────────────────────────────────────────────────────┘
```

### 기술 스택
- **Frontend**: React.js + TypeScript
- **컴퓨터 비전**: MediaPipe Pose (Web SDK)
- **카메라 API**: WebRTC
- **스타일링**: Tailwind CSS
- **상태 관리**: Zustand
- **데이터 저장**: LocalStorage + IndexedDB
- **빌드 도구**: Vite

### 프로젝트 구조
```
src/
├─ components/
│  ├─ Camera/
│  │  ├─ CameraView.jsx
│  │  ├─ CameraControls.jsx
│  │  └─ CalibrationOverlay.jsx
│  ├─ Posture/
│  │  ├─ PostureIndicator.jsx
│  │  ├─ PostureStats.jsx
│  │  └─ PostureChart.jsx
│  ├─ Notifications/
│  │  ├─ NotificationModal.jsx
│  │  ├─ StatusBar.jsx
│  │  └─ AlertBanner.jsx
│  └─ Settings/
│     ├─ SettingsPanel.jsx
│     ├─ ThresholdSlider.jsx
│     └─ NotificationConfig.jsx
├─ services/
│  ├─ mediapipe/
│  │  ├─ PostureDetector.js
│  │  ├─ LandmarkProcessor.js
│  │  └─ AngleCalculator.js
│  ├─ notifications/
│  │  ├─ NotificationService.js
│  │  └─ SoundManager.js
│  └─ storage/
│     ├─ LocalStorageService.js
│     └─ StatsStorage.js
├─ hooks/
│  ├─ useCamera.js
│  ├─ usePostureDetection.js
│  ├─ useNotifications.js
│  └─ useSettings.js
├─ utils/
│  ├─ calculations.js
│  ├─ constants.js
│  └─ helpers.js
└─ store/
   ├─ postureStore.js
   ├─ settingsStore.js
   └─ statsStore.js
```

## 🎯 핵심 기능

### 1. 자세 감지 시스템
- **실시간 포즈 추정**: MediaPipe를 이용한 33개 랜드마크 추적
- **CVA(Craniovertebral Angle) 계산**: 목-어깨 각도 분석
- **화면 거리 측정**: 얼굴 크기 기반 거리 추정
- **복합적 분석**: 각도 + 거리 + 시간 지속성 종합 판단

### 2. 알림 시스템
- **다중 채널 알림**: 시각적, 청각적, 브라우저, 진동 알림
- **3단계 경고**: 좋음(초록), 주의(주황), 위험(빨강)
- **개인화 설정**: 작업 시간, 조용한 시간, 알림 빈도 조절
- **성취 시스템**: 목표 달성 시 동기부여 알림

### 3. 통계 및 분석
- **실시간 상태 표시**: 현재 자세, 각도, 거리 정보
- **시간대별 분석**: 자세 변화 패턴 추적
- **일/주/월 통계**: 자세 개선 진행률 모니터링
- **성과 지표**: 연속 좋은 자세 기록, 개선률 등

## 🔧 자세 감지 알고리즘

### MediaPipe 랜드마크 활용
```javascript
const POSE_LANDMARKS = {
  NOSE: 0,           // 코
  LEFT_EYE: 1,       // 왼쪽 눈
  RIGHT_EYE: 2,      // 오른쪽 눈
  LEFT_EAR: 7,       // 왼쪽 귀
  RIGHT_EAR: 8,      // 오른쪽 귀
  LEFT_SHOULDER: 11, // 왼쪽 어깨
  RIGHT_SHOULDER: 12 // 오른쪽 어깨
};
```

### 핵심 계산 로직

#### 1. CVA 각도 계산
```javascript
function calculateCVA(landmarks) {
  const earCenter = {
    x: (landmarks[LEFT_EAR].x + landmarks[RIGHT_EAR].x) / 2,
    y: (landmarks[LEFT_EAR].y + landmarks[RIGHT_EAR].y) / 2
  };
  
  const shoulderCenter = {
    x: (landmarks[LEFT_SHOULDER].x + landmarks[RIGHT_SHOULDER].x) / 2,
    y: (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2
  };
  
  const deltaX = earCenter.x - shoulderCenter.x;
  const deltaY = earCenter.y - shoulderCenter.y;
  
  const angle = Math.atan2(deltaX, deltaY) * (180 / Math.PI);
  return Math.abs(angle);
}
```

#### 2. 화면 거리 추정
```javascript
function estimateDistance(landmarks) {
  const eyeDistance = Math.sqrt(
    Math.pow(landmarks[LEFT_EYE].x - landmarks[RIGHT_EYE].x, 2) +
    Math.pow(landmarks[LEFT_EYE].y - landmarks[RIGHT_EYE].y, 2)
  );
  
  const REAL_EYE_DISTANCE = 6.3; // cm
  const focalLength = getFocalLength();
  
  return (REAL_EYE_DISTANCE * focalLength) / eyeDistance;
}
```

#### 3. 자세 상태 분류
```javascript
function classifyPosture(cva, distance) {
  if (cva < 50 || distance < 40) return 'BAD';
  if (cva < 65 || distance < 50) return 'WARNING';
  return 'GOOD';
}
```

### 시간적 분석
- **연속성 필터링**: 3초간 일관된 상태 확인
- **임계값 지속성**: 30초(경고), 60초(위험) 지속 시 알림
- **성능 최적화**: 5fps로 처리 속도 제한

## 📱 사용자 인터페이스

### 메인 화면 구성
1. **카메라 뷰**: 실시간 비디오 + 포즈 오버레이
2. **상태 표시**: 현재 자세, 각도, 거리 정보
3. **컨트롤**: 캘리브레이션, 시작/중지, 설정 버튼
4. **통계 요약**: 일일 자세 현황

### 알림 모달
- **시각적 피드백**: 색상 코딩 (초록/주황/빨강)
- **구체적 정보**: 현재 각도, 권장 각도, 지속 시간
- **개선 가이드**: 자세 교정 방법 제시
- **액션 버튼**: 즉시 교정, 알림 연기, 설정 변경

### 설정 패널
- **감지 설정**: 각도 임계값, 알림 지연 시간
- **알림 설정**: 채널별 on/off, 볼륨, 주기
- **개인화**: 작업 시간, 휴식 알림, 다크 모드

### 통계 대시보드
- **시간대별 차트**: 자세 변화 패턴 시각화
- **성과 지표**: 연속 기록, 개선률, 목표 달성률
- **리포트**: 일/주/월 단위 분석 결과

## 🔔 알림 시스템

### 알림 레벨
- **INFO (초록)**: 자세 개선, 목표 달성 등
- **WARNING (주황)**: 자세 주의 필요
- **DANGER (빨강)**: 심각한 거북목 자세

### 알림 채널
1. **시각적**: 모달 창, 상태 표시줄
2. **청각적**: 단계별 다른 알림음
3. **브라우저**: 시스템 알림 (선택적)
4. **진동**: 모바일 기기 지원

### 개인화 기능
- **작업 시간**: 알림 활성화 시간대 설정
- **조용한 시간**: 알림 비활성화 시간대
- **쿨다운**: 알림 간격 조절
- **성취 알림**: 목표 달성 시 축하 메시지

## 📊 데이터 관리

### 로컬 저장소
- **설정 데이터**: LocalStorage
- **통계 데이터**: IndexedDB
- **캘리브레이션**: 개인별 기준값 저장

### 데이터 플로우
```
Camera Stream → MediaPipe → Pose Landmarks → Angle Calculation → 
Posture Analysis → Notification Decision → UI Update → Data Storage
```

## 🚀 성능 최적화

### 처리 성능
- **프레임 스킵**: 30fps → 5fps로 제한
- **리소스 모니터링**: CPU 사용량 기반 자동 조절
- **저성능 모드**: 처리 지연 시 자동 활성화

### 메모리 관리
- **히스토리 제한**: 최근 5초 데이터만 보관
- **가비지 컬렉션**: 불필요한 객체 정리
- **캐싱**: 계산 결과 재사용

## 📈 개발 로드맵

### Phase 1: MVP (2-3주)
- [ ] 기본 카메라 연동
- [ ] MediaPipe 포즈 감지
- [ ] 기본 CVA 계산
- [ ] 단순 알림 시스템

### Phase 2: 고도화 (3-4주)
- [ ] 복합적 자세 분석
- [ ] 다중 알림 채널
- [ ] 사용자 설정 시스템
- [ ] 기본 통계 기능

### Phase 3: 완성도 향상 (4-6주)
- [ ] 통계 대시보드
- [ ] 성취 시스템
- [ ] 성능 최적화
- [ ] 모바일 대응

### Phase 4: 확장 (추후)
- [ ] 데스크톱 앱 변환
- [ ] 클라우드 동기화
- [ ] 팀 관리 기능
- [ ] AI 기반 맞춤 추천

## 🎯 성공 지표

### 기술적 지표
- **정확도**: 85% 이상 거북목 감지 정확도
- **반응 속도**: 1초 이내 상태 변화 감지
- **CPU 사용률**: 30% 이하 유지
- **메모리 사용량**: 100MB 이하

### 사용자 경험 지표
- **사용 편의성**: 3단계 이내 모든 기능 접근
- **알림 효과**: 70% 이상 자세 개선 반응률
- **지속 사용**: 월 20시간 이상 사용
- **만족도**: 4.0/5.0 이상 사용자 만족도

## 🔐 보안 및 개인정보

### 개인정보 보호
- **로컬 처리**: 모든 영상 처리 브라우저 내에서 수행
- **데이터 저장**: 개인 기기에만 저장, 외부 전송 없음
- **권한 관리**: 카메라 접근 권한 사용자 제어

### 보안 고려사항
- **HTTPS 필수**: 카메라 접근을 위한 보안 연결
- **CSP 적용**: 콘텐츠 보안 정책 설정
- **XSS 방지**: 사용자 입력 검증 및 이스케이프

이 설계서를 기반으로 Dr.Turtle 프로젝트를 체계적으로 개발할 수 있습니다. 각 단계별로 구현하면서 필요에 따라 설계를 수정 및 보완할 예정입니다.