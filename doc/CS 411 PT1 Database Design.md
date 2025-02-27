**Entities**  
**User:** This entity represents users of the application who create and manage travel itineraries. This must be an entity because it doesn’t make sense to make it an attribute on another entity, because it is important to distinguish users.

- Assumption: Each user has personal preferences (food, nature, culture, activity) stored as numeric values on a scale to indicate preference strength. 

**Itinerary:** This entity represents a travel plan for a specific destination and time period. This must be an entity because a single user can have multiple itineraries.

- Assumption: Each itinerary is for a specific destination with a specific start and end date

**ItineraryItem:** This represents a specific attraction scheduled in an itinerary. This must be its own entity because an Itinerary will have multiple ItineraryItems

- Assumption: Users need to specify not just what attractions to visit but also when to visit them. An itinerary will consist of multiple attractions

**Attraction:** This entity represents tourist attractions that can be included in itineraries. This is mapped to an ItineraryItem because you can have the same attraction multiple times in one Itinerary at different times.

- Assumption: Attractions should have properties like price, ratings, and categories that help match them to user preferences.

**Route:** This entity represents travel paths between itinerary items. This must be its own entity because it connects two or more different ItineraryItems

- Assumption: A user may have multiple routes to get between two ItineraryItems depending on mode of travel, traffic, etc.

**Relationships**  
**User \- Itinerary (Plans)**: A user can make many itineraries, but an itinerary will always belong to one user

- Cardinality: One-to-many

**Itinerary \- ItineraryItem (Consists of):** An Itinerary will consist of many ItineraryItems with their own start and end times.

- Cardinality: One-to-many

**ItineraryItem \- Attraction (Describes):** An ItineraryItem describes a single attraction. However, one attraction may be on an Itinerary multiple times.

- Cardinality: Many-to-one

**ItineraryItem \- Route (Takes):** Two ItineraryItems must be connected through a Route. There also may be multiple routes between ItineraryItems

- Cardinality: One-to-many

**Normalization to BCNF**  
**User Table FDs:**

- user\_id → name, email, password, food\_pref, nature\_pref, culture\_pref, activity\_pref

Since user\_id is the only determinant and it is the primary key, this table is in BCNF  
**Itinerary Table FDs:**

- itinerary\_id → user\_id, destination, start\_date, end\_date, start\_time, end\_time

Since itinerary\_id is the only determinant and it is the primary key, this table is in BCNF  
**ItineraryItem Table FDs:**

- item\_id → itinerary\_id, attraction\_id, day\_number, start\_time, end\_time, notes

Since item\_id is the only determinant and it is the primary key, this table is in BCNF  
**Attraction Table FDs:**

- attraction\_id → name, description, location, rating, popularity, price\_level, category

Since attraction\_id is the only determinant and it is the primary key, this table is in BCNF  
**Route Table FDs:**

- route\_id → from\_item\_id, to\_item\_id, distance, travel\_time, transport\_mode, price\_level  
- (from\_item\_id, to\_item\_id, transport\_mode) → distance, travel\_time, price\_level

route\_id is the primary key  
(from\_item\_id, to\_item\_id, transport\_mode) We will assume that the same transport mode between two same items will be the exact same, which makes this a candidate key. Therefore this table is in BCNF.

**Relational Schema**  
User(  
user\_id:INT \[PK\],  
name:VARCHAR,  
email:VARCHAR,  
password:VARCHAR,  
food\_pref:INT,  
nature\_pref:INT,  
culture\_pref:INT,  
activity\_pref:INT  
)

Itinerary(  
itinerary\_id:INT \[PK\],  
user\_id:INT \[FK to User.user\_id\],  
destination:VARCHAR,  
start\_date:DATE,  
end\_date:DATE,  
start\_time:DATETIME,  
end\_time:DATETIME  
)

ItineraryItem(  
item\_id:INT \[PK\],  
itinerary\_id:INT \[FK to Itinerary.itinerary\_id\],  
attraction\_id:INT \[FK to Attraction.attraction\_id\],  
day\_number:INT,  
start\_time:DATETIME,  
end\_time:DATETIME,  
notes:TEXT  
)

Attraction(  
attraction\_id:INT \[PK\],  
name:VARCHAR,  
description:TEXT,  
location:LOCATION,  
rating:DECIMAL,  
popularity:INT,  
price\_level:INT,  
category:ENUM  
)

Route(  
route\_id:INT \[PK\],  
from\_item\_id:INT \[FK to ItineraryItem.item\_id\],  
to\_item\_id:INT \[FK to ItineraryItem.item\_id\],  
distance:DECIMAL,  
travel\_time:INT,  
transport\_mode:VARCHAR,  
price\_level:INT  
)