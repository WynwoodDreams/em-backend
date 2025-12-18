const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get user's bikes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bikes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ bikes: result.rows });
  } catch (error) {
    console.error('Get bikes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new bike
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { make, model, year, vin, mileage, color, engine, power, image } = req.body;
    const result = await pool.query(
      'INSERT INTO bikes (user_id, make, model, year, vin, mileage, color, engine, power, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [req.user.id, make, model, year || new Date().getFullYear(), vin, mileage || 0, color, engine, power, image]
    );
    res.status(201).json({ bike: result.rows[0] });
  } catch (error) {
    console.error('Add bike error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update bike
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { make, model, year, vin, mileage, color, engine, power, image, status } = req.body;
    const result = await pool.query(
      'UPDATE bikes SET make = COALESCE($1, make), model = COALESCE($2, model), year = COALESCE($3, year), vin = COALESCE($4, vin), mileage = COALESCE($5, mileage), color = COALESCE($6, color), engine = COALESCE($7, engine), power = COALESCE($8, power), image = COALESCE($9, image), status = COALESCE($10, status), updated_at = NOW() WHERE id = $11 AND user_id = $12 RETURNING *',
      [make, model, year, vin, mileage, color, engine, power, image, status, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bike not found' });
    }
    res.json({ bike: result.rows[0] });
  } catch (error) {
    console.error('Update bike error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete bike
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM bikes WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bike not found' });
    }
    res.json({ message: 'Bike deleted' });
  } catch (error) {
    console.error('Delete bike error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add photo to bike
router.post('/:id/photos', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { photo_url, is_primary } = req.body;
    const result = await pool.query(
      'INSERT INTO bike_photos (bike_id, photo_url, is_primary) VALUES ($1, $2, $3) RETURNING *',
      [id, photo_url, is_primary || false]
    );
    res.status(201).json({ photo: result.rows[0] });
  } catch (error) {
    console.error('Add photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add maintenance record
router.post('/:id/maintenance', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, due_mileage, due_date, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO maintenance_records (bike_id, title, type, due_mileage, due_date, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, title, type || 'General', due_mileage, due_date, notes]
    );
    res.status(201).json({ maintenance: result.rows[0] });
  } catch (error) {
    console.error('Add maintenance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
