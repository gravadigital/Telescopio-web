import React, { useState, useEffect } from 'react';
import './Events.css';
import EventDetail from './EventDetail';
import { useAuth } from '../context/AuthContext';
import { Event, EventsProps } from '../types';
import { EventService, ApiHealthService } from '../services/api';

interface CreateEventModalProps {
  onClose: () => void;
  onCreate: (eventData: {
    name: string;
    description: string;
    date: string;
    location?: string;
    organizer?: string;
  }) => Promise<void>;
  creating: boolean;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onCreate, creating }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    organizer: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="create-event-modal">
        <div className="modal-header">
          <h2>✨ Create New Event</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="create-event-form">
          <div className="form-group">
            <label>🔭 Event Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Jupiter Observation 2026"
            />
          </div>

          <div className="form-group">
            <label>📝 Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the astronomical event..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>📅 Start Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>📍 Location:</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Event location (optional)"
            />
          </div>

          <div className="form-group">
            <label>👨‍💼 Organizer:</label>
            <input
              type="text"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
              placeholder="Organizer name (optional)"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="submit-btn">
              {creating ? 'Creating...' : '🚀 Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Events: React.FC<EventsProps> = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    checkApiAndFetchEvents();
  }, []);

  const checkApiAndFetchEvents = async (): Promise<void> => {
    setLoading(true);
    setError('');
    
    try {
      const isHealthy = await ApiHealthService.checkHealth();
      
      if (isHealthy) {
        console.log('🟢 API is available, loading events from server...');
      } else {
        console.log('🟡 API not available, using demo data...');
      }
      
      const eventsData = await EventService.getAllEvents();
      setEvents(eventsData);
      
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Error loading events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEvent = (eventId: string): void => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
    }
  };

  const handleEventRegistered = (): void => {
    // Refresh event list after registration
    checkApiAndFetchEvents();
  };

  const handleRefresh = (): void => {
    checkApiAndFetchEvents();
  };

  const handleCreateEvent = async (eventData: {
    name: string;
    description: string;
    date: string;
    location?: string;
    organizer?: string;
  }): Promise<void> => {
    setCreating(true);
    setError(''); 
    
    try {
      const newEvent = await EventService.createEvent(eventData);
      setShowCreateModal(false);
      
      console.log('✅ Event created successfully:', newEvent);
      
      await checkApiAndFetchEvents();
      
      setError(''); 
      setSuccessMessage(`🎉 Event "${eventData.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000); 
            
    } catch (error) {
      console.error('Error creating event:', error);
      setError('❌ Error creating event. Please try again.');
    } finally {
      setCreating(false);
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

  const getStageIcon = (stage: Event['stage']): string => {
    const icons: Record<Event['stage'], string> = {
      'registration': '📝',
      'attachment_upload': '📤', 
      'voting': '🗳️',
      'completed': '🏆'
    };
    return icons[stage] || '📅';
  };

  if (loading) {
    return (
      <div className="events-container">
        <div className="events-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h2>Loading events...</h2>
            <p>Connecting to server...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="events-container">
        <div className="events-content">
          <div className="events-header">
            <h1>🔭 Telescopio Events</h1>
            
            <div className="events-controls">              
              <button 
                className="create-btn"
                onClick={() => setShowCreateModal(true)}
                disabled={!isAuthenticated}
                title={!isAuthenticated ? "Log in to create events" : ""}
              >
                ✨ Create Event
              </button>
              
              <button 
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="success-message">
              <p>✅ {successMessage}</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
              <button onClick={handleRefresh} className="retry-btn">
                Retry
              </button>
            </div>
          )}
          
          {events.length === 0 && !loading && !error ? (
            <div className="empty-state">
              <p>🌌 No events available at this time.</p>
              <p>Come back soon for new observation opportunities!</p>
            </div>
          ) : (
            <div className="events-list">
              {events.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h3>{event.title}</h3>
                    <span className={`event-stage stage-${event.stage}`}>
                      {getStageIcon(event.stage)} {getStageDisplayName(event.stage)}
                    </span>
                  </div>
                  
                  <div className="event-details">
                    <p className="event-description">
                      <strong>📝 Description:</strong> {event.description}
                    </p>
                    <p className="event-date">
                      <strong>📅 Date:</strong> {(() => {
                        try {
                          const date = new Date(event.date);
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
                      })()}
                    </p>
                    <p className="event-location">
                      <strong>📍 Location:</strong> {event.location}
                    </p>
                    {event.participant_ids && event.participant_ids.length > 0 && (
                      <p className="event-participants">
                        <strong>👥 Participants:</strong> {event.participant_ids.length}
                      </p>
                    )}
                  </div>

                  <div className="event-actions">
                    <button 
                      className="details-btn"
                      onClick={() => setSelectedEvent(event)}
                    >
                      🔍 View Details
                    </button>
                    
                    {event.stage === 'registration' && (
                      <button 
                        className={`register-btn ${!isAuthenticated ? 'disabled' : ''}`}
                        onClick={() => handleRegisterEvent(event.id)}
                        disabled={!isAuthenticated}
                        title={!isAuthenticated ? "Log in to participate" : ""}
                      >
                        {isAuthenticated ? '🚀 Join' : '🔐 Log in to participate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegistered={handleEventRegistered}
        />
      )}

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateEvent}
          creating={creating}
        />
      )}
    </>
  );
};

export default Events;
