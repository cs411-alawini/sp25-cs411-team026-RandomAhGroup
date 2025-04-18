const express = require('express');
const router = express.Router();

// Import middleware
const authenticateToken = require('../middleware/auth');

// Check if city and state are valid throught the database
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    const { city, state } = req.query;

    if (!city || !state) {
      return res.status(400).json({ message: 'City and state are required' });
    }

    const connection = await req.app.locals.pool.getConnection();
    const [results] = await connection.query(
      'SELECT 1 FROM Attraction WHERE LOWER(city) = LOWER(?) AND LOWER(state) = LOWER(?) LIMIT 1',
      [city, state]
    );
    connection.release();

    const isValid = results.length > 0;
    return res.status(200).json({ valid: isValid });

  } catch (error) {
    console.error('Validate city/state error:', error);
    return res.status(500).json({ message: 'Failed to validate city/state' });
  }
});


// Search for attractions based on city and state
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { city, state, orderBy } = req.query;

    if (!city || !state) {
      return res.status(400).json({ message: 'City and state are required' });
    }

    const validOrderBy = ['popularity', 'rating'];
    const orderColumn = validOrderBy.includes(orderBy) ? orderBy : 'popularity';
    const secondaryOrderColumn = orderBy === 'popularity' ? 'rating' : 'popularity';

    const connection = await req.app.locals.pool.getConnection();
    const [results] = await connection.query(
      `SELECT * FROM Attraction WHERE LOWER(city) = LOWER(?) AND LOWER(state) = LOWER(?) ORDER BY ${orderColumn} DESC , ${secondaryOrderColumn} DESC`,
      [city, state]
    );
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ message: 'No attractions found for the specified city and state.' });
    }

    res.json(results);
  } catch (error) {
    console.error('Search attractions error:', error);
    res.status(500).json({ message: 'Failed to search attractions' });
  }
});

// Create a new itinerary
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { destination_city, destination_state, start_date, end_date } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!destination_city || !destination_state || !start_date || !end_date) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (startDate > endDate) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }
    
    const connection = await req.app.locals.pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO Itinerary (user_id, destination_city, destination_state, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
      [userId, destination_city, destination_state, start_date, end_date]
    );
    
    connection.release();
    
    res.status(201).json({
      id: result.insertId,
      message: 'Itinerary created successfully'
    });
  } catch (error) {
    console.error('Itinerary creation error:', error);
    res.status(500).json({ message: 'Failed to create itinerary' });
  }
});

// Get all itineraries for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connection = await req.app.locals.pool.getConnection();
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE user_id = ? ORDER BY start_date DESC',
      [userId]
    );
    
    connection.release();
    
    res.json(itineraries);
  } catch (error) {
    console.error('Get itineraries error:', error);
    res.status(500).json({ message: 'Failed to retrieve itineraries' });
  }
});

// Get a specific itinerary with items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Get itinerary details
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (itineraries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Itinerary not found' });
    }
    
    // Get itinerary items with attraction details
    const [items] = await connection.query(
      `SELECT ii.*, a.name as attraction_name, a.main_category, a.rating, a.description, a.address, a.city, a.state
       FROM ItineraryItem ii
       LEFT JOIN Attraction a ON ii.attraction_id = a.attraction_id
       WHERE ii.itinerary_id = ?
       ORDER BY ii.day_number, ii.start_time`,
      [id]
    );
    
    connection.release();
    
    res.json({
      ...itineraries[0],
      items
    });
  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({ message: 'Failed to retrieve itinerary' });
  }
});

// Update an itinerary
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { destination_city, destination_state, start_date, end_date } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!destination_city || !destination_state || !start_date || !end_date) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (startDate > endDate) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Verify itinerary belongs to user
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (itineraries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Itinerary not found or unauthorized' });
    }
    
    const [result] = await connection.query(
      'UPDATE Itinerary SET destination_city = ?, destination_state = ?, start_date = ?, end_date = ? WHERE itinerary_id = ? AND user_id = ?',
      [destination_city, destination_state, start_date, end_date, id, userId]
    );
    
    connection.release();
    
    res.json({ message: 'Itinerary updated successfully' });
  } catch (error) {
    console.error('Update itinerary error:', error);
    res.status(500).json({ message: 'Failed to update itinerary' });
  }
});

// Delete an itinerary
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Verify itinerary belongs to user
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (itineraries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Itinerary not found or unauthorized' });
    }
    
    // Delete the itinerary (cascade will delete items due to ON DELETE CASCADE)
    const [result] = await connection.query(
      'DELETE FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );
    
    connection.release();
    
    res.json({ message: 'Itinerary deleted successfully' });
  } catch (error) {
    console.error('Delete itinerary error:', error);
    res.status(500).json({ message: 'Failed to delete itinerary' });
  }
});

// Clone an itinerary
router.post('/:id/clone', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;
    const userId = req.user.id;
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Verify original itinerary belongs to user
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (itineraries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Itinerary not found or unauthorized' });
    }
    
    const originalItinerary = itineraries[0];
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Create new itinerary
      const [newItineraryResult] = await connection.query(
        'INSERT INTO Itinerary (user_id, destination_city, destination_state, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
        [
          userId, 
          originalItinerary.destination_city, 
          originalItinerary.destination_state, 
          originalItinerary.start_date, 
          originalItinerary.end_date
        ]
      );
      
      const newItineraryId = newItineraryResult.insertId;
      
      // Get all items from original itinerary
      const [items] = await connection.query(
        'SELECT * FROM ItineraryItem WHERE itinerary_id = ?',
        [id]
      );
      
      // Clone each item to the new itinerary
      for (const item of items) {
        await connection.query(
          'INSERT INTO ItineraryItem (itinerary_id, attraction_id, day_number, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [
            newItineraryId,
            item.attraction_id,
            item.day_number,
            item.start_time,
            item.end_time,
            item.notes
          ]
        );
      }
      
      // Commit transaction
      await connection.commit();
      
      connection.release();
      
      res.status(201).json({
        id: newItineraryId,
        message: 'Itinerary cloned successfully'
      });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Clone itinerary error:', error);
    res.status(500).json({ message: 'Failed to clone itinerary' });
  }
});

// Share an itinerary
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const userId = req.user.id;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Verify itinerary belongs to user
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (itineraries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Itinerary not found or unauthorized' });
    }
    
    // Find the user to share with
    const [users] = await connection.query(
      'SELECT user_id FROM User WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'User not found' });
    }
    
    const targetUserId = users[0].user_id;
    
    // Create a copy of the itinerary for the target user
    const originalItinerary = itineraries[0];
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Create new itinerary for target user
      const [newItineraryResult] = await connection.query(
        'INSERT INTO Itinerary (user_id, destination_city, destination_state, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
        [
          targetUserId, 
          originalItinerary.destination_city, 
          originalItinerary.destination_state, 
          originalItinerary.start_date, 
          originalItinerary.end_date
        ]
      );
      
      const newItineraryId = newItineraryResult.insertId;
      
      // Get all items from original itinerary
      const [items] = await connection.query(
        'SELECT * FROM ItineraryItem WHERE itinerary_id = ?',
        [id]
      );
      
      // Clone each item to the new itinerary
      for (const item of items) {
        await connection.query(
          'INSERT INTO ItineraryItem (itinerary_id, attraction_id, day_number, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [
            newItineraryId,
            item.attraction_id,
            item.day_number,
            item.start_time,
            item.end_time,
            item.notes
          ]
        );
      }
      
      // Commit transaction
      await connection.commit();
      
      connection.release();
      
      res.json({ message: 'Itinerary shared successfully' });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Share itinerary error:', error);
    res.status(500).json({ message: 'Failed to share itinerary' });
  }
});

// Itinerary Items Routes

// Add an item to an itinerary
router.post('/:id/items', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { attraction_id, day_number = null, start_time = null, end_time = null, notes = null } = req.body;
    const userId = req.user.id;

    
    // Validate input
    if (!attraction_id || !id) {
      return res.status(400).json({ message: 'Attraction ID and Itinerary ID are required' });
    }

    const connection = await req.app.locals.pool.getConnection();

    // Verify itinerary belongs to user
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );

    if (itineraries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Itinerary not found or unauthorized' });
    }

    // Verify attraction exists
    const [attractions] = await connection.query(
      'SELECT * FROM Attraction WHERE attraction_id = ?',
      [attraction_id]
    );

    if (attractions.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Attraction not found' });
    }

    // Insert itinerary item
    const [result] = await connection.query(
      'INSERT INTO ItineraryItem (itinerary_id, attraction_id, day_number, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [id, attraction_id, day_number, start_time, end_time, notes]
    );

    connection.release();

    res.status(201).json({
      id: result.insertId,
      message: 'Itinerary item added successfully'
    });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ message: 'Failed to add itinerary item' });
  }
});


// Update an itinerary item
router.put('/:id/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { day_number, start_time, end_time, notes } = req.body;
    const userId = req.user.id;
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Verify itinerary belongs to user
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (itineraries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Itinerary not found or unauthorized' });
    }
    
    // Update itinerary item
    const [result] = await connection.query(
      'UPDATE ItineraryItem SET day_number = ?, start_time = ?, end_time = ?, notes = ? WHERE item_id = ? AND itinerary_id = ?',
      [day_number, start_time, end_time, notes, itemId, id]
    );
    
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Itinerary item not found' });
    }
    
    res.json({ message: 'Itinerary item updated successfully' });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Failed to update itinerary item' });
  }
});

// Delete an itinerary item using item_id in the body
router.delete('/:id/items', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { item_id } = req.body;
    const userId = req.user.id;

    if (!item_id) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    const connection = await req.app.locals.pool.getConnection();

    // Verify itinerary belongs to user
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );

    if (itineraries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Itinerary not found or unauthorized' });
    }

    // Delete the item
    const [result] = await connection.query(
      'DELETE FROM ItineraryItem WHERE item_id = ? AND itinerary_id = ?',
      [item_id, id]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found or already deleted' });
    }

    res.json({ message: 'Itinerary item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Failed to delete itinerary item' });
  }
});



// Get all attractions for a specific itinerary
router.get('/:id/attractions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const connection = await req.app.locals.pool.getConnection();

    console.log('Fetching attractions for itinerary ID:', id);
    console.log('User ID:', userId);
    

    // Verify itinerary belongs to user
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );

    if (itineraries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Itinerary not found or unauthorized' });
    }

    // Get all attractions for the itinerary
    const [attractions] = await connection.query(
      `SELECT 
      a.name,
         ii.item_id,
         a.description,
         a.rating,
         a.popularity,
         a.address
       FROM ItineraryItem ii
       JOIN Attraction a ON ii.attraction_id = a.attraction_id
       WHERE ii.itinerary_id = ?
       ORDER BY ii.day_number, ii.start_time`,
      [id]
    );
    connection.release();
    res.json(attractions);
  } catch (error) {
    console.error('Get itinerary attractions error:', error);
    res.status(500).json({ message: 'Failed to retrieve itinerary attractions' });
  }
});


// Reorder itinerary items
router.put('/:id/reorder', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { itemId, dayNumber, startTime, endTime }
    const userId = req.user.id;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required' });
    }
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Verify itinerary belongs to user
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (itineraries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Itinerary not found or unauthorized' });
    }
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Update each item
      for (const item of items) {
        await connection.query(
          'UPDATE ItineraryItem SET day_number = ?, start_time = ?, end_time = ? WHERE item_id = ? AND itinerary_id = ?',
          [item.dayNumber, item.startTime, item.endTime, item.itemId, id]
        );
      }
      
      // Commit transaction
      await connection.commit();
      
      connection.release();
      
      res.json({ message: 'Itinerary items reordered successfully' });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Reorder items error:', error);
    res.status(500).json({ message: 'Failed to reorder itinerary items' });
  }
});

// Get recommendations based on user preferences
router.get('/:id/recommendations', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const connection = await req.app.locals.pool.getConnection();
    
    // Verify itinerary belongs to user
    const [itineraries] = await connection.query(
      'SELECT * FROM Itinerary WHERE itinerary_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (itineraries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Itinerary not found or unauthorized' });
    }
    
    const itinerary = itineraries[0];
    
    // Get user preferences
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
    
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'User preferences not found' });
    }
    
    const preferences = users[0];
    
    // Get attractions in the destination city/state, sorted by preference match
    const [attractions] = await connection.query(
      `SELECT a.*, 
        CASE a.main_category 
          WHEN 'Park' THEN ${preferences.park_pref}
          WHEN 'Historical Landmark' THEN ${preferences.historical_landmark_pref}
          WHEN 'Historical Place/Museum' THEN ${preferences.historical_place_museum_pref}
          WHEN 'Museum' THEN ${preferences.museum_pref}
          WHEN 'History Museum' THEN ${preferences.history_museum_pref}
          WHEN 'Tourist Attraction' THEN ${preferences.tourist_attraction_pref}
          WHEN 'Wildlife Park' THEN ${preferences.wildlife_park_pref}
          WHEN 'Art Museum' THEN ${preferences.art_museum_pref}
          WHEN 'Aquarium' THEN ${preferences.aquarium_pref}
          WHEN 'Monument' THEN ${preferences.monument_pref}
          WHEN 'Hiking Area' THEN ${preferences.hiking_area_pref}
          WHEN 'Zoo' THEN ${preferences.zoo_pref}
          WHEN 'Catholic Cathedral' THEN ${preferences.catholic_cathedral_pref}
          WHEN 'Nature Preserve' THEN ${preferences.nature_preserve_pref}
          WHEN 'Amusement Park' THEN ${preferences.amusement_park_pref}
          WHEN 'Garden' THEN ${preferences.garden_pref}
          WHEN 'Theme Park' THEN ${preferences.theme_park_pref}
          WHEN 'Water Park' THEN ${preferences.water_park_pref}
          WHEN 'Scenic Spot' THEN ${preferences.scenic_spot_pref}
          WHEN 'Observatory' THEN ${preferences.observatory_pref}
          WHEN 'Castle' THEN ${preferences.castle_pref}
          WHEN 'Archaeological Museum' THEN ${preferences.archaeological_museum_pref}
          WHEN 'Public Beach' THEN ${preferences.public_beach_pref}
          WHEN 'National Forest' THEN ${preferences.national_forest_pref}
          WHEN 'Catholic Church' THEN ${preferences.catholic_church_pref}
          WHEN 'Heritage Museum' THEN ${preferences.heritage_museum_pref}
          WHEN 'Beach' THEN ${preferences.beach_pref}
          WHEN 'Synagogue' THEN ${preferences.synagogue_pref}
          WHEN 'Ecological Park' THEN ${preferences.ecological_park_pref}
          WHEN 'Wax Museum' THEN ${preferences.wax_museum_pref}
          WHEN 'Hindu Temple' THEN ${preferences.hindu_temple_pref}
          WHEN 'Wildlife Safari Park' THEN ${preferences.wildlife_safari_park_pref}
          WHEN 'Buddhist Temple' THEN ${preferences.buddhist_temple_pref}
          WHEN 'Animal Park' THEN ${preferences.animal_park_pref}
          WHEN 'Wildlife Refuge' THEN ${preferences.wildlife_refuge_pref}
          WHEN 'Heritage Building' THEN ${preferences.heritage_building_pref}
          WHEN 'Vista Point' THEN ${preferences.vista_point_pref}
          WHEN 'National Park' THEN ${preferences.national_park_pref}
          WHEN 'Monastery' THEN ${preferences.monastery_pref}
          WHEN 'Fortress' THEN ${preferences.fortress_pref}
          WHEN 'Beach Pavilion' THEN ${preferences.beach_pavilion_pref}
          ELSE 3
        END AS preference_score
      FROM Attraction a
      WHERE a.city = ? AND a.state = ?
      ORDER BY preference_score DESC, a.rating DESC
      LIMIT 30`,
      [itinerary.destination_city, itinerary.destination_state]
    );
    
    connection.release();
    
    res.json(attractions);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
});

module.exports = router; 