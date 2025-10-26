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

// dietary restriction and allergy filtering functions
const getAllergenMap = () => {
  return {
    'peanuts': ['peanut', 'peanut butter', 'peanut oil', 'groundnut', 'arachis'],
    'tree nuts': ['almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'pecan', 'brazil nut', 'macadamia', 'pine nut'],
    'shellfish': ['shrimp', 'crab', 'lobster', 'crayfish', 'prawn', 'scallop', 'oyster', 'mussel', 'clam', 'squid', 'octopus'],
    'fish': ['salmon', 'tuna', 'cod', 'halibut', 'mackerel', 'sardine', 'anchovy', 'fish sauce', 'seafood'],
    'eggs': ['egg', 'egg white', 'egg yolk', 'mayonnaise', 'meringue', 'albumen'],
    'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'lactose', 'dairy'],
    'soy': ['soy', 'soybean', 'tofu', 'tempeh', 'miso', 'soy sauce', 'edamame', 'soy milk'],
    'wheat': ['wheat', 'flour', 'bread', 'pasta', 'couscous', 'bulgur', 'seitan'],
    'gluten': ['wheat', 'barley', 'rye', 'oats', 'flour', 'bread', 'pasta', 'beer', 'gluten'],
    'sesame': ['sesame', 'tahini', 'sesame oil', 'sesame seed', 'benne']
  };
};

const checkAllergenInRecipe = (recipe, allergen) => {
  const allergenMap = getAllergenMap();
  const allergens = allergenMap[allergen.toLowerCase()] || [allergen.toLowerCase()];
  
  // check in recipe title and instructions
  const textToCheck = `${recipe.title} ${recipe.instructions}`.toLowerCase();
  
  return allergens.some(allergen => textToCheck.includes(allergen));
};

const checkDietCompatibility = (recipe, diet) => {
  const dietRules = {
    'keto': () => {
      const carbPercent = recipe.carbs ? (recipe.carbs * 4 / (recipe.calories || 1)) * 100 : 0;
      return carbPercent <= 10;
    },
    'low-carb': () => {
      const carbPercent = recipe.carbs ? (recipe.carbs * 4 / (recipe.calories || 1)) * 100 : 0;
      return carbPercent <= 20;
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
    },
    'paleo': () => {
      const nonPaleoKeywords = ['grain', 'wheat', 'rice', 'dairy', 'processed', 'sugar', 'legume'];
      const textToCheck = `${recipe.title} ${recipe.instructions}`.toLowerCase();
      return !nonPaleoKeywords.some(keyword => textToCheck.includes(keyword));
    },
    'mediterranean': () => {
      const mediterraneanKeywords = ['olive oil', 'fish', 'vegetables', 'herbs', 'tomato', 'garlic'];
      const textToCheck = `${recipe.title} ${recipe.instructions}`.toLowerCase();
      return mediterraneanKeywords.some(keyword => textToCheck.includes(keyword));
    },
    'dash': () => {
      const dashKeywords = ['vegetables', 'fruits', 'whole grain', 'low sodium'];
      const textToCheck = `${recipe.title} ${recipe.instructions}`.toLowerCase();
      return dashKeywords.some(keyword => textToCheck.includes(keyword));
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

// save user dietary preferences
app.post('/profile/preferences', (req, res) => {
  const { userId, preferences } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // save preferences to user profile
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

// get user dietary preferences
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

// get dietary options
app.get('/dietary-options', (req, res) => {
  const dietOptions = [
    { value: 'none', label: 'No specific diet', description: 'No dietary restrictions' },
    { value: 'keto', label: 'Keto', description: 'Very low carb, high fat diet' },
    { value: 'low-carb', label: 'Low Carb', description: 'Reduced carbohydrate intake' },
    { value: 'vegetarian', label: 'Vegetarian', description: 'No meat or fish' },
    { value: 'vegan', label: 'Vegan', description: 'No animal products' },
    { value: 'halal', label: 'Halal', description: 'Islamic dietary guidelines' },
    { value: 'kosher', label: 'Kosher', description: 'Jewish dietary laws' },
    { value: 'paleo', label: 'Paleo', description: 'Paleolithic diet principles' },
    { value: 'mediterranean', label: 'Mediterranean', description: 'Heart-healthy Mediterranean style' },
    { value: 'dash', label: 'DASH', description: 'Dietary Approaches to Stop Hypertension' }
  ];

  const allergyOptions = [
    { value: 'peanuts', label: 'Peanuts', severity: 'high' },
    { value: 'tree nuts', label: 'Tree Nuts', severity: 'high' },
    { value: 'shellfish', label: 'Shellfish', severity: 'high' },
    { value: 'fish', label: 'Fish', severity: 'high' },
    { value: 'eggs', label: 'Eggs', severity: 'high' },
    { value: 'dairy', label: 'Dairy', severity: 'high' },
    { value: 'soy', label: 'Soy', severity: 'medium' },
    { value: 'wheat', label: 'Wheat', severity: 'medium' },
    { value: 'gluten', label: 'Gluten', severity: 'medium' },
    { value: 'sesame', label: 'Sesame', severity: 'medium' }
  ];

  res.json({ dietOptions, allergyOptions });
});

// get recipe suggestions with dietary filtering
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
      instructions: '1. Beat eggs with milk, salt, and pepper.\n2. Heat butter in pan.\n3. Add eggs and scramble gently.\n4. Serve immediately.',
      photo_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500',
      coverage: 0.6,
      availableIngredients: 3,
      totalIngredients: 5,
      missingIngredients: [
        { name: 'Butter', needed: 1, available: 0, missing: 1, unit: 'tbsp' },
        { name: 'Milk', needed: 0.25, available: 0, missing: 0.25, unit: 'cups' }
      ]
    },
    {
      id: '3',
      title: 'Vegan Buddha Bowl',
      minutes: 25,
      calories: 320,
      protein: 12,
      carbs: 35,
      fat: 15,
      instructions: '1. Roast vegetables with olive oil.\n2. Cook quinoa.\n3. Prepare tahini dressing.\n4. Combine all ingredients in a bowl.',
      photo_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
      coverage: 0.4,
      availableIngredients: 2,
      totalIngredients: 5,
      missingIngredients: [
        { name: 'Quinoa', needed: 1, available: 0, missing: 1, unit: 'cups' },
        { name: 'Tahini', needed: 2, available: 0, missing: 2, unit: 'tbsp' }
      ]
    },
    {
      id: '4',
      title: 'Keto Salmon with Asparagus',
      minutes: 20,
      calories: 380,
      protein: 28,
      carbs: 8,
      fat: 25,
      instructions: '1. Season salmon with herbs.\n2. Pan-sear salmon.\n3. Roast asparagus with olive oil.\n4. Serve together.',
      photo_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500',
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
      photo_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500',
      coverage: 0.5,
      availableIngredients: 3,
      totalIngredients: 6,
      missingIngredients: [
        { name: 'Pasta', needed: 1, available: 0, missing: 1, unit: 'lbs' },
        { name: 'Olives', needed: 0.5, available: 0, missing: 0.5, unit: 'cups' }
      ]
    }
  ];
  
  // filter recipes based on dietary restrictions
  const filteredRecipes = filterRecipesByDietaryRestrictions(allRecipes, userPreferences);
  
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

// start server
app.listen(PORT, () => {
  console.log(`🍽️  Replate API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;