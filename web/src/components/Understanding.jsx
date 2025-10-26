import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Zap, Moon, Heart, AlertCircle, BarChart3, Clock, Target } from 'lucide-react';

const Understanding = ({ userId }) => {
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  const moodOptions = [
    { id: 'energized', emoji: '⚡', label: 'Energized', color: 'text-yellow-600' },
    { id: 'sleepy', emoji: '😴', label: 'Sleepy', color: 'text-blue-600' },
    { id: 'bloated', emoji: '🤢', label: 'Bloated', color: 'text-red-600' },
    { id: 'calm', emoji: '😌', label: 'Calm', color: 'text-green-600' },
    { id: 'focused', emoji: '🎯', label: 'Focused', color: 'text-purple-600' },
    { id: 'irritable', emoji: '😤', label: 'Irritable', color: 'text-orange-600' }
  ];

  useEffect(() => {
    fetchMoodData();
    generateInsights();
  }, [userId]);

  const fetchMoodData = async () => {
    try {
      const response = await fetch(`${API_BASE}/mood-data/${userId}`);
      const data = await response.json();
      setMoodData(data.moodEntries || []);
      
      // check cooldown status
      if (data.moodEntries && data.moodEntries.length > 0) {
        const lastEntry = data.moodEntries[0];
        const lastEntryTime = new Date(lastEntry.timestamp).getTime();
        const now = new Date().getTime();
        const cooldownPeriod = 3 * 60 * 60 * 1000; // 3 hours
        const timeSinceLastEntry = now - lastEntryTime;
        
        if (timeSinceLastEntry < cooldownPeriod) {
          const remainingTime = cooldownPeriod - timeSinceLastEntry;
          const remainingHours = Math.ceil(remainingTime / (60 * 60 * 1000));
          const remainingMinutes = Math.ceil((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
          
          setCooldownInfo({
            remainingHours,
            remainingMinutes,
            nextAllowedTime: new Date(lastEntryTime + cooldownPeriod).toISOString()
          });
        } else {
          setCooldownInfo(null);
        }
      } else {
        setCooldownInfo(null);
      }
    } catch (error) {
      console.error('Error fetching mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = () => {
    // Mock insights based on mood data patterns
    const mockInsights = [
      {
        id: 1,
        title: "High-protein breakfasts give you +23% more afternoon focus",
        description: "Your focus levels peak 3-4 hours after protein-rich morning meals",
        confidence: 87,
        trend: "up",
        icon: TrendingUp,
        color: "text-green-600"
      },
      {
        id: 2,
        title: "Late-night carbs make you feel bloated the next morning",
        description: "Evening meals with >50g carbs correlate with morning bloating",
        confidence: 72,
        trend: "down",
        icon: AlertCircle,
        color: "text-red-600"
      },
      {
        id: 3,
        title: "Mediterranean meals boost your calm energy by 31%",
        description: "Olive oil, fish, and vegetables consistently improve your mood",
        confidence: 91,
        trend: "up",
        icon: Heart,
        color: "text-blue-600"
      },
      {
        id: 4,
        title: "Caffeine after 2 PM disrupts your sleep quality",
        description: "Late caffeine intake correlates with restless sleep patterns",
        confidence: 78,
        trend: "down",
        icon: Moon,
        color: "text-purple-600"
      }
    ];
    setInsights(mockInsights);
  };

  const submitMoodEntry = async (mood, mealId) => {
    try {
      const response = await fetch(`${API_BASE}/mood-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mealId,
          mood: mood.id,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (response.ok) {
        fetchMoodData();
        setShowMoodModal(false);
        setSelectedMeal(null);
        alert(`✅ Mood tracked: ${mood.label}`);
      } else if (response.status === 429) {
        // Handle cooldown period
        alert(`⏰ ${data.message}`);
        setShowMoodModal(false);
        setSelectedMeal(null);
      } else {
        alert('Failed to track mood');
      }
    } catch (error) {
      console.error('Error submitting mood:', error);
      alert('Error tracking mood');
    }
  };

  const openMoodModal = (meal) => {
    setSelectedMeal(meal);
    setShowMoodModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-burgundy-700 mb-2">Understanding</h1>
        <p className="text-gray-600">
          Discover how your meals affect your mood, energy, and well-being
        </p>
      </div>

      {/* Key Insights Dashboard */}
      <div className="card bg-gradient-to-r from-burgundy-50 to-cream-50">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-6 w-6 text-burgundy-600" />
          <h2 className="text-xl font-semibold text-gray-800">Your Personal Insights</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <div key={insight.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-gray-50 ${insight.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">{insight.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{insight.confidence}% confidence</span>
                      </div>
                      <div className={`text-xs font-medium ${
                        insight.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {insight.trend === 'up' ? '↗️ Improving' : '↘️ Declining'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Mood Entries */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-5 w-5 text-burgundy-600" />
          <h2 className="text-xl font-semibold text-gray-800">Recent Mood Tracking</h2>
        </div>
        
        {moodData.length > 0 ? (
          <div className="space-y-3">
            {moodData.slice(0, 5).map((entry) => {
              const mood = moodOptions.find(m => m.id === entry.mood);
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{mood?.emoji}</span>
                    <div>
                      <div className="font-medium text-gray-800">{mood?.label}</div>
                      <div className="text-sm text-gray-500">{entry.mealTitle}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">No mood data yet</h3>
            <p className="text-gray-400">Start tracking your mood after meals to discover patterns</p>
          </div>
        )}
      </div>

      {/* Quick Mood Check */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="text-center">
          <h3 className="font-semibold text-blue-800 mb-2">How are you feeling right now?</h3>
          <p className="text-sm text-blue-600 mb-4">Track your current mood to build better insights</p>
          
          {cooldownInfo ? (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium text-orange-800">Cooldown Active</div>
                  <div className="text-sm text-orange-600">
                    Next mood entry allowed in {cooldownInfo.remainingHours}h {cooldownInfo.remainingMinutes}m
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {moodOptions.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => submitMoodEntry(mood, 'current-mood')}
                  className="flex flex-col items-center space-y-2 p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-medium text-gray-700">{mood.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mood Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              How did this meal make you feel?
            </h3>
            <p className="text-sm text-gray-600 mb-4">{selectedMeal?.title}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {moodOptions.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => submitMoodEntry(mood, selectedMeal?.id)}
                  className="flex flex-col items-center space-y-2 p-3 border border-gray-200 rounded-lg hover:border-burgundy-300 hover:bg-burgundy-50 transition-colors"
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{mood.label}</span>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowMoodModal(false)}
              className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Understanding;
