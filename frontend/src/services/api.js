import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`Request to ${config.url}: Added authorization header`);
    } else {
      console.log(`Request to ${config.url}: No token available`);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  }, 
  (error) => {
    console.error('API Error:', error);
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error detected, redirecting to login');
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/sign-in') {
        window.location.href = '/sign-in';
      }
    }
    
    return Promise.reject(error);
  }
);

// User services
export const userService = {
  // Get current user profile
  getProfile: async () => {
    return api.get('/users/profile');
  },
  
  // Update user profile (name, email)
  updateProfile: async (userData) => {
    return api.put('/users/profile', userData);
  },
  
  // Update user preferences
  updatePreferences: async (preferences) => {
    return api.put('/users/preferences', preferences);
  },

  getRecommendations: async (itineraryId) => {
    return api.get(`/itineraries/${itineraryId}/recommendations`);
  },
  
  // Change user password
  changePassword: async (currentPassword, newPassword) => {
    return api.put('/users/password', { 
      currentPassword, 
      newPassword 
    });
  },
  
  // Delete user account
  deleteAccount: async () => {
    return api.delete('/users/account');
  },
  
  // Get user preferences
  getPreferences: async () => {
    return api.get('/users/preferences');
  }
};

// Auth services
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  register: async (name, email, password) => {
    return api.post('/auth/register', { name, email, password });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  refreshToken: async () => {
    const response = await api.post('/auth/refresh-token');
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }
};

// Itinerary services
export const itineraryService = {
  // Create a new itinerary
  createItinerary: async (itineraryData) => {
    return api.post('/itineraries', {
      destination_city: itineraryData.city,
      destination_state: itineraryData.state,
      start_date: itineraryData.startDate,
      end_date: itineraryData.endDate,
      // The user_id will be determined from the token on the server side
    });
  },
  
  // Get all itineraries for the current user
  getItineraries: async () => {
    return api.get('/itineraries');
  },
  
  // Get a specific itinerary by ID with all its items
  getItinerary: async (id) => {
    return api.get(`/itineraries/${id}`);
  },
  
  // Update an existing itinerary
  updateItinerary: async (id, itineraryData) => {
    return api.put(`/itineraries/${id}`, {
      destination_city: itineraryData.city,
      destination_state: itineraryData.state,
      start_date: itineraryData.startDate,
      end_date: itineraryData.endDate
    });
  },
  
  // Delete an itinerary
  deleteItinerary: async (id) => {
    if (!id) {
      console.error("Cannot delete itinerary: ID is undefined or null");
      throw new Error("Cannot delete itinerary: missing ID");
    }
    
    console.log(`Attempting to delete itinerary with ID: ${id}`);
    try {
      const token = localStorage.getItem('token');
      console.log(`Token exists: ${!!token}`);
      
      // Ensure proper API endpoint format
      const endpoint = `/itineraries/${id}`;
      console.log(`Delete endpoint: ${endpoint}`);
      
      const response = await api.delete(endpoint);
      console.log('Delete response:', response.data);
      return response;
    } catch (error) {
      console.error('Error in deleteItinerary service:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Clone an existing itinerary
  cloneItinerary: async (id, newName) => {
    return api.post(`/itineraries/${id}/clone`, { newName });
  },
  
  // Share an itinerary with another user
  shareItinerary: async (id, email) => {
    return api.post(`/itineraries/${id}/share`, { email });
  },
  
  // Itinerary Items
  // Add a new item to an itinerary
  addItineraryItem: async (itineraryId, itemData) => {
    return api.post(`/itineraries/${itineraryId}/items`, {
      attraction_id: itemData.attractionId,
    });
  },
  
  // Update an existing itinerary item
  updateItineraryItem: async (itineraryId, itemId, itemData) => {
    return api.put(`/itineraries/${itineraryId}/items/${itemId}`, {
      day_number: itemData.dayNumber,
      start_time: itemData.startTime,
      end_time: itemData.endTime,
      notes: itemData.notes
    });
  },

  // Get all attractions for a specific itinerary
  getItineraryItems: async (itineraryId) => {
    return api.get(`/itineraries/${itineraryId}/attractions`);
  },
  
  // Delete an itinerary item
  deleteItineraryItem: async (itineraryId, itemId) => {
    return api.delete(`/itineraries/${itineraryId}/items`, {
      data: { item_id: itemId },
    });
  },
  
  
  // Reorder itinerary items (change day or sequence)
  reorderItems: async (itineraryId, reorderData) => {
    return api.put(`/itineraries/${itineraryId}/reorder`, reorderData);
  },
  
  // Get recommended attractions for an itinerary based on user preferences
  getRecommendations: async (itineraryId) => {
    return api.get(`/itineraries/${itineraryId}/recommendations`);
  },
  
  // Generate an optimized itinerary based on user preferences
  generateOptimizedItinerary: async (itineraryId) => {
    return api.post(`/itineraries/${itineraryId}/optimize`);
  },

  searchAttractions: async (city, state, orderBy = 'popularity') => {
    return api.get('/itineraries/search', {
      params: {
        city,
        state,
        orderBy,
      },
    });
  },

  ValidityCityState: async (city, state) => {
    return api.get('/itineraries/validate', {
      params: {
        city,
        state,
      },
    });
  },
};



export default { authService, userService, itineraryService }; 