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
          <h2>✨ Crear Nuevo Evento</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="create-event-form">
          <div className="form-group">
            <label>🔭 Nombre del Evento:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="ej. Observación de Júpiter 2026"
            />
          </div>

          <div className="form-group">
            <label>📝 Descripción:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe el evento astronómico..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>📅 Fecha de inicio:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>📍 Ubicación:</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Ubicación del evento (opcional)"
            />
          </div>

          <div className="form-group">
            <label>👨‍💼 Organizador:</label>
            <input
              type="text"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
              placeholder="Nombre del organizador (opcional)"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" disabled={creating} className="submit-btn">
              {creating ? 'Creando...' : '🚀 Crear Evento'}
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
        console.log('🟢 API está disponible, cargando eventos desde el servidor...');
      } else {
        console.log('🟡 API no disponible, usando datos de demostración...');
      }
      
      const eventsData = await EventService.getAllEvents();
      setEvents(eventsData);
      
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Error al cargar los eventos. Intenta nuevamente.');
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
    // Refrescar la lista de eventos después del registro
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
      
      console.log('✅ Evento creado exitosamente:', newEvent);
      
      await checkApiAndFetchEvents();
      
      setError(''); 
      setSuccessMessage(`🎉 ¡Evento "${eventData.name}" creado exitosamente!`);
      setTimeout(() => setSuccessMessage(''), 5000); 
            
    } catch (error) {
      console.error('Error creating event:', error);
      setError('❌ Error al crear el evento. Intenta nuevamente.');
    } finally {
      setCreating(false);
    }
  };

  const getStageDisplayName = (stage: Event['stage']): string => {
    const stages: Record<Event['stage'], string> = {
      'registration': 'Registro Abierto',
      'attachment_upload': 'Subida de Archivos',
      'voting': 'Votación',
      'completed': 'Completado'
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
            <h2>Cargando eventos...</h2>
            <p>Conectando con el servidor...</p>
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
            <h1>🔭 Eventos Telescopio</h1>
            
            <div className="events-controls">              
              <button 
                className="create-btn"
                onClick={() => setShowCreateModal(true)}
                disabled={!isAuthenticated}
                title={!isAuthenticated ? "Inicia sesión para crear eventos" : ""}
              >
                ✨ Crear Evento
              </button>
              
              <button 
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={loading}
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="success-message">
              <p>✅ {successMessage}</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
              <button onClick={handleRefresh} className="retry-btn">
                Reintentar
              </button>
            </div>
          )}
          
          {events.length === 0 && !loading && !error ? (
            <div className="empty-state">
              <p>🌌 No hay eventos disponibles en este momento.</p>
              <p>¡Vuelve pronto para nuevas oportunidades de observación!</p>
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
                      <strong>📝 Descripción:</strong> {event.description}
                    </p>
                    <p className="event-date">
                      <strong>📅 Fecha:</strong> {(() => {
                        try {
                          const date = new Date(event.date);
                          return isNaN(date.getTime()) 
                            ? 'Fecha por determinar' 
                            : date.toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                              });
                        } catch {
                          return 'Fecha por determinar';
                        }
                      })()}
                    </p>
                    <p className="event-location">
                      <strong>📍 Ubicación:</strong> {event.location}
                    </p>
                    {event.participant_ids && event.participant_ids.length > 0 && (
                      <p className="event-participants">
                        <strong>👥 Participantes:</strong> {event.participant_ids.length}
                      </p>
                    )}
                  </div>

                  <div className="event-actions">
                    <button 
                      className="details-btn"
                      onClick={() => setSelectedEvent(event)}
                    >
                      🔍 Ver Detalles
                    </button>
                    
                    {event.stage === 'registration' && (
                      <button 
                        className={`register-btn ${!isAuthenticated ? 'disabled' : ''}`}
                        onClick={() => handleRegisterEvent(event.id)}
                        disabled={!isAuthenticated}
                        title={!isAuthenticated ? "Inicia sesión para participar" : ""}
                      >
                        {isAuthenticated ? '🚀 Participar' : '🔐 Inicia sesión para participar'}
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
