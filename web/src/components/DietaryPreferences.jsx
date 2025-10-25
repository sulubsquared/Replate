import { useState, useEffect } from 'react';
import { Settings, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const DietaryPreferences = ({ userId }) => {
  const [preferences, setPreferences] = useState({
    diet: 'none',
    allergies: [],
    restricted_ingredients: []
  });
  const [dietaryOptions, setDietaryOptions] = useState({ dietOptions: [], allergyOptions: [] });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  // Load dietary options and user preferences on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load dietary options
        const optionsResponse = await fetch(`${API_BASE}/dietary-options`);
        const optionsData = await optionsResponse.json();
        setDietaryOptions(optionsData);

        // Load user preferences
        const prefsResponse = await fetch(`${API_BASE}/profile/preferences/${userId}`);
        const prefsData = await prefsResponse.json();
        setPreferences(prefsData.preferences);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [userId]);

  const handleDietChange = (diet) => {
    setPreferences(prev => ({ ...prev, diet }));
  };

  const handleAllergyToggle = (allergy) => {
    setPreferences(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  const handleRestrictionToggle = (restriction) => {
    setPreferences(prev => ({
      ...prev,
      restricted_ingredients: prev.restricted_ingredients.includes(restriction)
        ? prev.restricted_ingredients.filter(r => r !== restriction)
        : [...prev.restricted_ingredients, restriction]
    }));
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/profile/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          preferences 
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        console.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDietDescription = (diet) => {
    const option = dietaryOptions.dietOptions.find(opt => opt.value === diet);
    return option ? option.description : '';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-burgundy-700 mb-2">Dietary Preferences</h1>
        <p className="text-gray-600">
          Set your dietary restrictions and preferences to get personalized recipe suggestions
        </p>
      </div>

      {/* Diet Selection */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5 text-burgundy-600" />
          <h2 className="text-xl font-semibold text-gray-800">Diet Type</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dietaryOptions.dietOptions.map((option) => (
            <label key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="diet"
                value={option.value}
                checked={preferences.diet === option.value}
                onChange={(e) => handleDietChange(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>

        {preferences.diet !== 'none' && (
          <div className="mt-4 p-3 bg-burgundy-50 border border-burgundy-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-burgundy-600" />
              <span className="text-sm text-burgundy-700">
                Selected: {getDietDescription(preferences.diet)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Allergies */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-800">Allergies</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {dietaryOptions.allergyOptions.map((allergy) => (
            <label key={allergy.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.allergies.includes(allergy.value)}
                onChange={() => handleAllergyToggle(allergy.value)}
                className="rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800">{allergy.label}</div>
                <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(allergy.severity)}`}>
                  {allergy.severity} risk
                </span>
              </div>
            </label>
          ))}
        </div>

        {preferences.allergies.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">
                {preferences.allergies.length} allergies selected - recipes will be filtered accordingly
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Personal Restrictions */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-800">Personal Restrictions</h2>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['sugar', 'salt', 'spicy foods', 'processed foods', 'artificial sweeteners', 'food coloring'].map((restriction) => (
              <label key={restriction} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.restricted_ingredients.includes(restriction)}
                  onChange={() => handleRestrictionToggle(restriction)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700 capitalize">{restriction}</span>
              </label>
            ))}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Restrictions
            </label>
            <input
              type="text"
              placeholder="Add custom ingredients to avoid (comma separated)"
              className="input w-full"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const customRestrictions = e.target.value.split(',').map(r => r.trim()).filter(r => r);
                  setPreferences(prev => ({
                    ...prev,
                    restricted_ingredients: [...prev.restricted_ingredients, ...customRestrictions]
                  }));
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>

        {preferences.restricted_ingredients.length > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-700">
                {preferences.restricted_ingredients.length} personal restrictions set
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSavePreferences}
          disabled={loading}
          className="btn-primary px-8 py-3 flex items-center space-x-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Settings className="h-5 w-5" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Preferences saved successfully!</span>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="card bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Dietary Profile</h3>
        <div className="space-y-2 text-sm">
          <div><strong>Diet:</strong> {dietaryOptions.dietOptions.find(opt => opt.value === preferences.diet)?.label || 'None'}</div>
          <div><strong>Allergies:</strong> {preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'None'}</div>
          <div><strong>Restrictions:</strong> {preferences.restricted_ingredients.length > 0 ? preferences.restricted_ingredients.join(', ') : 'None'}</div>
        </div>
      </div>
    </div>
  );
};

export default DietaryPreferences;
