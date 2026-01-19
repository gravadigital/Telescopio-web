import React, { useState, useEffect, ChangeEvent } from 'react';
import { Event } from '../../types';
import { EventService, ApiHealthService, AttachmentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Participants from '../../components/participants/Participants';
import VotingConfigurationPanel from '../../components/voting-configuration-panel/VotingConfigurationPanel';
import RankingVotePanel from '../../components/ranking-vote-panel/RankingVotePanel';
import VotingResultsPanel from '../../components/voting-results-panel/VotingResultsPanel';
import './EventDetailPage.css';
import ShareButton from '../../components/ShareButton';

interface EventDetailPageProps {
  eventId: string;
  onBack: () => void;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({ eventId, onBack }) => {
  const { user, isAuthenticated, joinEvent, openAuthModal } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [isUserRegistered, setIsUserRegistered] = useState<boolean>(false);
  const [showParticipants, setShowParticipants] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<Event['stage'] | null>(null);
  const [stageLoading, setStageLoading] = useState<boolean>(false);
  const [votingConfigured, setVotingConfigured] = useState<boolean>(false);
  const [userHasSubmittedFile, setUserHasSubmittedFile] = useState<boolean>(false);

  useEffect(() => {
    fetchEventDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    if (user && event) {
      // Check if user is registered in multiple ways:
      // 1. User's joinedEventIDs includes this event (synced from backend via AuthContext)
      // 2. Event's participant_ids includes this user
      const inJoinedEvents = user.joinedEventIDs.includes(event.id);
      const inParticipantList = event.participant_ids?.includes(user.id) || false;
      const userIsRegistered = inJoinedEvents || inParticipantList;
      
      console.log('🔍 EventDetailPage - Registration check:', {
        eventId: event.id,
        userId: user.id,
        userName: user.name,
        inJoinedEvents,
        inParticipantList,
        userIsRegistered,
        stage: event.stage,
        participant_ids: event.participant_ids
      });
      
      setIsUserRegistered(userIsRegistered);
    }
  }, [user, event, joinEvent]);

  const fetchEventDetails = async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const isHealthy = await ApiHealthService.checkHealth();

      if (!isHealthy) {
        console.warn('⚠️ API health check failed - backend may be unavailable');
        setError('Unable to connect to the server. Using cached data if available.');
      }

      // Fetch event
      const eventData = await EventService.getEventById(eventId);

      if (eventData) {
        setEvent(eventData);
        setCurrentStage(eventData.stage);
        setError(''); // Clear any previous errors if we got data
        
        // Check if current user has submitted a file
        if (user && eventData.stage === 'participation') {
          try {
            const attachments = await AttachmentService.getEventAttachments(eventId);
            const userAttachment = attachments.find((att: any) => 
              att.participant_id === user.id || att.author_id === user.id
            );
            setUserHasSubmittedFile(!!userAttachment);
          } catch (err) {
            console.warn('Could not check user attachment status:', err);
            setUserHasSubmittedFile(false);
          }
        }
      } else {
        setError(`Event with ID "${eventId}" was not found. It may have been deleted or the ID is incorrect.`);
      }

    } catch (err) {
      console.error('❌ Error fetching event details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load event details: ${errorMessage}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (newStage: Event['stage']): Promise<void> => {
    if (!event) return;

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
    const stageOrder: Event['stage'][] = ['creation', 'participation', 'voting', 'results'];
    const currentIndex = stageOrder.indexOf(stage);
    return currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null;
  };

  const handleRegister = async (): Promise<void> => {
    if (!isAuthenticated || !user || !event) {
      setError('You must log in to register');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await EventService.registerForEvent(event.id, user.name, user.email);
      setSuccess('Successfully registered! You can now upload your file.');
      setIsUserRegistered(true);
      
      // Update user in context
      if (joinEvent) {
        joinEvent(event.id);
      }
      
      // Refresh event details
      await fetchEventDetails();
    } catch (err) {
      console.error('Error registering for event:', err);
      setError('Failed to register for the event. Please try again.');
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
    if (!selectedFile || !event) {
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
      
      // Reload event data to update attachment count
      await fetchEventDetails();
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const errorMessage = err?.message || 'Failed to upload file. Please try again.';
      setError(`Upload failed: ${errorMessage}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const getStageDisplayName = (stage: Event['stage']): string => {
    const stages: Record<Event['stage'], string> = {
      'creation': 'Creation',
      'participation': 'Participation',
      'voting': 'Voting',
      'results': 'Results'
    };
    return stages[stage] || stage;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? 'Date to be determined'
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          });
    } catch {
      return 'Date to be determined';
    }
  };

  // Formatear fecha estimativa con tiempo relativo (S-003)
  const formatEstimatedDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    
    // Normalizar a medianoche para comparación de días
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Formatear la fecha
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Calcular texto relativo
    let relative = '';
    if (diffDays === 0) {
      relative = '(today)';
    } else if (diffDays === 1) {
      relative = '(tomorrow)';
    } else if (diffDays > 1) {
      relative = `(in ${diffDays} days)`;
    } else if (diffDays === -1) {
      relative = '(yesterday)';
    } else {
      relative = `(${Math.abs(diffDays)} days ago)`;
    }
    
    return `${formattedDate} ${relative}`;
  };

  // Obtener fecha de deadline de la etapa actual (S-003)
  const getCurrentStageDeadline = (): string | null => {
    if (!event) return null;
    
    if (currentStage === 'participation' && event.participation_estimated_end_date) {
      return event.participation_estimated_end_date;
    }
    
    if (currentStage === 'voting' && event.voting_estimated_end_date) {
      return event.voting_estimated_end_date;
    }
    
    return null;
  };

  // Obtener clase CSS según urgencia del deadline (S-003)
  const getDeadlineCardClass = (): string => {
    const deadline = getCurrentStageDeadline();
    if (!deadline) return 'info-card deadline-card';
    
    const date = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'info-card deadline-card urgent'; // Pasó
    } else if (diffDays === 0) {
      return 'info-card deadline-card today'; // Hoy
    } else if (diffDays <= 2) {
      return 'info-card deadline-card urgent'; // Próximo
    }
    
    return 'info-card deadline-card';
  };

  if (loading) {
    return (
      <div className="event-detail-page">
        <div className="event-detail-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h2>Loading event details...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && !event) {
    return (
      <div className="event-detail-page">
        <div className="event-detail-container">
          <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: '20px' }}>
            ← Back to Events
          </button>

          <div className="alert alert-danger">
            <h3 style={{ marginTop: 0 }}>⚠️ Unable to Load Event</h3>
            <p style={{ marginBottom: '20px' }}>{error || 'Event not found'}</p>

            <div style={{
              padding: '15px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              fontFamily: 'monospace'
            }}>
              <strong>Event ID:</strong> {eventId}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onBack} className="btn btn-secondary">
                ← Back to Events List
              </button>
              <button onClick={fetchEventDetails} className="btn btn-primary">
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si llegamos aquí, event existe
  if (!event || !currentStage) {
    return null;
  }

  const isEventCreator = user?.id === event.creator_id;
  const canRegister = currentStage === 'participation' && isAuthenticated && !isUserRegistered && !isEventCreator;
  
  const canUploadAttachment = currentStage === 'participation' && isAuthenticated && isUserRegistered && !userHasSubmittedFile && !isEventCreator;
  const isOrganizer = isEventCreator || user?.role === 'admin';
  const nextStage = getNextStage(currentStage);
  
  console.log('🎯 EventDetailPage - User permissions:', {
    canRegister,
    canUploadAttachment,
    isUserRegistered,
    isEventCreator,
    isOrganizer,
    stage: currentStage,
    isAuthenticated,
    userId: user?.id,
    creatorId: event.creator_id,
    userRole: user?.role,
    votingConfigured,
    debugInfo: {
      userIdMatches: user?.id === event.creator_id,
      isAdmin: user?.role === 'admin',
      calculatedOrganizer: (user?.id === event.creator_id) || (user?.role === 'admin')
    }
  });

  return (
    <div className="event-detail-page">
      <div className="event-detail-container">
        {/* Header */}
        <div className="event-detail-page-header">
          <button onClick={onBack} className="btn btn-secondary btn-sm back-button">
            ← Back to Events
          </button>

          <div className="event-header-content">
            <div className="event-title-row">
              <h1>{event.title}</h1>
              <div className="header-badges">
                <ShareButton eventId={event.id} eventTitle={event.title} />
                <span className={`badge badge-${
                  currentStage === 'participation' ? 'success' :
                  currentStage === 'voting' ? 'warning' : 'primary'
                }`}>
                  {getStageDisplayName(currentStage)}
                </span>

                {isOrganizer && nextStage && (
                  <button
                    className="stage-advance-btn"
                    onClick={() => handleStageChange(nextStage)}
                    disabled={stageLoading}
                  >
                    {stageLoading ? '⏳ Updating...' : `▶️ Advance Stage`}
                  </button>
                )}
              </div>
            </div>
            <p className="event-subtitle">{event.description}</p>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="alert alert-success">
            <p>{success}</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <p>{error}</p>
          </div>
        )}

        {/* Event Info */}
        <div className="event-info-section">
          <div className="info-grid">
            <div className="info-card">
              <label>📅 Date</label>
              <p>{formatDate(event.date)}</p>
            </div>
            <div className="info-card">
              <label>👥 Participants</label>
              <p>
                {event.participant_ids?.length || 0} / {event.max_participants || 20}
                {event.participant_ids && event.participant_ids.length > 0 && (
                  <button
                    className="view-participants-btn"
                    onClick={() => setShowParticipants(!showParticipants)}
                  >
                    {showParticipants ? 'Hide' : 'View'}
                  </button>
                )}
              </p>
            </div>
            <div className="info-card">
              <label>👤 Organizer</label>
              <p>{event.organizer || 'Not specified'}</p>
            </div>
            
            {/* Stage Deadline - S-003 */}
            {getCurrentStageDeadline() && (
              <div className={getDeadlineCardClass()}>
                <label>⏰ Stage Deadline</label>
                <p className="deadline-date">
                  {formatEstimatedDate(getCurrentStageDeadline()!)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Participants Section */}
        {showParticipants && (
          <Participants
            eventId={event.id}
            eventTitle={event.title}
            onClose={() => setShowParticipants(false)}
          />
        )}

        {/* Stage-specific Actions */}
        <div className="event-actions">
          {!isAuthenticated && (
            <div className="auth-required">
              <p>Log in to participate in this event</p>
            </div>
          )}

          {/* Participation Stage - Unified Registration and Upload */}
          {currentStage === 'participation' && !isEventCreator && (
            <div className="participation-section">
              {!isUserRegistered ? (
                // User not registered - show registration
                <div className="register-section">
                  <h3>📝 Event Participation</h3>
                  <p>Register to participate and upload your file.</p>
                  <button
                    className="primary-btn"
                    onClick={() => {
                      if (isAuthenticated) {
                        handleRegister();
                      } else {
                        openAuthModal('login');
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Participate'}
                  </button>
                </div>
              ) : (
                // User registered - show upload section
                <div className="upload-section">
                  <div className="registered-info">
                    <h3>✅ You're Registered</h3>
                    <p>You can now upload your file for this event.</p>
                  </div>

                  <h3>📎 Upload File</h3>
                  
                  {userHasSubmittedFile ? (
                    <div className="message success-message">
                      ✅ You have already submitted your file for this event. Only one submission is allowed per participant.
                    </div>
                  ) : (
                    <>
                      <p>Upload your submission for this event.</p>

                      <div className="file-upload">
                        <input
                          id="attachment-file"
                          type="file"
                          onChange={handleFileChange}
                          disabled={uploadLoading || !canUploadAttachment}
                          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx"
                        />

                        {selectedFile && (
                          <div className="file-preview">
                            <strong>Selected file:</strong> {selectedFile.name}
                            ({(selectedFile.size / 1024).toFixed(2)} KB)
                          </div>
                        )}

                        <button
                          className="primary-btn"
                          onClick={handleUploadAttachment}
                          disabled={uploadLoading || !selectedFile || !canUploadAttachment}
                        >
                          {uploadLoading ? 'Uploading...' : 'Upload File'}
                        </button>
                      </div>

                      <div className="upload-info">
                        <h4>📋 Allowed file types:</h4>
                        <ul>
                          <li>Images: JPEG, PNG, GIF, WebP</li>
                          <li>Documents: PDF, TXT, DOC, DOCX</li>
                          <li>Maximum size: 10 MB</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Voting Stage - MBC Configuration (Organizers) */}
          {currentStage === 'voting' && isOrganizer && !votingConfigured && (
            <VotingConfigurationPanel
              eventId={event.id}
              totalAttachments={event.attachmentCount || 0}
              totalParticipants={event.participant_ids?.length || 0}
              onConfigured={() => {
                setVotingConfigured(true);
                setSuccess('✅ Voting configuration completed! Participants can now submit their rankings.');
              }}
            />
          )}

          {/* Voting Stage - MBC Configuration Done (Organizers) */}
          {currentStage === 'voting' && isOrganizer && votingConfigured && (
            <div className="voting-configured-info">
              <h3>✅ Voting System Configured</h3>
              <p>The distributed voting system has been configured successfully.</p>
              <p>Participants can now rank their assigned attachments.</p>
              <p>Once all participants have voted, you can advance to the "Results" stage to see results.</p>
            </div>
          )}

          {/* Voting Stage - Ranking Panel (Participants) */}
          {currentStage === 'voting' && isUserRegistered && !isOrganizer && (
            <RankingVotePanel
              eventId={event.id}
              participantId={user?.id || ''}
              onVotesSubmitted={() => {
                setSuccess('✅ Your rankings have been submitted successfully!');
              }}
            />
          )}

          {/* Results Stage - Final Results */}
          {currentStage === 'results' && (
            <VotingResultsPanel eventId={event.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
