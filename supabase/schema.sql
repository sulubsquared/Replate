-- Replate Database Schema
-- A meal planner app that helps users plan meals from their pantry

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ingredients table
CREATE TABLE ingredients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_pantry table
CREATE TABLE user_pantry (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE NOT NULL,
    qty DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ingredient_id)
);

-- Create recipes table
CREATE TABLE recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    calories INTEGER,
    protein DECIMAL(5,2),
    instructions TEXT NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe_ingredients table
CREATE TABLE recipe_ingredients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE NOT NULL,
    qty DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recipe_id, ingredient_id)
);

-- Create preferences table
CREATE TABLE preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    diet TEXT,
    max_minutes INTEGER,
    target_protein DECIMAL(5,2),
    dislikes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_plan table
CREATE TABLE meal_plan (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    day DATE NOT NULL,
    slot TEXT NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'cooked', 'skipped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, day, slot)
);

-- Create indexes for better performance
CREATE INDEX idx_user_pantry_user_id ON user_pantry(user_id);
CREATE INDEX idx_user_pantry_ingredient_id ON user_pantry(ingredient_id);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX idx_meal_plan_user_id ON meal_plan(user_id);
CREATE INDEX idx_meal_plan_day ON meal_plan(day);
CREATE INDEX idx_preferences_user_id ON preferences(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pantry ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User pantry policies
CREATE POLICY "Users can view their own pantry" ON user_pantry
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own pantry" ON user_pantry
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pantry" ON user_pantry
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own pantry" ON user_pantry
    FOR DELETE USING (auth.uid() = user_id);

-- Preferences policies
CREATE POLICY "Users can view their own preferences" ON preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Meal plan policies
CREATE POLICY "Users can view their own meal plan" ON meal_plan
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own meal plan" ON meal_plan
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plan" ON meal_plan
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own meal plan" ON meal_plan
    FOR DELETE USING (auth.uid() = user_id);

-- Public read access for ingredients and recipes (for suggestions)
CREATE POLICY "Anyone can view ingredients" ON ingredients
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view recipes" ON recipes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view recipe ingredients" ON recipe_ingredients
    FOR SELECT USING (true);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_pantry_updated_at BEFORE UPDATE ON user_pantry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plan_updated_at BEFORE UPDATE ON meal_plan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample ingredients
INSERT INTO ingredients (name, unit) VALUES
    ('Chicken Breast', 'lbs'),
    ('Rice', 'cups'),
    ('Onion', 'pieces'),
    ('Garlic', 'cloves'),
    ('Tomato', 'pieces'),
    ('Olive Oil', 'tbsp'),
    ('Salt', 'tsp'),
    ('Black Pepper', 'tsp'),
    ('Eggs', 'pieces'),
    ('Milk', 'cups'),
    ('Flour', 'cups'),
    ('Butter', 'tbsp'),
    ('Cheese', 'cups'),
    ('Pasta', 'cups'),
    ('Ground Beef', 'lbs'),
    ('Bell Pepper', 'pieces'),
    ('Carrot', 'pieces'),
    ('Potato', 'pieces'),
    ('Broccoli', 'cups'),
    ('Spinach', 'cups');

-- Insert some sample recipes
INSERT INTO recipes (title, minutes, calories, protein, instructions, photo_url) VALUES
    ('Simple Chicken and Rice', 30, 450, 35.5, '1. Season chicken with salt and pepper. 2. Cook chicken in olive oil until golden. 3. Add rice and water, simmer until cooked. 4. Serve hot.', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500'),
    ('Scrambled Eggs', 10, 200, 15.0, '1. Beat eggs with milk, salt, and pepper. 2. Heat butter in pan. 3. Add eggs and scramble gently. 4. Serve immediately.', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500'),
    ('Pasta with Tomato Sauce', 25, 380, 12.5, '1. Boil pasta according to package directions. 2. Sauté onion and garlic in olive oil. 3. Add tomatoes and simmer. 4. Toss with pasta and serve.', 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500'),
    ('Beef Stir Fry', 20, 420, 28.0, '1. Heat oil in wok. 2. Cook beef until browned. 3. Add vegetables and stir fry. 4. Season with salt and pepper. 5. Serve over rice.', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500'),
    ('Cheesy Baked Potato', 45, 320, 8.5, '1. Bake potatoes until tender. 2. Cut open and fluff with fork. 3. Add butter, cheese, and seasonings. 4. Bake until cheese melts.', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500');

-- Insert recipe ingredients for sample recipes
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, qty, unit) 
SELECT 
    r.id,
    i.id,
    CASE 
        WHEN i.name = 'Chicken Breast' THEN 1.0
        WHEN i.name = 'Rice' THEN 1.5
        WHEN i.name = 'Onion' THEN 0.5
        WHEN i.name = 'Garlic' THEN 2.0
        WHEN i.name = 'Olive Oil' THEN 2.0
        WHEN i.name = 'Salt' THEN 1.0
        WHEN i.name = 'Black Pepper' THEN 0.5
        ELSE 0
    END,
    i.unit
FROM recipes r, ingredients i
WHERE r.title = 'Simple Chicken and Rice' AND i.name IN ('Chicken Breast', 'Rice', 'Onion', 'Garlic', 'Olive Oil', 'Salt', 'Black Pepper')
AND CASE 
    WHEN i.name = 'Chicken Breast' THEN 1.0
    WHEN i.name = 'Rice' THEN 1.5
    WHEN i.name = 'Onion' THEN 0.5
    WHEN i.name = 'Garlic' THEN 2.0
    WHEN i.name = 'Olive Oil' THEN 2.0
    WHEN i.name = 'Salt' THEN 1.0
    WHEN i.name = 'Black Pepper' THEN 0.5
    ELSE 0
END > 0;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, qty, unit) 
SELECT 
    r.id,
    i.id,
    CASE 
        WHEN i.name = 'Eggs' THEN 3.0
        WHEN i.name = 'Milk' THEN 0.25
        WHEN i.name = 'Butter' THEN 1.0
        WHEN i.name = 'Salt' THEN 0.25
        WHEN i.name = 'Black Pepper' THEN 0.25
        ELSE 0
    END,
    i.unit
FROM recipes r, ingredients i
WHERE r.title = 'Scrambled Eggs' AND i.name IN ('Eggs', 'Milk', 'Butter', 'Salt', 'Black Pepper')
AND CASE 
    WHEN i.name = 'Eggs' THEN 3.0
    WHEN i.name = 'Milk' THEN 0.25
    WHEN i.name = 'Butter' THEN 1.0
    WHEN i.name = 'Salt' THEN 0.25
    WHEN i.name = 'Black Pepper' THEN 0.25
    ELSE 0
END > 0;