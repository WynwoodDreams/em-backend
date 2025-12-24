require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDatabase = require('./config/initDb');

// Import routes
const authRoutes = require('./routes/auth');
const bikesRoutes = require('./routes/bikes');
const ridesRoutes = require('./routes/rides');
const postsRoutes = require('./routes/posts');
const shopRoutes = require('./routes/shop');
const uploadRoutes = require('./routes/upload');
const storiesRoutes = require('./routes/stories');
const followsRoutes = require('./routes/follows');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://emnova-prjoect.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'EM Motorcycle API is running',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bikes', bikesRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/follows', followsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize database tables
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║     EM MOTORCYCLE API SERVER              ║
╠═══════════════════════════════════════════╣
║  Status:  Running                         ║
║  Port:    ${PORT}                            ║
║  Env:     ${process.env.NODE_ENV || 'development'}                   ║
╚═══════════════════════════════════════════╝

Available endpoints:
  POST   /api/auth/register     - Register new user
  POST   /api/auth/login        - Login
  GET    /api/auth/me           - Get current user
  PUT    /api/auth/profile      - Update profile

  GET    /api/bikes             - Get user's bikes
  POST   /api/bikes             - Add new bike
  PUT    /api/bikes/:id         - Update bike
  DELETE /api/bikes/:id         - Delete bike

  GET    /api/rides             - Get all rides
  POST   /api/rides             - Create ride
  POST   /api/rides/:id/rsvp    - RSVP to ride

  GET    /api/posts             - Get community posts
  POST   /api/posts             - Create post
  POST   /api/posts/:id/like    - Like post
  POST   /api/posts/:id/comments - Add comment
  DELETE /api/posts/:id         - Delete post

  GET    /api/stories           - Get active stories
  POST   /api/stories           - Create story
  POST   /api/stories/:id/seen  - Mark story as seen
  DELETE /api/stories/:id       - Delete story

  GET    /api/follows/followers/:userId  - Get followers
  GET    /api/follows/following/:userId  - Get following
  GET    /api/follows/status/:userId     - Check follow status
  POST   /api/follows/:userId            - Follow user
  DELETE /api/follows/:userId            - Unfollow user

  GET    /api/shop/profile      - Get shop profile (dealer)
  PUT    /api/shop/profile      - Update shop profile
  GET    /api/shop/promotions   - Get promotions
  POST   /api/shop/promotions   - Create promotion
  GET    /api/shop/items        - Get store items
  GET    /api/shop/appointments - Get appointments
  GET    /api/shop/inventory    - Get bike inventory

  POST   /api/upload            - Upload image
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
