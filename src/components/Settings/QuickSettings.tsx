import { useState } from 'react';

interface QuickSettingsProps {
  settings: {
    notifications: boolean;
    sound: boolean;
    sensitivity: number;
  };
  onSettingsChange: (newSettings: any) => void;
}

export default function QuickSettings({ settings, onSettingsChange }: QuickSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleToggle = (key: 'notifications' | 'sound') => {
    const newSettings = {
      ...localSettings,
      [key]: !localSettings[key]
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleSensitivityChange = (value: number) => {
    const newSettings = {
      ...localSettings,
      sensitivity: value
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const getSensitivityText = (value: number) => {
    if (value <= 3) return '낮음';
    if (value <= 7) return '보통';
    return '높음';
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">빠른 설정</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">알림 활성화</span>
          <button 
            className={`w-12 h-6 rounded-full relative transition-colors ${
              localSettings.notifications ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            onClick={() => handleToggle('notifications')}
          >
            <div 
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                localSettings.notifications ? 'transform translate-x-7' : 'transform translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">소리 알림</span>
          <button 
            className={`w-12 h-6 rounded-full relative transition-colors ${
              localSettings.sound ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            onClick={() => handleToggle('sound')}
          >
            <div 
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                localSettings.sound ? 'transform translate-x-7' : 'transform translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>민감도</span>
            <span>{getSensitivityText(localSettings.sensitivity)}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={localSettings.sensitivity}
            onChange={(e) => handleSensitivityChange(parseInt(e.target.value))}
            className="input-range"
          />
        </div>
      </div>
    </div>
  );
}