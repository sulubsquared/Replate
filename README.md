# 🍽️ Replate - Smart Meal Planning App

Replate helps users plan meals from what's already in their pantry. Users can log ingredients, get AI-powered recipe suggestions based on what they have, and generate grocery lists for missing items.

## 🚀 Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js (Express)
- **Database + Auth**: Supabase
- **AI Integration**: OpenAI (optional)

## 📁 Project Structure

```
replate/
├── web/                 # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.jsx     # Main app component
│   │   └── index.css   # TailwindCSS styles
│   └── package.json
├── server/             # Node.js API
│   ├── index.js        # Express server
│   └── package.json
├── supabase/           # Database schema
│   └── schema.sql      # SQL schema + seed data
└── README.md
```

## 🗄️ Database Schema

The app uses the following main tables:

- `profiles` - User profile information
- `ingredients` - Available ingredients catalog
- `user_pantry` - User's pantry inventory
- `recipes` - Recipe database
- `recipe_ingredients` - Recipe ingredient requirements
- `preferences` - User dietary preferences
- `meal_plan` - Weekly meal planning

All tables include Row Level Security (RLS) policies for data protection.

## 🛠️ Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Note down your project URL and API keys

### 2. Backend Setup

```bash
cd server
npm install
cp ../env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### 3. Frontend Setup

```bash
cd web
npm install
cp ../env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### 4. Environment Variables

Create `.env` files in both `server/` and `web/` directories with:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3001

# Frontend Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE=http://localhost:3001
```

## 🎨 Features

### Pantry Management
- Add/remove ingredients with quantities
- View current pantry inventory
- Search and select from ingredient catalog

### AI-Powered Recipe Suggestions
- Get personalized recipe recommendations
- Based on pantry ingredients and user preferences
- Coverage scoring and missing ingredient analysis
- Optional OpenAI integration for enhanced suggestions

### Meal Planning
- Weekly meal plan view
- Add meals to specific days and time slots
- Quick actions for meal planning

### User Authentication
- Magic link authentication via Supabase
- Secure user sessions
- Row-level security for data protection

## 🎨 Design System

The app uses a warm, cozy design with:
- **Primary Colors**: Burgundy (#be185d) and Cream (#fef7ed)
- **Typography**: Inter font family
- **Components**: Rounded corners, soft shadows, warm color palette
- **Icons**: Lucide React icon library

## 🔧 API Endpoints

### Backend API (`http://localhost:3001`)

- `POST /suggest` - Get recipe suggestions based on pantry
- `POST /grocery` - Get missing ingredients for a recipe
- `GET /pantry/:userId` - Get user's pantry
- `POST /pantry` - Add ingredient to pantry
- `DELETE /pantry/:userId/:ingredientId` - Remove ingredient
- `GET /ingredients` - Get all available ingredients

## 🚀 Development

### Running the Development Servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd web
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Database Management

The `supabase/schema.sql` file includes:
- Complete table definitions
- Row Level Security policies
- Sample data (ingredients and recipes)
- Database functions and triggers

## 🔐 Security

- Row Level Security (RLS) enabled on all user tables
- Users can only access their own data
- Magic link authentication for secure login
- Service role key used only on backend for admin operations

## 🤖 AI Integration

The app includes optional OpenAI integration for:
- Enhanced recipe re-ranking
- Personalized motivational messages
- Smart ingredient matching

To enable AI features, add your OpenAI API key to the environment variables.

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🎯 Future Enhancements

- Grocery list generation
- Meal prep planning
- Nutritional analysis
- Social sharing features
- Recipe rating and reviews
- Advanced dietary filters
- Meal plan templates

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For questions or support, please open an issue in the repository.

---

**Happy Cooking! 🍳**
