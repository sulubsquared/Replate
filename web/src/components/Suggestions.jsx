import { useState, useEffect } from 'react';
import { ChefHat, Clock, Flame, Zap, ShoppingCart, Star } from 'lucide-react';

const Suggestions = ({ userId }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pantryCount, setPantryCount] = useState(0);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  const handleReplate = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuggestions(data.recipes);
        setMessage(data.message);
        setPantryCount(data.pantryCount);
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCoverageColor = (coverage) => {
    if (coverage >= 0.8) return 'text-green-600 bg-green-100';
    if (coverage >= 0.6) return 'text-yellow-600 bg-yellow-100';
    if (coverage >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getCoverageText = (coverage) => {
    if (coverage >= 0.8) return 'Excellent match!';
    if (coverage >= 0.6) return 'Good match';
    if (coverage >= 0.4) return 'Partial match';
    return 'Needs more ingredients';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-burgundy-700 mb-2">Recipe Suggestions</h1>
        <p className="text-gray-600 mb-6">
          Get AI-powered recipe suggestions based on what's in your pantry
        </p>
        
        <button
          onClick={handleReplate}
          disabled={loading}
          className="btn-primary text-lg px-8 py-4 flex items-center space-x-3 mx-auto"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <>
              <ChefHat className="h-6 w-6" />
              <span>Replate Me!</span>
            </>
          )}
        </button>

        {message && (
          <div className="mt-4 p-4 bg-burgundy-50 border border-burgundy-200 rounded-xl">
            <p className="text-burgundy-700 font-medium text-center">{message}</p>
          </div>
        )}

        {pantryCount > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Based on {pantryCount} ingredients in your pantry
          </p>
        )}
      </div>

      {/* Suggestions Grid */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((recipe, index) => (
            <div key={recipe.id} className="card group hover:shadow-warm transition-shadow duration-200">
              {/* Recipe Image */}
              <div className="relative mb-4">
                <img
                  src={recipe.photo_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop'}
                  alt={recipe.title}
                  className="w-full h-48 object-cover rounded-xl"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCoverageColor(recipe.coverage)}`}>
                    {Math.round(recipe.coverage * 100)}% match
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-700">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipe Info */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-800 group-hover:text-burgundy-600 transition-colors">
                  {recipe.title}
                </h3>
                
                <p className="text-sm text-gray-600">
                  {getCoverageText(recipe.coverage)} • {recipe.availableIngredients}/{recipe.totalIngredients} ingredients available
                </p>

                {/* Recipe Stats */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{recipe.minutes} min</span>
                    </div>
                    {recipe.calories && (
                      <div className="flex items-center space-x-1">
                        <Flame className="h-4 w-4" />
                        <span>{recipe.calories} cal</span>
                      </div>
                    )}
                    {recipe.protein && (
                      <div className="flex items-center space-x-1">
                        <Zap className="h-4 w-4" />
                        <span>{recipe.protein}g protein</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Macro Breakdown */}
                  {(recipe.calories || recipe.protein) && (
                    <div className="bg-cream-100 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Nutritional Info</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {recipe.calories && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Calories:</span>
                            <span className="font-semibold text-burgundy-600">{recipe.calories}</span>
                          </div>
                        )}
                        {recipe.protein && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Protein:</span>
                            <span className="font-semibold text-burgundy-600">{recipe.protein}g</span>
                          </div>
                        )}
                        {recipe.carbs && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Carbs:</span>
                            <span className="font-semibold text-green-600">{recipe.carbs}g</span>
                          </div>
                        )}
                        {recipe.fat && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Fat:</span>
                            <span className="font-semibold text-yellow-600">{recipe.fat}g</span>
                          </div>
                        )}
                        {recipe.calories && recipe.protein && (
                          <div className="col-span-2 pt-2 border-t border-cream-200">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Protein per 100 cal:</span>
                              <span className="font-medium">
                                {Math.round((recipe.protein / recipe.calories) * 100 * 10) / 10}g
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Missing Ingredients */}
                {recipe.missingIngredients.length > 0 && (
                  <div className="pt-3 border-t border-cream-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Missing ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {recipe.missingIngredients.slice(0, 3).map((ingredient, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"
                        >
                          {ingredient.name}
                        </span>
                      ))}
                      {recipe.missingIngredients.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          +{recipe.missingIngredients.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-3">
                  <button className="flex-1 btn-primary text-sm py-2">
                    Add to Meal Plan
                  </button>
                  <button className="btn-secondary text-sm py-2 px-3">
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !loading && (
        <div className="text-center py-12">
          <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">Ready to get cooking?</h3>
          <p className="text-gray-400">Click "Replate Me!" to get personalized recipe suggestions</p>
        </div>
      )}
    </div>
  );
};

export default Suggestions;
