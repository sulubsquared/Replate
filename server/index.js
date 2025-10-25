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

// get recipe suggestions based on pantry
app.post('/suggest', async (req, res) => {
  try {
    const { userId = 'demo-user-123' } = req.body;
    
    // get current pantry ingredients
    const pantryIngredients = Array.from(pantry.values()).map(item => item.ingredients.name.toLowerCase());
    
    // try gemini ai first for smart suggestions
    if (GEMINI_API_KEY !== 'demo-key') {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Based on these pantry ingredients: ${pantryIngredients.join(', ')}, create 5 specific recipes that use these ingredients. Each recipe should be detailed with specific quantities and instructions. Return JSON:
        {
          "recipes": [
            {
              "title": "Specific Recipe Name",
              "minutes": 25,
              "calories": 400,
              "protein": 25,
              "carbs": 35,
              "fat": 15,
              "instructions": "Detailed step-by-step instructions",
              "photo_url": "https://images.unsplash.com/photo-1234567890?w=500",
              "availableIngredients": 3,
              "totalIngredients": 5,
              "missingIngredients": [
                {"name": "Missing Ingredient", "needed": 2, "available": 0, "missing": 2, "unit": "cups"}
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
          return res.json({ 
            recipes: data.recipes, 
            message: `Found ${data.recipes.length} recipes using your pantry ingredients!`, 
            pantryCount: pantry.size 
          });
        }
      } catch (error) {
        console.log('Gemini AI failed, using fallback:', error.message);
      }
    }

    // fallback: generate recipes based on pantry ingredients
    const recipes = generateRecipesFromPantry(pantryIngredients);
    
    res.json({ 
      recipes, 
      message: `Found ${recipes.length} recipes using your pantry ingredients!`, 
      pantryCount: pantry.size 
    });

  } catch (error) {
    console.error('Error in /suggest endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// helper function to generate recipes based on pantry
function generateRecipesFromPantry(pantryIngredients) {
  const recipes = [];
  
  // chicken-based recipes
  if (pantryIngredients.includes('chicken breast')) {
    recipes.push({
      id: 'chicken-1',
      title: 'Garlic Chicken with Onions',
      minutes: 25,
      calories: 320,
      protein: 42,
      carbs: 8,
      fat: 12,
      instructions: '1. Season chicken with salt and pepper. 2. Heat olive oil in pan. 3. Cook chicken until golden. 4. Add sliced onions and minced garlic. 5. Cook until onions are soft. 6. Serve hot.',
      photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500',
      availableIngredients: 3,
      totalIngredients: 4,
      missingIngredients: []
    });
  }
  
  // egg-based recipes
  if (pantryIngredients.includes('eggs')) {
    recipes.push({
      id: 'egg-1',
      title: 'Scrambled Eggs with Garlic',
      minutes: 8,
      calories: 180,
      protein: 18,
      carbs: 2,
      fat: 12,
      instructions: '1. Beat eggs with salt and pepper. 2. Heat olive oil in pan. 3. Add minced garlic and cook 30 seconds. 4. Add eggs and scramble gently. 5. Serve immediately.',
      photo_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500',
      availableIngredients: 3,
      totalIngredients: 3,
      missingIngredients: []
    });
  }
  
  // onion and garlic recipes
  if (pantryIngredients.includes('onion') && pantryIngredients.includes('garlic')) {
    recipes.push({
      id: 'onion-garlic-1',
      title: 'Caramelized Onion and Garlic Rice',
      minutes: 20,
      calories: 280,
      protein: 6,
      carbs: 55,
      fat: 4,
      instructions: '1. Slice onions thinly. 2. Heat olive oil in pan. 3. Add onions and cook slowly until caramelized. 4. Add minced garlic. 5. Add rice and water. 6. Simmer until rice is cooked.',
      photo_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500',
      availableIngredients: 3,
      totalIngredients: 3,
      missingIngredients: []
    });
  }
  
  // if we have chicken, eggs, onion, garlic - make a complete meal
  if (pantryIngredients.includes('chicken breast') && pantryIngredients.includes('eggs') && 
      pantryIngredients.includes('onion') && pantryIngredients.includes('garlic')) {
    recipes.push({
      id: 'complete-1',
      title: 'Chicken and Egg Fried Rice',
      minutes: 15,
      calories: 450,
      protein: 35,
      carbs: 25,
      fat: 20,
      instructions: '1. Dice chicken and season. 2. Beat eggs. 3. Heat oil in wok. 4. Cook chicken until done. 5. Add onions and garlic. 6. Push aside, scramble eggs. 7. Add rice and mix everything. 8. Season with salt and pepper.',
      photo_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500',
      availableIngredients: 4,
      totalIngredients: 4,
      missingIngredients: []
    });
  }
  
  // if we have eggs and onion
  if (pantryIngredients.includes('eggs') && pantryIngredients.includes('onion')) {
    recipes.push({
      id: 'egg-onion-1',
      title: 'Onion Omelette',
      minutes: 10,
      calories: 220,
      protein: 20,
      carbs: 6,
      fat: 14,
      instructions: '1. Beat eggs with salt and pepper. 2. Heat olive oil in pan. 3. Add diced onions and cook until soft. 4. Pour eggs over onions. 5. Cook until set, fold in half. 6. Serve hot.',
      photo_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500',
      availableIngredients: 3,
      totalIngredients: 3,
      missingIngredients: []
    });
  }
  
  return recipes;
}


// start server
app.listen(PORT, () => {
  console.log(`🍽️  Replate API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;