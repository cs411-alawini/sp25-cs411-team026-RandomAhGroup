import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Grid,
  Card,
  CardBody,
  CardFooter,
  Button,
  HStack,
  Badge,
  Divider,
  Spinner,
  useColorModeValue,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import {
  FiMapPin,
  FiCalendar,
  FiEye,
  FiTrash2,
  FiEdit,
  FiShare2,
} from "react-icons/fi";
import { itineraryService } from "../services/api";
import { useNavigate } from "react-router-dom";

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

function MyItinerariesPage() {
  const [itineraries, setItineraries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itineraryToDelete, setItineraryToDelete] = useState(null);
  const [itineraryToEdit, setItineraryToEdit] = useState(null);
  const [itineraryToShare, setItineraryToShare] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isShareOpen,
    onOpen: onShareOpen,
    onClose: onShareClose,
  } = useDisclosure();
  const cancelRef = useRef();
  const toast = useToast();
  const navigate = useNavigate();

  const bgGradient = useColorModeValue(
    "linear(to-r, gray.50, blue.50, purple.50)",
    "linear(to-r, gray.900, blue.900, purple.900)"
  );

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await itineraryService.getItineraries();
      console.log("Fetched itineraries:", response.data);

      // Inspect the structure of the first itinerary if available
      if (response.data && response.data.length > 0) {
        console.log("First itinerary structure:", response.data[0]);
        console.log("Itinerary ID field:", response.data[0].id);

        // If ID is missing but itinerary_id exists, map the data
        if (!response.data[0].id && response.data[0].itinerary_id) {
          console.log("Mapping itinerary_id to id for compatibility");
          const mappedData = response.data.map((item) => ({
            ...item,
            id: item.itinerary_id,
          }));
          setItineraries(mappedData);
        } else {
          setItineraries(response.data);
        }
      } else {
        setItineraries(response.data);
      }
    } catch (err) {
      console.error("Error fetching itineraries:", err);
      setError("Failed to load your itineraries. Please try again later.");
      toast({
        title: "Error loading itineraries",
        description: err.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to ensure auth is valid before deletion or updates
  const ensureValidAuth = async () => {
    const token = localStorage.getItem("token");

    // If no token, redirect to login
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please sign in to manage your itineraries",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      navigate("/sign-in");
      return false;
    }

    try {
      // Optional: validate token with a lightweight API call
      // For example, getting user profile or a simple auth check
      return true;
    } catch (err) {
      // Handle token validation error
      toast({
        title: "Session expired",
        description: "Your session has expired. Please sign in again.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      navigate("/sign-in");
      return false;
    }
  };

  const handleDeleteClick = async (itinerary) => {
    // Ensure valid authentication before proceeding
    if (await ensureValidAuth()) {
      setItineraryToDelete(itinerary);
      onDeleteOpen();
    }
  };

  const handleEditClick = async (itinerary) => {
    // Ensure valid authentication before proceeding
    if (await ensureValidAuth()) {
      setItineraryToEdit(itinerary);
      setStartDate(itinerary.start_date);
      setEndDate(itinerary.end_date);
      onEditOpen();
    }
  };

  const handleShareClick = async (itinerary) => {
    // Ensure valid authentication before proceeding
    if (await ensureValidAuth()) {
      setItineraryToShare(itinerary);
      setShareEmail("");
      onShareOpen();
    }
  };

  // Validation function for date inputs
  const isEndDateValid = () => {
    if (!startDate || !endDate) return true;
    return new Date(endDate) >= new Date(startDate);
  };

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split("T")[0];

  const confirmDelete = async () => {
    if (!itineraryToDelete) return;

    try {
      // Log token for debugging
      const token = localStorage.getItem("token");
      console.log(
        "Using auth token:",
        token ? "Token exists" : "No token found"
      );

      // Try to get user info
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("User info:", user);

      // Log the itinerary being deleted
      console.log("Deleting itinerary:", itineraryToDelete);

      // Make sure we have the ID
      if (!itineraryToDelete.id) {
        throw new Error("Cannot delete itinerary: ID is missing");
      }

      // Make the delete request with the actual ID
      const itineraryId = itineraryToDelete.id;
      console.log("Proceeding with deletion of itinerary ID:", itineraryId);

      await itineraryService.deleteItinerary(itineraryId);

      // Remove the deleted itinerary from state
      setItineraries(itineraries.filter((i) => i.id !== itineraryId));

      toast({
        title: "Itinerary deleted",
        description: `Your trip to ${itineraryToDelete.destination_city} has been deleted.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error deleting itinerary:", err);

      // More detailed error logging
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
      }

      toast({
        title: "Error deleting itinerary",
        description:
          err.message || err.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setItineraryToDelete(null);
      onDeleteClose();
    }
  };

  const handleUpdateItinerary = async () => {
    if (!itineraryToEdit) return;

    // Validate dates
    if (!isEndDateValid()) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUpdating(true);

    try {
      const itineraryId = itineraryToEdit.id;
      console.log("Updating itinerary ID:", itineraryId);

      const itineraryData = {
        city: itineraryToEdit.destination_city,
        state: itineraryToEdit.destination_state,
        startDate: startDate,
        endDate: endDate,
      };

      await itineraryService.updateItinerary(itineraryId, itineraryData);

      // Update the itinerary in state
      setItineraries(
        itineraries.map((i) => {
          if (i.id === itineraryId) {
            return {
              ...i,
              start_date: startDate,
              end_date: endDate,
            };
          }
          return i;
        })
      );

      toast({
        title: "Itinerary updated",
        description: `Your trip dates for ${itineraryToEdit.destination_city} have been updated.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onEditClose();
    } catch (err) {
      console.error("Error updating itinerary:", err);

      toast({
        title: "Error updating itinerary",
        description:
          err.message || err.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShareItinerary = async () => {
    if (!itineraryToShare || !shareEmail) return;

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
      const itineraryId = itineraryToShare.id || itineraryToShare.itinerary_id;
      console.log("Sharing itinerary ID:", itineraryId);

      const response = await itineraryService.shareItinerary(
        itineraryId,
        shareEmail
      );

      toast({
        title: "Itinerary shared successfully",
        description: `Your trip to ${itineraryToShare.destination_city} has been shared with ${shareEmail}.`,
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

  const handleViewItinerary = (itinerary) => {
    navigate("/itinerary-view", { state: { itinerary } });
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInTime = end.getTime() - start.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);
    return Math.round(diffInDays) + 1;
  };

  return (
    <Box
      minH="calc(100vh - 57px)"
      py={{ base: 10, md: 20 }}
      bgGradient={bgGradient}
    >
      <Container maxW="container.xl" px={4}>
        <VStack spacing={12} mb={10}>
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            textAlign="center"
            w="full"
          >
            <MotionHeading
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              as="h1"
              fontSize={{ base: "4xl", md: "5xl", lg: "5xl" }}
              fontWeight="bold"
              letterSpacing="tight"
              mb={3}
            >
              My Itineraries
            </MotionHeading>
            <MotionText
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              fontSize={{ base: "lg", md: "xl" }}
              color="gray.500"
              maxW="xl"
              mx="auto"
            >
              View and manage your saved itineraries
            </MotionText>
          </MotionBox>

          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" color="brand.500" thickness="4px" />
              <Text mt={4} color="gray.500">
                Loading your itineraries...
              </Text>
            </Box>
          ) : error ? (
            <Box
              p={8}
              bg={cardBg}
              shadow="lg"
              rounded="xl"
              w="full"
              textAlign="center"
              borderWidth="1px"
              borderColor={cardBorder}
            >
              <Text fontSize="lg" color="red.500">
                {error}
              </Text>
              <Button mt={4} colorScheme="brand" onClick={fetchItineraries}>
                Try Again
              </Button>
            </Box>
          ) : itineraries.length === 0 ? (
            <Box
              p={8}
              bg={cardBg}
              shadow="lg"
              rounded="xl"
              w="full"
              textAlign="center"
              borderWidth="1px"
              borderColor={cardBorder}
            >
              <Text fontSize="lg" color="gray.500">
                You don't have any itineraries yet.
              </Text>
              <Button
                mt={4}
                colorScheme="brand"
                onClick={() => navigate("/trip-planning")}
              >
                Plan Your First Trip
              </Button>
            </Box>
          ) : (
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              }}
              gap={6}
              w="full"
            >
              {itineraries.map((itinerary) => (
                <Card
                  key={itinerary.id || itinerary.itinerary_id}
                  bg={cardBg}
                  shadow="md"
                  borderWidth="1px"
                  borderColor={cardBorder}
                  rounded="xl"
                  overflow="hidden"
                  transition="all 0.3s"
                  _hover={{ shadow: "lg", transform: "translateY(-5px)" }}
                >
                  <CardBody p={5}>
                    <HStack spacing={3} mb={3}>
                      <Badge colorScheme="brand" fontSize="sm">
                        {calculateDuration(
                          itinerary.start_date,
                          itinerary.end_date
                        )}{" "}
                        Days
                      </Badge>
                    </HStack>

                    <Heading size="md" mb={2}>
                      {itinerary.destination_city},{" "}
                      {itinerary.destination_state}
                    </Heading>

                    <HStack color="gray.500" mb={4} spacing={4}>
                      <HStack>
                        <FiCalendar />
                        <Text fontSize="sm">
                          {formatDate(itinerary.start_date)} -{" "}
                          {formatDate(itinerary.end_date)}
                        </Text>
                      </HStack>
                    </HStack>
                  </CardBody>

                  <Divider borderColor={cardBorder} />

                  <CardFooter p={4}>
                    <HStack spacing={3} justify="flex-end" w="full">
                      <Button
                        leftIcon={<FiEye />}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewItinerary(itinerary)}
                      >
                        View
                      </Button>
                      <Button
                        leftIcon={<FiShare2 />}
                        colorScheme="green"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareClick(itinerary)}
                      >
                        Share
                      </Button>
                      <Button
                        leftIcon={<FiEdit />}
                        colorScheme="blue"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(itinerary)}
                      >
                        Edit
                      </Button>
                      <Button
                        leftIcon={<FiTrash2 />}
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log(
                            "Delete clicked for itinerary:",
                            itinerary
                          );
                          console.log(
                            "Itinerary ID:",
                            itinerary.id || itinerary.itinerary_id
                          );
                          handleDeleteClick(itinerary);
                        }}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </CardFooter>
                </Card>
              ))}
            </Grid>
          )}
        </VStack>
      </Container>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Itinerary
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete your trip to{" "}
              {itineraryToDelete?.destination_city}? This action cannot be
              undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Edit Itinerary Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Trip Dates</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>
              Update your trip dates to {itineraryToEdit?.destination_city},{" "}
              {itineraryToEdit?.destination_state}
            </Text>

            <FormControl isRequired mb={4}>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
              />
            </FormControl>

            <FormControl isRequired isInvalid={!isEndDateValid()}>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
              />
              {!isEndDateValid() && (
                <FormHelperText color="red.500">
                  End date must be after start date
                </FormHelperText>
              )}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleUpdateItinerary}
              isLoading={isUpdating}
              loadingText="Updating..."
              isDisabled={!isEndDateValid()}
            >
              Update Dates
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Share Itinerary Modal */}
      <Modal isOpen={isShareOpen} onClose={onShareClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Share Itinerary</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>
              Share your trip to {itineraryToShare?.destination_city},{" "}
              {itineraryToShare?.destination_state} with another user
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

export default MyItinerariesPage;
