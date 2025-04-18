import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiMail, FiEye, FiEyeOff, FiUserPlus } from "react-icons/fi";
import { authService } from "../services/api";

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
  
    try {
      await authService.register(name, email, password);
      toast({
        title: "Registration successful",
        description: "You can now sign in with your credentials.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  

  const cardBg = useColorModeValue("white", "gray.800");
  const bgGradient = useColorModeValue(
    "linear(to-r, gray.50, blue.50, purple.50)",
    "linear(to-r, gray.900, blue.900, purple.900)"
  );
  const inputBg = useColorModeValue("gray.50", "gray.700");

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bgGradient={bgGradient}
      py={12}
      px={4}
    >
      <Container maxW="lg" py={{ base: 10, md: 20 }} px={{ base: 5, md: 10 }}>
        <Stack align="center" mb={8}>
          <MotionHeading
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            fontSize={{ base: "3xl", md: "4xl" }}
            textAlign="center"
            fontWeight="bold"
          >
            Create an Account
          </MotionHeading>
          <MotionText
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            fontSize="lg"
            color="gray.500"
            textAlign="center"
            maxW="md"
          >
            Start planning your next adventure with us!
          </MotionText>
        </Stack>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          py={8}
          px={{ base: 4, md: 10 }}
          shadow="xl"
          bg={cardBg}
          rounded="xl"
        >
          {error && (
            <Alert status="error" mb={6} rounded="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <form onSubmit={handleRegister}>
            <Stack spacing={6}>
              <FormControl id="name">
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.500">
                  FULL NAME
                </FormLabel>
                <Input
                  bg={inputBg}
                  border="none"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  _focus={{ boxShadow: "outline" }}
                />
              </FormControl>

              <FormControl id="email">
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.500">
                  EMAIL ADDRESS
                </FormLabel>
                <InputGroup size="lg">
                  <Input
                    bg={inputBg}
                    border="none"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    _focus={{ boxShadow: "outline" }}
                  />
                  <InputRightElement>
                    <Box color="gray.400" mr={3}>
                      <FiMail />
                    </Box>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl id="password">
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.500">
                  PASSWORD
                </FormLabel>
                <InputGroup size="lg">
                  <Input
                    bg={inputBg}
                    border="none"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    _focus={{ boxShadow: "outline" }}
                  />
                  <InputRightElement>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      colorScheme="gray"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Box pt={4}>
                <Button
                  as={motion.button}
                  whileHover={{ translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  colorScheme="brand"
                  size="lg"
                  fontSize="md"
                  fontWeight="bold"
                  w="full"
                  h="56px"
                  rightIcon={<FiUserPlus />}
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Creating account..."
                >
                  Register
                </Button>
              </Box>
            </Stack>
          </form>
        </MotionBox>

        <MotionText
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          mt={8}
          textAlign="center"
          color="gray.500"
        >
          Already have an account?{" "}
          <Text
            as="span"
            color="brand.500"
            fontWeight="semibold"
            cursor="pointer"
            onClick={() => navigate("/signin")}
          >
            Sign in
          </Text>
        </MotionText>
      </Container>
    </Flex>
  );
}

export default Register;
