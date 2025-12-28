import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';  
import './Events.css';
import { Event, EventsProps } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ApiHealthService, EventService } from '../../services/api';


interface EventsComponentProps extends EventsProps {
  onViewEventDetail?: (eventId: string) => void;
}

const Events: React.FC<EventsComponentProps> = ({ onViewEventDetail }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  const { isAuthenticated, user } = useAuth();

  // Reload events when returning to /events page
  useEffect(() => {
    if (location.pathname === '/events') {
      checkApiAndFetchEvents();
    }
  }, [location.pathname]);

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
    // Navegar a la página de detalle del evento
    navigate(`/events/${eventId}`);
  };

  const handleRefresh = (): void => {
    checkApiAndFetchEvents();
  };

  const handleCreateEvent = (): void => {
    navigate('/events/create');
  };

  const getStageDisplayName = (stage: Event['stage']): string => {
    const stages: Record<Event['stage'], string> = {
      'creation': 'Creation',
      'registration': 'Open Registration',
      'attachment_upload': 'File Upload',
      'voting': 'Voting',
      'results': 'Completed'
    };
    return stages[stage] || stage;
  };

  // Separate events into "my events" and "all events"
  const myEvents = user ? events.filter(event => event.creator_id === user.id) : [];
  // Exclude user's own events from 'All Events' tab
  const allEvents = user 
    ? events.filter(event => event.creator_id !== user.id)
    : events;

  const displayEvents = activeTab === 'my' ? myEvents : allEvents;

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
                onClick={handleCreateEvent}
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

          {/* Tabs for My Events / All Events */}
          {isAuthenticated && myEvents.length > 0 && (
            <div className="events-tabs">
              <button
                className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Events ({allEvents.length})
              </button>
              <button
                className={`tab-button ${activeTab === 'my' ? 'active' : ''}`}
                onClick={() => setActiveTab('my')}
              >
                My Events ({myEvents.length})
              </button>
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
          
          {displayEvents.length === 0 && !loading && !error ? (
            <div className="empty-state">
              <p>{activeTab === 'my' ? 'You have not created any events yet.' : 'No events available at this time.'}</p>
              <p>{activeTab === 'my' ? 'Click "Create Event" to get started!' : 'Come back soon for new observation opportunities!'}</p>
            </div>
          ) : (
            <div className="events-table-container">
              <div className="events-table">
                <div className="table-header">
                  <div className="header-cell header-title">Event</div>
                  <div className="header-cell header-date">Date</div>
                  <div className="header-cell header-stage">Stage</div>
                  <div className="header-cell header-participants">Participants</div>
                  <div className="header-cell header-actions">Actions</div>
                </div>

                <div className="table-body">
                  {displayEvents.map((event) => (
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
                            onClick={() => {
                              if (onViewEventDetail) {
                                onViewEventDetail(event.id);
                              } else {
                                navigate(`/events/${event.id}`);
                              }
                            }}
                            title="View full details"
                          >
                            Details
                          </button>

                          {/* Show Manage button if user is the event creator */}
                          {user && event.creator_id === user.id ? (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => navigate(`/events/${event.id}/manage`)}
                              title="Manage event stages and settings"
                            >
                              Manage
                            </button>
                          ) : (
                            /* Show action button for participants based on stage */
                            <>
                              {event.stage === 'registration' && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => navigate(`/events/${event.id}`)}
                                  disabled={!isAuthenticated}
                                  title={!isAuthenticated ? "Log in to participate" : "Register for event"}
                                >
                                  📝 Register
                                </button>
                              )}
                              {event.stage === 'attachment_upload' && isAuthenticated && (
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => navigate(`/events/${event.id}`)}
                                  title="Upload your file"
                                >
                                  📄 Upload File
                                </button>
                              )}
                              {event.stage === 'voting' && isAuthenticated && (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => navigate(`/events/${event.id}`)}
                                  title="Submit your votes"
                                >
                                  ✅ Vote
                                </button>
                              )}
                              {event.stage === 'results' && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => navigate(`/events/${event.id}`)}
                                  title="View results"
                                >
                                  🏆 Results
                                </button>
                              )}
                            </>
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
    </>
  );
};

export default Events;
