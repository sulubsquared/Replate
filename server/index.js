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
    // proteins
    { id: '1', name: 'Chicken Breast', unit: 'lbs' },
    { id: '2', name: 'Ground Beef', unit: 'lbs' },
    { id: '3', name: 'Salmon', unit: 'lbs' },
    { id: '4', name: 'Tofu', unit: 'cups' },
    { id: '5', name: 'Eggs', unit: 'pieces' },
    { id: '6', name: 'Shrimp', unit: 'lbs' },
    { id: '7', name: 'Turkey', unit: 'lbs' },
    { id: '8', name: 'Pork Chops', unit: 'pieces' },
    
    // vegetables
    { id: '9', name: 'Onion', unit: 'pieces' },
    { id: '10', name: 'Garlic', unit: 'cloves' },
    { id: '11', name: 'Tomato', unit: 'pieces' },
    { id: '12', name: 'Bell Pepper', unit: 'pieces' },
    { id: '13', name: 'Carrot', unit: 'pieces' },
    { id: '14', name: 'Broccoli', unit: 'cups' },
    { id: '15', name: 'Spinach', unit: 'cups' },
    { id: '16', name: 'Mushrooms', unit: 'cups' },
    { id: '17', name: 'Zucchini', unit: 'pieces' },
    { id: '18', name: 'Potato', unit: 'pieces' },
    { id: '19', name: 'Sweet Potato', unit: 'pieces' },
    { id: '20', name: 'Avocado', unit: 'pieces' },
    
    // grains & carbs
    { id: '21', name: 'Rice', unit: 'cups' },
    { id: '22', name: 'Pasta', unit: 'cups' },
    { id: '23', name: 'Quinoa', unit: 'cups' },
    { id: '24', name: 'Bread', unit: 'slices' },
    { id: '25', name: 'Tortillas', unit: 'pieces' },
    { id: '26', name: 'Oats', unit: 'cups' },
    
    // dairy
    { id: '27', name: 'Milk', unit: 'cups' },
    { id: '28', name: 'Cheese', unit: 'cups' },
    { id: '29', name: 'Yogurt', unit: 'cups' },
    { id: '30', name: 'Butter', unit: 'tbsp' },
    { id: '31', name: 'Cream', unit: 'cups' },
    
    // oils & seasonings
    { id: '32', name: 'Olive Oil', unit: 'tbsp' },
    { id: '33', name: 'Salt', unit: 'tsp' },
    { id: '34', name: 'Black Pepper', unit: 'tsp' },
    { id: '35', name: 'Basil', unit: 'tsp' },
    { id: '36', name: 'Oregano', unit: 'tsp' },
    { id: '37', name: 'Paprika', unit: 'tsp' },
    { id: '38', name: 'Cumin', unit: 'tsp' },
    { id: '39', name: 'Ginger', unit: 'tbsp' },
    { id: '40', name: 'Lemon', unit: 'pieces' },
    { id: '41', name: 'Lime', unit: 'pieces' },
    
    // pantry staples
    { id: '42', name: 'Flour', unit: 'cups' },
    { id: '43', name: 'Sugar', unit: 'cups' },
    { id: '44', name: 'Honey', unit: 'tbsp' },
    { id: '45', name: 'Soy Sauce', unit: 'tbsp' },
    { id: '46', name: 'Vinegar', unit: 'tbsp' },
    { id: '47', name: 'Coconut Milk', unit: 'cups' },
    { id: '48', name: 'Almonds', unit: 'cups' },
    { id: '49', name: 'Walnuts', unit: 'cups' },
    { id: '50', name: 'Chickpeas', unit: 'cups' }
  ];

  mockIngredients.forEach(ing => ingredients.set(ing.id, ing));
  
  // add some demo pantry items
  pantry.set('1', { id: '1', qty: 2, ingredients: ingredients.get('1') }); // chicken breast
  pantry.set('2', { id: '2', qty: 1, ingredients: ingredients.get('9') }); // onion
  pantry.set('3', { id: '3', qty: 3, ingredients: ingredients.get('10') }); // garlic
  pantry.set('4', { id: '4', qty: 6, ingredients: ingredients.get('5') }); // eggs
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
  const { userId = 'demo-user-123', ingredientId, qty, customIngredient } = req.body;
  
  if (!ingredientId && !customIngredient) {
    return res.status(400).json({ error: 'Ingredient ID or custom ingredient required' });
  }

  let ingredient;
  
  if (customIngredient) {
    // create new custom ingredient
    const newId = (ingredients.size + 1).toString();
    ingredient = {
      id: newId,
      name: customIngredient.name,
      unit: customIngredient.unit || 'pieces'
    };
    ingredients.set(newId, ingredient);
  } else {
    ingredient = ingredients.get(ingredientId);
    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
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
        const prompt = `Based on these pantry ingredients: ${pantryIngredients.join(', ')}, create 6 diverse and creative recipes that use these ingredients. Make recipes that are practical and delicious. Each recipe should have:

1. A creative, appetizing title
2. Realistic cooking time (5-45 minutes)
3. Accurate nutritional estimates
4. Detailed step-by-step instructions
5. Use mostly pantry ingredients, add 1-2 common missing ingredients max
6. Include proper quantities and measurements

Return JSON format:
{
  "recipes": [
    {
      "title": "Creative Recipe Name",
      "minutes": 25,
      "calories": 400,
      "protein": 25,
      "carbs": 35,
      "fat": 15,
      "instructions": "1. Step one with details. 2. Step two with details. 3. Continue...",
      "availableIngredients": 4,
      "totalIngredients": 5,
      "missingIngredients": [
        {"name": "Missing Ingredient", "needed": 2, "available": 0, "missing": 2, "unit": "cups"}
      ]
    }
  ]
}`;

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout after 10 seconds')), 10000)
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
          // add photo URLs to each recipe
          const recipesWithPhotos = data.recipes.map((recipe, index) => ({
            ...recipe,
            id: `ai-${Date.now()}-${index}`,
            photo_url: `https://images.unsplash.com/photo-${1500000000 + Math.floor(Math.random() * 10000)}?w=500&h=300&fit=crop&crop=center`
          }));
          
          return res.json({ 
            recipes: recipesWithPhotos, 
            message: `AI generated ${recipesWithPhotos.length} creative recipes using your pantry ingredients!`, 
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
  
  // salmon-based recipes
  if (pantryIngredients.includes('salmon')) {
    recipes.push({
      id: 'salmon-1',
      title: 'Simple Pan-Seared Salmon',
      minutes: 15,
      calories: 320,
      protein: 40,
      carbs: 2,
      fat: 16,
      instructions: '1. Season salmon with salt and pepper. 2. Heat olive oil in pan over medium-high heat. 3. Cook salmon 4-5 minutes per side until golden. 4. Serve immediately with your favorite sides.',
      photo_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&h=300&fit=crop&crop=center',
      availableIngredients: 1,
      totalIngredients: 2,
      missingIngredients: []
    });
    
    if (pantryIngredients.includes('garlic')) {
      recipes.push({
        id: 'salmon-2',
        title: 'Garlic Salmon',
        minutes: 20,
        calories: 350,
        protein: 45,
        carbs: 5,
        fat: 18,
        instructions: '1. Season salmon with salt and pepper. 2. Heat olive oil in pan. 3. Add minced garlic and cook 30 seconds. 4. Add salmon and cook 4-5 minutes per side. 5. Serve immediately.',
        photo_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&h=300&fit=crop&crop=center',
        availableIngredients: 2,
        totalIngredients: 3,
        missingIngredients: []
      });
    }
    
    if (pantryIngredients.includes('fresh basil')) {
      recipes.push({
        id: 'salmon-3',
        title: 'Basil-Crusted Salmon',
        minutes: 25,
        calories: 380,
        protein: 42,
        carbs: 8,
        fat: 20,
        instructions: '1. Mix fresh basil with breadcrumbs and olive oil. 2. Season salmon with salt and pepper. 3. Top salmon with basil mixture. 4. Bake at 400°F for 12-15 minutes. 5. Serve with lemon wedges.',
        photo_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&h=300&fit=crop&crop=center',
        availableIngredients: 2,
        totalIngredients: 4,
        missingIngredients: [
          {name: 'Breadcrumbs', needed: 0.5, available: 0, missing: 0.5, unit: 'cups'},
          {name: 'Lemon', needed: 1, available: 0, missing: 1, unit: 'pieces'}
        ]
      });
    }
  }

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
      photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&h=300&fit=crop&crop=center',
      availableIngredients: 3,
      totalIngredients: 4,
      missingIngredients: []
    });
  }
  
  // fresh basil recipes
  if (pantryIngredients.includes('fresh basil')) {
    recipes.push({
      id: 'basil-1',
      title: 'Fresh Basil Pesto',
      minutes: 10,
      calories: 180,
      protein: 4,
      carbs: 8,
      fat: 16,
      instructions: '1. Blend fresh basil with olive oil, garlic, and pine nuts. 2. Add parmesan cheese and salt. 3. Process until smooth. 4. Serve over pasta or as a spread.',
      photo_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=300&fit=crop&crop=center',
      availableIngredients: 1,
      totalIngredients: 5,
      missingIngredients: [
        {name: 'Pine Nuts', needed: 0.25, available: 0, missing: 0.25, unit: 'cups'},
        {name: 'Parmesan Cheese', needed: 0.5, available: 0, missing: 0.5, unit: 'cups'},
        {name: 'Olive Oil', needed: 0.25, available: 0, missing: 0.25, unit: 'cups'},
        {name: 'Garlic', needed: 2, available: 0, missing: 2, unit: 'cloves'}
      ]
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
      photo_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&h=300&fit=crop&crop=center',
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
      photo_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&h=300&fit=crop&crop=center',
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
      photo_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&h=300&fit=crop&crop=center',
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
      photo_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&h=300&fit=crop&crop=center',
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