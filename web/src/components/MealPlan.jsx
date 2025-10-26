import { useState, useEffect } from 'react';
import { Calendar, Clock, Flame, Zap, Trash2, ChevronLeft, ChevronRight, Utensils, Heart } from 'lucide-react';

const MealPlan = ({ userId }) => {
  const [mealPlan, setMealPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(0);
  
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTimes = ['breakfast', 'lunch', 'dinner'];
  const mealTimeLabels = ['Breakfast', 'Lunch', 'Dinner'];

  useEffect(() => {
    fetchMealPlan();
  }, [userId]);

  const fetchMealPlan = async () => {
    try {
      const response = await fetch(`${API_BASE}/meal-plan/${userId}`);
      const data = await response.json();
      setMealPlan(data);
    } catch (error) {
      console.error('Error fetching meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeMeal = async (day, mealId) => {
    try {
      const response = await fetch(`${API_BASE}/meal-plan/${day}/${mealId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchMealPlan();
      }
    } catch (error) {
      console.error('Error removing meal:', error);
    }
  };

  const trackMood = async (meal, mood) => {
    try {
      const response = await fetch(`${API_BASE}/mood-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mealId: meal.id,
          mood: mood.id,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Mood tracked: ${mood.label} for ${meal.recipe.title}`);
      } else if (response.status === 429) {
        // Handle cooldown period
        alert(`⏰ ${data.message}`);
      } else {
        alert('Failed to track mood');
      }
    } catch (error) {
      console.error('Error tracking mood:', error);
      alert('Error tracking mood');
    }
  };

  const calculateDailyMacros = (day) => {
    const dayMeals = mealPlan[day] || { breakfast: [], lunch: [], dinner: [] };
    const allMeals = [...dayMeals.breakfast, ...dayMeals.lunch, ...dayMeals.dinner];
    
    return allMeals.reduce((totals, meal) => ({
      calories: totals.calories + (meal.recipe.calories || 0),
      protein: totals.protein + (meal.recipe.protein || 0),
      carbs: totals.carbs + (meal.recipe.carbs || 0),
      fat: totals.fat + (meal.recipe.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const calculateWeeklyMacros = () => {
    return days.reduce((totals, day) => {
      const dayMacros = calculateDailyMacros(day);
      return {
        calories: totals.calories + dayMacros.calories,
        protein: totals.protein + dayMacros.protein,
        carbs: totals.carbs + dayMacros.carbs,
        fat: totals.fat + dayMacros.fat,
        mealsCount: totals.mealsCount + Object.values(mealPlan[day] || {}).flat().length
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, mealsCount: 0 });
  };

  const navigateWeek = (direction) => {
    setCurrentWeek(prev => prev + direction);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy-600"></div>
      </div>
    );
  }

  const weeklyMacros = calculateWeeklyMacros();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-burgundy-700">Meal Plan</h1>
          <p className="text-gray-600 text-sm">Plan your meals for the week</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">Week {currentWeek + 1}</span>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekly Summary - Mobile Responsive */}
      <div className="card bg-gradient-to-r from-burgundy-50 to-cream-50 p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-burgundy-700">{weeklyMacros.mealsCount}</div>
            <div className="text-xs lg:text-sm text-gray-600">Meals Planned</div>
          </div>
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-burgundy-700">{weeklyMacros.calories.toLocaleString()}</div>
            <div className="text-xs lg:text-sm text-gray-600">Total Calories</div>
          </div>
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-burgundy-700">{weeklyMacros.protein.toFixed(0)}g</div>
            <div className="text-xs lg:text-sm text-gray-600">Total Protein</div>
          </div>
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-burgundy-700">{Math.round(weeklyMacros.calories / 7)}</div>
            <div className="text-xs lg:text-sm text-gray-600">Avg Daily Calories</div>
          </div>
        </div>
      </div>

      {/* Weekly Meal Plan - Mobile First Grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {days.map((day, index) => {
          const dayMeals = mealPlan[day] || { breakfast: [], lunch: [], dinner: [] };
          const dayMacros = calculateDailyMacros(day);
          const totalMeals = dayMeals.breakfast.length + dayMeals.lunch.length + dayMeals.dinner.length;

          return (
            <div key={day} className="card p-3 min-h-[200px]">
              <div className="text-center mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">{dayNames[index]}</h3>
                <div className="text-xs text-gray-500">
                  {totalMeals} meal{totalMeals !== 1 ? 's' : ''} • {dayMacros.calories} cal
                </div>
              </div>

              <div className="space-y-2">
                {mealTimes.map((mealTime) => (
                  <div key={mealTime} className="space-y-1">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {mealTimeLabels[mealTimes.indexOf(mealTime)]}
                    </div>
                    
                    {dayMeals[mealTime] && dayMeals[mealTime].length > 0 ? (
                      <div className="space-y-1">
                        {dayMeals[mealTime].map((meal) => (
                          <div key={meal.id} className="bg-gray-50 rounded p-2 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start space-x-1 flex-1 min-w-0">
                                <Utensils className="h-3 w-3 text-burgundy-400 flex-shrink-0 mt-0.5" />
                                <span className="font-medium text-gray-800 break-words leading-tight">{meal.recipe.title}</span>
                              </div>
                              <button
                                onClick={() => removeMeal(day, meal.id)}
                                className="text-red-500 hover:text-red-700 flex-shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                              <div className="flex items-center justify-between mt-1 text-gray-500">
                                <div className="flex items-center space-x-1 min-w-0">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span className="text-xs truncate">{meal.recipe.minutes}m</span>
                                </div>
                                <div className="flex items-center space-x-1 min-w-0">
                                  <Flame className="h-3 w-3 flex-shrink-0" />
                                  <span className="text-xs truncate">{meal.recipe.calories}cal</span>
                                </div>
                                <div className="flex items-center space-x-1 min-w-0">
                                  <Zap className="h-3 w-3 flex-shrink-0" />
                                  <span className="text-xs truncate">{meal.recipe.protein}g</span>
                                </div>
                              </div>
                            
                            {/* Mood Tracking */}
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-xs text-gray-500 mb-1">How did this meal make you feel?</div>
                              <div className="flex flex-wrap gap-1">
                                <button
                                  onClick={() => trackMood(meal, { id: 'energized', label: 'Energized' })}
                                  className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors flex-shrink-0"
                                >
                                  ⚡ Energized
                                </button>
                                <button
                                  onClick={() => trackMood(meal, { id: 'calm', label: 'Calm' })}
                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex-shrink-0"
                                >
                                  😌 Calm
                                </button>
                                <button
                                  onClick={() => trackMood(meal, { id: 'bloated', label: 'Bloated' })}
                                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex-shrink-0"
                                >
                                  🤢 Bloated
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">No meal planned</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats - Mobile Responsive */}
      <div className="card bg-gray-50 p-4">
        <div className="text-center">
          <h3 className="font-semibold text-gray-800 mb-3">Weekly Nutrition Summary</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Calories</div>
              <div className="text-lg font-bold text-burgundy-700">{weeklyMacros.calories.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Protein</div>
              <div className="text-lg font-bold text-burgundy-700">{weeklyMacros.protein.toFixed(0)}g</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Carbs</div>
              <div className="text-lg font-bold text-burgundy-700">{weeklyMacros.carbs.toFixed(0)}g</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Fat</div>
              <div className="text-lg font-bold text-burgundy-700">{weeklyMacros.fat.toFixed(0)}g</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlan;