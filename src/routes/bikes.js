const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bikes WHERE user_id = $1', [req.user.id]);
    res.json({ bikes: result.rows });
  } catch (error) {
    console.error('Get bikes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { make, model, year, vin, mileage, color, image } = req.body;
    const result = await pool.query(
      'INSERT INTO bikes (user_id, make, model, year, vin, mileage, color, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, make, model, year, vin, mileage, color, image]
    );
    res.status(201).json({ bike: result.rows[0] });
  } catch (error) {
    console.error('Add bike error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM bikes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
