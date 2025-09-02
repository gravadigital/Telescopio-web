import { apiRequest, uploadFile, API_CONFIG } from '../config/api';
import { Event, User, ApiResponse } from '../types';

// Servicios para eventos
export const EventService = {
  // Obtener todos los eventos
  async getAllEvents(): Promise<Event[]> {
    const response: ApiResponse<Event[]> = await apiRequest(API_CONFIG.ENDPOINTS.EVENTS);
    return response.data || [];
  },

  // Crear un nuevo evento
  async createEvent(eventData: {
    name: string;
    description: string;
    author_id: string;
    start_date: string;
    end_date: string;
  }): Promise<Event> {
    const response: ApiResponse<Event> = await apiRequest(
      API_CONFIG.ENDPOINTS.EVENTS,
      {
        method: 'POST',
        body: JSON.stringify(eventData),
      }
    );
    if (!response.data) {
      throw new Error('Failed to create event');
    }
    return response.data;
  },

  // Obtener un evento por ID
  async getEventById(eventId: string): Promise<Event> {
    const response: ApiResponse<Event> = await apiRequest(`${API_CONFIG.ENDPOINTS.EVENTS}/${eventId}`);
    if (!response.data) {
      throw new Error('Event not found');
    }
    return response.data;
  },

  // Registrar participante en un evento
  async registerParticipant(eventId: string, userId: string): Promise<void> {
    await apiRequest(
      API_CONFIG.ENDPOINTS.EVENT_REGISTER(eventId),
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      }
    );
  },

  // Obtener resultados de un evento
  async getEventResults(eventId: string): Promise<any> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.EVENT_RESULTS(eventId));
    return response.data;
  }
};

// Servicios para usuarios
export const UserService = {
  // Crear un nuevo usuario
  async createUser(userData: {
    name: string;
    email: string;
  }): Promise<User> {
    const response: ApiResponse<User> = await apiRequest(
      '/api/users',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
    if (!response.data) {
      throw new Error('Failed to create user');
    }
    return response.data;
  },

  // Obtener usuario por email
  async getUserByEmail(email: string): Promise<User> {
    const response: ApiResponse<User> = await apiRequest(`/api/users?email=${email}`);
    if (!response.data) {
      throw new Error('User not found');
    }
    return response.data;
  },

  // Autenticar usuario (simulado por ahora)
  async authenticateUser(email: string): Promise<User> {
    try {
      return await this.getUserByEmail(email);
    } catch (error) {
      // Si el usuario no existe, lo creamos
      const name = email.split('@')[0];
      return await this.createUser({ name, email });
    }
  }
};

// Servicios para archivos adjuntos
export const AttachmentService = {
  // Subir archivo adjunto
  async uploadAttachment(eventId: string, participantId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('event_id', eventId);
    formData.append('participant_id', participantId);

    return await uploadFile('/api/attachments/upload', formData);
  },

  // Obtener archivos adjuntos de un evento
  async getEventAttachments(eventId: string): Promise<any[]> {
    const response = await apiRequest(`/api/attachments/event/${eventId}`);
    return response.data || [];
  }
};

// Servicios para votación
export const VoteService = {
  // Enviar voto
  async submitVote(eventId: string, voterId: string, attachmentId: string): Promise<void> {
    await apiRequest(
      API_CONFIG.ENDPOINTS.EVENT_VOTE(eventId),
      {
        method: 'POST',
        body: JSON.stringify({
          event_id: eventId,
          voter_id: voterId,
          attachment_id: attachmentId,
        }),
      }
    );
  },

  // Obtener asignaciones de votación para un usuario
  async getVotingAssignments(eventId: string, userId: string): Promise<any[]> {
    const response = await apiRequest(`/api/votes/event/${eventId}/assignments/${userId}`);
    return response.data || [];
  }
};

// Servicio de salud de la API
export const HealthService = {
  async checkHealth(): Promise<boolean> {
    try {
      const response = await apiRequest('/ping');
      return response.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
};
