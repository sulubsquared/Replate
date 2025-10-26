# Replate 🍽️

A smart meal planning app that helps you make the most of your pantry ingredients and track your eating habits.

## What is Replate?

Replate is a full-stack meal planning application that:
- **Suggests recipes** based on what you have in your pantry
- **Tracks your mood** after meals to understand how food affects you
- **Plans your weekly meals** with breakfast, lunch, and dinner slots
- **Manages dietary restrictions** like halal, kosher, allergies, and more

## Features

- 🥘 **Smart Recipe Suggestions**: Only shows recipes you can actually make
- ➕ **Easy Ingredient Addition**: Click the + button to add missing ingredients to your pantry
- 📅 **Meal Planning**: Schedule meals for the week with time slots
- 🧠 **Understanding Tab**: Track how meals make you feel (energized, calm, bloated)
- 🚫 **Dietary Filtering**: Automatically filters out recipes that don't match your dietary needs
- 🔄 **Demo Mode**: Reset button to start fresh for testing

## How to Use

### Getting Started
1. **Add Ingredients**: Go to the Pantry tab and add ingredients you have
2. **Get Suggestions**: Click "Replate Me!" to see recipes you can make
3. **Add Missing Items**: Click the + button next to missing ingredients to add them
4. **Plan Meals**: Add recipes to your weekly meal plan
5. **Track Mood**: After eating, record how the meal made you feel

### Key Features
- **Pantry**: Manage your ingredients and quantities
- **Suggestions**: Get AI-powered recipe recommendations
- **Meal Plan**: Schedule your weekly meals
- **Understanding**: Track mood and energy patterns
- **Preferences**: Set dietary restrictions and allergies

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **AI**: Google Gemini API for recipe generation
- **Styling**: Warm burgundy/cream color palette

## Running the App

### Prerequisites
- Node.js installed
- Git

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   cd server && npm install
   cd ../web && npm install
   ```
3. Start the servers:
   ```bash
   # Terminal 1 - Backend
   cd server && npm start
   
   # Terminal 2 - Frontend  
   cd web && npm run dev
   ```
4. Open http://localhost:5173 in your browser

## Demo Mode

The app runs in demo mode by default - no authentication required. Use the "Reset Demo" button to clear all data and start fresh.

## Contributing

Feel free to submit issues and pull requests to improve Replate!

---

*Made with ❤️ for better meal planning*