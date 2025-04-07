import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Button,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { authService } from "../services/api";

function NavBar() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    // Get user data from localStorage on component mount
    const user = authService.getCurrentUser();
    if (user) {
      setUserData(user);
    }
  }, []);

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      zIndex="10"
      bg={bgColor}
      boxShadow="sm"
      borderBottom="1px"
      borderColor={borderColor}
      px={4}
      py={3}
    >
      <Flex alignItems="center" justifyContent="space-between" maxW="container.xl" mx="auto">
        <Text 
          fontWeight="bold" 
          fontSize="xl" 
          color="brand.500"
          cursor="pointer"
          _hover={{ color: "brand.600" }}
          onClick={() => navigate("/trip-planning")}
          transition="color 0.2s"
        >
          Travel Planner
        </Text>
        
        <HStack spacing={4}>
          {userData && (
            <Text fontSize="sm" color="gray.600">
              Logged in as: <Text as="span" fontWeight="medium">{userData.name}</Text>
            </Text>
          )}
          
          <Button
            colorScheme="brand"
            variant="outline"
            size="sm"
            onClick={() => navigate("/my-itineraries")}
          >
            My Itineraries
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}

export default NavBar; 