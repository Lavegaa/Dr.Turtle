interface StatusPanelProps {
  postureStatus: 'GOOD' | 'WARNING' | 'BAD';
  neckAngle: number;
  screenDistance: number;
  isMonitoring: boolean;
}

export default function StatusPanel({ 
  postureStatus, 
  neckAngle, 
  screenDistance, 
  isMonitoring 
}: StatusPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GOOD': return 'status-good'
      case 'WARNING': return 'status-warning'
      case 'BAD': return 'status-bad'
      default: return 'status-good'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'GOOD': return '🟢 좋음'
      case 'WARNING': return '🟡 주의'
      case 'BAD': return '🔴 나쁨'
      default: return '🟢 좋음'
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">현재 상태</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">자세 상태</span>
          <span className={`status-indicator ${getStatusColor(postureStatus)}`}>
            {getStatusText(postureStatus)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">목 각도</span>
          <span className="text-sm font-mono">{neckAngle}°</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">화면 거리</span>
          <span className="text-sm font-mono">{screenDistance}cm</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">모니터링 상태</span>
          <span className={`text-sm ${isMonitoring ? 'text-green-600' : 'text-gray-500'}`}>
            {isMonitoring ? '🟢 활성' : '⚪ 비활성'}
          </span>
        </div>
      </div>
    </div>
  );
}