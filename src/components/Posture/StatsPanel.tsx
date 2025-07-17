interface StatsPanelProps {
  stats: {
    good: { time: string; percentage: number };
    warning: { time: string; percentage: number };
    bad: { time: string; percentage: number };
  };
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">오늘의 통계</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>좋음</span>
            <span>{stats.good.time} ({stats.good.percentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${stats.good.percentage}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>주의</span>
            <span>{stats.warning.time} ({stats.warning.percentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${stats.warning.percentage}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>나쁨</span>
            <span>{stats.bad.time} ({stats.bad.percentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${stats.bad.percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}