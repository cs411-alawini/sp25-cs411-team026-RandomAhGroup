import React, { useState, useEffect } from "react";
import {
  Box,
  Input,
  Button,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  useToast,
  Select,
  Divider,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { itineraryService } from "../services/api";

function ItineraryViewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const itinerary = state?.itinerary;

  const [city, setCity] = useState(itinerary?.destination_city || "");
  const [stateCode, setStateCode] = useState(itinerary?.destination_state || "");
  const [orderBy, setOrderBy] = useState("popularity");
  const [attractions, setAttractions] = useState([]);
  const [itineraryItems, setItineraryItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItineraryItems = async () => {
    try {
      const { data } = await itineraryService.getItineraryItems(itinerary.id);
      setItineraryItems(data);
    } catch (err) {
        console.error(err);
      toast({
        title: "Failed to load itinerary items",
        description: err.response?.data?.message || "Could not fetch itinerary items",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data } = await itineraryService.searchAttractions(city, stateCode, orderBy);
      setAttractions(data);
    } catch (err) {
      toast({
        title: "Search failed",
        description: err.response?.data?.message || "Could not fetch attractions",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const addItineraryItem = async (attraction) => {
    const itemData = {
      attractionId: attraction.attraction_id,
    };

    try {
      await itineraryService.addItineraryItem(itinerary.id, itemData);
      toast({
        title: "Added!",
        description: `${attraction.name} was added to your itinerary.`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      fetchItineraryItems();
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Could not add attraction",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deleteItineraryItem = async (itemId) => {
    try {
      await itineraryService.deleteItineraryItem(itinerary.id, itemId);
      toast({
        title: "Deleted",
        description: "Item removed from your itinerary.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      fetchItineraryItems();
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Could not delete item",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  

  useEffect(() => {
    if (!itinerary) {
      navigate("/my-itineraries");
    } else {
      fetchItineraryItems();
    }
  }, [itinerary, navigate]);

  return (
    <Box p={6}>
      <Heading mb={4}>Plan Trip to {city}, {stateCode}</Heading>

      <VStack spacing={4} align="stretch" mb={6}>
        <Select value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
          <option value="popularity">Sort by Popularity</option>
          <option value="rating">Sort by Rating</option>
        </Select>

        <Button onClick={handleSearch} colorScheme="blue" isLoading={loading}>
          Search Attractions
        </Button>
      </VStack>

      <Divider mb={6} />

      <Heading size="md" mb={4}>Your Itinerary</Heading>
      {itineraryItems.length > 0 ? (
        <SimpleGrid columns={[1, 2, 3]} spacing={4} mb={8}>
          {itineraryItems.map((item) => (
            <Card key={item.item_id}>
              <CardBody>
              <Heading size="sm">{item.name}</Heading>
                <Text fontSize="sm" mt={2}>{item.description || "No description available."}</Text>
                <Text fontSize="sm"><strong>Rating:</strong> {item.rating ?? "N/A"}</Text>
                <Text fontSize="sm"><strong>Popularity:</strong> {item.popularity ?? "N/A"}</Text>
                <Text fontSize="sm"><strong>Address:</strong> {item.address || "Not available"}</Text>
                
                <Button
                  mt={4}
                  size="sm"
                  colorScheme="red"
                  onClick={() => deleteItineraryItem(item.item_id)}
                >
                  Remove
                </Button>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Text color="gray.500">You haven’t added anything yet.</Text>
      )}

      <Heading size="md" mb={4}>Attraction Search Results</Heading>
      {attractions.length > 0 ? (
        <SimpleGrid columns={[1, 2, 3]} spacing={4}>
          {attractions.map((attr) => (
            <Card key={attr.attraction_id}>
              <CardBody>
                <Heading size="sm">{attr.name}</Heading>
                <Text fontSize="sm" mt={2}>{attr.description || "No description available."}</Text>
                <Text fontSize="sm"><strong>Rating:</strong> {attr.rating ?? "N/A"}</Text>
                <Text fontSize="sm"><strong>Popularity:</strong> {attr.popularity ?? "N/A"}</Text>
                <Text fontSize="sm"><strong>Address:</strong> {attr.address || "Not available"}</Text>
                <Button
                  mt={4}
                  size="sm"
                  colorScheme="teal"
                  onClick={() => addItineraryItem(attr)}
                >
                  Add to Itinerary
                </Button>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Text textAlign="center" color="gray.500">
          Click Search to find attractions in {city}, {stateCode}.
        </Text>
      )}
    </Box>
  );
}

export default ItineraryViewPage;
