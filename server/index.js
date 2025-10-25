const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client with service role key (demo mode)
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://demo.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize OpenAI client (demo mode)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key',
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Replate API is running' });
});

// Mock data for demo mode
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

const mockRecipes = [
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
  },
  {
    id: '3',
    title: 'Pasta with Tomato Sauce',
    minutes: 25,
    calories: 380,
    protein: 12.5,
    carbs: 65,
    fat: 8,
    instructions: '1. Boil pasta according to package directions. 2. Sauté onion and garlic in olive oil. 3. Add tomatoes and simmer. 4. Toss with pasta and serve.',
    photo_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500',
    coverage: 0.4,
    availableIngredients: 2,
    totalIngredients: 5,
    missingIngredients: [
      { name: 'Pasta', needed: 2, available: 0, missing: 2, unit: 'cups' },
      { name: 'Tomato', needed: 3, available: 0, missing: 3, unit: 'pieces' }
    ]
  },
  {
    id: '4',
    title: 'Beef Stir Fry',
    minutes: 20,
    calories: 420,
    protein: 28.0,
    carbs: 15,
    fat: 25,
    instructions: '1. Heat oil in wok. 2. Cook beef until browned. 3. Add vegetables and stir fry. 4. Season with salt and pepper. 5. Serve over rice.',
    photo_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500',
    coverage: 0.3,
    availableIngredients: 1,
    totalIngredients: 6,
    missingIngredients: [
      { name: 'Ground Beef', needed: 1, available: 0, missing: 1, unit: 'lbs' },
      { name: 'Bell Pepper', needed: 2, available: 0, missing: 2, unit: 'pieces' },
      { name: 'Carrot', needed: 2, available: 0, missing: 2, unit: 'pieces' }
    ]
  },
  {
    id: '5',
    title: 'Cheesy Baked Potato',
    minutes: 45,
    calories: 320,
    protein: 8.5,
    carbs: 35,
    fat: 16,
    instructions: '1. Bake potatoes until tender. 2. Cut open and fluff with fork. 3. Add butter, cheese, and seasonings. 4. Bake until cheese melts.',
    photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500',
    coverage: 0.2,
    availableIngredients: 1,
    totalIngredients: 5,
    missingIngredients: [
      { name: 'Potato', needed: 4, available: 0, missing: 4, unit: 'pieces' },
      { name: 'Cheese', needed: 1, available: 0, missing: 1, unit: 'cups' },
      { name: 'Butter', needed: 2, available: 0, missing: 2, unit: 'tbsp' }
    ]
  }
];

const mockPantry = [
  { id: '1', qty: 2, ingredients: { id: '1', name: 'Chicken Breast', unit: 'lbs' } },
  { id: '2', qty: 1, ingredients: { id: '3', name: 'Onion', unit: 'pieces' } },
  { id: '3', qty: 3, ingredients: { id: '4', name: 'Garlic', unit: 'cloves' } },
  { id: '4', qty: 6, ingredients: { id: '9', name: 'Eggs', unit: 'pieces' } }
];

// Get recipe suggestions based on user's pantry and preferences
app.post('/suggest', async (req, res) => {
  try {
    const { userId = 'demo-user-123' } = req.body;

    // Return mock data for demo
    res.json({
      recipes: mockRecipes,
      message: "Fuel up quick — no grocery run needed!",
      pantryCount: mockPantry.length
    });

  } catch (error) {
    console.error('Error in /suggest endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get grocery list for missing ingredients from a recipe
app.post('/grocery', async (req, res) => {
  try {
    const { userId = 'demo-user-123', recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({ error: 'Recipe ID is required' });
    }

    // Fetch user's pantry
    const { data: pantry, error: pantryError } = await supabase
      .from('user_pantry')
      .select(`
        qty,
        ingredients (
          id,
          name,
          unit
        )
      `)
      .eq('user_id', userId);

    if (pantryError) {
      console.error('Error fetching pantry:', pantryError);
      return res.status(500).json({ error: 'Failed to fetch pantry' });
    }

    // Fetch recipe ingredients
    const { data: recipeIngredients, error: recipeError } = await supabase
      .from('recipe_ingredients')
      .select(`
        qty,
        unit,
        ingredients (
          id,
          name,
          unit
        )
      `)
      .eq('recipe_id', recipeId);

    if (recipeError) {
      console.error('Error fetching recipe ingredients:', recipeError);
      return res.status(500).json({ error: 'Failed to fetch recipe ingredients' });
    }

    // Create pantry map
    const pantryMap = new Map();
    pantry.forEach(item => {
      pantryMap.set(item.ingredients.id, item.qty);
    });

    // Calculate missing ingredients
    const missingIngredients = recipeIngredients
      .map(ri => {
        const available = pantryMap.get(ri.ingredients.id) || 0;
        const needed = ri.qty;
        const missing = Math.max(0, needed - available);
        
        return {
          name: ri.ingredients.name,
          needed: needed,
          available: available,
          missing: missing,
          unit: ri.unit
        };
      })
      .filter(item => item.missing > 0);

    res.json({
      missingIngredients,
      totalMissing: missingIngredients.length
    });

  } catch (error) {
    console.error('Error in /grocery endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's pantry
app.get('/pantry/:userId', async (req, res) => {
  try {
    const { userId = 'demo-user-123' } = req.params;

    // Return mock pantry data
    res.json(mockPantry);
  } catch (error) {
    console.error('Error in /pantry endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add ingredient to pantry
app.post('/pantry', async (req, res) => {
  try {
    const { userId = 'demo-user-123', ingredientId, qty } = req.body;

    if (!ingredientId || qty === undefined) {
      return res.status(400).json({ error: 'Ingredient ID and quantity are required' });
    }

    const { data, error } = await supabase
      .from('user_pantry')
      .upsert({
        user_id: userId,
        ingredient_id: ingredientId,
        qty: qty
      })
      .select();

    if (error) {
      console.error('Error adding to pantry:', error);
      return res.status(500).json({ error: 'Failed to add ingredient to pantry' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error in /pantry POST endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove ingredient from pantry
app.delete('/pantry/:userId/:ingredientId', async (req, res) => {
  try {
    const { userId = 'demo-user-123', ingredientId } = req.params;

    const { error } = await supabase
      .from('user_pantry')
      .delete()
      .eq('user_id', userId)
      .eq('ingredient_id', ingredientId);

    if (error) {
      console.error('Error removing from pantry:', error);
      return res.status(500).json({ error: 'Failed to remove ingredient from pantry' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in /pantry DELETE endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all ingredients
app.get('/ingredients', async (req, res) => {
  try {
    // Return mock ingredients data
    res.json(mockIngredients);
  } catch (error) {
    console.error('Error in /ingredients endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🍽️  Replate API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
