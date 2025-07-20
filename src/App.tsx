import { useState, useCallback } from 'react'
import Header from './components/Header'
import CameraView from './components/Camera/CameraView'

function App() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 에러 처리
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    
    // 5초 후 에러 메시지 자동 제거
    setTimeout(() => {
      setError(null)
    }, 5000)
  }, [])

  const handleToggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
    if (error) {
      setError(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSettingsClick={() => {}}
        onStatsClick={() => {}}
      />

      {/* 에러 메시지 표시 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🐢 Dr.Turtle - 거북목 분석기</h1>
          <p className="text-gray-600">실시간 자세 분석으로 거북목을 감지하고 개선하세요</p>
        </div>

        <CameraView 
          isMonitoring={isMonitoring}
          onToggleMonitoring={handleToggleMonitoring}
          onError={handleError}
        />

        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 사용 방법</h3>
            <div className="text-blue-800 space-y-1">
              <p>1. 측정할 귀를 선택하고 거북목 판단 기준을 설정하세요</p>
              <p>2. "거북목 분석 시작" 버튼을 클릭하세요</p>
              <p>3. 얼굴과 어깨가 화면에 잘 보이도록 조정하세요</p>
              <p>4. 자연스러운 자세를 취하고 측면에서 촬영하세요</p>
              <p>5. <span className="font-semibold">⚙️ 설정:</span> 임계값을 조정하여 자신에게 맞는 기준을 설정하세요</p>
              <p>6. <span className="font-semibold">📊 기본값:</span> 좋은 자세({'>'}-3°), 경미한 거북목({'>'}-3°), 심한 거북목({'>'}-5°)</p>
              <p>7. <span className="font-semibold">📐 해석:</span> 음수(-) = 거북목, 0° 근처 = 이상적, 양수(+) = 목이 뒤로</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App