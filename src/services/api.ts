import { apiRequest, checkApiHealth, API_CONFIG } from "../config/api";
import {
  Event,
  User,
  VotingConfiguration,
  Assignment,
  RankingVote,
  VotingResults,
  VotingStatistics
} from "../types";

interface CreateEventRequest {
  name: string;
  description: string;
  date: string;
  organizer?: string;
  author_id?: string; // Optional: send user ID as author
}

interface CreateUserRequest {
  name: string;
  email: string;
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "participant" | "organizer" | "admin";
  joined_event_ids?: string[];
  created_event_ids?: string[];
}

export const EventService = {
  async getAllEvents(): Promise<Event[]> {
    try {
      // Request more events to avoid pagination issues (100 should be enough for now)
      const response = await apiRequest<{ data: any[] }>(`${API_CONFIG.ENDPOINTS.EVENTS}?limit=100`);
      
      if (!response || !response.data || !Array.isArray(response.data)) {
        console.warn("Invalid response format from API:", response);
        throw new Error("No data received");
      }
      
      console.log("✅ Events loaded from backend:", response.data.length);
      
      const events = response.data.map(event => ({
        id: event.id,
        title: event.name || event.title,
        description: event.description,
        date: event.start_date || event.date,
        organizer: event.organizer || "Organizador por determinar",
        status: event.status === "completed" || event.status === "active" || event.status === "cancelled"
          ? event.status as "completed" | "active" | "cancelled"
          : "active" as const,
        stage: (event.stage as "creation" | "participation" | "voting" | "results") || "participation",
        participant_ids: event.participant_ids || [],
        voteCount: {
          yes: 0,
          maybe: 0,
          no: 0
        },
        attachmentCount: event.attachment_count || 0,
        creator_id: event.author_id, // Map author_id from backend
        created_at: event.created_at,
        updated_at: event.updated_at
      }));
      
      return events;
    } catch (error) {
      console.warn("⚠️ Failed to fetch events from API, using fallback:", error);
      
      // Fallback con los IDs reales del backend para que funcione en modo offline
      return [
        {
          id: "68a94135-77f9-42a8-9b43-fea50d6ca524",
          title: "Asignación de Tiempo de Telescopio Q2 2025",
          description: "Evaluación de propuestas para tiempo de telescopio destinado al estudio de galaxias con corrimiento al rojo z > 2.",
          date: "2025-09-23",
          organizer: "Sistema Telescopio",
          status: "active" as const,
          stage: "voting" as const,
          participant_ids: [],
          voteCount: { yes: 5, maybe: 2, no: 0 },
          attachmentCount: 3
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440000",
          title: "Distributed Telescope Time Allocation 2026",
          description: "Annual telescope time allocation using distributed voting system based on Merrifield & Saari (2009) mathematical framework for fair and efficient proposal evaluation.",
          date: "2026-01-15",
          organizer: "Sistema Telescopio",
          status: "active" as const,
          stage: "results" as const,
          participant_ids: [],
          voteCount: { yes: 8, maybe: 1, no: 0 },
          attachmentCount: 5
        }
      ];
    }
  },

  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    try {
      console.log("Creating event with data:", eventData);

      const startDate = new Date(eventData.date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);

      // NO enviar author_id - el backend lo toma del token JWT automáticamente
      const requestBody = {
        name: eventData.name,
        description: eventData.description,
        start_date: eventData.date,
        end_date: endDate.toISOString().split("T")[0],
        organizer: eventData.organizer || ""
      };

      console.log("Sending request body:", requestBody);

      const response = await apiRequest<{ message: string; event: any; code: string }>(
        API_CONFIG.ENDPOINTS.EVENTS,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("API response:", response);

      // El backend devuelve { event: {...}, message, code }
      const backendEvent = response.event;
      
      if (!backendEvent) {
        throw new Error('Backend did not return event data');
      }
      
      return {
        id: backendEvent.id,
        title: backendEvent.name || backendEvent.title,
        description: backendEvent.description,
        date: backendEvent.start_date || backendEvent.date,
        organizer: eventData.organizer || backendEvent.organizer || "Organizador por determinar",
        status: "active",
        stage: backendEvent.stage || "creation" as const,
        participant_ids: [],
        voteCount: { yes: 0, maybe: 0, no: 0 },
        attachmentCount: 0,
        creator_id: backendEvent.author_id
      };
    } catch (error) {
      console.error("Failed to create event with API:", error);
      throw error;
    }
  },

  async getEventById(id: string): Promise<Event | null> {
    try {
      const response = await apiRequest<{ data: any }>(`${API_CONFIG.ENDPOINTS.EVENTS}/${id}`);
      
      if (!response || !response.data) {
        throw new Error("No response from API");
      }

      const event = response.data;
      console.log("✅ Event details loaded from backend:", event.id);

      return {
        id: event.id,
        title: event.name || event.title,
        description: event.description,
        date: event.start_date || event.date,
        organizer: event.organizer || "Organizador por determinar",
        status: event.status || "active",
        stage: event.stage || "participation",
        participant_ids: event.participant_ids || [],
        voteCount: event.vote_count || { yes: 0, maybe: 0, no: 0 },
        attachmentCount: event.attachment_count || 0,
        creator_id: event.author_id || event.creator_id,
        created_at: event.created_at,
        updated_at: event.updated_at
      };
    } catch (error) {
      console.warn("⚠️ Failed to fetch event by ID from API, checking fallback data:", error);
      
      // Try to find event in the fallback/demo data
      try {
        const allEvents = await this.getAllEvents();
        const event = allEvents.find(e => e.id === id);
        
        if (event) {
          console.log("📦 Found event in fallback data:", event.title);
          return event;
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
      
      console.error("❌ Event not found:", id);
      return null;
    }
  },

  async updateEventStage(eventId: string, newStage: string): Promise<void> {
    try {
      await apiRequest<any>(
        API_CONFIG.ENDPOINTS.EVENT_STAGE(eventId),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ stage: newStage }),
        }
      );
    } catch (error) {
      console.error("Failed to update event stage:", error);
      throw error;
    }
  },

  async registerForEvent(eventId: string, participantName: string, participantEmail: string): Promise<void> {
    try {
      console.log('🎫 Registering for event:', {
        eventId,
        participantName,
        participantEmail
      });

      await apiRequest<any>(
        API_CONFIG.ENDPOINTS.EVENT_REGISTER(eventId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participant_name: participantName,
            participant_email: participantEmail
          }),
        }
      );

      console.log('✅ Registration successful');
    } catch (error) {
      console.error("❌ Failed to register for event:", error);
      throw error;
    }
  },

  async getEventParticipants(eventId: string): Promise<User[]> {
    try {
      const response = await apiRequest<{ count: number; data: { participants: any[] } }>(
        API_CONFIG.ENDPOINTS.EVENT_PARTICIPANTS(eventId)
      );

      console.log('📊 Participants API Response:', {
        fullResponse: response,
        hasData: !!response.data,
        hasParticipants: !!response.data?.participants,
        participantsCount: response.data?.participants?.length || 0,
        count: response.count
      });

      // El backend devuelve { count, data: { event, participants } }
      const participants = response.data?.participants || [];

      console.log('✅ Parsed participants:', participants);

      return participants.map(participant => ({
        id: participant.id,
        name: participant.name,
        email: participant.email,
        role: participant.role || "participant",
        joinedEventIDs: participant.joined_event_ids || [],
        createdEventIDs: participant.created_event_ids || []
      }));
    } catch (error) {
      console.error("❌ Failed to fetch event participants:", error);
      return [];
    }
  },

  async getShareableEventInfo(eventId: string): Promise<any> {
    try {
      const response = await apiRequest<{ data: any }>(
        API_CONFIG.ENDPOINTS.EVENT_SHARE(eventId)
      );
      
      console.log('✅ Shareable event info loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch shareable event info:", error);
      throw error;
    }
  }
};

export const UserService = {
  async createUser(userData: CreateUserRequest): Promise<{ user: User; token: string }> {
    try {
      const response = await apiRequest<{ message: string; user: ApiUser; token: string }>(
        API_CONFIG.ENDPOINTS.USERS,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const apiUser = response.user;
      return {
        user: {
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          role: apiUser.role,
          joinedEventIDs: apiUser.joined_event_ids || [],
          createdEventIDs: apiUser.created_event_ids || []
        },
        token: response.token
      };
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await apiRequest<ApiUser>(`${API_CONFIG.ENDPOINTS.USERS}/${id}`);
      
      if (!response) {
        return null;
      }

      return {
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        joinedEventIDs: response.joined_event_ids || [],
        createdEventIDs: response.created_event_ids || []
      };
    } catch (error) {
      console.error("Failed to fetch user by ID:", error);
      return null;
    }
  },

  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await apiRequest<{ message: string; user: ApiUser; token: string }>(
        API_CONFIG.ENDPOINTS.USER_AUTHENTICATE,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const apiUser = response.user;
      return {
        user: {
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          role: apiUser.role,
          joinedEventIDs: apiUser.joined_event_ids || [],
          createdEventIDs: apiUser.created_event_ids || []
        },
        token: response.token
      };
    } catch (error) {
      console.error("Failed to authenticate user:", error);
      throw error;
    }
  }
};

export const AttachmentService = {
  async uploadAttachment(eventId: string, participantId: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiRequest<any>(
        API_CONFIG.ENDPOINTS.UPLOAD_ATTACHMENT(eventId, participantId),
        {
          method: "POST",
          body: formData,
        }
      );

      console.log('✅ Attachment uploaded:', response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to upload attachment:", error);
      throw error;
    }
  },

  async getEventAttachments(eventId: string): Promise<any[]> {
    try {
      console.log('🔍 Fetching attachments for event:', eventId);
      const endpoint = API_CONFIG.ENDPOINTS.EVENT_ATTACHMENTS(eventId);
      console.log('📡 Endpoint:', endpoint);
      
      const response = await apiRequest<{ data: any[] }>(endpoint);
      console.log('✅ Raw attachment response:', response);
      
      return response.data || [];
    } catch (error) {
      console.error("❌ Failed to fetch event attachments:", error);
      throw error;
    }
  }
};

export const VoteService = {
  async submitVote(eventId: string, userId: string, voteType: "yes" | "maybe" | "no"): Promise<any> {
    try {
      const response = await apiRequest<any>(
        `/api/v1/votes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_id: eventId,
            user_id: userId,
            vote_type: voteType
          }),
        }
      );

      return response;
    } catch (error) {
      console.error("Failed to submit vote:", error);
      throw error;
    }
  },

  async getEventVotes(eventId: string): Promise<any[]> {
    try {
      const response = await apiRequest<{ data: any[] }>(`/api/v1/votes?event_id=${eventId}`);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch event votes:", error);
      return [];
    }
  }
};

// ========================================
// Distributed Voting Service
// ========================================

export const DistributedVotingService = {
  /**
   * Crear configuración de votación para un evento
   */
  async createVotingConfig(
    eventId: string,
    config: Partial<VotingConfiguration>
  ): Promise<VotingConfiguration> {
    try {
      const response = await apiRequest<{ data: VotingConfiguration }>(
        API_CONFIG.ENDPOINTS.VOTING_CONFIG(eventId),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        }
      );
      console.log('✅ Voting configuration created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create voting configuration:', error);
      throw error;
    }
  },

  /**
   * Generar asignaciones distribuidas para todos los participantes
   */
  async generateAssignments(eventId: string): Promise<void> {
    try {
      const response = await apiRequest<{ 
        data: { 
          assignments_count: number;
          total_participants: number;
          total_attachments: number;
          total_evaluations: number;
        };
        message: string;
      }>(
        API_CONFIG.ENDPOINTS.GENERATE_ASSIGNMENTS(eventId),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      console.log('✅ Assignments generated:', response.data.assignments_count, 'assignments for', response.data.total_participants, 'participants');
    } catch (error) {
      console.error('Failed to generate assignments:', error);
      throw error;
    }
  },

  /**
   * Obtener la asignación de un participante específico
   */
  async getParticipantAssignment(
    eventId: string,
    participantId: string
  ): Promise<Assignment> {
    try {
      const response = await apiRequest<{ assignment: Assignment }>(
        API_CONFIG.ENDPOINTS.GET_ASSIGNMENT(eventId, participantId)
      );
      console.log('✅ Assignment loaded for participant:', participantId);
      return response.assignment;
    } catch (error) {
      console.error('Failed to get participant assignment:', error);
      throw error;
    }
  },

  /**
   * Enviar votos de ranking de un participante
   */
  async submitRankingVotes(
    eventId: string,
    participantId: string,
    assignmentId: string,
    rankings: RankingVote[]
  ): Promise<void> {
    try {
      await apiRequest<{ message: string }>(
        API_CONFIG.ENDPOINTS.SUBMIT_RANKING_VOTES(eventId, participantId),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            assignment_id: assignmentId,
            rankings 
          })
        }
      );
      console.log('✅ Ranking votes submitted successfully');
    } catch (error) {
      console.error('Failed to submit ranking votes:', error);
      throw error;
    }
  },

  /**
   * Obtener resultados calculados con Modified Borda Count
   */
  async getDistributedResults(eventId: string): Promise<VotingResults> {
    try {
      const response = await apiRequest<{ data: VotingResults }>(
        API_CONFIG.ENDPOINTS.DISTRIBUTED_RESULTS(eventId)
      );
      console.log('✅ Distributed voting results loaded');
      return response.data;
    } catch (error) {
      console.error('Failed to get distributed results:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de votación del evento
   */
  async getVotingStatistics(eventId: string): Promise<VotingStatistics> {
    try {
      const response = await apiRequest<{ data: VotingStatistics }>(
        API_CONFIG.ENDPOINTS.VOTING_STATISTICS(eventId)
      );
      console.log('✅ Voting statistics loaded');
      return response.data;
    } catch (error) {
      console.error('Failed to get voting statistics:', error);
      throw error;
    }
  }
};

export const ApiHealthService = {
  async checkHealth(): Promise<boolean> {
    return checkApiHealth();
  }
};
