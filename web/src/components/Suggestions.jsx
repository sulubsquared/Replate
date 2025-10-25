import { useState, useEffect } from 'react';
import { Search, Clock, Flame, Zap, ChevronDown, ChevronUp, Plus, Calendar, Settings, Shield, AlertTriangle } from 'lucide-react';

const Suggestions = ({ userId, refreshTrigger }) => {
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

  const handleAddToMealPlan = async (recipe, selectElement) => {
    const day = selectElement.value;
    if (!day) return;

    setAddingToMealPlan(true);
    try {
      const response = await fetch(`${API_BASE}/meal-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, day, recipe })
      });

      if (response.ok) {
        alert(`Added ${recipe.title} to ${day}!`);
        selectElement.value = '';
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

  const toggleRecipeExpansion = (recipeId) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
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
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <img
                  src={recipe.photo_url}
                  alt={recipe.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-800">{recipe.title}</h3>
                
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
                      onChange={(e) => handleAddToMealPlan(recipe, e.target)}
                      disabled={addingToMealPlan}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">Add to meal plan</option>
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                </div>

                {expandedRecipe === recipe.id && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Instructions</h4>
                      <p className="text-sm text-gray-600">{recipe.instructions}</p>
                    </div>
                    
                    {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Missing Ingredients</h4>
                        <div className="space-y-1">
                          {recipe.missingIngredients.map((ingredient, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                {ingredient.name} ({ingredient.missing} {ingredient.unit})
                              </span>
                              <button className="text-burgundy-600 hover:text-burgundy-700">
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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