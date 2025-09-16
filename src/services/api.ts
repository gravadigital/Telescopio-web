import { apiRequest, uploadFile, checkApiHealth, API_CONFIG } from '../config/api';
import { Event, User } from '../types';

// Interfaz para crear eventos
interface CreateEventRequest {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

// Interfaz para crear usuarios
interface CreateUserRequest {
  name: string;
  email: string;
}

// Servicios para eventos
export const EventService = {
  // Obtener todos los eventos
  async getAllEvents(): Promise<Event[]> {
    try {
      const response = await apiRequest<{ data: any[] }>(API_CONFIG.ENDPOINTS.EVENTS);
      
      // Transformar la respuesta del backend al formato esperado por el frontend
      const events = response.data?.map((eventData: any) => ({
        id: eventData.id,
        title: eventData.name, // Backend usa 'name', frontend espera 'title'
        description: eventData.description,
        date: eventData.start_date, // Backend usa 'start_date', frontend espera 'date'
        location: 'Observatorio Virtual', // Valor por defecto
        organizer: 'Sistema Telescopio', // Valor por defecto
        status: eventData.stage === 'registration' ? 'active' : 
                eventData.stage === 'voting' ? 'active' :
                eventData.stage === 'results' ? 'completed' : 'active',
        stage: eventData.stage,
        participantIDs: [], // Por ahora vacío
        voteCount: { yes: 0, maybe: 0, no: 0 }, // Por ahora vacío
        attachmentCount: 0
      })) || [];
      
      console.log('✅ Eventos obtenidos de la API:', events);
      return events;
      
    } catch (error) {
      console.warn('Failed to fetch events from API, using mock data:', error);
      // Fallback a datos mock para desarrollo
      return getMockEvents();
    }
  },

  // Crear un nuevo evento
  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    const response = await apiRequest<{ event: Event }>(
      API_CONFIG.ENDPOINTS.EVENTS,
      {
        method: 'POST',
        body: JSON.stringify(eventData),
      }
    );
    return response.event;
  },

  // Obtener un evento por ID
  async getEvent(eventId: string): Promise<Event> {
    try {
      const response = await apiRequest<{ data: any }>(`${API_CONFIG.ENDPOINTS.EVENTS}/${eventId}`);
      
      // Transformar un evento individual
      const eventData = response.data;
      const event: Event = {
        id: eventData.id,
        title: eventData.name,
        description: eventData.description,
        date: eventData.start_date,
        location: 'Observatorio Virtual',
        organizer: 'Sistema Telescopio',
        status: eventData.stage === 'registration' ? 'active' : 
                eventData.stage === 'voting' ? 'active' :
                eventData.stage === 'results' ? 'completed' : 'active',
        stage: eventData.stage,
        participantIDs: [],
        voteCount: { yes: 0, maybe: 0, no: 0 },
        attachmentCount: 0
      };
      
      console.log('✅ Evento individual obtenido:', event);
      return event;
      
    } catch (error) {
      console.warn('Failed to fetch event from API, using mock:', error);
      // Fallback a datos mock
      const mockEvents = getMockEvents();
      const mockEvent = mockEvents.find(e => e.id === eventId);
      if (!mockEvent) {
        throw new Error(`Event ${eventId} not found`);
      }
      return mockEvent;
    }
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

  // Obtener participantes de un evento
  async getEventParticipants(eventId: string): Promise<User[]> {
    const response = await apiRequest<{ participants: User[] }>(
      API_CONFIG.ENDPOINTS.EVENT_PARTICIPANTS(eventId)
    );
    return response.participants || [];
  },

  // Actualizar etapa del evento
  async updateEventStage(eventId: string, stage: Event['stage']): Promise<void> {
    await apiRequest(
      API_CONFIG.ENDPOINTS.EVENT_STAGE(eventId),
      {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
      }
    );
  },

  // Obtener resultados de un evento
  async getEventResults(eventId: string): Promise<any> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.EVENT_RESULTS(eventId));
    return response.data || response;
  }
};

// Servicios para usuarios (simplificado - el backend parece no tener endpoints de usuarios directos)
export const UserService = {
  // Crear un nuevo usuario (simulado por ahora)
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Por ahora simulamos la creación de usuario
    return {
      id: `user_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: 'participant' as const,
      joinedEventIDs: [],
      createdEventIDs: []
    };
  },

  // Autenticar usuario (simulado)
  async authenticateUser(email: string, name?: string): Promise<User> {
    const userData = {
      name: name || email.split('@')[0],
      email
    };
    return await this.createUser(userData);
  }
};

// Servicios para archivos adjuntos
export const AttachmentService = {
  // Subir archivo adjunto
  async uploadAttachment(eventId: string, participantId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const endpoint = API_CONFIG.ENDPOINTS.EVENT_ATTACHMENT(eventId, participantId);
    return await uploadFile(endpoint, formData);
  },

  // Obtener archivos adjuntos de un evento (no implementado en backend aún)
  async getEventAttachments(eventId: string): Promise<any[]> {
    try {
      const response = await apiRequest(`/api/v1/attachments/event/${eventId}`);
      return response.attachments || [];
    } catch (error) {
      console.warn('Failed to fetch attachments:', error);
      return [];
    }
  }
};

// Servicios para votación
export const VoteService = {
  // Crear configuración de votación
  async createVotingConfiguration(eventId: string, config: any): Promise<any> {
    return await apiRequest(
      `/api/v1/events/${eventId}/voting-config`,
      {
        method: 'POST',
        body: JSON.stringify(config),
      }
    );
  },

  // Generar asignaciones de votación
  async generateAssignments(eventId: string): Promise<any> {
    return await apiRequest(
      `/api/v1/events/${eventId}/generate-assignments`,
      {
        method: 'POST',
      }
    );
  },

  // Obtener asignaciones de votación para un participante
  async getParticipantAssignment(eventId: string, participantId: string): Promise<any> {
    return await apiRequest(
      `/api/v1/events/${eventId}/participants/${participantId}/assignment`
    );
  },

  // Enviar votos de ranking
  async submitRankingVotes(eventId: string, participantId: string, votes: any[]): Promise<void> {
    await apiRequest(
      `/api/v1/events/${eventId}/participants/${participantId}/ranking-votes`,
      {
        method: 'POST',
        body: JSON.stringify({ votes }),
      }
    );
  },

  // Obtener resultados distribuidos
  async getDistributedResults(eventId: string): Promise<any> {
    return await apiRequest(`/api/v1/events/${eventId}/distributed-results`);
  },

  // Obtener estadísticas de votación
  async getVotingStatistics(eventId: string): Promise<any> {
    return await apiRequest(`/api/v1/events/${eventId}/voting-statistics`);
  }
};

// Servicio de salud de la API
export const HealthService = {
  async checkHealth(): Promise<boolean> {
    return await checkApiHealth();
  }
};

// Datos mock para desarrollo y fallback
function getMockEvents(): Event[] {
  return [
    {
      id: '1',
      title: "Concurso de Astrofotografía Lunar",
      description: "Captura la belleza de la Luna en todas sus fases. Concurso abierto para fotógrafos aficionados y profesionales.",
      stage: "registration",
      date: "2025-10-15",
      location: "Observatorio Nacional",
      participant_ids: []
    },
    {
      id: '2',
      title: "Observación de la Conjunción Jupiter-Saturno",
      description: "Evento especial para observar y fotografiar la conjunción planetaria más esperada del año.",
      stage: "registration", 
      date: "2025-11-20",
      location: "Monte Palomar",
      participant_ids: []
    },
    {
      id: '3',
      title: "Fotografía de Nebulosas",
      description: "Taller y concurso de fotografía de objetos de espacio profundo. Técnicas avanzadas de astrofotografía.",
      stage: "attachment_upload",
      date: "2025-09-10",
      location: "Observatorio Cerro Tololo",
      participant_ids: ['user_789']
    },
    {
      id: '4',
      title: "Maratón de Messier",
      description: "Desafío para observar y fotografiar el mayor número de objetos del catálogo Messier en una noche.",
      stage: "voting",
      date: "2025-08-05",
      location: "Desierto de Atacama",
      participant_ids: ['user_101', 'user_202', 'user_303']
    },
    {
      id: '5',
      title: "Eclipse Solar Total 2025",
      description: "Evento histórico para la observación y fotografía del eclipse solar total. ¡Una oportunidad única!",
      stage: "completed",
      date: "2025-07-15",
      location: "Zona de Totalidad - Argentina",
      participant_ids: ['user_404', 'user_505', 'user_606', 'user_707']
    }
  ];
}

// Función helper para verificar si la API está disponible
export const isApiAvailable = async (): Promise<boolean> => {
  return await HealthService.checkHealth();
};