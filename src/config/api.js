export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  ENDPOINTS: {
    EVENTS: '/api/events',
    EVENT_REGISTER: (eventId) => `/api/events/${eventId}/register`,
    EVENT_STAGE: (eventId) => `/api/events/${eventId}/stage`,
    EVENT_PARTICIPANTS: (eventId) => `/api/events/${eventId}/participants`,
    EVENT_ATTACHMENT: (eventId, participantId) => `/api/events/${eventId}/participant/${participantId}/attachment`,
    EVENT_VOTE: (eventId) => `/api/events/${eventId}/vote`,
    EVENT_RESULTS: (eventId) => `/api/events/${eventId}/results`,
  }
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const config = {
    headers: DEFAULT_HEADERS,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
