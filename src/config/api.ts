import { ApiConfig } from '../types';

// Configuración de la API
export const API_CONFIG: ApiConfig = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  ENDPOINTS: {
    EVENTS: '/api/events',
    EVENT_REGISTER: (eventId: string) => `/api/events/${eventId}/register`,
    EVENT_STAGE: (eventId: string) => `/api/events/${eventId}/stage`,
    EVENT_PARTICIPANTS: (eventId: string) => `/api/events/${eventId}/participants`,
    EVENT_ATTACHMENT: (eventId: string, participantId: string) => `/api/events/${eventId}/participant/${participantId}/attachment`,
    EVENT_VOTE: (eventId: string) => `/api/events/${eventId}/vote`,
    EVENT_RESULTS: (eventId: string) => `/api/events/${eventId}/results`,
  }
};

// Headers por defecto para las peticiones
export const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
};

// Función helper para hacer peticiones a la API
export const apiRequest = async <T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const config: RequestInit = {
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
