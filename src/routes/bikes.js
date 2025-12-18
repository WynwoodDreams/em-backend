const express = require('express');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all bikes for current user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, 
        (SELECT json_agg(bp.*) FROM bike_photos bp WHERE bp.bike_id = b.id) as photos,
        (SELECT json_agg(mr.*) FROM maintenance_records mr WHERE mr.bike_id = b.id ORDER BY mr.created_at DESC) as maintenance
       FROM bikes b 
       WHERE b.user_id = $1 
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json({ bikes: result.rows });
  } catch (error) {
    console.error('Get bikes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single bike
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, 
        (SELECT json_agg(bp.*) FROM bike_photos bp WHERE bp.bike_id = b.id) as photos,
        (SELECT json_agg(mr.* ORDER BY mr.created_at DESC) FROM maintenance_records mr WHERE mr.bike_id = b.id) as maintenance
       FROM bikes b 
       WHERE b.id = $1 AND b.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    res.json({ bike: result.rows[0] });
  } catch (error) {
    console.error('Get bike error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new bike
router.post('/', auth, async (req, res) => {
  try {
    const { make, model, year, vin, mileage, color, engine, power, image } = req.body;

    if (!make || !model) {
      return res.status(400).json({ error: 'Make and model are required' });
    }

    const result = await pool.query(
      `INSERT INTO bikes (user_id, make, model, year, vin, mileage, color, engine, power, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.user.id, make, model, year, vin, mileage || 0, color, engine, power, image]
    );

    // Add default maintenance reminders
    const bike = result.rows[0];
    await pool.query(
      `INSERT INTO maintenance_records (bike_id, title, type, status, due_mileage)
       VALUES 
        ($1, 'Oil Change', 'Oil', 'pending', $2),
        ($1, 'Chain Adjustment', 'Chain', 'pending', $3),
        ($1, 'Brake Inspection', 'Brake', 'pending', $4),
        ($1, 'Tire Check', 'Tire', 'pending', $5)`,
      [bike.id, (mileage || 0) + 3000, (mileage || 0) + 500, (mileage || 0) + 5000, (mileage || 0) + 2000]
    );

    res.status(201).json({ bike });
  } catch (error) {
    console.error('Add bike error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update bike
router.put('/:id', auth, async (req, res) => {
  try {
    const { make, model, year, vin, mileage, color, engine, power, status, image } = req.body;

    const result = await pool.query(
      `UPDATE bikes 
       SET make = COALESCE($1, make),
           model = COALESCE($2, model),
           year = COALESCE($3, year),
           vin = COALESCE($4, vin),
           mileage = COALESCE($5, mileage),
           color = COALESCE($6, color),
           engine = COALESCE($7, engine),
           power = COALESCE($8, power),
           status = COALESCE($9, status),
           image = COALESCE($10, image),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [make, model, year, vin, mileage, color, engine, power, status, image, req.params.id, req.user.id]
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
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM bikes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    res.json({ message: 'Bike deleted successfully' });
  } catch (error) {
    console.error('Delete bike error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add photo to bike
router.post('/:id/photos', auth, async (req, res) => {
  try {
    const { photo_url, is_primary } = req.body;

    // Verify bike belongs to user
    const bikeCheck = await pool.query(
      'SELECT id FROM bikes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (bikeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    // If setting as primary, unset other primaries
    if (is_primary) {
      await pool.query(
        'UPDATE bike_photos SET is_primary = false WHERE bike_id = $1',
        [req.params.id]
      );
    }

    const result = await pool.query(
      'INSERT INTO bike_photos (bike_id, photo_url, is_primary) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, photo_url, is_primary || false]
    );

    // Update bike main image if primary
    if (is_primary) {
      await pool.query(
        'UPDATE bikes SET image = $1 WHERE id = $2',
        [photo_url, req.params.id]
      );
    }

    res.status(201).json({ photo: result.rows[0] });
  } catch (error) {
    console.error('Add photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add maintenance record
router.post('/:id/maintenance', auth, async (req, res) => {
  try {
    const { title, type, due_mileage, due_date, notes } = req.body;

    // Verify bike belongs to user
    const bikeCheck = await pool.query(
      'SELECT id FROM bikes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (bikeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    const result = await pool.query(
      `INSERT INTO maintenance_records (bike_id, title, type, due_mileage, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, title, type, due_mileage, due_date, notes]
    );

    res.status(201).json({ maintenance: result.rows[0] });
  } catch (error) {
    console.error('Add maintenance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete maintenance
router.put('/maintenance/:id/complete', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE maintenance_records 
       SET status = 'completed', completed_date = CURRENT_DATE
       WHERE id = $1 
       AND bike_id IN (SELECT id FROM bikes WHERE user_id = $2)
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    res.json({ maintenance: result.rows[0] });
  } catch (error) {
    console.error('Complete maintenance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
