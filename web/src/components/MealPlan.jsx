import { useState, useEffect } from 'react';
import { Calendar, Clock, Flame, Zap, Trash2, ChevronLeft, ChevronRight, TrendingUp, Target } from 'lucide-react';

const MealPlan = ({ userId }) => {
  const [mealPlan, setMealPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(0);
  
  // Weekly goals (customizable by user in a real app)
  const weeklyGoals = {
    calories: 14000, // 2000 per day average
    protein: 700,    // 100g per day average
    carbs: 1750,     // 250g per day average
    fat: 490         // 70g per day average
  };

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
        mealsCount: totals.mealsCount + (mealPlan[day]?.length || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, mealsCount: 0 });
  };

  const navigateWeek = (direction) => {
    setCurrentWeek(prev => prev + direction);
  };

  // Circular Progress Ring Component
  const CircularProgress = ({ value, max, size = 120, strokeWidth = 10, color = '#dc2626', label, unit = '' }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</span>
            <span className="text-xs text-gray-500">{unit}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{label}</p>
        <p className="text-xs text-gray-400">of {max.toLocaleString()}{unit}</p>
        <p className="text-xs font-semibold" style={{ color }}>{percentage.toFixed(0)}%</p>
      </div>
    );
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

      {weeklyMacros.mealsCount > 0 && (
        <>
          <div className="card bg-gradient-to-br from-burgundy-50 to-cream-50 border-2 border-burgundy-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Target className="h-6 w-6 text-burgundy-600" />
                <h2 className="text-xl font-bold text-burgundy-700">Weekly Goals Tracker</h2>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-burgundy-700">{weeklyMacros.mealsCount} meal{weeklyMacros.mealsCount !== 1 ? 's' : ''}</span> planned
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <CircularProgress
                value={weeklyMacros.calories}
                max={weeklyGoals.calories}
                size={140}
                strokeWidth={12}
                color="#f97316"
                label="Calories"
                unit=""
              />
              
              <CircularProgress
                value={Math.round(weeklyMacros.protein)}
                max={weeklyGoals.protein}
                size={140}
                strokeWidth={12}
                color="#3b82f6"
                label="Protein"
                unit="g"
              />
              
              <CircularProgress
                value={Math.round(weeklyMacros.carbs)}
                max={weeklyGoals.carbs}
                size={140}
                strokeWidth={12}
                color="#22c55e"
                label="Carbs"
                unit="g"
              />
              
              <CircularProgress
                value={Math.round(weeklyMacros.fat)}
                max={weeklyGoals.fat}
                size={140}
                strokeWidth={12}
                color="#eab308"
                label="Fat"
                unit="g"
              />
            </div>
            
            <div className="mt-6 pt-4 border-t border-burgundy-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Daily Avg Calories</p>
                  <p className="text-lg font-bold text-gray-800">{Math.round(weeklyMacros.calories / 7)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Daily Avg Protein</p>
                  <p className="text-lg font-bold text-gray-800">{(weeklyMacros.protein / 7).toFixed(1)}g</p>
                </div>
                <div>
                  <p className="text-gray-600">Daily Avg Carbs</p>
                  <p className="text-lg font-bold text-gray-800">{(weeklyMacros.carbs / 7).toFixed(1)}g</p>
                </div>
                <div>
                  <p className="text-gray-600">Daily Avg Fat</p>
                  <p className="text-lg font-bold text-gray-800">{(weeklyMacros.fat / 7).toFixed(1)}g</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-6 w-6 text-burgundy-600" />
              <h2 className="text-xl font-bold text-burgundy-700">Daily Nutritional Breakdown</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Day</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Meals</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-orange-600">
                      <div className="flex items-center justify-end space-x-1">
                        <Flame className="h-4 w-4" />
                        <span>Calories</span>
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-blue-600">
                      <div className="flex items-center justify-end space-x-1">
                        <Zap className="h-4 w-4" />
                        <span>Protein</span>
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-green-600">
                      <div className="flex items-center justify-end space-x-1">
                        <div className="h-4 w-4 rounded bg-green-500 flex items-center justify-center text-white text-xs font-bold">C</div>
                        <span>Carbs</span>
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-yellow-600">
                      <div className="flex items-center justify-end space-x-1">
                        <div className="h-4 w-4 rounded bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">F</div>
                        <span>Fat</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day, index) => {
                    const dayMacros = calculateDailyMacros(day);
                    const mealCount = mealPlan[day]?.length || 0;
                    const hasData = mealCount > 0;
                    
                    return (
                      <tr 
                        key={day} 
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!hasData ? 'opacity-50' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-800">{dayNames[index]}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-sm text-gray-600">{mealCount}</span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={`text-sm font-medium ${hasData ? 'text-orange-600' : 'text-gray-400'}`}>
                            {hasData ? dayMacros.calories.toLocaleString() : '0'}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={`text-sm font-medium ${hasData ? 'text-blue-600' : 'text-gray-400'}`}>
                            {hasData ? `${dayMacros.protein.toFixed(1)}g` : '0g'}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={`text-sm font-medium ${hasData ? 'text-green-600' : 'text-gray-400'}`}>
                            {hasData ? `${dayMacros.carbs.toFixed(1)}g` : '0g'}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={`text-sm font-medium ${hasData ? 'text-yellow-600' : 'text-gray-400'}`}>
                            {hasData ? `${dayMacros.fat.toFixed(1)}g` : '0g'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-burgundy-50 font-semibold border-t-2 border-burgundy-200">
                    <td className="py-3 px-4 text-burgundy-700">Weekly Total</td>
                    <td className="text-center py-3 px-4 text-burgundy-700">{weeklyMacros.mealsCount}</td>
                    <td className="text-right py-3 px-4 text-orange-700">{weeklyMacros.calories.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-blue-700">{weeklyMacros.protein.toFixed(1)}g</td>
                    <td className="text-right py-3 px-4 text-green-700">{weeklyMacros.carbs.toFixed(1)}g</td>
                    <td className="text-right py-3 px-4 text-yellow-700">{weeklyMacros.fat.toFixed(1)}g</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {days.map((day, index) => {
          const dayMeals = mealPlan[day] || [];
          const macros = calculateDailyMacros(day);

          return (
            <div key={day} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{dayNames[index]}</h3>
                <Calendar className="h-5 w-5 text-burgundy-600" />
              </div>

              {/* Nutritional Facts Summary */}
              <div className="mb-3 p-3 bg-gradient-to-br from-gray-50 to-cream-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Daily Nutrition</div>
                
                {macros.calories > 0 ? (
                  <>
                    {/* Calories - Prominent Display */}
                    <div className="mb-2 pb-2 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1">
                          <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          <span className="text-[10px] font-medium text-gray-600">Calories</span>
                        </div>
                        <span className="text-lg font-bold text-orange-600 flex-shrink-0">{macros.calories}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-1 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((macros.calories / 2000) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Macros Grid */}
                    <div className="grid grid-cols-3 gap-1.5 px-1">
                      <div className="text-center min-w-0">
                        <div className="flex flex-col items-center mb-0.5">
                          <Zap className="h-3 w-3 text-blue-500 mb-0.5 flex-shrink-0" />
                          <span className="text-[9px] text-gray-600 truncate w-full">Protein</span>
                        </div>
                        <p className="text-sm font-bold text-blue-600 truncate">
                          <span className="text-base">{macros.protein.toFixed(0)}</span>
                          <span className="text-[9px]">g</span>
                        </p>
                      </div>
                      
                      <div className="text-center border-x border-gray-200 min-w-0">
                        <div className="flex flex-col items-center mb-0.5">
                          <div className="h-3 w-3 rounded bg-green-500 mb-0.5 flex-shrink-0"></div>
                          <span className="text-[9px] text-gray-600 truncate w-full">Carbs</span>
                        </div>
                        <p className="text-sm font-bold text-green-600 truncate">
                          <span className="text-base">{macros.carbs.toFixed(0)}</span>
                          <span className="text-[9px]">g</span>
                        </p>
                      </div>
                      
                      <div className="text-center min-w-0">
                        <div className="flex flex-col items-center mb-0.5">
                          <div className="h-3 w-3 rounded bg-yellow-500 mb-0.5 flex-shrink-0"></div>
                          <span className="text-[9px] text-gray-600 truncate w-full">Fat</span>
                        </div>
                        <p className="text-sm font-bold text-yellow-600 truncate">
                          <span className="text-base">{macros.fat.toFixed(0)}</span>
                          <span className="text-[9px]">g</span>
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-xs text-gray-400">No meals planned</p>
                  </div>
                )}
              </div>

              {/* Meals by Type */}
              <div className="space-y-3">
                {/* Breakfast */}
                <div>
                  <div className="flex items-center space-x-2 mb-2 px-1">
                    <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Breakfast</div>
                  </div>
                  <div className="space-y-2">
                    {dayMeals.filter(m => m.mealType === 'breakfast').length > 0 ? (
                      dayMeals.filter(m => m.mealType === 'breakfast').map((meal) => (
                        <div key={meal.id} className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200">
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
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-3 text-xs text-gray-400 bg-gray-50 rounded border border-dashed border-gray-300">
                        No breakfast planned
                      </div>
                    )}
                  </div>
                </div>

                {/* Lunch */}
                <div>
                  <div className="flex items-center space-x-2 mb-2 px-1">
                    <div className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Lunch</div>
                  </div>
                  <div className="space-y-2">
                    {dayMeals.filter(m => m.mealType === 'lunch').length > 0 ? (
                      dayMeals.filter(m => m.mealType === 'lunch').map((meal) => (
                        <div key={meal.id} className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200">
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
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-3 text-xs text-gray-400 bg-gray-50 rounded border border-dashed border-gray-300">
                        No lunch planned
                      </div>
                    )}
                  </div>
                </div>

                {/* Dinner */}
                <div>
                  <div className="flex items-center space-x-2 mb-2 px-1">
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Dinner</div>
                  </div>
                  <div className="space-y-2">
                    {dayMeals.filter(m => m.mealType === 'dinner').length > 0 ? (
                      dayMeals.filter(m => m.mealType === 'dinner').map((meal) => (
                        <div key={meal.id} className="p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200">
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
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-3 text-xs text-gray-400 bg-gray-50 rounded border border-dashed border-gray-300">
                        No dinner planned
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MealPlan;