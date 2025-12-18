const express = require('express');
const pool = require('../config/database');
const { auth, isDealer } = require('../middleware/auth');

const router = express.Router();

// ============ SHOP PROFILE ============

// Get shop profile
router.get('/profile', auth, isDealer, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM shop_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop profile not found' });
    }

    res.json({ shop: result.rows[0] });
  } catch (error) {
    console.error('Get shop profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update shop profile
router.put('/profile', auth, isDealer, async (req, res) => {
  try {
    const { business_name, address, phone, email, hours, description, logo, visible, accepting_appointments } = req.body;

    const result = await pool.query(
      `UPDATE shop_profiles 
       SET business_name = COALESCE($1, business_name),
           address = COALESCE($2, address),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           hours = COALESCE($5, hours),
           description = COALESCE($6, description),
           logo = COALESCE($7, logo),
           visible = COALESCE($8, visible),
           accepting_appointments = COALESCE($9, accepting_appointments),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $10
       RETURNING *`,
      [business_name, address, phone, email, hours, description, logo, visible, accepting_appointments, req.user.id]
    );

    res.json({ shop: result.rows[0] });
  } catch (error) {
    console.error('Update shop profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ PROMOTIONS ============

// Get all promotions for shop
router.get('/promotions', auth, isDealer, async (req, res) => {
  try {
    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    if (shopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const result = await pool.query(
      'SELECT * FROM promotions WHERE shop_id = $1 ORDER BY created_at DESC',
      [shopResult.rows[0].id]
    );

    res.json({ promotions: result.rows });
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create promotion
router.post('/promotions', auth, isDealer, async (req, res) => {
  try {
    const { title, description, discount, valid_until, image } = req.body;

    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    if (shopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const result = await pool.query(
      `INSERT INTO promotions (shop_id, title, description, discount, valid_until, image)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [shopResult.rows[0].id, title, description, discount, valid_until, image]
    );

    res.status(201).json({ promotion: result.rows[0] });
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update promotion
router.put('/promotions/:id', auth, isDealer, async (req, res) => {
  try {
    const { title, description, discount, valid_until, active, image } = req.body;

    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    
    const result = await pool.query(
      `UPDATE promotions 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           discount = COALESCE($3, discount),
           valid_until = COALESCE($4, valid_until),
           active = COALESCE($5, active),
           image = COALESCE($6, image)
       WHERE id = $7 AND shop_id = $8
       RETURNING *`,
      [title, description, discount, valid_until, active, image, req.params.id, shopResult.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json({ promotion: result.rows[0] });
  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete promotion
router.delete('/promotions/:id', auth, isDealer, async (req, res) => {
  try {
    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    
    const result = await pool.query(
      'DELETE FROM promotions WHERE id = $1 AND shop_id = $2 RETURNING id',
      [req.params.id, shopResult.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json({ message: 'Promotion deleted' });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ STORE ITEMS ============

// Get all store items
router.get('/items', auth, isDealer, async (req, res) => {
  try {
    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    if (shopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const result = await pool.query(
      'SELECT * FROM store_items WHERE shop_id = $1 ORDER BY created_at DESC',
      [shopResult.rows[0].id]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create store item
router.post('/items', auth, isDealer, async (req, res) => {
  try {
    const { name, description, price, stock, category, image } = req.body;

    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    if (shopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const result = await pool.query(
      `INSERT INTO store_items (shop_id, name, description, price, stock, category, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [shopResult.rows[0].id, name, description, price, stock || 0, category, image]
    );

    res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update store item
router.put('/items/:id', auth, isDealer, async (req, res) => {
  try {
    const { name, description, price, stock, category, image } = req.body;

    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    
    const result = await pool.query(
      `UPDATE store_items 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock),
           category = COALESCE($5, category),
           image = COALESCE($6, image)
       WHERE id = $7 AND shop_id = $8
       RETURNING *`,
      [name, description, price, stock, category, image, req.params.id, shopResult.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete store item
router.delete('/items/:id', auth, isDealer, async (req, res) => {
  try {
    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    
    const result = await pool.query(
      'DELETE FROM store_items WHERE id = $1 AND shop_id = $2 RETURNING id',
      [req.params.id, shopResult.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ APPOINTMENTS ============

// Get all appointments
router.get('/appointments', auth, isDealer, async (req, res) => {
  try {
    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    if (shopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { date } = req.query;
    let query = 'SELECT * FROM appointments WHERE shop_id = $1';
    const params = [shopResult.rows[0].id];

    if (date) {
      query += ' AND date = $2';
      params.push(date);
    }

    query += ' ORDER BY date ASC, time ASC';

    const result = await pool.query(query, params);

    res.json({ appointments: result.rows });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create appointment (can be created by customer or dealer)
router.post('/appointments', auth, async (req, res) => {
  try {
    const { shop_id, customer_name, customer_phone, bike_info, service_type, date, time, notes } = req.body;

    // If dealer creating for walk-in
    let targetShopId = shop_id;
    if (req.user.role === 'dealer') {
      const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
      targetShopId = shopResult.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO appointments (shop_id, customer_id, customer_name, customer_phone, bike_info, service_type, date, time, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [targetShopId, req.user.role === 'rider' ? req.user.id : null, customer_name, customer_phone, bike_info, service_type, date, time, notes]
    );

    res.status(201).json({ appointment: result.rows[0] });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update appointment status
router.put('/appointments/:id', auth, isDealer, async (req, res) => {
  try {
    const { status, notes, date, time } = req.body;

    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    
    const result = await pool.query(
      `UPDATE appointments 
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes),
           date = COALESCE($3, date),
           time = COALESCE($4, time)
       WHERE id = $5 AND shop_id = $6
       RETURNING *`,
      [status, notes, date, time, req.params.id, shopResult.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment: result.rows[0] });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete appointment
router.delete('/appointments/:id', auth, isDealer, async (req, res) => {
  try {
    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    
    const result = await pool.query(
      'DELETE FROM appointments WHERE id = $1 AND shop_id = $2 RETURNING id',
      [req.params.id, shopResult.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ INVENTORY (Bikes for sale) ============

// Get inventory
router.get('/inventory', auth, isDealer, async (req, res) => {
  try {
    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    if (shopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const result = await pool.query(
      'SELECT * FROM inventory WHERE shop_id = $1 ORDER BY created_at DESC',
      [shopResult.rows[0].id]
    );

    res.json({ inventory: result.rows });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add to inventory
router.post('/inventory', auth, isDealer, async (req, res) => {
  try {
    const { make, model, year, vin, mileage, price, status, image } = req.body;

    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    if (shopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const result = await pool.query(
      `INSERT INTO inventory (shop_id, make, model, year, vin, mileage, price, status, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [shopResult.rows[0].id, make, model, year, vin, mileage, price, status || 'Available', image]
    );

    res.status(201).json({ bike: result.rows[0] });
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update inventory item
router.put('/inventory/:id', auth, isDealer, async (req, res) => {
  try {
    const { make, model, year, vin, mileage, price, status, image } = req.body;

    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    
    const result = await pool.query(
      `UPDATE inventory 
       SET make = COALESCE($1, make),
           model = COALESCE($2, model),
           year = COALESCE($3, year),
           vin = COALESCE($4, vin),
           mileage = COALESCE($5, mileage),
           price = COALESCE($6, price),
           status = COALESCE($7, status),
           image = COALESCE($8, image)
       WHERE id = $9 AND shop_id = $10
       RETURNING *`,
      [make, model, year, vin, mileage, price, status, image, req.params.id, shopResult.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ bike: result.rows[0] });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete from inventory
router.delete('/inventory/:id', auth, isDealer, async (req, res) => {
  try {
    const shopResult = await pool.query('SELECT id FROM shop_profiles WHERE user_id = $1', [req.user.id]);
    
    const result = await pool.query(
      'DELETE FROM inventory WHERE id = $1 AND shop_id = $2 RETURNING id',
      [req.params.id, shopResult.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
