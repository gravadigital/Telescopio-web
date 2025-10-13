import React, { useState, useEffect } from 'react';
import { Event, User } from '../types';
import { EventService, ApiHealthService } from '../services/api';
import './EventDetailPage.css';

interface EventDetailPageProps {
  eventId: string;
  onBack: () => void;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({ eventId, onBack }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'timeline'>('overview');

  useEffect(() => {
    fetchEventDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

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
        setError(''); // Clear any previous errors if we got data
        
        // Fetch participants
        try {
          const participantsData = await EventService.getEventParticipants(eventId);
          setParticipants(participantsData);
        } catch (participantError) {
          console.warn('Could not load participants:', participantError);
          // Don't fail the whole page if participants fail to load
          setParticipants([]);
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

  const getStageDisplayName = (stage: Event['stage']): string => {
    const stages: Record<Event['stage'], string> = {
      'registration': 'Open Registration',
      'attachment_upload': 'File Upload',
      'voting': 'Voting',
      'completed': 'Completed'
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

  // Si llegamos aquí, event existe (TypeScript lo infiere)
  if (!event) {
    return null; // Nunca debería pasar, pero TypeScript lo necesita
  }

  return (
    <div className="event-detail-page">
      <div className="event-detail-container">
        {/* Header */}
        <div className="event-detail-header">
          <button onClick={onBack} className="btn btn-secondary btn-sm back-button">
            ← Back to Events
          </button>
          
          <div className="event-header-content">
            <div className="event-title-row">
              <h1>{event.title}</h1>
              <span className={`badge badge-${
                event.stage === 'registration' ? 'success' :
                event.stage === 'attachment_upload' ? 'info' :
                event.stage === 'voting' ? 'warning' : 'primary'
              }`}>
                {getStageDisplayName(event.stage)}
              </span>
            </div>
            <p className="event-subtitle">{event.description}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{participants.length}</h3>
              <p>Participants</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">�</div>
            <div className="stat-content">
              <h3>{event.attachmentCount || 0}</h3>
              <p>Attachments</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">�</div>
            <div className="stat-content">
              <h3>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h3>
              <p>Event Date</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📋 Overview
            </button>
            <button
              className={`tab ${activeTab === 'participants' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('participants')}
            >
              👥 Participants ({participants.length})
            </button>
            <button
              className={`tab ${activeTab === 'timeline' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              ⏱️ Timeline
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <div className="info-section">
                <h3>Event Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Start Date</label>
                    <p>{formatDate(event.date)}</p>
                  </div>
                  <div className="info-item">
                    <label>End Date</label>
                    <p>To be determined</p>
                  </div>
                  <div className="info-item">
                    <label>Location</label>
                    <p>{event.location || 'To be determined'}</p>
                  </div>
                  <div className="info-item">
                    <label>Organizer</label>
                    <p>{event.organizer || 'Not specified'}</p>
                  </div>
                  <div className="info-item">
                    <label>Current Stage</label>
                    <p>{getStageDisplayName(event.stage)}</p>
                  </div>
                  <div className="info-item">
                    <label>Status</label>
                    <p className="status-active">{event.status || 'Active'}</p>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Description</h3>
                <p className="description-text">{event.description}</p>
              </div>

              {event.created_at && (
                <div className="info-section">
                  <h3>Timestamps</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Created</label>
                      <p>{formatDate(event.created_at)}</p>
                    </div>
                    {event.updated_at && (
                      <div className="info-item">
                        <label>Last Updated</label>
                        <p>{formatDate(event.updated_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="participants-content">
              {participants.length === 0 ? (
                <div className="empty-state">
                  <p>No participants registered yet.</p>
                </div>
              ) : (
                <div className="participants-list">
                  {participants.map((participant) => (
                    <div key={participant.id} className="participant-card">
                      <div className="participant-avatar">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="participant-info">
                        <h4>{participant.name}</h4>
                        <p>{participant.email}</p>
                        <span className="badge badge-info">{participant.role}</span>
                      </div>
                      <div className="participant-date">
                        <small>Registered participant</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="timeline-content">
              <div className="timeline">
                <div className={`timeline-item ${event.stage === 'registration' ? 'active' : 'completed'}`}>
                  <div className="timeline-marker"></div>
                  <div className="timeline-content-item">
                    <h4>Registration</h4>
                    <p>Participants register for the event</p>
                  </div>
                </div>
                
                <div className={`timeline-item ${event.stage === 'attachment_upload' ? 'active' : event.stage === 'voting' || event.stage === 'completed' ? 'completed' : ''}`}>
                  <div className="timeline-marker"></div>
                  <div className="timeline-content-item">
                    <h4>File Upload</h4>
                    <p>Participants submit their attachments</p>
                  </div>
                </div>
                
                <div className={`timeline-item ${event.stage === 'voting' ? 'active' : event.stage === 'completed' ? 'completed' : ''}`}>
                  <div className="timeline-marker"></div>
                  <div className="timeline-content-item">
                    <h4>Voting</h4>
                    <p>Participants vote on submissions</p>
                  </div>
                </div>
                
                <div className={`timeline-item ${event.stage === 'completed' ? 'active' : ''}`}>
                  <div className="timeline-marker"></div>
                  <div className="timeline-content-item">
                    <h4>Results</h4>
                    <p>Final results are published</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
