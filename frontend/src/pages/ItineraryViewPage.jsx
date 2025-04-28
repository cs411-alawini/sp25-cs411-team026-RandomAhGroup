import React, { useState, useEffect, useRef } from "react";
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
  Badge,
  Flex,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormHelperText,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { itineraryService } from "../services/api";
import { FiShare2 } from "react-icons/fi";

function ItineraryViewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const itinerary = state?.itinerary;

  const [city, setCity] = useState(itinerary?.destination_city || "");
  const [stateCode, setStateCode] = useState(
    itinerary?.destination_state || ""
  );
  const [orderBy, setOrderBy] = useState("popularity");
  const [attractions, setAttractions] = useState([]);
  const [itineraryItems, setItineraryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const {
    isOpen: isShareOpen,
    onOpen: onShareOpen,
    onClose: onShareClose,
  } = useDisclosure();

  const fetchItineraryItems = async () => {
    try {
      const { data } = await itineraryService.getItineraryItems(itinerary.id);
      setItineraryItems(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load itinerary items",
        description:
          err.response?.data?.message || "Could not fetch itinerary items",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (orderBy === "recommended") {
        // Use recommendation endpoint
        const { data } = await itineraryService.getRecommendations(itinerary.id);
        setAttractions(data);
      } else {
        // Use regular search
        const { data } = await itineraryService.searchAttractions(city, stateCode, orderBy);
        setAttractions(data);
      }
    } catch (err) {
      toast({
        title: "Search failed",
        description:
          err.response?.data?.message || "Could not fetch attractions",
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

  const handleShareClick = () => {
    setShareEmail("");
    onShareOpen();
  };

  const handleShareItinerary = async () => {
    if (!itinerary || !shareEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSharing(true);

    try {
      const itineraryId = itinerary.id || itinerary.itinerary_id;
      console.log("Sharing itinerary ID:", itineraryId);

      const response = await itineraryService.shareItinerary(
        itineraryId,
        shareEmail
      );

      toast({
        title: "Itinerary shared successfully",
        description: `Your trip to ${city}, ${stateCode} has been shared with ${shareEmail}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onShareClose();
    } catch (err) {
      console.error("Error sharing itinerary:", err);

      toast({
        title: "Error sharing itinerary",
        description:
          err.response?.data?.message ||
          "Failed to share itinerary. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSharing(false);
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
      <HStack mb={4} justify="space-between">
        <Heading>
          Plan Trip to {city}, {stateCode}
        </Heading>
        <Button
          leftIcon={<FiShare2 />}
          colorScheme="green"
          onClick={handleShareClick}
        >
          Share
        </Button>
      </HStack>

      <VStack spacing={4} align="stretch" mb={6}>
        <Select value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
          <option value="popularity">Sort by Popularity</option>
          <option value="rating">Sort by Rating</option>
          <option value="recommended">Recommended For You</option>
        </Select>

        <Button onClick={handleSearch} colorScheme="blue" isLoading={loading}>
          Search Attractions
        </Button>
      </VStack>

      <Divider mb={6} />

      <Heading size="md" mb={4}>
        Your Itinerary
      </Heading>
      {itineraryItems.length > 0 ? (
        <SimpleGrid columns={[1, 2, 3]} spacing={4} mb={8}>
          {itineraryItems.map((item) => (
            <Card key={item.item_id}>
              <CardBody>
                <Heading size="sm">{item.name}</Heading>
                <Text fontSize="sm" mt={2}>
                  {item.description || "No description available."}
                </Text>
                <Text fontSize="sm">
                  <strong>Rating:</strong> {item.rating ?? "N/A"}
                </Text>
                <Text fontSize="sm">
                  <strong>Popularity:</strong> {item.popularity ?? "N/A"}
                </Text>
                <Text fontSize="sm">
                  <strong>Address:</strong> {item.address || "Not available"}
                </Text>

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
        <Text color="gray.500">You haven't added anything yet.</Text>
      )}

      <Heading size="md" mb={4}>
        {orderBy === "recommended" ? "Recommended Attractions" : "Attraction Search Results"}
      </Heading>
      {attractions.length > 0 ? (
        <SimpleGrid columns={[1, 2, 3]} spacing={4}>
          {attractions.map((attr) => (
            <Card 
              key={attr.attraction_id}
              borderColor={orderBy === "recommended" && attr.preference_score > 3 ? "green.400" : undefined}
              borderWidth={orderBy === "recommended" && attr.preference_score > 3 ? "2px" : undefined}
            >
              <CardBody>
                <Flex justify="space-between" align="start">
                  <Heading size="sm">{attr.name}</Heading>
                  
                  {/* Add preference score display */}
                  {orderBy === "recommended" && (
                    <Badge 
                      colorScheme={attr.preference_score > 80 ? "green" : attr.preference_score > 60 ? "blue" : "gray"}
                      fontSize="0.8em"
                      borderRadius="full"
                      px={2}
                      variant="solid"
                    >
                      {attr.preference_score === 100 ? "Perfect Match" : 
                       attr.preference_score > 80 ? "Strong Match" :
                       attr.preference_score > 60 ? "Good Match" :
                       attr.preference_score > 40 ? "Fair Match" : "Basic Match"}
                      {" "}{attr.preference_score}%
                    </Badge>
                  )}
                </Flex>

                <Text fontSize="sm" mt={2}>{attr.description || "No description available."}</Text>
                <Text fontSize="sm"><strong>Rating:</strong> {attr.rating ?? "N/A"}</Text>
                <Text fontSize="sm"><strong>Popularity:</strong> {attr.popularity ?? "N/A"}</Text>
                <Text fontSize="sm"><strong>Address:</strong> {attr.address || "Not available"}</Text>
                
                {/* Show preference match details instead of just a badge */}
                {orderBy === "recommended" && attr.preference_score > 3 && (
                  <Box mt={2}>
                    <Text fontSize="xs" fontWeight="medium" color="green.600">
                      This matches your preferences for:
                    </Text>
                    <Text fontSize="xs" color="green.600">
                      {attr.main_category || "Attractions"} 
                    </Text>
                  </Box>
                )}
                
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

      {/* Share Itinerary Modal */}
      <Modal isOpen={isShareOpen} onClose={onShareClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Share Itinerary</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>
              Share your trip to {city}, {stateCode} with another user
            </Text>

            <FormControl isRequired mb={4}>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                placeholder="Enter recipient's email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <FormHelperText>
                The recipient must have an account in the system
              </FormHelperText>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onShareClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleShareItinerary}
              isLoading={isSharing}
              loadingText="Sharing..."
              isDisabled={!shareEmail}
            >
              Share Itinerary
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default ItineraryViewPage;
