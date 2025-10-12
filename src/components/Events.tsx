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
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Create New Event</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Event Name:</label>
            <input
              className="form-input"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Jupiter Observation 2026"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description:</label>
            <textarea
              className="form-textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the astronomical event..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Start Date:</label>
            <input
              className="form-input"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location:</label>
            <input
              className="form-input"
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Event location (optional)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Organizer:</label>
            <input
              className="form-input"
              type="text"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
              placeholder="Organizer name (optional)"
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn btn-primary">
              {creating ? 'Creating...' : 'Create Event'}
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
        console.log('API is available, loading events from server...');
      } else {
        console.log('API not available, using demo data...');
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
      
      console.log('Event created successfully:', newEvent);
      
      await checkApiAndFetchEvents();
      
      setError(''); 
      setSuccessMessage(`Event "${eventData.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000); 
            
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Error creating event. Please try again.');
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
            <h1>Telescopio Events</h1>
            
            <div className="events-controls">              
              <button 
                className="btn btn-warning btn-md"
                onClick={() => setShowCreateModal(true)}
                disabled={!isAuthenticated}
                title={!isAuthenticated ? "Log in to create events" : ""}
              >
                Create Event
              </button>
              
              <button 
                className="btn btn-secondary btn-md"
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="alert alert-success">
              <p>{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              <p>{error}</p>
              <button onClick={handleRefresh} className="btn btn-danger btn-sm">
                Retry
              </button>
            </div>
          )}
          
          {events.length === 0 && !loading && !error ? (
            <div className="empty-state">
              <p>No events available at this time.</p>
              <p>Come back soon for new observation opportunities!</p>
            </div>
          ) : (
            <div className="events-table-container">
              <div className="events-table">
                <div className="table-header">
                  <div className="header-cell header-title">Event</div>
                  <div className="header-cell header-date">Date</div>
                  <div className="header-cell header-location">Location</div>
                  <div className="header-cell header-stage">Stage</div>
                  <div className="header-cell header-participants">Participants</div>
                  <div className="header-cell header-actions">Actions</div>
                </div>
                
                <div className="table-body">
                  {events.map((event) => (
                    <div key={event.id} className="table-row">
                      <div className="table-cell cell-title">
                        <div className="event-title-section">
                          <h3>{event.title}</h3>
                          <p className="event-description-preview">{event.description}</p>
                        </div>
                      </div>
                      
                      <div className="table-cell cell-date">
                        <span className="cell-label">Date:</span>
                        {(() => {
                          try {
                            const date = new Date(event.date);
                            return isNaN(date.getTime()) 
                              ? 'TBD' 
                              : date.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                });
                          } catch {
                            return 'TBD';
                          }
                        })()}
                      </div>
                      
                      <div className="table-cell cell-location">
                        <span className="cell-label">Location:</span>
                        <span className="location-text">{event.location}</span>
                      </div>
                      
                      <div className="table-cell cell-stage">
                        <span className="cell-label">Stage:</span>
                        <span className={`badge badge-${
                          event.stage === 'registration' ? 'success' : 
                          event.stage === 'attachment_upload' ? 'info' : 
                          event.stage === 'voting' ? 'warning' : 'primary'
                        }`}>
                          {getStageDisplayName(event.stage)}
                        </span>
                      </div>
                      
                      <div className="table-cell cell-participants">
                        <span className="cell-label">Participants:</span>
                        <span className="participants-count">
                          {event.participant_ids?.length || 0}
                          {event.max_participants && ` / ${event.max_participants}`}
                        </span>
                      </div>
                      
                      <div className="table-cell cell-actions">
                        <div className="action-buttons">
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedEvent(event)}
                            title="View full details"
                          >
                            Details
                          </button>
                          
                          {event.stage === 'registration' && (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleRegisterEvent(event.id)}
                              disabled={!isAuthenticated}
                              title={!isAuthenticated ? "Log in to participate" : "Join this event"}
                            >
                              Join
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
