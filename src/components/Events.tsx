import React, { useState, useEffect } from 'react';
import './Events.css';
import EventDetail from './EventDetail';
import { useAuth } from '../context/AuthContext';
import { Event, EventsProps } from '../types';
import { EventService, HealthService } from '../services/api';

const Events: React.FC<EventsProps> = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    checkApiAndFetchEvents();
  }, []);

  const checkApiAndFetchEvents = async (): Promise<void> => {
    setLoading(true);
    setError('');
    
    try {
      // Verificar si la API está disponible
      const isHealthy = await HealthService.checkHealth();
      setApiAvailable(isHealthy);
      
      if (isHealthy) {
        console.log('🟢 API está disponible, cargando eventos desde el servidor...');
      } else {
        console.log('🟡 API no disponible, usando datos de demostración...');
      }
      
      // Cargar eventos (fallback automático incluido en EventService)
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
              <div className="api-status">
                {apiAvailable ? (
                  <span className="status-online">🟢 Conectado a la API</span>
                ) : (
                  <span className="status-offline">🟡 Modo demostración</span>
                )}
              </div>
              
              <button 
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={loading}
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

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
                      <strong>📅 Fecha:</strong> {new Date(event.date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
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
    </>
  );
};

export default Events;
