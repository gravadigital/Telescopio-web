import { ApiConfig } from '../types';

// Configuración de la API
export const API_CONFIG: ApiConfig = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  ENDPOINTS: {
    EVENTS: '/api/v1/events',
    EVENT_REGISTER: (eventId: string) => `/api/v1/events/${eventId}/register`,
    EVENT_STAGE: (eventId: string) => `/api/v1/events/${eventId}/stage`,
    EVENT_PARTICIPANTS: (eventId: string) => `/api/v1/events/${eventId}/participants`,
    EVENT_ATTACHMENT: (eventId: string, participantId: string) => `/api/v1/events/${eventId}/participant/${participantId}/attachment`,
    EVENT_VOTE: (eventId: string) => `/api/v1/events/${eventId}/vote`,
    EVENT_RESULTS: (eventId: string) => `/api/v1/events/${eventId}/results`,
  }
};

// Headers por defecto para las peticiones
export const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Función helper para hacer peticiones a la API con JSON
export const apiRequest = async <T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', { endpoint, error });
    throw error;
  }
};

// Función helper para subir archivos
export const uploadFile = async (endpoint: string, formData: FormData): Promise<any> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // No establecer Content-Type aquí - el browser lo hará automáticamente con boundary para multipart
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('File upload failed:', { endpoint, error });
    throw error;
  }
};

// Helper para verificar conectividad con la API
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
};
