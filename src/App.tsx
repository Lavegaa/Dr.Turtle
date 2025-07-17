import { useState } from 'react'

function App() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [postureStatus, setPostureStatus] = useState<'GOOD' | 'WARNING' | 'BAD'>('GOOD')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GOOD': return 'status-good'
      case 'WARNING': return 'status-warning'
      case 'BAD': return 'status-bad'
      default: return 'status-good'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Dr.Turtle 🐢
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                ⚙️
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                📊
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Camera View */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="camera-container aspect-video mb-4">
                <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4">📷</div>
                    <p className="text-lg">카메라 뷰</p>
                    <p className="text-sm text-gray-400">사용자 얼굴/상체</p>
                  </div>
                </div>
              </div>
              
              {/* Control Buttons */}
              <div className="flex justify-center space-x-4">
                <button className="btn-secondary">
                  캘리브레이션
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => setIsMonitoring(!isMonitoring)}
                >
                  {isMonitoring ? '모니터링 중지' : '모니터링 시작'}
                </button>
                <button className="btn-secondary">
                  도움말
                </button>
              </div>
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">현재 상태</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">자세 상태</span>
                  <span className={`status-indicator ${getStatusColor(postureStatus)}`}>
                    {postureStatus === 'GOOD' && '🟢 좋음'}
                    {postureStatus === 'WARNING' && '🟡 주의'}
                    {postureStatus === 'BAD' && '🔴 나쁨'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">목 각도</span>
                  <span className="text-sm font-mono">78°</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">화면 거리</span>
                  <span className="text-sm font-mono">60cm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">모니터링 상태</span>
                  <span className={`text-sm ${isMonitoring ? 'text-turtle-green' : 'text-gray-500'}`}>
                    {isMonitoring ? '🟢 활성' : '⚪ 비활성'}
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Stats */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">오늘의 통계</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>좋음</span>
                    <span>4h 32m (73%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-turtle-green h-2 rounded-full" style={{width: '73%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>주의</span>
                    <span>1h 15m (20%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-turtle-orange h-2 rounded-full" style={{width: '20%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>나쁨</span>
                    <span>25m (7%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-turtle-red h-2 rounded-full" style={{width: '7%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">빠른 설정</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">알림 활성화</span>
                  <button className="w-12 h-6 bg-turtle-blue rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">소리 알림</span>
                  <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>민감도</span>
                    <span>보통</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    defaultValue="5"
                    className="input-range"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App