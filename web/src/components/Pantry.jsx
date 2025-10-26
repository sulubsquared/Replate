import { useState, useEffect } from 'react';
import { Plus, Trash2, Package, Flame, Zap, Search } from 'lucide-react';

const Pantry = ({ userId, onPantryUpdate }) => {
  const [pantry, setPantry] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [quantity, setQuantity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  useEffect(() => {
    fetchPantry();
    fetchIngredients();
  }, [userId]);

  const fetchPantry = async () => {
    try {
      const response = await fetch(`${API_BASE}/pantry/${userId}`);
      const data = await response.json();
      setPantry(data);
    } catch (error) {
      console.error('Error fetching pantry:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch(`${API_BASE}/ingredients`);
      const data = await response.json();
      setIngredients(data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/search-ingredients?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching ingredients:', error);
    }
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (!selectedIngredient || !quantity) return;

    try {
      const response = await fetch(`${API_BASE}/pantry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ingredientId: selectedIngredient,
          qty: parseFloat(quantity)
        })
      });

      if (response.ok) {
        fetchPantry();
        onPantryUpdate?.();
        setSelectedIngredient('');
        setQuantity('');
        setSearchQuery('');
        setSearchResults([]);
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding ingredient:', error);
    }
  };

  const handleRemoveIngredient = async (ingredientId) => {
    try {
      const response = await fetch(`${API_BASE}/pantry/${userId}/${ingredientId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchPantry();
        onPantryUpdate?.();
      }
    } catch (error) {
      console.error('Error removing ingredient:', error);
    }
  };

  const getIngredientMacros = (ingredientName) => {
    const macroData = {
      'Chicken Breast': { calories: 165, protein: 31 },
      'Eggs': { calories: 70, protein: 6 },
      'Onion': { calories: 40, protein: 1 },
      'Garlic': { calories: 4, protein: 0.2 },
      'Rice': { calories: 130, protein: 2.7 },
      'Tomato': { calories: 18, protein: 0.9 },
      'Olive Oil': { calories: 120, protein: 0 },
      'Salt': { calories: 0, protein: 0 },
      'Black Pepper': { calories: 6, protein: 0.3 },
      'Milk': { calories: 42, protein: 3.4 }
    };
    return macroData[ingredientName] || { calories: 0, protein: 0 };
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
          <h1 className="text-3xl font-bold text-burgundy-700">My Pantry</h1>
          <p className="text-gray-600 mt-1">Manage the ingredients you have at home</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Ingredient</span>
        </button>
      </div>

      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Ingredient</h3>
          <form onSubmit={handleAddIngredient} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Ingredients
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-burgundy-500 focus:border-transparent"
                  placeholder="Type to search ingredients..."
                  required
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((ingredient) => (
                    <button
                      key={ingredient.id}
                      type="button"
                      onClick={() => {
                        setSelectedIngredient(ingredient.id);
                        setSearchQuery(ingredient.name);
                        setSearchResults([]);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      {ingredient.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input"
                placeholder="0.0"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Add to Pantry
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {pantry.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">Your pantry is empty</h3>
            <p className="text-gray-400">Add some ingredients to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Pantry Items ({pantry.length})
            </h3>
            {pantry.filter(item => item.ingredients).map((item) => {
              const macros = getIngredientMacros(item.ingredients?.name || '');
              const totalCalories = Math.round(macros.calories * item.qty);
              const totalProtein = Math.round(macros.protein * item.qty * 10) / 10;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-cream-50 rounded-xl border border-cream-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-burgundy-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-burgundy-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.ingredients?.name || 'Unknown'}</h4>
                      <p className="text-sm text-gray-500 mb-2">
                        {item.qty} {item.ingredients?.unit || 'units'}
                      </p>
                      {(totalCalories > 0 || totalProtein > 0) && (
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-1 text-orange-600">
                            <Flame className="h-3 w-3" />
                            <span className="font-medium">{totalCalories} cal</span>
                          </div>
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Zap className="h-3 w-3" />
                            <span className="font-medium">{totalProtein}g protein</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveIngredient(item.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pantry;