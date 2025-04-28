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

-- Create a stored procedure for getting attraction recommendations based on user preferences
DELIMITER //
CREATE PROCEDURE GetRecommendationsForItinerary(
    IN p_itinerary_id INT,
    IN p_user_id INT,
    IN p_limit INT
)
BEGIN
    DECLARE v_city VARCHAR(100);
    DECLARE v_state VARCHAR(100);
    
    -- Get the itinerary city and state
    SELECT destination_city, destination_state 
    INTO v_city, v_state
    FROM Itinerary
    WHERE itinerary_id = p_itinerary_id AND user_id = p_user_id;
    
    -- If no itinerary found or not owned by user, return empty result
    IF v_city IS NULL THEN
        SELECT NULL;
        LEAVE GetRecommendationsForItinerary;
    END IF;
    
    -- Get attractions in the destination city/state with preference scores
    SELECT 
        a.*,
        -- Calculate a preference score based on user preferences and attraction category
        CASE 
            WHEN a.main_category = 'Park' THEN u.park_pref
            WHEN a.main_category = 'Historical Landmark' THEN u.historical_landmark_pref
            WHEN a.main_category = 'Historical Place Museum' THEN u.historical_place_museum_pref
            WHEN a.main_category = 'Museum' THEN u.museum_pref
            WHEN a.main_category = 'History Museum' THEN u.history_museum_pref
            WHEN a.main_category = 'Tourist Attraction' THEN u.tourist_attraction_pref
            WHEN a.main_category = 'Wildlife Park' THEN u.wildlife_park_pref
            WHEN a.main_category = 'Art Museum' THEN u.art_museum_pref
            WHEN a.main_category = 'Aquarium' THEN u.aquarium_pref
            WHEN a.main_category = 'Monument' THEN u.monument_pref
            WHEN a.main_category = 'Hiking Area' THEN u.hiking_area_pref
            WHEN a.main_category = 'Zoo' THEN u.zoo_pref
            WHEN a.main_category = 'Catholic Cathedral' THEN u.catholic_cathedral_pref
            WHEN a.main_category = 'Nature Preserve' THEN u.nature_preserve_pref
            WHEN a.main_category = 'Amusement Park' THEN u.amusement_park_pref
            WHEN a.main_category = 'Garden' THEN u.garden_pref
            WHEN a.main_category = 'Theme Park' THEN u.theme_park_pref
            WHEN a.main_category = 'Water Park' THEN u.water_park_pref
            WHEN a.main_category = 'Scenic Spot' THEN u.scenic_spot_pref
            WHEN a.main_category = 'Observatory' THEN u.observatory_pref
            WHEN a.main_category = 'Castle' THEN u.castle_pref
            WHEN a.main_category = 'Archaeological Museum' THEN u.archaeological_museum_pref
            WHEN a.main_category = 'Public Beach' THEN u.public_beach_pref
            WHEN a.main_category = 'National Forest' THEN u.national_forest_pref
            WHEN a.main_category = 'Catholic Church' THEN u.catholic_church_pref
            WHEN a.main_category = 'Heritage Museum' THEN u.heritage_museum_pref
            WHEN a.main_category = 'Beach' THEN u.beach_pref
            WHEN a.main_category = 'Synagogue' THEN u.synagogue_pref
            WHEN a.main_category = 'Ecological Park' THEN u.ecological_park_pref
            WHEN a.main_category = 'Wax Museum' THEN u.wax_museum_pref
            WHEN a.main_category = 'Hindu Temple' THEN u.hindu_temple_pref
            WHEN a.main_category = 'Wildlife Safari Park' THEN u.wildlife_safari_park_pref
            WHEN a.main_category = 'Buddhist Temple' THEN u.buddhist_temple_pref
            WHEN a.main_category = 'Animal Park' THEN u.animal_park_pref
            WHEN a.main_category = 'Wildlife Refuge' THEN u.wildlife_refuge_pref
            WHEN a.main_category = 'Heritage Building' THEN u.heritage_building_pref
            WHEN a.main_category = 'Vista Point' THEN u.vista_point_pref
            WHEN a.main_category = 'National Park' THEN u.national_park_pref
            WHEN a.main_category = 'Monastery' THEN u.monastery_pref
            WHEN a.main_category = 'Fortress' THEN u.fortress_pref
            WHEN a.main_category = 'Beach Pavilion' THEN u.beach_pavilion_pref
            ELSE 3 -- Default preference if no match
        END AS preference_score
    FROM 
        Attraction a
        JOIN User u ON u.user_id = p_user_id
        LEFT JOIN (
            SELECT attraction_id 
            FROM ItineraryItem 
            WHERE itinerary_id = p_itinerary_id
        ) AS added ON a.attraction_id = added.attraction_id
    WHERE 
        a.city = v_city 
        AND a.state = v_state
        AND added.attraction_id IS NULL -- Exclude attractions already in itinerary
    ORDER BY 
        preference_score DESC, -- Sort by preference first
        a.rating DESC          -- Then by rating
    LIMIT p_limit;
END //
DELIMITER ;

-- Create a trigger that updates user preferences when they add an attraction to their itinerary
DELIMITER //
CREATE TRIGGER after_itinerary_item_insert
AFTER INSERT ON ItineraryItem
FOR EACH ROW
BEGIN
    DECLARE v_category VARCHAR(100);
    DECLARE v_user_id INT;
    
    -- Get the category of the attraction and user_id
    SELECT a.main_category, i.user_id INTO v_category, v_user_id
    FROM Attraction a
    JOIN Itinerary i ON i.itinerary_id = NEW.itinerary_id
    WHERE a.attraction_id = NEW.attraction_id;
    
    -- Only proceed if we found a valid category and user
    IF v_category IS NOT NULL AND v_user_id IS NOT NULL THEN
        -- Update the appropriate preference based on category
        -- We have to use a CASE statement instead of dynamic SQL
        CASE LOWER(REPLACE(REPLACE(v_category, ' ', '_'), '-', '_'))
            WHEN 'park' THEN 
                UPDATE User SET park_pref = LEAST(IFNULL(park_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'historical_landmark' THEN 
                UPDATE User SET historical_landmark_pref = LEAST(IFNULL(historical_landmark_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'historical_place_museum' THEN 
                UPDATE User SET historical_place_museum_pref = LEAST(IFNULL(historical_place_museum_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'museum' THEN 
                UPDATE User SET museum_pref = LEAST(IFNULL(museum_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'history_museum' THEN 
                UPDATE User SET history_museum_pref = LEAST(IFNULL(history_museum_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'tourist_attraction' THEN 
                UPDATE User SET tourist_attraction_pref = LEAST(IFNULL(tourist_attraction_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'wildlife_park' THEN 
                UPDATE User SET wildlife_park_pref = LEAST(IFNULL(wildlife_park_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'art_museum' THEN 
                UPDATE User SET art_museum_pref = LEAST(IFNULL(art_museum_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'aquarium' THEN 
                UPDATE User SET aquarium_pref = LEAST(IFNULL(aquarium_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'monument' THEN 
                UPDATE User SET monument_pref = LEAST(IFNULL(monument_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'hiking_area' THEN 
                UPDATE User SET hiking_area_pref = LEAST(IFNULL(hiking_area_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'zoo' THEN 
                UPDATE User SET zoo_pref = LEAST(IFNULL(zoo_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'catholic_cathedral' THEN 
                UPDATE User SET catholic_cathedral_pref = LEAST(IFNULL(catholic_cathedral_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'nature_preserve' THEN 
                UPDATE User SET nature_preserve_pref = LEAST(IFNULL(nature_preserve_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'amusement_park' THEN 
                UPDATE User SET amusement_park_pref = LEAST(IFNULL(amusement_park_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'garden' THEN 
                UPDATE User SET garden_pref = LEAST(IFNULL(garden_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'theme_park' THEN 
                UPDATE User SET theme_park_pref = LEAST(IFNULL(theme_park_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'water_park' THEN 
                UPDATE User SET water_park_pref = LEAST(IFNULL(water_park_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'scenic_spot' THEN 
                UPDATE User SET scenic_spot_pref = LEAST(IFNULL(scenic_spot_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'observatory' THEN 
                UPDATE User SET observatory_pref = LEAST(IFNULL(observatory_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'castle' THEN 
                UPDATE User SET castle_pref = LEAST(IFNULL(castle_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'archaeological_museum' THEN 
                UPDATE User SET archaeological_museum_pref = LEAST(IFNULL(archaeological_museum_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'public_beach' THEN 
                UPDATE User SET public_beach_pref = LEAST(IFNULL(public_beach_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'national_forest' THEN 
                UPDATE User SET national_forest_pref = LEAST(IFNULL(national_forest_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'catholic_church' THEN 
                UPDATE User SET catholic_church_pref = LEAST(IFNULL(catholic_church_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'heritage_museum' THEN 
                UPDATE User SET heritage_museum_pref = LEAST(IFNULL(heritage_museum_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'beach' THEN 
                UPDATE User SET beach_pref = LEAST(IFNULL(beach_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'synagogue' THEN 
                UPDATE User SET synagogue_pref = LEAST(IFNULL(synagogue_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'ecological_park' THEN 
                UPDATE User SET ecological_park_pref = LEAST(IFNULL(ecological_park_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'wax_museum' THEN 
                UPDATE User SET wax_museum_pref = LEAST(IFNULL(wax_museum_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'hindu_temple' THEN 
                UPDATE User SET hindu_temple_pref = LEAST(IFNULL(hindu_temple_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'wildlife_safari_park' THEN 
                UPDATE User SET wildlife_safari_park_pref = LEAST(IFNULL(wildlife_safari_park_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'buddhist_temple' THEN 
                UPDATE User SET buddhist_temple_pref = LEAST(IFNULL(buddhist_temple_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'animal_park' THEN 
                UPDATE User SET animal_park_pref = LEAST(IFNULL(animal_park_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'wildlife_refuge' THEN 
                UPDATE User SET wildlife_refuge_pref = LEAST(IFNULL(wildlife_refuge_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'heritage_building' THEN 
                UPDATE User SET heritage_building_pref = LEAST(IFNULL(heritage_building_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'vista_point' THEN 
                UPDATE User SET vista_point_pref = LEAST(IFNULL(vista_point_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'national_park' THEN 
                UPDATE User SET national_park_pref = LEAST(IFNULL(national_park_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'monastery' THEN 
                UPDATE User SET monastery_pref = LEAST(IFNULL(monastery_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'fortress' THEN 
                UPDATE User SET fortress_pref = LEAST(IFNULL(fortress_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            WHEN 'beach_pavilion' THEN 
                UPDATE User SET beach_pavilion_pref = LEAST(IFNULL(beach_pavilion_pref, 0) + 1, 100) 
                WHERE user_id = v_user_id;
            ELSE 
                -- No matching preference found, do nothing
                BEGIN
                END;
        END CASE;
    END IF;
END //
DELIMITER ;