const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// middleware
app.use(cors());
app.use(express.json());

// data storage
const pantry = new Map();
const ingredients = new Map();
const mealPlan = new Map();
const userProfiles = new Map();
const moodData = new Map();

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
    { id: '10', name: 'Milk', unit: 'cups' },
    { id: '11', name: 'Salmon', unit: 'lbs' },
    { id: '12', name: 'Pasta', unit: 'lbs' },
    { id: '13', name: 'Butter', unit: 'tbsp' },
    { id: '14', name: 'Cheese', unit: 'cups' },
    { id: '15', name: 'Bread', unit: 'slices' },
    // Non-halal/kosher ingredients for testing
    { id: '16', name: 'Pork', unit: 'lbs' },
    { id: '17', name: 'Bacon', unit: 'slices' },
    { id: '18', name: 'Ham', unit: 'lbs' },
    { id: '19', name: 'Shellfish', unit: 'lbs' },
    { id: '20', name: 'Shrimp', unit: 'lbs' },
    { id: '21', name: 'Crab', unit: 'lbs' },
    { id: '22', name: 'Wine', unit: 'cups' },
    { id: '23', name: 'Beer', unit: 'bottles' },
    { id: '24', name: 'Alcohol', unit: 'oz' },
    { id: '25', name: 'Gelatin', unit: 'tbsp' },
    { id: '26', name: 'Lard', unit: 'tbsp' },
    { id: '27', name: 'Sausage', unit: 'lbs' },
    { id: '28', name: 'Pepperoni', unit: 'oz' },
    { id: '29', name: 'Prosciutto', unit: 'oz' },
    { id: '30', name: 'Lobster', unit: 'lbs' }
  ];

  mockIngredients.forEach(ing => ingredients.set(ing.id, ing));
  
  // add some demo pantry items
  pantry.set('1', { id: '1', qty: 2, ingredients: ingredients.get('1') });
  pantry.set('2', { id: '2', qty: 1, ingredients: ingredients.get('3') });
  pantry.set('3', { id: '3', qty: 3, ingredients: ingredients.get('4') });
  pantry.set('4', { id: '4', qty: 6, ingredients: ingredients.get('9') });
};

initData();

// demo reset endpoint
app.post('/reset-demo', (req, res) => {
  // clear all data
  pantry.clear();
  mealPlan.clear();
  userProfiles.clear();
  moodData.clear();
  
  // reinitialize with fresh data
  initData();
  
  res.json({ 
    success: true, 
    message: 'Demo data reset successfully',
    timestamp: new Date().toISOString()
  });
});

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Replate API is running' });
});

// pantry endpoints
app.get('/pantry/:userId', (req, res) => {
  res.json(Array.from(pantry.values()));
});

app.post('/pantry', (req, res) => {
  const { userId = 'demo-user-123', ingredientId, qty, customIngredient } = req.body;
  
  let ingredient;
  
  if (customIngredient) {
    // handle custom ingredient
    const newId = Date.now().toString();
    ingredient = {
      id: newId,
      name: customIngredient.name,
      unit: customIngredient.unit
    };
    ingredients.set(newId, ingredient);
  } else {
    // handle existing ingredient
    if (!ingredientId || qty === undefined) {
      return res.status(400).json({ error: 'Ingredient ID and quantity required' });
    }
    
    ingredient = ingredients.get(ingredientId);
    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
  }

  // check if ingredient already exists in pantry
  let existingItem = null;
  let existingItemId = null;
  
  for (const [id, item] of pantry.entries()) {
    if (item.ingredients.id === ingredientId) {
      existingItem = item;
      existingItemId = id;
      break;
    }
  }

  if (existingItem) {
    // update existing item quantity
    const newQty = existingItem.qty + qty;
    const updatedItem = { 
      ...existingItem, 
      qty: newQty,
      updatedAt: new Date().toISOString()
    };
    pantry.set(existingItemId, updatedItem);
    
    res.json({
      ...updatedItem,
      message: `Updated ${ingredient.name} quantity to ${newQty}`,
      wasExisting: true
    });
  } else {
    // create new pantry item
    const pantryId = Date.now().toString();
    const pantryItem = { 
      id: pantryId, 
      qty, 
      ingredients: ingredient,
      createdAt: new Date().toISOString()
    };
    pantry.set(pantryId, pantryItem);
    
    res.json({
      ...pantryItem,
      message: `Added ${qty} ${ingredient.name} to pantry`,
      wasExisting: false
    });
  }
});

app.delete('/pantry/:userId/:ingredientId', (req, res) => {
  const { ingredientId } = req.params;
  pantry.delete(ingredientId);
  res.json({ success: true });
});

// ingredients endpoints
app.get('/ingredients', (req, res) => {
  res.json(Array.from(ingredients.values()));
});

app.get('/search-ingredients', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  
  const results = Array.from(ingredients.values())
    .filter(ing => ing.name.toLowerCase().includes(q.toLowerCase()))
    .map(ing => ({ id: ing.id, name: ing.name }));
  
  res.json(results);
});

// meal plan endpoints
app.get('/meal-plan/:userId', (req, res) => {
  res.json(Object.fromEntries(mealPlan));
});

app.post('/meal-plan', (req, res) => {
  const { userId = 'demo-user-123', day, mealTime, recipe } = req.body;
  
  if (!day || !mealTime || !recipe) {
    return res.status(400).json({ error: 'Day, meal time, and recipe required' });
  }

  if (!mealPlan.has(day)) {
    mealPlan.set(day, { breakfast: [], lunch: [], dinner: [] });
  }

  const mealId = Date.now().toString();
  const meal = {
    id: mealId,
    recipe,
    mealTime,
    addedAt: new Date().toISOString()
  };

  mealPlan.get(day)[mealTime].push(meal);
  
  res.json({ success: true, meal });
});

app.delete('/meal-plan/:day/:mealId', (req, res) => {
  const { day, mealId } = req.params;
  
  if (mealPlan.has(day)) {
    const dayMeals = mealPlan.get(day);
    // search through all meal times for the meal
    ['breakfast', 'lunch', 'dinner'].forEach(mealTime => {
      if (dayMeals[mealTime]) {
        dayMeals[mealTime] = dayMeals[mealTime].filter(meal => meal.id !== mealId);
      }
    });
  }
  
  res.json({ success: true });
});

// dietary preferences endpoints
app.post('/profile/preferences', (req, res) => {
  const { userId, preferences } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  userProfiles.set(userId, {
    userId,
    preferences: preferences || {},
    updatedAt: new Date().toISOString()
  });

  res.json({
    success: true, 
    message: 'Dietary preferences saved successfully',
    preferences: userProfiles.get(userId).preferences
  });
});

app.get('/profile/preferences/:userId', (req, res) => {
  const { userId } = req.params;

  const profile = userProfiles.get(userId);
  if (!profile) {
    return res.json({ 
      preferences: {
        diet: 'none',
        allergies: [],
        restricted_ingredients: []
      }
    });
  }

  res.json({ preferences: profile.preferences });
});

app.get('/dietary-options', (req, res) => {
  const dietOptions = [
    { value: 'none', label: 'No specific diet', description: 'No dietary restrictions' },
    { value: 'keto', label: 'Keto', description: 'Very low carb, high fat diet' },
    { value: 'vegetarian', label: 'Vegetarian', description: 'No meat or fish' },
    { value: 'vegan', label: 'Vegan', description: 'No animal products' },
    { value: 'halal', label: 'Halal', description: 'Islamic dietary guidelines' },
    { value: 'kosher', label: 'Kosher', description: 'Jewish dietary laws' }
  ];

  const allergyOptions = [
    { value: 'peanuts', label: 'Peanuts', severity: 'high' },
    { value: 'tree nuts', label: 'Tree Nuts', severity: 'high' },
    { value: 'shellfish', label: 'Shellfish', severity: 'high' },
    { value: 'fish', label: 'Fish', severity: 'high' },
    { value: 'eggs', label: 'Eggs', severity: 'high' },
    { value: 'dairy', label: 'Dairy', severity: 'high' },
    { value: 'gluten', label: 'Gluten', severity: 'medium' }
  ];

  res.json({ dietOptions, allergyOptions });
});

// dietary filtering functions
const checkAllergenInRecipe = (recipe, allergen) => {
  const textToCheck = `${recipe.title} ${recipe.instructions}`.toLowerCase();
  return textToCheck.includes(allergen.toLowerCase());
};

const checkDietCompatibility = (recipe, diet) => {
  const dietRules = {
    'keto': () => {
      const carbPercent = recipe.carbs ? (recipe.carbs * 4 / (recipe.calories || 1)) * 100 : 0;
      return carbPercent <= 10;
    },
    'vegetarian': () => {
      const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'meat', 'bacon', 'ham', 'turkey', 'lamb'];
      const textToCheck = `${recipe.title} ${recipe.instructions}`.toLowerCase();
      return !meatKeywords.some(meat => textToCheck.includes(meat));
    },
    'vegan': () => {
      const nonVeganKeywords = ['chicken', 'beef', 'pork', 'fish', 'meat', 'bacon', 'ham', 'turkey', 'lamb', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg'];
      const textToCheck = `${recipe.title} ${recipe.instructions}`.toLowerCase();
      return !nonVeganKeywords.some(keyword => textToCheck.includes(keyword));
    },
    'halal': () => {
      const haramKeywords = ['pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer', 'liquor'];
      const textToCheck = `${recipe.title} ${recipe.instructions}`.toLowerCase();
      return !haramKeywords.some(keyword => textToCheck.includes(keyword));
    },
    'kosher': () => {
      const nonKosherKeywords = ['pork', 'shellfish', 'bacon', 'ham', 'alcohol', 'wine', 'mixing meat dairy'];
      const textToCheck = `${recipe.title} ${recipe.instructions}`.toLowerCase();
      return !nonKosherKeywords.some(keyword => textToCheck.includes(keyword));
    }
  };
  
  const dietFunction = dietRules[diet.toLowerCase()];
  return dietFunction ? dietFunction() : true;
};

const filterRecipesByDietaryRestrictions = (recipes, preferences) => {
  let filteredRecipes = [...recipes];
  
  // filter by allergies
  if (preferences.allergies && preferences.allergies.length > 0) {
    filteredRecipes = filteredRecipes.filter(recipe => {
      return !preferences.allergies.some(allergy => 
        checkAllergenInRecipe(recipe, allergy)
      );
    });
  }
  
  // filter by diet
  if (preferences.diet && preferences.diet !== 'none') {
    filteredRecipes = filteredRecipes.filter(recipe => 
      checkDietCompatibility(recipe, preferences.diet)
    );
  }
  
  // filter by personal restrictions
  if (preferences.restricted_ingredients && preferences.restricted_ingredients.length > 0) {
    filteredRecipes = filteredRecipes.filter(recipe => {
      const textToCheck = `${recipe.title} ${recipe.instructions}`.toLowerCase();
      return !preferences.restricted_ingredients.some(restriction => 
        textToCheck.includes(restriction.toLowerCase())
      );
    });
  }
  
  return filteredRecipes;
};

// recipe suggestions with dietary filtering
app.post('/suggest', (req, res) => {
  const { userId = 'demo-user-123', preferences = null } = req.body;
  
  // get saved preferences from user profile if not provided
  let userPreferences = preferences;
  if (!userPreferences) {
    const profile = userProfiles.get(userId);
    userPreferences = profile ? profile.preferences : {
      diet: 'none',
      allergies: [],
      restricted_ingredients: []
    };
  }

  // get current pantry ingredients
  const pantryItems = Array.from(pantry.values());
  const pantryIngredients = pantryItems.map(item => item.ingredients.name.toLowerCase());

  // helper function to check if ingredient is in pantry
  const isIngredientInPantry = (ingredientName) => {
    const normalizedName = ingredientName.toLowerCase();
    return pantryIngredients.some(pantryIngredient => 
      pantryIngredient.includes(normalizedName) || normalizedName.includes(pantryIngredient)
    );
  };

  // helper function to calculate missing ingredients for a recipe
  const calculateMissingIngredients = (recipeIngredients) => {
    if (!recipeIngredients || !Array.isArray(recipeIngredients)) {
      return [];
    }
    const missing = [];
    recipeIngredients.forEach(ingredient => {
      if (!isIngredientInPantry(ingredient.name)) {
        missing.push({
          name: ingredient.name,
          needed: ingredient.qty || 1,
          available: 0,
          missing: ingredient.qty || 1,
          unit: ingredient.unit || 'pieces'
        });
      }
    });
    return missing;
  };

  // helper function to check if recipe has main ingredients
  const hasMainIngredients = (recipeIngredients) => {
    // consider first ingredient as main ingredient
    if (!recipeIngredients || !Array.isArray(recipeIngredients) || recipeIngredients.length === 0) return false;
    const mainIngredient = recipeIngredients[0];
    return isIngredientInPantry(mainIngredient.name);
  };
  
  const allRecipes = [
    {
      id: '1',
      title: 'Simple Chicken and Rice',
      minutes: 30,
      calories: 450,
      protein: 35.5,
      carbs: 45,
      fat: 8,
      instructions: '1. Season chicken with salt and pepper.\n2. Cook chicken in olive oil until golden.\n3. Add rice and water, simmer until cooked.\n4. Serve hot.',
      photo_url: null,
      ingredients: [
        { name: 'Chicken Breast', qty: 1, unit: 'lbs' },
        { name: 'Rice', qty: 1.5, unit: 'cups' },
        { name: 'Onion', qty: 1, unit: 'pieces' },
        { name: 'Garlic', qty: 2, unit: 'cloves' },
        { name: 'Olive Oil', qty: 2, unit: 'tbsp' }
      ]
    },
    {
      id: '2',
      title: 'Scrambled Eggs',
      minutes: 10,
      calories: 200,
      protein: 15.0,
      carbs: 2,
      fat: 14,
      instructions: '1. Beat eggs with milk, salt, and pepper.\n2. Heat butter in pan.\n3. Add eggs and scramble gently.\n4. Serve immediately.',
      photo_url: null,
      ingredients: [
        { name: 'Eggs', qty: 3, unit: 'pieces' },
        { name: 'Butter', qty: 1, unit: 'tbsp' },
        { name: 'Milk', qty: 0.25, unit: 'cups' },
        { name: 'Salt', qty: 0.5, unit: 'tsp' },
        { name: 'Black Pepper', qty: 0.25, unit: 'tsp' }
      ]
    },
    {
      id: '3',
      title: 'Garlic Roasted Vegetables',
      minutes: 25,
      calories: 120,
      protein: 4,
      carbs: 20,
      fat: 3,
      instructions: '1. Preheat oven to 400°F.\n2. Toss vegetables with olive oil, garlic, salt, and pepper.\n3. Roast for 20-25 minutes until tender.\n4. Serve hot.',
      photo_url: null,
      coverage: 0.7,
      availableIngredients: 4,
      totalIngredients: 5,
      missingIngredients: [{ name: 'Mixed Vegetables', needed: 2, available: 0, missing: 2, unit: 'cups' }]
    },
    {
      id: '4',
      title: 'Salmon with Asparagus',
      minutes: 20,
      calories: 320,
      protein: 40,
      carbs: 8,
      fat: 12,
      instructions: '1. Season salmon with salt and pepper.\n2. Heat olive oil in pan.\n3. Cook salmon 4-5 minutes per side.\n4. Steam asparagus until tender.\n5. Serve together.',
      photo_url: null,
      coverage: 0.3,
      availableIngredients: 1,
      totalIngredients: 4,
      missingIngredients: [
        { name: 'Salmon', needed: 1, available: 0, missing: 1, unit: 'lbs' },
        { name: 'Asparagus', needed: 1, available: 0, missing: 1, unit: 'bunch' }
      ]
    },
    {
      id: '5',
      title: 'Mediterranean Pasta',
      minutes: 35,
      calories: 420,
      protein: 18,
      carbs: 55,
      fat: 12,
      instructions: '1. Cook pasta.\n2. Sauté garlic and tomatoes in olive oil.\n3. Add herbs and olives.\n4. Toss with pasta.',
      photo_url: null,
      coverage: 0.5,
      availableIngredients: 3,
      totalIngredients: 6,
      missingIngredients: [
        { name: 'Pasta', needed: 1, available: 0, missing: 1, unit: 'lbs' },
        { name: 'Olives', needed: 0.5, available: 0, missing: 0.5, unit: 'cups' }
      ]
    },
    // Non-halal/kosher recipes for testing
    {
      id: '6',
      title: 'Pork Chops with Wine Sauce',
      minutes: 25,
      calories: 380,
      protein: 32,
      carbs: 8,
      fat: 22,
      instructions: '1. Season pork chops with salt and pepper.\n2. Sear pork chops in pan.\n3. Add wine and garlic to create sauce.\n4. Simmer until pork is cooked through.\n5. Serve with sauce.',
      photo_url: null,
      ingredients: [
        { name: 'Pork', qty: 1, unit: 'lbs' },
        { name: 'Wine', qty: 0.5, unit: 'cups' },
        { name: 'Garlic', qty: 2, unit: 'cloves' },
        { name: 'Salt', qty: 0.5, unit: 'tsp' },
        { name: 'Black Pepper', qty: 0.25, unit: 'tsp' }
      ]
    },
    {
      id: '7',
      title: 'Bacon and Egg Breakfast',
      minutes: 15,
      calories: 350,
      protein: 20,
      carbs: 2,
      fat: 28,
      instructions: '1. Cook bacon until crispy.\n2. Fry eggs in bacon fat.\n3. Season with salt and pepper.\n4. Serve together.',
      photo_url: null,
      coverage: 0.5,
      availableIngredients: 2,
      totalIngredients: 4,
      missingIngredients: [
        { name: 'Bacon', needed: 4, available: 0, missing: 4, unit: 'slices' }
      ]
    },
    {
      id: '8',
      title: 'Shrimp Scampi',
      minutes: 20,
      calories: 280,
      protein: 25,
      carbs: 12,
      fat: 15,
      instructions: '1. Sauté shrimp in olive oil.\n2. Add garlic and wine.\n3. Cook until shrimp are pink.\n4. Serve over pasta.',
      photo_url: null,
      coverage: 0.3,
      availableIngredients: 2,
      totalIngredients: 5,
      missingIngredients: [
        { name: 'Shrimp', needed: 1, available: 0, missing: 1, unit: 'lbs' },
        { name: 'Wine', needed: 0.25, available: 0, missing: 0.25, unit: 'cups' }
      ]
    },
    {
      id: '9',
      title: 'Ham and Cheese Sandwich',
      minutes: 10,
      calories: 450,
      protein: 22,
      carbs: 35,
      fat: 24,
      instructions: '1. Layer ham and cheese on bread.\n2. Add lettuce and tomato.\n3. Spread with butter.\n4. Serve immediately.',
      photo_url: null,
      coverage: 0.4,
      availableIngredients: 2,
      totalIngredients: 6,
      missingIngredients: [
        { name: 'Ham', needed: 0.25, available: 0, missing: 0.25, unit: 'lbs' },
        { name: 'Cheese', needed: 0.5, available: 0, missing: 0.5, unit: 'cups' },
        { name: 'Bread', needed: 2, available: 0, missing: 2, unit: 'slices' }
      ]
    },
    {
      id: '10',
      title: 'Lobster with Butter Sauce',
      minutes: 30,
      calories: 420,
      protein: 35,
      carbs: 2,
      fat: 28,
      instructions: '1. Boil lobster until cooked.\n2. Melt butter with garlic.\n3. Serve lobster with butter sauce.\n4. Garnish with herbs.',
      photo_url: null,
      coverage: 0.2,
      availableIngredients: 1,
      totalIngredients: 4,
      missingIngredients: [
        { name: 'Lobster', needed: 1, available: 0, missing: 1, unit: 'lbs' },
        { name: 'Butter', needed: 0.25, available: 0, missing: 0.25, unit: 'cups' }
      ]
    }
  ];
  
  // process recipes: calculate missing ingredients and filter by main ingredients
  const processedRecipes = allRecipes.map(recipe => {
    // skip recipes that don't have ingredients array yet
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
      return recipe; // return as-is for now
    }
    
    const missingIngredients = calculateMissingIngredients(recipe.ingredients);
    const availableIngredients = recipe.ingredients.length - missingIngredients.length;
    const totalIngredients = recipe.ingredients.length;
    
    return {
      ...recipe,
      missingIngredients,
      availableIngredients,
      totalIngredients,
      coverage: availableIngredients / totalIngredients
    };
  });

  // filter out recipes that don't have their main ingredients
  const recipesWithMainIngredients = processedRecipes.filter(recipe => 
    recipe.ingredients && Array.isArray(recipe.ingredients) && hasMainIngredients(recipe.ingredients)
  );
  
  // filter recipes based on dietary restrictions
  const filteredRecipes = filterRecipesByDietaryRestrictions(recipesWithMainIngredients, userPreferences);
  
  // generate dietary summary
  const dietarySummary = {
    diet: userPreferences.diet || 'none',
    allergies: userPreferences.allergies || [],
    restrictions: userPreferences.restricted_ingredients || [],
    filteredCount: allRecipes.length - filteredRecipes.length,
    usingSavedPreferences: !preferences
  };
  
  res.json({ 
    recipes: filteredRecipes, 
    message: `Found ${filteredRecipes.length} recipes matching your dietary preferences!`, 
    pantryCount: pantry.size,
    dietarySummary
  });
});

// mood tracking endpoints
app.post('/mood-data', (req, res) => {
  const { userId, mealId, mood, timestamp } = req.body;
  
  if (!userId || !mood) {
    return res.status(400).json({ error: 'User ID and mood required' });
  }

  // check for cooldown period (3 hours = 3 * 60 * 60 * 1000 milliseconds)
  const cooldownPeriod = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  const now = new Date().getTime();
  
  // find the most recent mood entry for this user
  const userMoodEntries = Array.from(moodData.values())
    .filter(entry => entry.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  if (userMoodEntries.length > 0) {
    const lastEntryTime = new Date(userMoodEntries[0].timestamp).getTime();
    const timeSinceLastEntry = now - lastEntryTime;
    
    if (timeSinceLastEntry < cooldownPeriod) {
      const remainingTime = cooldownPeriod - timeSinceLastEntry;
      const remainingHours = Math.ceil(remainingTime / (60 * 60 * 1000));
      const remainingMinutes = Math.ceil((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      
      return res.status(429).json({ 
        error: 'Cooldown period active', 
        message: `Please wait ${remainingHours}h ${remainingMinutes}m before tracking another mood`,
        remainingTime: remainingTime,
        nextAllowedTime: new Date(lastEntryTime + cooldownPeriod).toISOString()
      });
    }
  }

  const moodId = Date.now().toString();
  const moodEntry = {
    id: moodId,
    userId,
    mealId,
    mood,
    timestamp: timestamp || new Date().toISOString()
  };

  moodData.set(moodId, moodEntry);
  
  res.json({ success: true, moodEntry });
});

app.get('/mood-data/:userId', (req, res) => {
  const { userId } = req.params;
  
  const userMoodData = Array.from(moodData.values())
    .filter(entry => entry.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json({ moodEntries: userMoodData });
});

// start server
app.listen(PORT, () => {
  console.log(`🍽️  Replate API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});