import { apiRequest, checkApiHealth, API_CONFIG } from "../config/api";
import { Event, User } from "../types";

interface CreateEventRequest {
  name: string;
  description: string;
  date: string;
  location?: string;
  organizer?: string;
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
      const response = await apiRequest<{ data: any[] }>(API_CONFIG.ENDPOINTS.EVENTS);
      
      if (!response || !response.data) {
        throw new Error("No data received");
      }
      
      const events = response.data.map(event => ({
        id: event.id,
        title: event.name || event.title,
        description: event.description,
        date: event.start_date || event.date,
        location: event.location || "Ubicación por determinar",
        organizer: event.organizer || "Organizador por determinar",
        status: event.status === "completed" || event.status === "active" || event.status === "cancelled" 
          ? event.status as "completed" | "active" | "cancelled"
          : "active" as const,
        stage: (event.stage as "registration" | "attachment_upload" | "voting" | "completed") || "registration",
        participantIDs: [],
        voteCount: {
          yes: 0,
          maybe: 0,
          no: 0
        },
        attachmentCount: 0
      }));
      
      return events;
    } catch (error) {
      console.warn("Failed to fetch events from API, using fallback:", error);
      
      return [
        {
          id: "demo_event_1",
          title: "Distributed Telescope Time Allocation 2026",
          description: "Annual telescope time allocation using distributed voting system based on Merrifield & Saari (2009) mathematical framework for fair and efficient proposal evaluation.",
          date: "2026-01-13",
          location: "Ubicación por determinar",
          organizer: "Sistema Telescopio",
          status: "active" as const,
          stage: "registration" as const,
          participantIDs: [],
          voteCount: { yes: 5, maybe: 2, no: 0 },
          attachmentCount: 3
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

      const requestBody = {
        name: eventData.name,
        description: eventData.description,
        start_date: eventData.date,
        end_date: endDate.toISOString().split("T")[0],
      };

      console.log("Sending request body:", requestBody);

      const response = await apiRequest<{ message: string; event: any }>(
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

      const backendEvent = response.event;
      return {
        id: backendEvent.id,
        title: backendEvent.name || backendEvent.title,
        description: backendEvent.description,
        date: backendEvent.start_date || backendEvent.date,
        location: eventData.location || "Ubicación por determinar",
        organizer: eventData.organizer || "Organizador por determinar",
        status: "active",
        stage: "registration" as const,
        participantIDs: [],
        voteCount: { yes: 0, maybe: 0, no: 0 },
        attachmentCount: 0
      };
    } catch (error) {
      console.error("Failed to create event with API:", error);
      throw error;
    }
  },

  async getEventById(id: string): Promise<Event | null> {
    try {
      const response = await apiRequest<any>(`${API_CONFIG.ENDPOINTS.EVENTS}/${id}`);
      
      if (!response) {
        return null;
      }

      return {
        id: response.id,
        title: response.name || response.title,
        description: response.description,
        date: response.start_date || response.date,
        location: response.location || "Ubicación por determinar",
        organizer: response.organizer || "Organizador por determinar",
        status: response.status || "active",
        stage: response.stage || "registration",
        participantIDs: response.participant_ids || [],
        voteCount: response.vote_count || { yes: 0, maybe: 0, no: 0 },
        attachmentCount: response.attachment_count || 0
      };
    } catch (error) {
      console.error("Failed to fetch event by ID:", error);
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

  async registerForEvent(eventId: string, userId: string): Promise<void> {
    try {
      await apiRequest<any>(
        API_CONFIG.ENDPOINTS.EVENT_REGISTER(eventId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );
    } catch (error) {
      console.error("Failed to register for event:", error);
      throw error;
    }
  },

  async getEventParticipants(eventId: string): Promise<User[]> {
    try {
      const response = await apiRequest<{ data: any[] }>(
        API_CONFIG.ENDPOINTS.EVENT_PARTICIPANTS(eventId)
      );

      return response.data?.map(participant => ({
        id: participant.id,
        name: participant.name,
        email: participant.email,
        role: participant.role || "participant",
        joinedEventIDs: participant.joined_event_ids || [],
        createdEventIDs: participant.created_event_ids || []
      })) || [];
    } catch (error) {
      console.error("Failed to fetch event participants:", error);
      return [];
    }
  }
};

export const UserService = {
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await apiRequest<{ message: string; user: ApiUser }>(
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
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
        joinedEventIDs: apiUser.joined_event_ids || [],
        createdEventIDs: apiUser.created_event_ids || []
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

  async authenticateUser(email: string, password: string): Promise<User> {
    try {
      const response = await apiRequest<{ message: string; user: ApiUser }>(
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
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
        joinedEventIDs: apiUser.joined_event_ids || [],
        createdEventIDs: apiUser.created_event_ids || []
      };
    } catch (error) {
      console.error("Failed to authenticate user:", error);
      throw error;
    }
  }
};

export const AttachmentService = {
  async uploadAttachment(eventId: string, userId: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("event_id", eventId);
      formData.append("user_id", userId);

      const response = await apiRequest<any>(
        `/api/v1/attachments`,
        {
          method: "POST",
          body: formData,
        }
      );

      return response;
    } catch (error) {
      console.error("Failed to upload attachment:", error);
      throw error;
    }
  },

  async getEventAttachments(eventId: string): Promise<any[]> {
    try {
      const response = await apiRequest<{ data: any[] }>(`/api/v1/attachments?event_id=${eventId}`);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch event attachments:", error);
      return [];
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

export const ApiHealthService = {
  async checkHealth(): Promise<boolean> {
    return checkApiHealth();
  }
};
