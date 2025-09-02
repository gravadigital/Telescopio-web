import { ApiConfig } from '../types';

// Configuración de la API
export const API_CONFIG: ApiConfig = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  ENDPOINTS: {
    EVENTS: '/api/events',
    EVENT_REGISTER: (eventId: string) => `/api/events/${eventId}/register`,
    EVENT_STAGE: (eventId: string) => `/api/events/${eventId}/stage`,
    EVENT_PARTICIPANTS: (eventId: string) => `/api/events/${eventId}/participants`,
    EVENT_ATTACHMENT: (eventId: string, participantId: string) => `/api/attachments/upload`,
    EVENT_VOTE: (eventId: string) => `/api/votes`,
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
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Función para subir archivos
export const uploadFile = async (
  endpoint: string,
  formData: FormData
): Promise<any> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData, // No establecer Content-Type para multipart/form-data
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};
