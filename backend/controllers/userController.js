const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, ...preferences } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user with default preferences (all set to 0)
    const user = await User.create({
      name,
      email,
      password,
      ...preferences, // This will include any preference fields sent in the request
    });

    res.status(201).json({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      token: generateToken(user.user_id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ where: { email } });

    if (user && (await user.matchPassword(password))) {
      res.json({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        token: generateToken(user.user_id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);

    if (user) {
      res.json({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        preferences: {
          park_pref: user.park_pref,
          historical_landmark_pref: user.historical_landmark_pref,
          historical_place_museum_pref: user.historical_place_museum_pref,
          museum_pref: user.museum_pref,
          history_museum_pref: user.history_museum_pref,
          tourist_attraction_pref: user.tourist_attraction_pref,
          wildlife_park_pref: user.wildlife_park_pref,
          art_museum_pref: user.art_museum_pref,
          aquarium_pref: user.aquarium_pref,
          monument_pref: user.monument_pref,
          hiking_area_pref: user.hiking_area_pref,
          zoo_pref: user.zoo_pref,
          catholic_cathedral_pref: user.catholic_cathedral_pref,
          nature_preserve_pref: user.nature_preserve_pref,
          amusement_park_pref: user.amusement_park_pref,
          garden_pref: user.garden_pref,
          theme_park_pref: user.theme_park_pref,
          water_park_pref: user.water_park_pref,
          scenic_spot_pref: user.scenic_spot_pref,
          observatory_pref: user.observatory_pref,
          castle_pref: user.castle_pref,
          archaeological_museum_pref: user.archaeological_museum_pref,
          public_beach_pref: user.public_beach_pref,
          national_forest_pref: user.national_forest_pref,
          catholic_church_pref: user.catholic_church_pref,
          heritage_museum_pref: user.heritage_museum_pref,
          beach_pref: user.beach_pref,
          synagogue_pref: user.synagogue_pref,
          ecological_park_pref: user.ecological_park_pref,
          wax_museum_pref: user.wax_museum_pref,
          hindu_temple_pref: user.hindu_temple_pref,
          wildlife_safari_park_pref: user.wildlife_safari_park_pref,
          buddhist_temple_pref: user.buddhist_temple_pref,
          animal_park_pref: user.animal_park_pref,
          wildlife_refuge_pref: user.wildlife_refuge_pref,
          heritage_building_pref: user.heritage_building_pref,
          vista_point_pref: user.vista_point_pref,
          national_park_pref: user.national_park_pref,
          monastery_pref: user.monastery_pref,
          fortress_pref: user.fortress_pref,
          beach_pavilion_pref: user.beach_pavilion_pref,
        },
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out only valid preference fields
    const preferenceFields = Object.keys(req.body).filter((key) =>
      key.endsWith("_pref")
    );
    const validPreferences = {};

    preferenceFields.forEach((field) => {
      if (user[field] !== undefined) {
        validPreferences[field] = req.body[field];
      }
    });

    // Update user preferences
    await user.update(validPreferences);

    res.json({ message: "Preferences updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updatePreferences,
};
