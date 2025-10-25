import { useState, useEffect } from 'react';
import { Calendar, Clock, Flame, Zap, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const MealPlan = ({ userId }) => {
  const [mealPlan, setMealPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(0);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  const calculateDailyMacros = (day) => {
    const dayMeals = mealPlan[day] || [];
    return dayMeals.reduce((totals, meal) => ({
      calories: totals.calories + (meal.recipe.calories || 0),
      protein: totals.protein + (meal.recipe.protein || 0)
    }), { calories: 0, protein: 0 });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-burgundy-700">Meal Plan</h1>
          <p className="text-gray-600 mt-1">Plan your meals for the week</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600">Week {currentWeek + 1}</span>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {days.map((day, index) => {
          const dayMeals = mealPlan[day] || [];
          const macros = calculateDailyMacros(day);

          return (
            <div key={day} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{dayNames[index]}</h3>
                <Calendar className="h-5 w-5 text-burgundy-600" />
              </div>

              {macros.calories > 0 && (
                <div className="mb-4 p-3 bg-cream-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-orange-600">
                      <Flame className="h-4 w-4" />
                      <span className="font-medium">{macros.calories} cal</span>
                    </div>
                    <div className="flex items-center space-x-1 text-blue-600">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">{macros.protein.toFixed(1)}g protein</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {dayMeals.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">No meals planned</div>
                  </div>
                ) : (
                  dayMeals.map((meal) => (
                    <div key={meal.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 text-sm">{meal.recipe.title}</h4>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{meal.recipe.minutes} min</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Flame className="h-3 w-3" />
                              <span>{meal.recipe.calories} cal</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeMeal(day, meal.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MealPlan;