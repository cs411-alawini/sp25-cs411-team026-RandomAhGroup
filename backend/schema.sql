-- Drop tables if they exist (Be careful with this in production!)
DROP TABLE IF EXISTS Route;
DROP TABLE IF EXISTS ItineraryItem;
DROP TABLE IF EXISTS Attraction;
DROP TABLE IF EXISTS Itinerary;
DROP TABLE IF EXISTS User;

-- Create User table
CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    park_pref INT,
    historical_landmark_pref INT,
    historical_place_museum_pref INT,
    museum_pref INT,
    history_museum_pref INT,
    tourist_attraction_pref INT,
    wildlife_park_pref INT,
    art_museum_pref INT,
    aquarium_pref INT,
    monument_pref INT,
    hiking_area_pref INT,
    zoo_pref INT,
    catholic_cathedral_pref INT,
    nature_preserve_pref INT,
    amusement_park_pref INT,
    garden_pref INT,
    theme_park_pref INT,
    water_park_pref INT,
    scenic_spot_pref INT,
    observatory_pref INT,
    castle_pref INT,
    archaeological_museum_pref INT,
    public_beach_pref INT,
    national_forest_pref INT,
    catholic_church_pref INT,
    heritage_museum_pref INT,
    beach_pref INT,
    synagogue_pref INT,
    ecological_park_pref INT,
    wax_museum_pref INT,
    hindu_temple_pref INT,
    wildlife_safari_park_pref INT,
    buddhist_temple_pref INT,
    animal_park_pref INT,
    wildlife_refuge_pref INT,
    heritage_building_pref INT,
    vista_point_pref INT,
    national_park_pref INT,
    monastery_pref INT,
    fortress_pref INT,
    beach_pavilion_pref INT
);

-- Create Itinerary table
CREATE TABLE Itinerary (
    itinerary_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    destination_city VARCHAR(100),
    destination_state VARCHAR(100),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

-- Create Attraction table
CREATE TABLE Attraction (
    attraction_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    main_category VARCHAR(100),
    rating FLOAT CHECK (rating >= 0 AND rating <= 5),
    popularity INT,
    description TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100)
);

-- Create ItineraryItem table
CREATE TABLE ItineraryItem (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    itinerary_id INT,
    attraction_id INT,
    day_number INT,
    start_time DATETIME,
    end_time DATETIME,
    notes TEXT,
    FOREIGN KEY (itinerary_id) REFERENCES Itinerary(itinerary_id) ON DELETE CASCADE,
    FOREIGN KEY (attraction_id) REFERENCES Attraction(attraction_id)
);

-- Create Route table
CREATE TABLE Route (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    from_item_id INT,
    to_item_id INT,
    distance DECIMAL(10,2),
    travel_time INT, -- in minutes
    transport_mode VARCHAR(100),
    price_level INT,
    FOREIGN KEY (from_item_id) REFERENCES ItineraryItem(item_id) ON DELETE CASCADE,
    FOREIGN KEY (to_item_id) REFERENCES ItineraryItem(item_id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX idx_user_id ON Itinerary(user_id);
CREATE INDEX idx_itinerary_id ON ItineraryItem(itinerary_id);
CREATE INDEX idx_attraction_id ON ItineraryItem(attraction_id);
CREATE INDEX idx_attraction_city ON Attraction(city);
CREATE INDEX idx_attraction_state ON Attraction(state);
CREATE INDEX idx_attraction_category ON Attraction(main_category); 