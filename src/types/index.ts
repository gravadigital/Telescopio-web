// Tipos globales para la aplicación Telescopio

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'participant' | 'organizer' | 'admin';
  joinedEventIDs: string[];
  createdEventIDs: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  stage: 'registration' | 'attachment_upload' | 'voting' | 'completed';
  date: string;
  location: string;
  participant_ids?: string[];
  max_participants?: number;
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  joinEvent: (eventId: string) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface ApiConfig {
  BASE_URL: string;
  ENDPOINTS: {
    EVENTS: string;
    EVENT_REGISTER: (eventId: string) => string;
    EVENT_STAGE: (eventId: string) => string;
    EVENT_PARTICIPANTS: (eventId: string) => string;
    EVENT_ATTACHMENT: (eventId: string, participantId: string) => string;
    EVENT_VOTE: (eventId: string) => string;
    EVENT_RESULTS: (eventId: string) => string;
  };
}

export interface FormData {
  name: string;
  email: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  events?: T;
  message?: string;
  error?: string;
}

// Props para componentes
export interface AuthProps {
  onClose?: () => void;
}

export interface EventsProps {}

export interface EventDetailProps {
  event: Event;
  onClose: () => void;
  onRegistered?: () => void;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
