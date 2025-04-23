// Add at the very beginning of the file
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error("Error name:", err.name);
  console.error("Error message:", err.message);
  console.error("Error stack:", err.stack);
  process.exit(1);
});

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Import routes
const userRoutes = require("./routes/userRoutes");
const itineraryRoutes = require("./routes/itineraryRoutes");
const authenticateToken = require("./middleware/auth");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Make pool available to route handlers
app.locals.pool = pool;

// Test database connection
app.get("/api/test", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ message: "Database connection successful" });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Failed to connect to database" });
  }
});

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const connection = await pool.getConnection();
    const [existingUsers] = await connection.query(
      "SELECT * FROM User WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare default preferences (all set to 3 - neutral)
    const defaultPreference = 3;

    // Insert user with default preferences
    await connection.query(
      `INSERT INTO User (
        name, email, password, 
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
      ) VALUES (?, ?, ?, 
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        name,
        email,
        hashedPassword,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
        defaultPreference,
      ]
    );

    connection.release();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Get connection from pool
    const connection = await pool.getConnection();
    console.log("Database connection established");

    // Find user
    const [users] = await connection.query(
      "SELECT * FROM User WHERE email = ?",
      [email]
    );
    console.log(`Found ${users.length} users with this email`);

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/api/auth/refresh-token", authenticateToken, async (req, res) => {
  try {
    // Generate new JWT with extended expiration
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Failed to refresh token" });
  }
});

// Register route handlers
app.use("/api/users", userRoutes);
app.use("/api/itineraries", itineraryRoutes);

// Attractions Routes
app.get("/api/attractions", async (req, res) => {
  try {
    const { city, state, category } = req.query;

    const connection = await pool.getConnection();

    let sql = "SELECT * FROM Attraction WHERE 1=1";
    const params = [];

    if (city) {
      sql += " AND city = ?";
      params.push(city);
    }

    if (state) {
      sql += " AND state = ?";
      params.push(state);
    }

    if (category) {
      sql += " AND main_category = ?";
      params.push(category);
    }

    sql += " ORDER BY popularity DESC";

    const [attractions] = await connection.query(sql, params);
    connection.release();

    res.json(attractions);
  } catch (error) {
    console.error("Get attractions error:", error);
    res.status(500).json({ message: "Failed to retrieve attractions" });
  }
});

app.get("/api/attractions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [attractions] = await connection.query(
      "SELECT * FROM Attraction WHERE attraction_id = ?",
      [id]
    );

    connection.release();

    if (attractions.length === 0) {
      return res.status(404).json({ message: "Attraction not found" });
    }

    res.json(attractions[0]);
  } catch (error) {
    console.error("Get attraction error:", error);
    res.status(500).json({ message: "Failed to retrieve attraction" });
  }
});

app.get("/api/attractions/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const connection = await pool.getConnection();
    const [attractions] = await connection.query(
      "SELECT * FROM Attraction WHERE name LIKE ? OR description LIKE ? ORDER BY rating DESC",
      [`%${q}%`, `%${q}%`]
    );

    connection.release();

    res.json(attractions);
  } catch (error) {
    console.error("Search attractions error:", error);
    res.status(500).json({ message: "Failed to search attractions" });
  }
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on("error", (err) => {
  console.error("Server failed to start:");
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Please use a different port.`
    );
  } else {
    console.error("Error details:", err);
  }
  process.exit(1);
});
