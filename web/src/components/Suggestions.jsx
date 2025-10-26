import { useState, useEffect } from 'react';
import { Search, Clock, Flame, Zap, ChevronDown, ChevronUp, Plus, Calendar, Utensils, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

const Suggestions = ({ userId, refreshTrigger, onPantryUpdate }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [addingToMealPlan, setAddingToMealPlan] = useState(false);
  const [dietarySummary, setDietarySummary] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  useEffect(() => {
    if (refreshTrigger) {
      handleReplate();
    }
  }, [refreshTrigger]);

  const handleReplate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      setRecipes(data.recipes || []);
      setDietarySummary(data.dietarySummary);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMealPlan = async (recipe, daySelectElement, mealTimeSelectElement) => {
    const day = daySelectElement.value;
    const mealTime = mealTimeSelectElement.value;
    if (!day || !mealTime) return;

    setAddingToMealPlan(true);
    try {
      const response = await fetch(`${API_BASE}/meal-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, day, mealTime, recipe })
      });

      if (response.ok) {
        alert(`Added ${recipe.title} to ${day} ${mealTime}!`);
        daySelectElement.value = '';
        mealTimeSelectElement.value = '';
      } else {
        alert('Failed to add to meal plan');
      }
    } catch (error) {
      console.error('Error adding to meal plan:', error);
      alert('Error adding to meal plan');
    } finally {
      setAddingToMealPlan(false);
    }
  };

  const addMissingIngredientToPantry = async (ingredient) => {
    try {
      const response = await fetch(`${API_BASE}/pantry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ingredientId: null, // Will be found by name
          qty: ingredient.missing,
          customIngredient: {
            name: ingredient.name,
            unit: ingredient.unit
          }
        })
      });

      if (response.ok) {
        alert(`Added ${ingredient.name} to your pantry!`);
        if (onPantryUpdate) {
          onPantryUpdate(); // Trigger pantry refresh
        }
      } else {
        alert('Failed to add ingredient to pantry');
      }
    } catch (error) {
      console.error('Error adding ingredient to pantry:', error);
      alert('Error adding ingredient to pantry');
    }
  };

  const toggleRecipeExpansion = (recipeId) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  const checkDietaryRestrictions = (recipe, dietarySummary) => {
    if (!dietarySummary) return null;
    
    const restrictions = [];
    const textToCheck = `${recipe.title} ${recipe.instructions}`.toLowerCase();
    
    // check allergies
    if (dietarySummary.allergies && dietarySummary.allergies.length > 0) {
      dietarySummary.allergies.forEach(allergy => {
        if (textToCheck.includes(allergy.toLowerCase())) {
          restrictions.push({ type: 'allergy', ingredient: allergy, severity: 'high' });
        }
      });
    }
    
    // check personal restrictions
    if (dietarySummary.restrictions && dietarySummary.restrictions.length > 0) {
      dietarySummary.restrictions.forEach(restriction => {
        if (textToCheck.includes(restriction.toLowerCase())) {
          restrictions.push({ type: 'restriction', ingredient: restriction, severity: 'medium' });
        }
      });
    }
    
    return restrictions.length > 0 ? restrictions : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-burgundy-700">Recipe Suggestions</h1>
          <p className="text-gray-600 mt-1">Discover recipes based on your pantry and dietary preferences</p>
        </div>
        <button
          onClick={handleReplate}
          disabled={loading}
          className="btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Search className="h-5 w-5" />
          )}
          <span>Replate Me!</span>
        </button>
      </div>

      {/* Dietary Summary */}
      {dietarySummary && (
        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">
              {dietarySummary.usingSavedPreferences ? 'Using Saved Dietary Preferences' : 'Dietary Filtering Applied'}
            </h3>
          </div>
          <div className="text-sm text-green-700">
            <p><strong>Diet:</strong> {dietarySummary.diet}</p>
            <p><strong>Allergies:</strong> {dietarySummary.allergies.length > 0 ? dietarySummary.allergies.join(', ') : 'None'}</p>
            <p><strong>Restrictions:</strong> {dietarySummary.restrictions.length > 0 ? dietarySummary.restrictions.join(', ') : 'None'}</p>
            <p><strong>Filtered out:</strong> {dietarySummary.filteredCount} recipes</p>
            {dietarySummary.usingSavedPreferences && (
              <p className="text-xs text-green-600 mt-2">
                💡 Update your preferences in the "Preferences" tab to change filtering
              </p>
            )}
          </div>
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="card text-center py-12">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No recipes yet</h3>
          <p className="text-gray-400">Click "Replate Me!" to get recipe suggestions</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="card overflow-hidden">
              <div className="mb-4 flex items-center justify-center h-48 bg-gradient-to-br from-burgundy-50 to-cream-50 rounded-lg">
                <Utensils className="h-16 w-16 text-burgundy-400" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">{recipe.title}</h3>
                  {checkDietaryRestrictions(recipe, dietarySummary) && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <Shield className="h-4 w-4" />
                      <span className="text-xs font-medium">Restricted</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{recipe.minutes} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Flame className="h-4 w-4" />
                    <span>{recipe.calories} cal</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4" />
                    <span>{recipe.protein}g protein</span>
                  </div>
                </div>

                {/* Missing Ingredients */}
                {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Missing Ingredients</span>
                    </div>
                    <div className="space-y-1">
                      {recipe.missingIngredients.slice(0, 3).map((ingredient, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-red-700">
                            {ingredient.name} ({ingredient.missing} {ingredient.unit})
                          </span>
                          <button 
                            onClick={() => addMissingIngredientToPantry(ingredient)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title={`Add ${ingredient.name} to pantry`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {recipe.missingIngredients.length > 3 && (
                        <div className="text-xs text-red-600">
                          +{recipe.missingIngredients.length - 3} more ingredients needed
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Available Ingredients */}
                {(!recipe.missingIngredients || recipe.missingIngredients.length === 0) && recipe.availableIngredients > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        You have all {recipe.availableIngredients} ingredients needed!
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleRecipeExpansion(recipe.id)}
                    className="text-burgundy-600 hover:text-burgundy-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <span>View Recipe Details</span>
                    {expandedRecipe === recipe.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      disabled={addingToMealPlan}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                      onChange={(e) => {
                        const daySelect = e.target;
                        const mealTimeSelect = e.target.nextElementSibling;
                        if (daySelect.value && mealTimeSelect.value) {
                          handleAddToMealPlan(recipe, daySelect, mealTimeSelect);
                        }
                      }}
                    >
                      <option value="">Day</option>
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                    <select
                      disabled={addingToMealPlan}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                      onChange={(e) => {
                        const mealTimeSelect = e.target;
                        const daySelect = e.target.previousElementSibling;
                        if (daySelect.value && mealTimeSelect.value) {
                          handleAddToMealPlan(recipe, daySelect, mealTimeSelect);
                        }
                      }}
                    >
                      <option value="">Meal</option>
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>
                </div>

                {expandedRecipe === recipe.id && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Dietary Restrictions Warning */}
                    {checkDietaryRestrictions(recipe, dietarySummary) && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-4 w-4 text-red-600" />
                          <h4 className="font-medium text-red-800">Dietary Restrictions</h4>
                        </div>
                        <div className="space-y-1">
                          {checkDietaryRestrictions(recipe, dietarySummary).map((restriction, index) => (
                            <div key={index} className="text-sm">
                              <span className={`font-medium ${
                                restriction.severity === 'high' ? 'text-red-700' : 'text-orange-700'
                              }`}>
                                {restriction.type === 'allergy' ? '⚠️ Allergy:' : '🚫 Restriction:'}
                              </span>
                              <span className={`ml-1 ${
                                restriction.severity === 'high' ? 'text-red-600' : 'text-orange-600'
                              }`}>
                                {restriction.ingredient}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Instructions</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{recipe.instructions}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Suggestions;