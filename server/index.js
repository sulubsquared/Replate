const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// middleware
app.use(cors());
app.use(express.json());

// initialize gemini ai
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'demo-key';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// data storage
const pantry = new Map();
const ingredients = new Map();
const mealPlan = new Map();

// initialize data
const initData = () => {
  const mockIngredients = [
    { id: '1', name: 'Chicken Breast', unit: 'lbs' },
    { id: '2', name: 'Rice', unit: 'cups' },
    { id: '3', name: 'Onion', unit: 'pieces' },
    { id: '4', name: 'Garlic', unit: 'cloves' },
    { id: '5', name: 'Tomato', unit: 'pieces' },
    { id: '6', name: 'Olive Oil', unit: 'tbsp' },
    { id: '7', name: 'Salt', unit: 'tsp' },
    { id: '8', name: 'Black Pepper', unit: 'tsp' },
    { id: '9', name: 'Eggs', unit: 'pieces' },
    { id: '10', name: 'Milk', unit: 'cups' }
  ];

  mockIngredients.forEach(ing => ingredients.set(ing.id, ing));
  
  // add some demo pantry items
  pantry.set('1', { id: '1', qty: 2, ingredients: ingredients.get('1') });
  pantry.set('2', { id: '2', qty: 1, ingredients: ingredients.get('3') });
  pantry.set('3', { id: '3', qty: 3, ingredients: ingredients.get('4') });
  pantry.set('4', { id: '4', qty: 6, ingredients: ingredients.get('9') });
};

initData();

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Replate API is running' });
});

// get pantry
app.get('/pantry/:userId', (req, res) => {
  res.json(Array.from(pantry.values()));
});

// add to pantry
app.post('/pantry', (req, res) => {
  const { userId = 'demo-user-123', ingredientId, qty } = req.body;
  
  if (!ingredientId || qty === undefined) {
    return res.status(400).json({ error: 'Ingredient ID and quantity required' });
  }

  const ingredient = ingredients.get(ingredientId);
  if (!ingredient) {
    return res.status(404).json({ error: 'Ingredient not found' });
  }

  const pantryId = Date.now().toString();
  const pantryItem = { id: pantryId, qty, ingredients: ingredient };
  pantry.set(pantryId, pantryItem);
  
  res.json(pantryItem);
});

// remove from pantry
app.delete('/pantry/:userId/:ingredientId', (req, res) => {
  const { ingredientId } = req.params;
  pantry.delete(ingredientId);
  res.json({ success: true });
});

// get ingredients
app.get('/ingredients', (req, res) => {
  res.json(Array.from(ingredients.values()));
});

// search ingredients
app.get('/search-ingredients', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  
  const results = Array.from(ingredients.values())
    .filter(ing => ing.name.toLowerCase().includes(q.toLowerCase()))
    .map(ing => ({ id: ing.id, name: ing.name }));
  
  res.json(results);
});

// get meal plan
app.get('/meal-plan/:userId', (req, res) => {
  res.json(Object.fromEntries(mealPlan));
});

// add to meal plan
app.post('/meal-plan', (req, res) => {
  const { userId = 'demo-user-123', day, recipe } = req.body;
  
  if (!day || !recipe) {
    return res.status(400).json({ error: 'Day and recipe required' });
  }

  if (!mealPlan.has(day)) {
    mealPlan.set(day, []);
  }
  
  const mealId = Date.now().toString();
  const meal = { id: mealId, recipe };
  mealPlan.get(day).push(meal);
  
  res.json(meal);
});

// remove from meal plan
app.delete('/meal-plan/:day/:mealId', (req, res) => {
  const { day, mealId } = req.params;
  
  if (mealPlan.has(day)) {
    const meals = mealPlan.get(day).filter(meal => meal.id !== mealId);
    mealPlan.set(day, meals);
  }
  
  res.json({ success: true });
});

// get recipe suggestions
app.post('/suggest', (req, res) => {
  const { userId = 'demo-user-123' } = req.body;
  
  const recipes = [
    {
      id: '1',
      title: 'Simple Chicken and Rice',
      minutes: 30,
      calories: 450,
      protein: 35.5,
      carbs: 45,
      fat: 8,
      instructions: '1. Season chicken with salt and pepper. 2. Cook chicken in olive oil until golden. 3. Add rice and water, simmer until cooked. 4. Serve hot.',
      photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500',
      coverage: 0.8,
      availableIngredients: 4,
      totalIngredients: 5,
      missingIngredients: [{ name: 'Rice', needed: 1.5, available: 0, missing: 1.5, unit: 'cups' }]
    },
    {
      id: '2',
      title: 'Scrambled Eggs',
      minutes: 10,
      calories: 200,
      protein: 15.0,
      carbs: 2,
      fat: 14,
      instructions: '1. Beat eggs with milk, salt, and pepper. 2. Heat butter in pan. 3. Add eggs and scramble gently. 4. Serve immediately.',
      photo_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500',
      coverage: 0.6,
      availableIngredients: 3,
      totalIngredients: 5,
      missingIngredients: [
        { name: 'Butter', needed: 1, available: 0, missing: 1, unit: 'tbsp' },
        { name: 'Milk', needed: 0.25, available: 0, missing: 0.25, unit: 'cups' }
      ]
    }
  ];
  
  res.json({ recipes, message: "Fuel up quick — no grocery run needed!", pantryCount: pantry.size });
});

// ai recipe search
app.post('/ai-suggest', async (req, res) => {
  try {
    const { userId = 'demo-user-123', query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    // try gemini ai first
    if (GEMINI_API_KEY !== 'demo-key') {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Create 3 ${query} recipes with specific ingredients. Return JSON:
        {
          "recipes": [
            {
              "title": "Recipe Name",
              "minutes": 30,
              "calories": 400,
              "protein": 25,
              "carbs": 35,
              "fat": 15,
              "instructions": "Step by step instructions",
              "photo_url": "https://images.unsplash.com/photo-1234567890?w=500",
              "missingIngredients": [
                {"name": "Ingredient Name", "needed": 2, "available": 0, "missing": 2, "unit": "cups"}
              ]
            }
          ]
        }`;

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout after 8 seconds')), 8000)
        );
        
        const geminiPromise = model.generateContent(prompt).then(result => {
          const response = result.response;
          return response.text();
        });
        
        const text = await Promise.race([geminiPromise, timeoutPromise]);
        
        // parse gemini response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          return res.json({ recipes: data.recipes, message: `Found ${data.recipes.length} ${query} recipes!` });
        }
      } catch (error) {
        console.log('Gemini AI failed, using fallback:', error.message);
      }
    }

    // fallback to basic recipes
    const fallbackRecipes = [
      {
        id: `fallback-1-${Date.now()}`,
        title: `Simple ${query.charAt(0).toUpperCase() + query.slice(1)} Recipe`,
        minutes: 25,
        calories: 350,
        protein: 20,
        carbs: 30,
        fat: 12,
        instructions: `1. Prepare ingredients for ${query}. 2. Follow traditional cooking method. 3. Season to taste. 4. Serve hot.`,
        photo_url: `https://images.unsplash.com/photo-${1500000000 + Math.floor(Math.random() * 1000)}?w=500`,
        missingIngredients: [
          { name: 'Main Ingredient', needed: 2, available: 0, missing: 2, unit: 'cups' },
          { name: 'Seasoning', needed: 1, available: 0, missing: 1, unit: 'tsp' }
        ]
      }
    ];

    res.json({ recipes: fallbackRecipes, message: `Found ${query} recipes!` });

  } catch (error) {
    console.error('Error in /ai-suggest endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// start server
app.listen(PORT, () => {
  console.log(`🍽️  Replate API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;