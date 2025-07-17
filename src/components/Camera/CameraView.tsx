interface CameraViewProps {
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  onCalibrate: () => void;
  onHelp: () => void;
}

export default function CameraView({ 
  isMonitoring, 
  onToggleMonitoring, 
  onCalibrate, 
  onHelp 
}: CameraViewProps) {
  return (
    <div className="lg:col-span-2">
      <div className="card p-6">
        <div className="camera-container aspect-video mb-4">
          <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-lg">카메라 뷰</p>
              <p className="text-sm text-gray-400">사용자 얼굴/상체</p>
              {isMonitoring && (
                <div className="mt-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 rounded-full text-sm">
                    🟢 모니터링 중
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          <button 
            className="btn-secondary"
            onClick={onCalibrate}
          >
            캘리브레이션
          </button>
          <button 
            className="btn-primary"
            onClick={onToggleMonitoring}
          >
            {isMonitoring ? '모니터링 중지' : '모니터링 시작'}
          </button>
          <button 
            className="btn-secondary"
            onClick={onHelp}
          >
            도움말
          </button>
        </div>
      </div>
    </div>
  );
}