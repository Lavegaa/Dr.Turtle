interface HeaderProps {
  onSettingsClick: () => void;
  onStatsClick: () => void;
}

export default function Header({ onSettingsClick, onStatsClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Dr.Turtle 🐢
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={onSettingsClick}
            >
              ⚙️
            </button>
            <button 
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={onStatsClick}
            >
              📊
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}