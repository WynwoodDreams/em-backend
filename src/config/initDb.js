const pool = require('./database');

const initDatabase = async () => {
  const createTables = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('rider', 'dealer')),
      name VARCHAR(255),
      phone VARCHAR(50),
      profile_photo VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Dealer/Shop profiles
    CREATE TABLE IF NOT EXISTS shop_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      business_name VARCHAR(255) NOT NULL,
      address VARCHAR(500),
      phone VARCHAR(50),
      email VARCHAR(255),
      hours VARCHAR(255),
      description TEXT,
      logo VARCHAR(500),
      visible BOOLEAN DEFAULT true,
      accepting_appointments BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Bikes table
    CREATE TABLE IF NOT EXISTS bikes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      make VARCHAR(100) NOT NULL,
      model VARCHAR(100) NOT NULL,
      year INTEGER,
      vin VARCHAR(17),
      mileage INTEGER DEFAULT 0,
      color VARCHAR(50),
      engine VARCHAR(50),
      power VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Active',
      image VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Bike photos
    CREATE TABLE IF NOT EXISTS bike_photos (
      id SERIAL PRIMARY KEY,
      bike_id INTEGER REFERENCES bikes(id) ON DELETE CASCADE,
      photo_url VARCHAR(500) NOT NULL,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Maintenance records
    CREATE TABLE IF NOT EXISTS maintenance_records (
      id SERIAL PRIMARY KEY,
      bike_id INTEGER REFERENCES bikes(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(50),
      status VARCHAR(20) DEFAULT 'pending',
      due_mileage INTEGER,
      due_date DATE,
      completed_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Rides table
    CREATE TABLE IF NOT EXISTS rides (
      id SERIAL PRIMARY KEY,
      creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      time TIME,
      meeting_point VARCHAR(500),
      difficulty VARCHAR(20) DEFAULT 'Beginner',
      max_riders INTEGER,
      image VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Ride RSVPs
    CREATE TABLE IF NOT EXISTS ride_rsvps (
      id SERIAL PRIMARY KEY,
      ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'going',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(ride_id, user_id)
    );

    -- Community posts
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      image VARCHAR(500),
      likes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Post comments
    CREATE TABLE IF NOT EXISTS post_comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Promotions (dealers)
    CREATE TABLE IF NOT EXISTS promotions (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shop_profiles(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      discount VARCHAR(50),
      valid_until DATE,
      active BOOLEAN DEFAULT true,
      views INTEGER DEFAULT 0,
      image VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Store items (dealers)
    CREATE TABLE IF NOT EXISTS store_items (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shop_profiles(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      stock INTEGER DEFAULT 0,
      category VARCHAR(100),
      image VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Appointments
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shop_profiles(id) ON DELETE CASCADE,
      customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name VARCHAR(255),
      customer_phone VARCHAR(50),
      bike_info VARCHAR(255),
      service_type VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      time TIME NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Inventory (dealer bike inventory)
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shop_profiles(id) ON DELETE CASCADE,
      make VARCHAR(100) NOT NULL,
      model VARCHAR(100) NOT NULL,
      year INTEGER,
      vin VARCHAR(17),
      mileage INTEGER,
      price DECIMAL(10, 2),
      status VARCHAR(50) DEFAULT 'Available',
      image VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createTables);
    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

module.exports = initDatabase;
