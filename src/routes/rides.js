const express = require('express');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all rides (public)
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, 
        u.name as creator_name, 
        u.profile_photo as creator_photo,
        (SELECT COUNT(*) FROM ride_rsvps WHERE ride_id = r.id AND status = 'going') as rsvp_count,
        (SELECT json_agg(json_build_object('id', ru.id, 'name', ru.name, 'photo', ru.profile_photo))
         FROM ride_rsvps rr 
         JOIN users ru ON rr.user_id = ru.id 
         WHERE rr.ride_id = r.id AND rr.status = 'going' LIMIT 5) as rsvp_users,
        EXISTS(SELECT 1 FROM ride_rsvps WHERE ride_id = r.id AND user_id = $1) as user_rsvp
       FROM rides r
       JOIN users u ON r.creator_id = u.id
       WHERE r.date >= CURRENT_DATE
       ORDER BY r.date ASC, r.time ASC`,
      [req.user.id]
    );

    res.json({ rides: result.rows });
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my rides (created by me)
router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, 
        (SELECT COUNT(*) FROM ride_rsvps WHERE ride_id = r.id AND status = 'going') as rsvp_count
       FROM rides r
       WHERE r.creator_id = $1
       ORDER BY r.date DESC`,
      [req.user.id]
    );

    res.json({ rides: result.rows });
  } catch (error) {
    console.error('Get my rides error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get rides I'm attending
router.get('/attending', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, 
        u.name as creator_name,
        (SELECT COUNT(*) FROM ride_rsvps WHERE ride_id = r.id AND status = 'going') as rsvp_count
       FROM rides r
       JOIN users u ON r.creator_id = u.id
       JOIN ride_rsvps rr ON rr.ride_id = r.id
       WHERE rr.user_id = $1 AND rr.status = 'going'
       ORDER BY r.date ASC`,
      [req.user.id]
    );

    res.json({ rides: result.rows });
  } catch (error) {
    console.error('Get attending rides error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single ride
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, 
        u.name as creator_name, 
        u.profile_photo as creator_photo,
        (SELECT COUNT(*) FROM ride_rsvps WHERE ride_id = r.id AND status = 'going') as rsvp_count,
        (SELECT json_agg(json_build_object('id', ru.id, 'name', ru.name, 'photo', ru.profile_photo))
         FROM ride_rsvps rr 
         JOIN users ru ON rr.user_id = ru.id 
         WHERE rr.ride_id = r.id AND rr.status = 'going') as rsvp_users,
        EXISTS(SELECT 1 FROM ride_rsvps WHERE ride_id = r.id AND user_id = $2) as user_rsvp
       FROM rides r
       JOIN users u ON r.creator_id = u.id
       WHERE r.id = $1`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json({ ride: result.rows[0] });
  } catch (error) {
    console.error('Get ride error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create ride
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, date, time, meeting_point, difficulty, max_riders, image } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const result = await pool.query(
      `INSERT INTO rides (creator_id, title, description, date, time, meeting_point, difficulty, max_riders, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, title, description, date, time, meeting_point, difficulty || 'Beginner', max_riders, image]
    );

    // Auto RSVP creator
    await pool.query(
      'INSERT INTO ride_rsvps (ride_id, user_id, status) VALUES ($1, $2, $3)',
      [result.rows[0].id, req.user.id, 'going']
    );

    res.status(201).json({ ride: result.rows[0] });
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// RSVP to ride
router.post('/:id/rsvp', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'going' or 'not_going'

    // Check if ride exists
    const rideCheck = await pool.query('SELECT id, max_riders FROM rides WHERE id = $1', [req.params.id]);
    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Check max riders
    if (status === 'going' && rideCheck.rows[0].max_riders) {
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM ride_rsvps WHERE ride_id = $1 AND status = $2',
        [req.params.id, 'going']
      );
      if (parseInt(countResult.rows[0].count) >= rideCheck.rows[0].max_riders) {
        return res.status(400).json({ error: 'Ride is full' });
      }
    }

    // Upsert RSVP
    const result = await pool.query(
      `INSERT INTO ride_rsvps (ride_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (ride_id, user_id) 
       DO UPDATE SET status = $3
       RETURNING *`,
      [req.params.id, req.user.id, status || 'going']
    );

    // Get updated count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM ride_rsvps WHERE ride_id = $1 AND status = $2',
      [req.params.id, 'going']
    );

    res.json({ 
      rsvp: result.rows[0],
      rsvp_count: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel RSVP
router.delete('/:id/rsvp', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM ride_rsvps WHERE ride_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    res.json({ message: 'RSVP cancelled' });
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete ride (creator only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM rides WHERE id = $1 AND creator_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or not authorized' });
    }

    res.json({ message: 'Ride deleted successfully' });
  } catch (error) {
    console.error('Delete ride error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
