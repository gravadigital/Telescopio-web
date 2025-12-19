
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
  stage: 'creation' | 'registration' | 'attachment_upload' | 'voting' | 'results';
  date: string;
  organizer?: string;
  status?: 'active' | 'cancelled' | 'completed';
  participant_ids?: string[];
  voteCount?: {
    yes: number;
    maybe: number;
    no: number;
  };
  attachmentCount?: number;
  max_participants?: number;
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
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
    USERS: string;
    USER_AUTHENTICATE: string;
    EVENT_REGISTER: (eventId: string) => string;
    EVENT_STAGE: (eventId: string) => string;
    EVENT_PARTICIPANTS: (eventId: string) => string;
    EVENT_ATTACHMENT: (eventId: string, participantId: string) => string;
    EVENT_VOTE: (eventId: string) => string;
    EVENT_RESULTS: (eventId: string) => string;

    // Nuevos endpoints del sistema de votación distribuida
    VOTING_CONFIG: (eventId: string) => string;
    GENERATE_ASSIGNMENTS: (eventId: string) => string;
    GET_ASSIGNMENT: (eventId: string, participantId: string) => string;
    SUBMIT_RANKING_VOTES: (eventId: string, participantId: string) => string;
    DISTRIBUTED_RESULTS: (eventId: string) => string;
    VOTING_STATISTICS: (eventId: string) => string;
    UPLOAD_ATTACHMENT: (eventId: string, participantId: string) => string;
    EVENT_ATTACHMENTS: (eventId: string) => string;
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
  initialMode?: 'login' | 'register';
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

// ========================================
// Sistema de Votación Distribuida (MBC)
// ========================================

export interface VotingConfiguration {
  id: string;
  event_id: string;
  attachments_per_evaluator: number;        // m parameter
  quality_good_threshold: number;            // Q_good (0-1)
  quality_bad_threshold: number;             // Q_bad (0-1)
  adjustment_magnitude: number;              // n parameter
  min_evaluations_per_file: number;
  created_at?: string;
  updated_at?: string;
}

export interface Assignment {
  id: string;
  event_id: string;
  participant_id: string;
  attachment_ids: string[];                  // Array de UUIDs
  assignment_round: number;
  is_completed: boolean;
  completed_at?: string | null;
  quality_score?: number | null;            // Q_i score (0-1)
  expertise_match_score?: number | null;
  conflict_of_interest: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RankingVote {
  attachment_id: string;
  rank: number;                              // 1 = best, higher numbers = worse
  score?: number | null;
  confidence?: number | null;
  notes?: string;
}

export interface AttachmentResult {
  attachment_id: string;
  filename: string;
  participant_id: string;
  participant_name?: string;                 // Name of who uploaded the file
  mbc_score: number;                         // Modified Borda Count score
  global_rank: number;
  adjusted_rank: number;
  vote_count: number;
  average_rank: number;
}

export interface VotingResults {
  id: string;
  event_id: string;
  global_ranking: AttachmentResult[];
  participant_qualities: { [participantId: string]: number };
  adjusted_ranking: AttachmentResult[];
  total_participants: number;
  attachments_per_evaluator: number;
  calculated_at: string;
  updated_at?: string;
}

export interface Attachment {
  id: string;
  event_id: string;
  participant_id: string;
  original_name: string;
  stored_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  url?: string;
}

export interface VotingStatistics {
  total_assignments: number;
  completed_assignments: number;
  total_votes: number;
  completion_rate: number;
  average_quality_score: number;
  participants_with_good_quality: number;
  participants_with_bad_quality: number;
  participant_voting_status?: { [participantId: string]: boolean };
}
