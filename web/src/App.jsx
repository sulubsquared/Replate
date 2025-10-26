import { useState } from 'react';
import { ChefHat, ShoppingCart, Calendar, Settings, Brain, RotateCcw } from 'lucide-react';
import Pantry from './components/Pantry';
import Suggestions from './components/Suggestions';
import MealPlan from './components/MealPlan';
import DietaryPreferences from './components/DietaryPreferences';
import Understanding from './components/Understanding';

function App() {
  const [activeTab, setActiveTab] = useState('pantry');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Mock user ID for development
  const userId = 'demo-user-123';

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  const resetDemo = async () => {
    try {
      const response = await fetch(`${API_BASE}/reset-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert('✅ Demo data reset successfully!');
        setRefreshTrigger(prev => prev + 1);
        // Force page reload to reset all state
        window.location.reload();
      } else {
        alert('Failed to reset demo data');
      }
    } catch (error) {
      console.error('Error resetting demo:', error);
      alert('Error resetting demo data');
    }
  };

  const tabs = [
    { id: 'pantry', label: 'Pantry', icon: ShoppingCart },
    { id: 'suggestions', label: 'Suggestions', icon: ChefHat },
    { id: 'meal-plan', label: 'Meal Plan', icon: Calendar },
    { id: 'understanding', label: 'Understanding', icon: Brain },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="logo">🍽️ Replate</div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Reset Demo Button */}
              <button
                onClick={resetDemo}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                title="Reset demo data"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Demo</span>
              </button>
              
              <div className="flex items-center space-x-2 text-gray-600">
                <span className="text-sm font-medium">Demo Mode</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-burgundy-500 text-burgundy-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'pantry' && <Pantry userId={userId} />}
        {activeTab === 'suggestions' && <Suggestions userId={userId} refreshTrigger={refreshTrigger} onPantryUpdate={() => setRefreshTrigger(prev => prev + 1)} />}
        {activeTab === 'meal-plan' && <MealPlan userId={userId} />}
        {activeTab === 'understanding' && <Understanding userId={userId} />}
        {activeTab === 'preferences' && <DietaryPreferences userId={userId} />}
      </main>
    </div>
  );
}

export default App;