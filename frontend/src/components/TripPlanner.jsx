import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  Input,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  InputGroup,
  InputRightElement,
  useToast,
  Alert,
  AlertIcon,
  FormHelperText,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiMap, FiCalendar, FiArrowRight } from "react-icons/fi";
import { itineraryService, authService } from "../services/api";
import { useNavigate } from "react-router-dom";

const MotionBox = motion(Box);

function TripPlanner() {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const navigate = useNavigate();
  
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  
  // Validation functions
  const isEndDateValid = () => {
    if (!startDate || !endDate) return true;
    return new Date(endDate) >= new Date(startDate);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Validate user is logged in
    if (!authService.isAuthenticated()) {
      setError("You must be logged in to create an itinerary.");
      setIsLoading(false);
      return;
    }
    
    // Validate dates
    if (!isEndDateValid()) {
      setError("End date must be after start date.");
      setIsLoading(false);
      return;
    }

    try {
      const itineraryData = {
        city,
        state,
        startDate,
        endDate,
      };

      const response = await itineraryService.createItinerary(itineraryData);
      
      toast({
        title: "Itinerary created!",
        description: `Your trip to ${city}, ${state} has been successfully planned.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Navigate to My Itineraries page
      navigate("/my-itineraries");
      
    } catch (err) {
      console.error("Error creating itinerary:", err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError("Your session has expired. Please sign in again.");
        navigate("/sign-in");
      } else {
        setError(
          err.response?.data?.message || 
          "There was an error creating your itinerary. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cardBg = useColorModeValue("white", "gray.800");
  const inputBg = useColorModeValue("gray.50", "gray.700");

  return (
    <Box maxW="4xl" mx="auto">
      {error && (
        <Alert status="error" mb={6} rounded="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Stack spacing={12}>
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            bg={cardBg}
            borderRadius="xl"
            boxShadow="xl"
            overflow="hidden"
          >
            <Flex direction={{ base: "column", md: "row" }}>
              <Flex 
                bg="brand.500" 
                color="white" 
                p={6} 
                align="center" 
                justify="center"
                flexShrink={0}
                width={{ base: "full", md: "200px" }}
              >
                <FiMap size={36} />
              </Flex>
              <VStack align="stretch" p={8} spacing={6} flex="1">
                <FormControl isRequired>
                  <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.500">
                    DESTINATION CITY
                  </Text>
                  <InputGroup size="lg">
                    <Input
                      bg={inputBg}
                      border="none"
                      placeholder="Where are you going?"
                      size="lg"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      _focus={{ boxShadow: "outline" }}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.500">
                    STATE / PROVINCE
                  </Text>
                  <InputGroup size="lg">
                    <Input
                      bg={inputBg}
                      border="none"
                      placeholder="Enter state or province"
                      size="lg"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      _focus={{ boxShadow: "outline" }}
                    />
                  </InputGroup>
                </FormControl>
              </VStack>
            </Flex>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            bg={cardBg}
            borderRadius="xl"
            boxShadow="xl"
            overflow="hidden"
          >
            <Flex direction={{ base: "column", md: "row" }}>
              <Flex 
                bg="brand.500" 
                color="white" 
                p={6} 
                align="center" 
                justify="center"
                flexShrink={0}
                width={{ base: "full", md: "200px" }}
              >
                <FiCalendar size={36} />
              </Flex>
              <VStack align="stretch" p={8} spacing={6} flex="1">
                <FormControl isRequired>
                  <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.500">
                    START DATE
                  </Text>
                  <InputGroup size="lg">
                    <Input
                      bg={inputBg}
                      border="none"
                      type="date"
                      size="lg"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={today}
                      required
                      _focus={{ boxShadow: "outline" }}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired isInvalid={!isEndDateValid()}>
                  <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.500">
                    END DATE
                  </Text>
                  <InputGroup size="lg">
                    <Input
                      bg={inputBg}
                      border="none"
                      type="date"
                      size="lg"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || today}
                      required
                      _focus={{ boxShadow: "outline" }}
                    />
                  </InputGroup>
                  {!isEndDateValid() && (
                    <FormHelperText color="red.500">
                      End date must be after start date
                    </FormHelperText>
                  )}
                </FormControl>
              </VStack>
            </Flex>
          </MotionBox>

          <MotionBox
            as={Button}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            size="lg"
            height="70px"
            width="full"
            type="submit"
            colorScheme="brand"
            rightIcon={<FiArrowRight />}
            fontSize="xl"
            borderRadius="xl"
            boxShadow="lg"
            _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
            _active={{ transform: "translateY(0)" }}
            isLoading={isLoading}
            loadingText="Creating Itinerary..."
            isDisabled={!isEndDateValid()}
          >
            Plan My Trip
          </MotionBox>
        </Stack>
      </form>
    </Box>
  );
}

export default TripPlanner;
