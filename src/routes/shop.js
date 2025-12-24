const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

// Get Shop Profile
router.get('/profile', auth, authorize('dealer'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dealers WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Shop Profile
router.put('/profile', auth, authorize('dealer'), async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    // Simple check if dealer profile exists, then insert or update
    const check = await pool.query('SELECT id FROM dealers WHERE user_id = $1', [req.user.id]);
    
    if (check.rows.length === 0) {
      await pool.query(
        'INSERT INTO dealers (user_id, name, address, phone) VALUES ($1, $2, $3, $4)',
        [req.user.id, name, address, phone]
      );
    } else {
      await pool.query(
        'UPDATE dealers SET name = $2, address = $3, phone = $4 WHERE user_id = $1',
        [req.user.id, name, address, phone]
      );
    }
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Promotions
router.get('/promotions', auth, authorize('dealer'), async (req, res) => {
  res.json({ promotions: [] }); // Placeholder to prevent crash
});

// Create Promotion
router.post('/promotions', auth, authorize('dealer'), async (req, res) => {
  res.json({ message: 'Promotion created' }); // Placeholder
});

// Get Items
router.get('/items', auth, authorize('dealer'), async (req, res) => {
  res.json({ items: [] }); // Placeholder
});

// Get Appointments
router.get('/appointments', auth, authorize('dealer'), async (req, res) => {
  res.json({ appointments: [] }); // Placeholder
});

// Get Inventory
router.get('/inventory', auth, authorize('dealer'), async (req, res) => {
  res.json({ inventory: [] }); // Placeholder
});

module.exports = router;
