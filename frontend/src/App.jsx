import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./App.css";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register"; 
import TripPlanningPage from "./pages/TripPlanningPage";
import MyItinerariesPage from "./pages/MyItinerariesPage";
import ItineraryViewPage from "./pages/ItineraryViewPage";
import NavBar from "./components/NavBar";
import { Box } from "@chakra-ui/react";

// Layout wrapper component that conditionally shows NavBar
const Layout = ({ children }) => {
  const location = useLocation();
  const isSignInPage = location.pathname === "/sign-in" || location.pathname === "/register";
  
  return (
    <Box>
      {!isSignInPage && <NavBar />}
      {children}
    </Box>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/trip-planning" 
          element={
            <Layout>
              <TripPlanningPage />
            </Layout>
          } 
        />
        <Route 
          path="/my-itineraries" 
          element={
            <Layout>
              <MyItinerariesPage />
            </Layout>
          } 
        />
        <Route 
          path="/itinerary-view" 
          element={
            <Layout>
              <ItineraryViewPage />
            </Layout>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
