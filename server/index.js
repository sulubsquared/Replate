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

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Replate API is running' });
});

// Get recipe suggestions based on user's pantry and preferences
app.post('/suggest', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
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

    // Fetch user preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefsError);
      return res.status(500).json({ error: 'Failed to fetch preferences' });
    }

    // Fetch all recipes with their ingredients
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select(`
        id,
        title,
        minutes,
        calories,
        protein,
        instructions,
        photo_url,
        recipe_ingredients (
          qty,
          unit,
          ingredients (
            id,
            name,
            unit
          )
        )
      `);

    if (recipesError) {
      console.error('Error fetching recipes:', recipesError);
      return res.status(500).json({ error: 'Failed to fetch recipes' });
    }

    // Create pantry map for quick lookup
    const pantryMap = new Map();
    pantry.forEach(item => {
      pantryMap.set(item.ingredients.id, {
        qty: item.qty,
        name: item.ingredients.name,
        unit: item.ingredients.unit
      });
    });

    // Score recipes based on ingredient coverage and preferences
    const scoredRecipes = recipes.map(recipe => {
      let score = 0;
      let totalIngredients = recipe.recipe_ingredients.length;
      let availableIngredients = 0;
      let missingIngredients = [];

      // Check ingredient availability
      recipe.recipe_ingredients.forEach(recipeIngredient => {
        const pantryItem = pantryMap.get(recipeIngredient.ingredients.id);
        if (pantryItem && pantryItem.qty >= recipeIngredient.qty) {
          availableIngredients++;
          score += 1; // Base score for having the ingredient
        } else {
          missingIngredients.push({
            name: recipeIngredient.ingredients.name,
            needed: recipeIngredient.qty,
            unit: recipeIngredient.unit,
            available: pantryItem ? pantryItem.qty : 0
          });
        }
      });

      // Calculate coverage percentage
      const coverage = totalIngredients > 0 ? availableIngredients / totalIngredients : 0;
      score += coverage * 10; // Bonus for higher coverage

      // Apply preference filters
      if (preferences) {
        // Diet filter
        if (preferences.diet && preferences.diet !== 'none') {
          // Simple diet matching (can be enhanced)
          if (preferences.diet === 'vegetarian' && recipe.title.toLowerCase().includes('chicken')) {
            score -= 5;
          }
        }

        // Time filter
        if (preferences.max_minutes && recipe.minutes > preferences.max_minutes) {
          score -= 3;
        }

        // Protein filter
        if (preferences.target_protein && recipe.protein) {
          const proteinDiff = Math.abs(recipe.protein - preferences.target_protein);
          score -= proteinDiff * 0.1;
        }

        // Dislikes filter
        if (preferences.dislikes && preferences.dislikes.length > 0) {
          const hasDislikedIngredient = recipe.recipe_ingredients.some(ri => 
            preferences.dislikes.some(dislike => 
              ri.ingredients.name.toLowerCase().includes(dislike.toLowerCase())
            )
          );
          if (hasDislikedIngredient) {
            score -= 5;
          }
        }
      }

      return {
        ...recipe,
        score,
        coverage,
        availableIngredients,
        totalIngredients,
        missingIngredients
      };
    });

    // Sort by score (highest first) and take top 5
    const topRecipes = scoredRecipes
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // AI-powered re-ranking and motivational message
    let aiMessage = "Fuel up quick — no grocery run needed!";
    
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `You are a helpful meal planning assistant. The user has these ingredients in their pantry: ${pantry.map(p => `${p.ingredients.name} (${p.qty} ${p.ingredients.unit})`).join(', ')}. 

The top recipe suggestions are: ${topRecipes.map((r, i) => `${i + 1}. ${r.title} (${r.coverage * 100}% pantry coverage)`).join(', ')}.

Generate a short, motivational message (max 50 characters) to encourage the user to cook with what they have. Make it warm and encouraging.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 50,
          temperature: 0.7,
        });

        aiMessage = completion.choices[0].message.content.trim();
      } catch (aiError) {
        console.error('AI integration error:', aiError);
        // Fall back to default message
      }
    }

    res.json({
      recipes: topRecipes,
      message: aiMessage,
      pantryCount: pantry.length
    });

  } catch (error) {
    console.error('Error in /suggest endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get grocery list for missing ingredients from a recipe
app.post('/grocery', async (req, res) => {
  try {
    const { userId, recipeId } = req.body;

    if (!userId || !recipeId) {
      return res.status(400).json({ error: 'User ID and Recipe ID are required' });
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
    const { userId } = req.params;

    const { data: pantry, error } = await supabase
      .from('user_pantry')
      .select(`
        id,
        qty,
        created_at,
        ingredients (
          id,
          name,
          unit
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pantry:', error);
      return res.status(500).json({ error: 'Failed to fetch pantry' });
    }

    res.json(pantry);
  } catch (error) {
    console.error('Error in /pantry endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add ingredient to pantry
app.post('/pantry', async (req, res) => {
  try {
    const { userId, ingredientId, qty } = req.body;

    if (!userId || !ingredientId || qty === undefined) {
      return res.status(400).json({ error: 'User ID, Ingredient ID, and quantity are required' });
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
    const { userId, ingredientId } = req.params;

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
    const { data: ingredients, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching ingredients:', error);
      return res.status(500).json({ error: 'Failed to fetch ingredients' });
    }

    res.json(ingredients);
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
