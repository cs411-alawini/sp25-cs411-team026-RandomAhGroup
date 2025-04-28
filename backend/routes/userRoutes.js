const express = require("express");
const bcrypt = require('bcrypt');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updatePreferences,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// Import middleware
const authenticateToken = require('../middleware/auth');

router.post("/", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/preferences", protect, updatePreferences);

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get connection from the pool
    const connection = await req.app.locals.pool.getConnection();
    
    // Get user data (excluding password)
    const [users] = await connection.query(
      'SELECT user_id, name, email FROM User WHERE user_id = ?',
      [userId]
    );
    
    connection.release();
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to retrieve profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;
    
    // Validate input
    if (!name && !email) {
      return res.status(400).json({ message: 'No update data provided' });
    }
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Check if email already exists (if email is being updated)
    if (email) {
      const [existingUsers] = await connection.query(
        'SELECT * FROM User WHERE email = ? AND user_id != ?',
        [email, userId]
      );
      
      if (existingUsers.length > 0) {
        connection.release();
        return res.status(409).json({ message: 'Email already in use' });
      }
    }
    
    // Build query based on provided fields
    let updateFields = [];
    let params = [];
    
    if (name) {
      updateFields.push('name = ?');
      params.push(name);
    }
    
    if (email) {
      updateFields.push('email = ?');
      params.push(email);
    }
    
    params.push(userId);
    
    const [result] = await connection.query(
      `UPDATE User SET ${updateFields.join(', ')} WHERE user_id = ?`,
      params
    );
    
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Get all preference fields
    const [users] = await connection.query(
      `SELECT 
        park_pref, historical_landmark_pref, historical_place_museum_pref, 
        museum_pref, history_museum_pref, tourist_attraction_pref,
        wildlife_park_pref, art_museum_pref, aquarium_pref,
        monument_pref, hiking_area_pref, zoo_pref,
        catholic_cathedral_pref, nature_preserve_pref, amusement_park_pref,
        garden_pref, theme_park_pref, water_park_pref,
        scenic_spot_pref, observatory_pref, castle_pref,
        archaeological_museum_pref, public_beach_pref, national_forest_pref,
        catholic_church_pref, heritage_museum_pref, beach_pref,
        synagogue_pref, ecological_park_pref, wax_museum_pref,
        hindu_temple_pref, wildlife_safari_park_pref, buddhist_temple_pref,
        animal_park_pref, wildlife_refuge_pref, heritage_building_pref,
        vista_point_pref, national_park_pref, monastery_pref,
        fortress_pref, beach_pavilion_pref
      FROM User 
      WHERE user_id = ?`,
      [userId]
    );
    
    connection.release();
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Failed to retrieve preferences' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Build the SQL query dynamically based on provided preferences
    let sql = 'UPDATE User SET ';
    const values = [];
    const validPrefs = [];
    
    // Add each preference to the query if it exists and is valid
    Object.keys(preferences).forEach((pref) => {
      if (pref.endsWith('_pref') && 
          typeof preferences[pref] === 'number' && 
          preferences[pref] >= 1 && 
          preferences[pref] <= 100) {
        validPrefs.push(`${pref} = ?`);
        values.push(preferences[pref]);
      }
    });
    
    if (validPrefs.length === 0) {
      connection.release();
      return res.status(400).json({ message: 'No valid preferences provided' });
    }
    
    sql += validPrefs.join(', ');
    sql += ' WHERE user_id = ?';
    values.push(userId);
    
    const [result] = await connection.query(sql, values);
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

// Change user password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Get current user with password
    const [users] = await connection.query(
      'SELECT password FROM User WHERE user_id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!validPassword) {
      connection.release();
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    const [result] = await connection.query(
      'UPDATE User SET password = ? WHERE user_id = ?',
      [hashedPassword, userId]
    );
    
    connection.release();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Delete user (cascade will delete related records due to ON DELETE CASCADE)
    const [result] = await connection.query(
      'DELETE FROM User WHERE user_id = ?',
      [userId]
    );
    
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

module.exports = router;
