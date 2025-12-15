import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EventService, AttachmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Event, User } from '../types';
import './ManageEventPage.css';

const ManageEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [votingStatus, setVotingStatus] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [updatingStage, setUpdatingStage] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/events');
      return;
    }

    if (eventId) {
      loadEventData();
    }
  }, [eventId, isAuthenticated, navigate]);

  const loadEventData = async (): Promise<void> => {
    if (!eventId) return;

    setLoading(true);
    setError('');

    try {
      // Load event details
      const eventData = await EventService.getEventById(eventId);

      // Check if event exists
      if (!eventData) {
        setError('Event not found.');
        setLoading(false);
        return;
      }

      // Check if user is the creator
      if (eventData.creator_id !== user?.id) {
        setError('You do not have permission to manage this event.');
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Load participants
      try {
        const participantsData = await EventService.getEventParticipants(eventId);
        setParticipants(participantsData);
      } catch (err) {
        console.warn('Could not load participants:', err);
        setParticipants([]);
      }
      
      // Load attachments
      try {
        console.log('🔄 Loading attachments for event:', eventId);
        const attachmentsData = await AttachmentService.getEventAttachments(eventId);
        console.log('📎 Raw attachments data:', attachmentsData);
        console.log('📊 Attachment count:', attachmentsData.length);
        console.log('📋 Attachment details:', attachmentsData.map(a => ({
          id: a.id,
          participant_id: a.participant_id,
          author_id: a.author_id,
          filename: a.filename
        })));
        setAttachments(attachmentsData);
      } catch (err: any) {
        console.error('❌ Failed to load attachments:', err);
        console.error('Error details:', err.message);
        setAttachments([]);
      }

      // Load voting statistics if in voting or results stage
      if (eventData.stage === 'voting' || eventData.stage === 'results') {
        try {
          const response = await fetch(`http://localhost:8080/api/v1/events/${eventId}/voting-statistics`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('telescopio_token')}`
            }
          });
          if (response.ok) {
            const statsData = await response.json();
            if (statsData.data && statsData.data.participant_voting_status) {
              setVotingStatus(statsData.data.participant_voting_status);
            }
          }
        } catch (err) {
          console.warn('Could not load voting statistics:', err);
        }
      }
    } catch (err) {
      console.error('Error loading event:', err);
      setError('Error loading event data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (newStage: Event['stage']): Promise<void> => {
    if (!eventId || !event) return;

    setUpdatingStage(true);
    setError('');

    try {
      await EventService.updateEventStage(eventId, newStage);

      // Reload event data
      await loadEventData();

      console.log(`Event stage updated to: ${newStage}`);
    } catch (err) {
      console.error('Error updating stage:', err);
      setError('Error updating event stage. Please try again.');
    } finally {
      setUpdatingStage(false);
    }
  };

const getNextStage = (currentStage: Event['stage']): Event['stage'] | null => {
  const stageOrder: Event['stage'][] = ['creation', 'registration', 'attachment_upload', 'voting', 'results'];
  const currentIndex = stageOrder.indexOf(currentStage);

  if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
    return stageOrder[currentIndex + 1];
  }

  return null;
};

const getStageName = (stage: Event['stage']): string => {
  const stageNames: Record<Event['stage'], string> = {
    'creation': 'Creation',
    'registration': 'Registration',
    'attachment_upload': 'File Upload',
    'voting': 'Voting',
    'results': 'Results'
  };
  return stageNames[stage] || stage;
};

  const handleBack = (): void => {
    navigate(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <div className="manage-event-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading event...</h2>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="manage-event-page">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/events')} className="btn btn-primary">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="manage-event-page">
        <div className="error-state">
          <h2>Event not found</h2>
          <button onClick={() => navigate('/events')} className="btn btn-primary">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const nextStage = getNextStage(event.stage);

  return (
    <div className="manage-event-page">
      <div className="manage-event-container">
        {/* Header */}
        <div className="manage-header">
          <button onClick={handleBack} className="btn btn-secondary btn-sm back-button">
            ← Back to Event Details
          </button>
          <h1>Manage Event</h1>
          <p className="subtitle">Control event stages and view participants</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger">
            <p>{error}</p>
          </div>
        )}

        {/* Event Info Card */}
        <div className="event-info-card">
          <h2>{event.title}</h2>
          <p className="event-description">{event.description}</p>

          <div className="event-meta">
            <div className="meta-item">
              <span className="meta-label">Date:</span>
              <span className="meta-value">
                {new Date(event.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Current Stage:</span>
              <span className={`badge badge-${
                event.stage === 'registration' ? 'success' :
                event.stage === 'attachment_upload' ? 'info' :
                event.stage === 'voting' ? 'warning' : 'primary'
              }`}>
                {getStageName(event.stage)}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Participants:</span>
              <span className="meta-value">{participants.length}</span>
            </div>
            
            <div className="meta-item">
              <span className="meta-label">Files Submitted:</span>
              <span className="meta-value">
                {new Set(attachments.map(a => a.participant_id)).size} / {participants.length}
              </span>
            </div>
          </div>
        </div>

        {/* Stage Control Section */}
        <div className="stage-control-section">
          <h3>Event Stage Control</h3>

          <div className="stage-flow">
            <div className={`stage-item ${
              event.stage === 'registration' ? 'active' :
              (event.stage === 'attachment_upload' || event.stage === 'voting' || event.stage === 'results') ? 'completed' : ''
            }`}>
              <div className="stage-number">1</div>
              <div className="stage-name">Registration</div>
            </div>
            <div className="stage-arrow">→</div>

            <div className={`stage-item ${
              event.stage === 'attachment_upload' ? 'active' :
              (event.stage === 'voting' || event.stage === 'results') ? 'completed' : ''
            }`}>
              <div className="stage-number">2</div>
              <div className="stage-name">File Upload</div>
            </div>
            <div className="stage-arrow">→</div>

            <div className={`stage-item ${
              event.stage === 'voting' ? 'active' :
              event.stage === 'results' ? 'completed' : ''
            }`}>
              <div className="stage-number">3</div>
              <div className="stage-name">Voting</div>
            </div>
            <div className="stage-arrow">→</div>

            <div className={`stage-item ${event.stage === 'results' ? 'active' : ''}`}>
              <div className="stage-number">4</div>
              <div className="stage-name">Results</div>
            </div>
          </div>

          <div className="stage-actions">
            {nextStage && (
              <button
                onClick={() => handleUpdateStage(nextStage)}
                disabled={updatingStage}
                className="btn btn-primary btn-lg"
              >
                {updatingStage ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Updating...
                  </>
                ) : (
                  `Advance to ${getStageName(nextStage)}`
                )}
              </button>
            )}

            {event.stage !== 'results' && (
              <button
                onClick={() => handleUpdateStage('results')}
                disabled={updatingStage}
                className="btn btn-danger btn-lg"
              >
                {updatingStage ? 'Updating...' : 'Move to Results'}
              </button>
            )}

            {event.stage === 'results' && (
              <div className="completed-message">
                <span className="completed-icon">✓</span>
                Event has reached final results
              </div>
            )}
          </div>
        </div>

        {/* Participants Section */}
        <div className="participants-section">
          <h3>Registered Participants ({participants.length})</h3>

          {participants.length === 0 ? (
            <div className="empty-state">
              <p>No participants have registered yet.</p>
              <p>Share the event link to invite participants!</p>
            </div>
          ) : (
            <div className="participants-table">
              <div className="table-header">
                <div className="header-cell">Name</div>
                <div className="header-cell">Email</div>
                <div className="header-cell">Role</div>
                <div className="header-cell">File Status</div>
                <div className="header-cell">Voting Status</div>
                <div className="header-cell">Joined</div>
              </div>

              <div className="table-body">
                {participants.map((participant) => {
                  const hasSubmittedFile = attachments.some(
                    att => att.participant_id === participant.id || att.author_id === participant.id
                  );
                  
                  // Get real voting status from backend
                  const hasVoted = votingStatus[participant.id] === true;
                  
                  return (
                  <div key={participant.id} className="table-row">
                    <div className="table-cell">
                      {participant.name}
                    </div>
                    <div className="table-cell">{participant.email}</div>
                    <div className="table-cell">
                      <span className="badge badge-secondary">
                        {participant.role}
                      </span>
                    </div>
                    <div className="table-cell">
                      {hasSubmittedFile ? (
                        <span className="badge badge-success">✓ Submitted</span>
                      ) : (
                        <span className="badge badge-warning">⏳ Pending</span>
                      )}
                    </div>
                    <div className="table-cell">
                      {event.stage === 'voting' || event.stage === 'results' ? (
                        hasVoted ? (
                          <span className="badge badge-success">✓ Voted</span>
                        ) : (
                          <span className="badge badge-warning">⏳ Not Voted</span>
                        )
                      ) : (
                        <span className="badge badge-secondary">N/A</span>
                      )}
                    </div>
                    <div className="table-cell">
                      Registered
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageEventPage;
