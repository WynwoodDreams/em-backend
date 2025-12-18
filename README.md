# EM Motorcycle Backend API

Complete backend for the EM Motorcycle app with user authentication, bike management, rides, community posts, and dealer features.

## 🚀 Quick Setup (15-20 minutes)

### Step 1: Add PostgreSQL to Railway

1. Go to your Railway project: https://railway.app
2. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
3. Wait for it to provision (1-2 minutes)
4. Click on the PostgreSQL service
5. Go to **"Variables"** tab
6. Copy the `DATABASE_URL` value

### Step 2: Deploy Backend to Railway

1. Create a new GitHub repository for the backend
2. Push this code to the repo
3. In Railway, click **"+ New"** → **"GitHub Repo"**
4. Select your backend repo
5. Railway will auto-detect Node.js and deploy

### Step 3: Set Environment Variables

In Railway, go to your backend service → **Variables** tab → Add:

```
DATABASE_URL=<paste from PostgreSQL service>
JWT_SECRET=em-motorcycle-super-secret-key-2024
CLOUDINARY_CLOUD_NAME=dsu7dcqu0
CLOUDINARY_API_KEY=<your key>
CLOUDINARY_API_SECRET=<your secret>
NODE_ENV=production
```

### Step 4: Get Your API URL

After deploy, Railway gives you a URL like:
```
https://em-backend-production.up.railway.app
```

Use this in your frontend.

---

## 📁 Project Structure

```
em-backend/
├── src/
│   ├── config/
│   │   ├── database.js     # PostgreSQL connection
│   │   └── initDb.js       # Create tables
│   ├── middleware/
│   │   └── auth.js         # JWT authentication
│   ├── routes/
│   │   ├── auth.js         # Login/Register
│   │   ├── bikes.js        # Bike management
│   │   ├── rides.js        # Ride creation/RSVP
│   │   ├── posts.js        # Community posts
│   │   ├── shop.js         # Dealer features
│   │   └── upload.js       # Image uploads
│   └── server.js           # Main app
├── package.json
└── .env.example
```

---

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Bikes (Rider)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bikes` | Get my bikes |
| POST | `/api/bikes` | Add bike |
| PUT | `/api/bikes/:id` | Update bike |
| DELETE | `/api/bikes/:id` | Delete bike |
| POST | `/api/bikes/:id/photos` | Add photo |
| POST | `/api/bikes/:id/maintenance` | Add maintenance |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rides` | Get all rides |
| GET | `/api/rides/my` | Get my created rides |
| GET | `/api/rides/attending` | Get rides I'm attending |
| POST | `/api/rides` | Create ride |
| POST | `/api/rides/:id/rsvp` | RSVP to ride |
| DELETE | `/api/rides/:id/rsvp` | Cancel RSVP |

### Community
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Get posts |
| POST | `/api/posts` | Create post |
| POST | `/api/posts/:id/like` | Like post |
| POST | `/api/posts/:id/comments` | Add comment |

### Shop (Dealer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shop/profile` | Get shop profile |
| PUT | `/api/shop/profile` | Update shop |
| GET | `/api/shop/promotions` | Get promos |
| POST | `/api/shop/promotions` | Create promo |
| GET | `/api/shop/items` | Get store items |
| POST | `/api/shop/items` | Add item |
| GET | `/api/shop/appointments` | Get appointments |
| POST | `/api/shop/appointments` | Create appointment |
| GET | `/api/shop/inventory` | Get bike inventory |
| POST | `/api/shop/inventory` | Add to inventory |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload image |

---

## 🧪 Test the API

### Register a user:
```bash
curl -X POST https://your-api.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"1234","role":"rider","name":"Test User"}'
```

### Login:
```bash
curl -X POST https://your-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"1234"}'
```

### Add a bike (with token):
```bash
curl -X POST https://your-api.railway.app/api/bikes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"make":"Honda","model":"CBR600RR","year":2023}'
```

---

## 🔐 Authentication

All protected routes require a Bearer token in the header:
```
Authorization: Bearer <your_jwt_token>
```

Tokens are valid for 30 days.

---

## 📱 Frontend Integration

Update your frontend to use these API calls. Example:

```javascript
const API_URL = 'https://your-api.railway.app';

// Login
const login = async (email, password) => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  localStorage.setItem('token', data.token);
  return data;
};

// Get bikes (authenticated)
const getBikes = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/bikes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};
```

---

## ❓ Troubleshooting

**Database connection error:**
- Make sure DATABASE_URL is set correctly
- Check PostgreSQL service is running in Railway

**401 Unauthorized:**
- Token expired or invalid
- Make sure to include `Bearer ` prefix

**CORS error:**
- Add your frontend URL to cors origins in server.js

---

## 📞 Support

If you have issues, check:
1. Railway logs (click on service → Deployments → View Logs)
2. Database is connected (check health endpoint)
3. Environment variables are set correctly
