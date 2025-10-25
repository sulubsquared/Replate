import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, ChefHat } from 'lucide-react';

const MealPlan = ({ userId }) => {
  const [mealPlan, setMealPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slots = [
    { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { id: 'lunch', label: 'Lunch', icon: '☀️' },
    { id: 'dinner', label: 'Dinner', icon: '🌙' },
    { id: 'snack', label: 'Snack', icon: '🍎' },
  ];

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  useEffect(() => {
    fetchMealPlan();
  }, [userId, currentWeek]);

  const fetchMealPlan = async () => {
    setLoading(true);
    try {
      // Get the start and end of the current week
      const startOfWeek = new Date(currentWeek);
      startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // For now, we'll create a mock meal plan since we don't have the full API
      // In a real implementation, you'd fetch from your meal_plan table
      const mockMealPlan = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        mockMealPlan[dateStr] = {
          breakfast: i === 1 ? { title: 'Scrambled Eggs', time: '8:00 AM' } : null,
          lunch: i === 2 ? { title: 'Simple Chicken and Rice', time: '12:30 PM' } : null,
          dinner: i === 3 ? { title: 'Pasta with Tomato Sauce', time: '7:00 PM' } : null,
          snack: i === 4 ? { title: 'Cheesy Baked Potato', time: '3:00 PM' } : null,
        };
      }
      
      setMealPlan(mockMealPlan);
    } catch (error) {
      console.error('Error fetching meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const getDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy-600"></div>
      </div>
    );
  }

  const weekDates = getWeekDates();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-burgundy-700">Meal Plan</h1>
          <p className="text-gray-600 mt-1">
            Plan your meals for the week
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateWeek(-1)}
            className="btn-secondary"
          >
            Previous Week
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="btn-primary"
          >
            This Week
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="btn-secondary"
          >
            Next Week
          </button>
        </div>
      </div>

      {/* Week View */}
      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-cream-200">
          {weekDates.map((date, dayIndex) => (
            <div key={dayIndex} className="bg-white">
              {/* Day Header */}
              <div className={`p-4 text-center border-b border-cream-200 ${
                isToday(date) ? 'bg-burgundy-50' : ''
              }`}>
                <div className="text-sm font-medium text-gray-500">
                  {days[dayIndex]}
                </div>
                <div className={`text-lg font-semibold ${
                  isToday(date) ? 'text-burgundy-700' : 'text-gray-800'
                }`}>
                  {date.getDate()}
                </div>
                <div className="text-xs text-gray-400">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>

              {/* Meal Slots */}
              <div className="p-3 space-y-2 min-h-[300px]">
                {slots.map((slot) => {
                  const dateStr = getDateString(date);
                  const meal = mealPlan[dateStr]?.[slot.id];
                  
                  return (
                    <div
                      key={slot.id}
                      className={`p-3 rounded-lg border-2 border-dashed transition-colors ${
                        meal
                          ? 'border-burgundy-200 bg-burgundy-50'
                          : 'border-cream-300 hover:border-burgundy-300 hover:bg-cream-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{slot.icon}</span>
                        <span className="text-xs font-medium text-gray-600 uppercase">
                          {slot.label}
                        </span>
                      </div>
                      
                      {meal ? (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-800">
                            {meal.title}
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{meal.time}</span>
                          </div>
                        </div>
                      ) : (
                        <button className="w-full text-left text-xs text-gray-400 hover:text-burgundy-600 transition-colors">
                          <div className="flex items-center space-x-1">
                            <Plus className="h-3 w-3" />
                            <span>Add meal</span>
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <ChefHat className="h-8 w-8 text-burgundy-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">Add from Suggestions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose from your personalized recipe suggestions
          </p>
          <button className="btn-primary w-full">
            Browse Suggestions
          </button>
        </div>

        <div className="card text-center">
          <Calendar className="h-8 w-8 text-burgundy-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">Quick Add</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add meals manually to any day and time slot
          </p>
          <button className="btn-secondary w-full">
            Add Manually
          </button>
        </div>

        <div className="card text-center">
          <Clock className="h-8 w-8 text-burgundy-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">Generate Week</h3>
          <p className="text-sm text-gray-600 mb-4">
            Auto-generate a full week of meals
          </p>
          <button className="btn-secondary w-full">
            Auto-Generate
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealPlan;
