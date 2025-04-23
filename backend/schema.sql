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

-- Create ItineraryShare table to track sharing history
CREATE TABLE ItineraryShare (
    share_id INT PRIMARY KEY AUTO_INCREMENT,
    source_itinerary_id INT,
    target_itinerary_id INT,
    source_user_id INT,
    target_user_id INT,
    share_date DATETIME NOT NULL,
    custom_message TEXT,
    FOREIGN KEY (source_itinerary_id) REFERENCES Itinerary(itinerary_id) ON DELETE SET NULL,
    FOREIGN KEY (target_itinerary_id) REFERENCES Itinerary(itinerary_id) ON DELETE SET NULL,
    FOREIGN KEY (source_user_id) REFERENCES User(user_id) ON DELETE SET NULL,
    FOREIGN KEY (target_user_id) REFERENCES User(user_id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX idx_user_id ON Itinerary(user_id);
CREATE INDEX idx_itinerary_id ON ItineraryItem(itinerary_id);
CREATE INDEX idx_attraction_id ON ItineraryItem(attraction_id);
CREATE INDEX idx_attraction_city ON Attraction(city);
CREATE INDEX idx_attraction_state ON Attraction(state);
CREATE INDEX idx_attraction_category ON Attraction(main_category);

-- Add indexes for ItineraryShare table
CREATE INDEX idx_source_itinerary ON ItineraryShare(source_itinerary_id);
CREATE INDEX idx_target_itinerary ON ItineraryShare(target_itinerary_id);
CREATE INDEX idx_share_date ON ItineraryShare(share_date);

-- Create a stored procedure for itinerary analytics 
DELIMITER //
CREATE PROCEDURE GetItineraryAnalytics(IN p_itinerary_id INT)
BEGIN
    -- Declare variables for storing results
    DECLARE total_days INT;
    DECLARE avg_rating FLOAT;
    
    -- Get basic itinerary info
    SELECT DATEDIFF(end_date, start_date) + 1 INTO total_days
    FROM Itinerary
    WHERE itinerary_id = p_itinerary_id;
    
    -- First advanced query: Get attraction statistics using JOIN and GROUP BY
    SELECT 
        i.destination_city,
        i.destination_state,
        COUNT(ii.item_id) AS total_attractions,
        AVG(a.rating) AS avg_attraction_rating,
        MAX(a.rating) AS highest_rated_attraction,
        MIN(a.rating) AS lowest_rated_attraction,
        COUNT(DISTINCT a.main_category) AS unique_categories,
        -- Calculate daily average
        COUNT(ii.item_id) / total_days AS avg_attractions_per_day
    FROM Itinerary i
    LEFT JOIN ItineraryItem ii ON i.itinerary_id = ii.itinerary_id
    LEFT JOIN Attraction a ON ii.attraction_id = a.attraction_id
    WHERE i.itinerary_id = p_itinerary_id
    GROUP BY i.itinerary_id, i.destination_city, i.destination_state;
    
    -- Second advanced query: Get attractions by day using JOIN, GROUP BY and subqueries
    SELECT 
        ii.day_number,
        COUNT(*) AS attractions_count,
        GROUP_CONCAT(a.name ORDER BY ii.start_time SEPARATOR ', ') AS attractions,
        (
            -- Subquery to get most common type per day
            SELECT a_inner.main_category
            FROM ItineraryItem ii_inner
            JOIN Attraction a_inner ON ii_inner.attraction_id = a_inner.attraction_id
            WHERE ii_inner.itinerary_id = p_itinerary_id AND ii_inner.day_number = ii.day_number
            GROUP BY a_inner.main_category
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) AS most_common_category,
        AVG(a.rating) AS avg_rating_per_day
    FROM ItineraryItem ii
    JOIN Attraction a ON ii.attraction_id = a.attraction_id
    WHERE ii.itinerary_id = p_itinerary_id
    GROUP BY ii.day_number
    ORDER BY ii.day_number;
    
    -- Third query: Get recommended changes to itinerary
    SELECT 
        a.main_category,
        COUNT(*) AS category_count,
        CASE 
            WHEN COUNT(*) > (total_days * 2) THEN 'Too many attractions of this type'
            WHEN COUNT(*) = 0 THEN 'Consider adding this type of attraction'
            ELSE 'Good balance'
        END AS recommendation
    FROM (
        -- Subquery to get all possible relevant categories
        SELECT DISTINCT main_category 
        FROM Attraction 
        WHERE city = (SELECT destination_city FROM Itinerary WHERE itinerary_id = p_itinerary_id)
        AND state = (SELECT destination_state FROM Itinerary WHERE itinerary_id = p_itinerary_id)
        ORDER BY main_category
    ) AS all_categories
    LEFT JOIN (
        SELECT a.main_category
        FROM ItineraryItem ii
        JOIN Attraction a ON ii.attraction_id = a.attraction_id
        WHERE ii.itinerary_id = p_itinerary_id
    ) AS used_categories ON all_categories.main_category = used_categories.main_category
    GROUP BY all_categories.main_category
    ORDER BY category_count DESC;
END //
DELIMITER ;

-- Create a stored procedure for sharing an itinerary with another user
DELIMITER //
CREATE PROCEDURE ShareItinerary(
    IN p_itinerary_id INT,
    IN p_source_user_id INT,
    IN p_target_email VARCHAR(255),
    OUT p_new_itinerary_id INT,
    OUT p_target_user_name VARCHAR(255),
    OUT p_items_copied INT,
    OUT p_categories_count INT
)
BEGIN
    -- Declare variables
    DECLARE v_target_user_id INT;
    DECLARE v_source_itinerary_exists BOOLEAN DEFAULT FALSE;
    DECLARE v_owner_name VARCHAR(255);
    DECLARE v_destination_city VARCHAR(100);
    DECLARE v_destination_state VARCHAR(100);
    DECLARE v_start_date DATE;
    DECLARE v_end_date DATE;
    DECLARE v_table_exists BOOLEAN DEFAULT FALSE;
    
    -- Declare handler for SQL exceptions
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback transaction on error
        ROLLBACK;
        RESIGNAL; -- Re-throw the error
    END;
    
    -- Start transaction
    START TRANSACTION;
    
    -- ADVANCED QUERY 1: Verify itinerary belongs to source user with JOIN
    SELECT 
        COUNT(*) > 0,
        i.destination_city,
        i.destination_state,
        i.start_date,
        i.end_date,
        u.name
    INTO 
        v_source_itinerary_exists,
        v_destination_city,
        v_destination_state,
        v_start_date,
        v_end_date,
        v_owner_name
    FROM Itinerary i
    JOIN User u ON i.user_id = u.user_id
    WHERE i.itinerary_id = p_itinerary_id 
    AND i.user_id = p_source_user_id;
    
    -- Check if itinerary exists and belongs to source user
    IF NOT v_source_itinerary_exists THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Itinerary not found or unauthorized';
    END IF;
    
    -- Find target user by email
    SELECT user_id, name INTO v_target_user_id, p_target_user_name
    FROM User
    WHERE email = p_target_email;
    
    -- Check if target user exists
    IF v_target_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Target user not found';
    END IF;
    
    -- Create new itinerary for target user
    INSERT INTO Itinerary (
        user_id, 
        destination_city, 
        destination_state, 
        start_date, 
        end_date
    ) VALUES (
        v_target_user_id,
        v_destination_city,
        v_destination_state,
        v_start_date,
        v_end_date
    );
    
    -- Get the new itinerary ID
    SET p_new_itinerary_id = LAST_INSERT_ID();
    
    -- ADVANCED QUERY 2: Use INSERT with SELECT to copy all itinerary items at once
    INSERT INTO ItineraryItem (
        itinerary_id,
        attraction_id,
        day_number,
        start_time,
        end_time,
        notes
    )
    SELECT 
        p_new_itinerary_id,
        attraction_id,
        day_number,
        start_time,
        end_time,
        notes
    FROM ItineraryItem
    WHERE itinerary_id = p_itinerary_id;
    
    -- ADVANCED QUERY 3: Get statistics about what was shared using GROUP BY and JOINs
    SELECT 
        COUNT(*) INTO p_items_copied
    FROM ItineraryItem 
    WHERE itinerary_id = p_new_itinerary_id;
    
    -- Get category count using aggregation and JOINs
    SELECT 
        COUNT(DISTINCT a.main_category) INTO p_categories_count
    FROM ItineraryItem ii
    JOIN Attraction a ON ii.attraction_id = a.attraction_id
    WHERE ii.itinerary_id = p_new_itinerary_id;
    
    -- Check if ItineraryShare table exists
    SELECT COUNT(*) > 0 INTO v_table_exists
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = 'ItineraryShare';
    
    -- Record the share if table exists
    IF v_table_exists THEN
        INSERT INTO ItineraryShare (
            source_itinerary_id,
            target_itinerary_id,
            source_user_id,
            target_user_id,
            share_date,
            custom_message
        ) VALUES (
            p_itinerary_id,
            p_new_itinerary_id,
            p_source_user_id,
            v_target_user_id,
            NOW(),
            CONCAT('Shared from ', v_owner_name)
        );
    END IF;
    
    -- Commit the transaction
    COMMIT;
END //
DELIMITER ; 