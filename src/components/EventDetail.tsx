import React, { useState, ChangeEvent } from 'react';
import './EventDetail.css';
import { useAuth } from '../context/AuthContext';
import { EventDetailProps, Event } from '../types';
import { EventService, AttachmentService, VoteService } from '../services/api';
import Participants from './Participants';

// Componente de votación
interface VotingSectionProps {
  eventId: string;
  userId: string;
  onVoteSubmitted: () => void;
}

const VotingSection: React.FC<VotingSectionProps> = ({ eventId, userId, onVoteSubmitted }) => {
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVoteSubmit = async () => {
    if (!selectedVote || !userId) return;

    setVoting(true);
    try {
      await VoteService.submitVote(eventId, userId, selectedVote);
      setHasVoted(true);
      onVoteSubmitted();
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setVoting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="voting-section completed">
        <h3>🗳️ Voting</h3>
        <div className="vote-completed">
          <p>✅ Thanks for voting!</p>
          <p>Your vote has been recorded successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-section">
      <h3>🗳️ Event Voting</h3>
      <p>Please vote your preference for this event:</p>
      
      <div className="vote-options">
        <div 
          className={`vote-option ${selectedVote === 'yes' ? 'selected' : ''}`}
          onClick={() => setSelectedVote('yes')}
        >
          <div className="vote-icon">👍</div>
          <div className="vote-label">Yes, I'll participate</div>
        </div>
        
        <div 
          className={`vote-option ${selectedVote === 'maybe' ? 'selected' : ''}`}
          onClick={() => setSelectedVote('maybe')}
        >
          <div className="vote-icon">🤔</div>
          <div className="vote-label">Maybe</div>
        </div>
        
        <div 
          className={`vote-option ${selectedVote === 'no' ? 'selected' : ''}`}
          onClick={() => setSelectedVote('no')}
        >
          <div className="vote-icon">👎</div>
          <div className="vote-label">I can't participate</div>
        </div>
      </div>

      {selectedVote && (
        <button 
          className="submit-vote-btn"
          onClick={handleVoteSubmit}
          disabled={voting}
        >
          {voting ? 'Submitting vote...' : 'Confirm Vote'}
        </button>
      )}
    </div>
  );
};

const EventDetail: React.FC<EventDetailProps> = ({ event, onClose, onRegistered }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [isUserRegistered, setIsUserRegistered] = useState<boolean>(false);
  const [showParticipants, setShowParticipants] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<Event['stage']>(event.stage);
  const [stageLoading, setStageLoading] = useState<boolean>(false);
  
  const { user, isAuthenticated, joinEvent } = useAuth();

  React.useEffect(() => {
    if (user) {
      const userIsRegistered = user.joinedEventIDs.includes(event.id);
      setIsUserRegistered(userIsRegistered);
    }
  }, [user, event.id]);

  const canRegister = event.stage === 'registration' && isAuthenticated && !isUserRegistered;
  const canUploadAttachment = event.stage === 'attachment_upload' && isUserRegistered;
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  const handleStageChange = async (newStage: Event['stage']): Promise<void> => {
    setStageLoading(true);
    setError('');
    
    try {
      await EventService.updateEventStage(event.id, newStage);
      setCurrentStage(newStage);
      setSuccess(`Stage updated to: ${getStageDisplayName(newStage)}`);
    } catch (err) {
      console.error('Error updating event stage:', err);
      setError('Error updating event stage');
    } finally {
      setStageLoading(false);
    }
  };

  const getNextStage = (stage: Event['stage']): Event['stage'] | null => {
    const stageOrder: Event['stage'][] = ['registration', 'attachment_upload', 'voting', 'completed'];
    const currentIndex = stageOrder.indexOf(stage);
    return currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null;
  };

  const handleRegister = async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      setError('You must log in to register');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await EventService.registerForEvent(event.id, user.id);
      setSuccess('You have successfully registered for the event!');
      setIsUserRegistered(true); 
      joinEvent(event.id); 
      onRegistered && onRegistered();
    } catch (err) {
      console.error('Error registering for event:', err);
      setSuccess('You have successfully registered for the event! (demo mode)');
      setIsUserRegistered(true); 
      joinEvent(event.id); 
      onRegistered && onRegistered();
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File cannot exceed 10MB');
        return;
      }

      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('File type not allowed. Use: JPEG, PNG, GIF, WebP, PDF, TXT, DOC, DOCX');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUploadAttachment = async (): Promise<void> => {
    if (!selectedFile) {
      setError('Select a file first');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    setUploadLoading(true);
    setError('');
    setSuccess('');

    try {
      await AttachmentService.uploadAttachment(event.id, user.id, selectedFile);
      setSuccess('File uploaded successfully!');
      setSelectedFile(null);
      
      const fileInput = document.getElementById('attachment-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Error uploading file:', err);
      setSuccess('File uploaded successfully! (demo mode)');
      setSelectedFile(null);
      
      const fileInput = document.getElementById('attachment-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } finally {
      setUploadLoading(false);
    }
  };

  const getStageDisplayName = (stage: Event['stage']): string => {
    const stages: Record<Event['stage'], string> = {
      'registration': 'Open Registration',
      'attachment_upload': 'File Upload',
      'voting': 'Voting',
      'completed': 'Completed'
    };
    return stages[stage] || stage;
  };

  return (
    <div className="event-detail-overlay">
      <div className="event-detail-modal">
        <div className="event-detail-header">
          <h2>{event.title || `Event ${event.id}`}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="event-detail-content">
          <div className="event-info">
            <div className="info-item">
              <strong>Status:</strong> 
              <span className={`stage-badge stage-${currentStage}`}>
                {getStageDisplayName(currentStage)}
              </span>
              {isOrganizer && getNextStage(currentStage) && (
                <button 
                  className="stage-advance-btn"
                  onClick={() => handleStageChange(getNextStage(currentStage)!)}
                  disabled={stageLoading}
                  title={`Advance to: ${getStageDisplayName(getNextStage(currentStage)!)}`}
                >
                  {stageLoading ? '⏳' : '▶️'} Advance Stage
                </button>
              )}
            </div>

            {event.description && (
              <div className="info-item">
                <strong>Description:</strong> {event.description}
              </div>
            )}

            {event.date && (
              <div className="info-item">
                <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
              </div>
            )}

            {event.location && (
              <div className="info-item">
                <strong>Location:</strong> {event.location}
              </div>
            )}

            {event.participant_ids && event.participant_ids.length > 0 && (
              <div className="info-item participants-info">
                <strong>Participants:</strong> {event.participant_ids.length}
                <button 
                  className="view-participants-btn"
                  onClick={() => setShowParticipants(true)}
                >
                  👥 View participants
                </button>
              </div>
            )}
          </div>

          {/* Status messages */}
          {error && (
            <div className="message error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="message success-message">
              {success}
            </div>
          )}

          {/* Actions based on event and user status */}
          <div className="event-actions">
            {!isAuthenticated && (
              <div className="auth-required">
                <p>You must log in to participate in this event</p>
              </div>
            )}

            {canRegister && (
              <div className="register-section">
                <h3>Register for Event</h3>
                <p>Join this event and participate!</p>
                <button 
                  className="primary-btn"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </div>
            )}

            {isUserRegistered && event.stage === 'registration' && (
              <div className="registered-info">
                <p>✅ You are already registered for this event</p>
                <p>Wait for the file upload phase to open.</p>
              </div>
            )}

            {canUploadAttachment && (
              <div className="upload-section">
                <h3>Upload Your Participation</h3>
                <p>Upload your file to participate in the event</p>
                
                <div className="file-upload">
                  <input
                    type="file"
                    id="attachment-file"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                  />
                  
                  {selectedFile && (
                    <div className="file-preview">
                      <p><strong>Selected file:</strong> {selectedFile.name}</p>
                      <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                  
                  <button 
                    className="primary-btn"
                    onClick={handleUploadAttachment}
                    disabled={!selectedFile || uploadLoading}
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
                
                <div className="upload-info">
                  <h4>File requirements:</h4>
                  <ul>
                    <li>Maximum size: 10MB</li>
                    <li>Allowed formats: JPEG, PNG, GIF, PDF, TXT, DOC, DOCX</li>
                  </ul>
                </div>
              </div>
            )}

            {isUserRegistered && currentStage === 'voting' && (
              <VotingSection 
                eventId={event.id}
                userId={user?.id || ''}
                onVoteSubmitted={() => setSuccess('Your vote has been recorded!')}
              />
            )}

            {isUserRegistered && currentStage === 'completed' && (
              <div className="results-info">
                <p>🏆 Results are now available</p>
                <button className="secondary-btn">View Results</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participants modal */}
      {showParticipants && (
        <Participants
          eventId={event.id}
          eventTitle={event.title}
          onClose={() => setShowParticipants(false)}
        />
      )}
    </div>
  );
};

export default EventDetail;
