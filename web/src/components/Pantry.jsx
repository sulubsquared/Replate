import { useState, useEffect } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';

const Pantry = ({ userId }) => {
  const [pantry, setPantry] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [quantity, setQuantity] = useState('');

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

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (!selectedIngredient || !quantity) return;

    try {
      const response = await fetch(`${API_BASE}/pantry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ingredientId: selectedIngredient,
          qty: parseFloat(quantity),
        }),
      });

      if (response.ok) {
        fetchPantry();
        setSelectedIngredient('');
        setQuantity('');
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding ingredient:', error);
    }
  };

  const handleRemoveIngredient = async (ingredientId) => {
    try {
      const response = await fetch(`${API_BASE}/pantry/${userId}/${ingredientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPantry();
      }
    } catch (error) {
      console.error('Error removing ingredient:', error);
    }
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
          <p className="text-gray-600 mt-1">
            Manage the ingredients you have at home
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Ingredient</span>
        </button>
      </div>

      {/* Add Ingredient Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Ingredient</h3>
          <form onSubmit={handleAddIngredient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredient
                </label>
                <select
                  value={selectedIngredient}
                  onChange={(e) => setSelectedIngredient(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Select an ingredient</option>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </option>
                  ))}
                </select>
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
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Add to Pantry
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pantry Items */}
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
            {pantry.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-cream-50 rounded-xl border border-cream-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-burgundy-100 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-burgundy-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{item.ingredients.name}</h4>
                    <p className="text-sm text-gray-500">
                      {item.qty} {item.ingredients.unit}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveIngredient(item.ingredients.id)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pantry;
