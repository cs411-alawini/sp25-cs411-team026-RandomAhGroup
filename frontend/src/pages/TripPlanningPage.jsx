import { motion } from "framer-motion";
import { Box, Container, Heading, Text, VStack, useColorModeValue } from "@chakra-ui/react";
import TripPlanner from "../components/TripPlanner";

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

function TripPlanningPage() {
  const bgGradient = useColorModeValue(
    "linear(to-r, gray.50, blue.50, purple.50)",
    "linear(to-r, gray.900, blue.900, purple.900)"
  );

  return (
    <Box 
      minH="calc(100vh - 57px)" // Accounting for NavBar height
      py={{ base: 10, md: 20 }}
      bgGradient={bgGradient}
    >
      <Container maxW="container.xl" px={4}>
        <VStack spacing={16} mb={10}>
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
              Trip Planning
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
              Create your next journey
            </MotionText>
          </MotionBox>

          <TripPlanner />
        </VStack>
      </Container>
    </Box>
  );
}

export default TripPlanningPage; 