import { useState } from 'react'
import Header from './components/Header'
import CameraView from './components/Camera/CameraView'
import StatusPanel from './components/Posture/StatusPanel'
import StatsPanel from './components/Posture/StatsPanel'
import QuickSettings from './components/Settings/QuickSettings'

function App() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [postureStatus, setPostureStatus] = useState<'GOOD' | 'WARNING' | 'BAD'>('GOOD')
  const [neckAngle, setNeckAngle] = useState(78)
  const [screenDistance, setScreenDistance] = useState(60)
  
  // 임시 통계 데이터
  const [stats] = useState({
    good: { time: '4h 32m', percentage: 73 },
    warning: { time: '1h 15m', percentage: 20 },
    bad: { time: '25m', percentage: 7 }
  })

  // 빠른 설정 상태
  const [quickSettings, setQuickSettings] = useState({
    notifications: true,
    sound: false,
    sensitivity: 5
  })

  const handleToggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
  }

  const handleCalibrate = () => {
    // TODO: 캘리브레이션 로직 구현
    console.log('캘리브레이션 시작')
  }

  const handleHelp = () => {
    // TODO: 도움말 모달 표시
    console.log('도움말 표시')
  }

  const handleSettingsClick = () => {
    // TODO: 설정 모달 표시
    console.log('설정 모달 표시')
  }

  const handleStatsClick = () => {
    // TODO: 통계 페이지 표시
    console.log('통계 페이지 표시')
  }

  const handleQuickSettingsChange = (newSettings: any) => {
    setQuickSettings(newSettings)
    // TODO: 설정 변경 처리
    console.log('설정 변경:', newSettings)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSettingsClick={handleSettingsClick}
        onStatsClick={handleStatsClick}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <CameraView 
            isMonitoring={isMonitoring}
            onToggleMonitoring={handleToggleMonitoring}
            onCalibrate={handleCalibrate}
            onHelp={handleHelp}
          />

          <div className="space-y-6">
            <StatusPanel 
              postureStatus={postureStatus}
              neckAngle={neckAngle}
              screenDistance={screenDistance}
              isMonitoring={isMonitoring}
            />

            <StatsPanel stats={stats} />

            <QuickSettings 
              settings={quickSettings}
              onSettingsChange={handleQuickSettingsChange}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App