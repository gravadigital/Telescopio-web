import React, { useState, useEffect } from 'react';
import './Events.css';
import { API_CONFIG, apiRequest } from '../config/api';
import EventDetail from './EventDetail';
import { useAuth } from '../context/AuthContext';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      // Nota: Necesitarás agregar un endpoint GET /api/events en tu API de Go
      // para obtener la lista de todos los eventos
      const data = await apiRequest(API_CONFIG.ENDPOINTS.EVENTS);
      
      // Asegurar que data es un array
      const eventsArray = Array.isArray(data) ? data : (data.events || []);
      setEvents(eventsArray);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
      // Datos de ejemplo para desarrollo cuando la API no esté disponible
      setEvents([
        {
          id: 1,
          title: "Evento de Fotografía 2025",
          description: "Concurso de fotografía digital",
          stage: "registration",
          date: "2025-09-15",
          location: "Centro Cultural"
        },
        {
          id: 2,
          title: "Hackathon Telescopio",
          description: "Desarrolla la próxima gran aplicación",
          stage: "voting",
          date: "2025-10-01",
          location: "Universidad Tech"
        },
        {
          id: 3,
          title: "Concurso de Arte Digital",
          description: "Muestra tu creatividad digital",
          stage: "closed",
          date: "2025-08-01",
          location: "Galería Virtual"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEvent = async (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
    }
  };

  const handleEventRegistered = () => {
    // Refrescar la lista de eventos
    fetchEvents();
  };

  const getStageDisplayName = (stage) => {
    const stages = {
      'creation': 'Creación',
      'registration': 'Registro Abierto',
      'attachment_upload': 'Subida de Archivos',
      'voting': 'Votación',
      'results': 'Resultados'
    };
    return stages[stage] || stage;
  };

  if (loading) {
    return (
      <div className="events-container">
        <div className="events-content">
          <h1>Cargando eventos...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-container">
        <div className="events-content">
          <h1>Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="events-container">
        <div className="events-content">
          <h1>Eventos Disponibles</h1>
          

          
          {events.length === 0 ? (
            <p>No hay eventos disponibles en este momento.</p>
          ) : (
            <div className="events-list">
              {Array.isArray(events) && events.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h3>{event.title || event.name || `Evento ${event.id}`}</h3>
                    <span className={`event-stage stage-${event.stage}`}>
                      {getStageDisplayName(event.stage)}
                    </span>
                  </div>
                  
                  <div className="event-details">
                    <p><strong>ID:</strong> {event.id}</p>
                    {event.description && (
                      <p><strong>Descripción:</strong> {event.description}</p>
                    )}
                    {event.date && (
                      <p><strong>Fecha:</strong> {new Date(event.date).toLocaleDateString()}</p>
                    )}
                    {event.location && (
                      <p><strong>Ubicación:</strong> {event.location}</p>
                    )}
                  </div>

                  <div className="event-actions">
                    <button 
                      className="details-btn"
                      onClick={() => setSelectedEvent(event)}
                    >
                      Ver Detalles
                    </button>
                    
                    {event.stage === 'registration' && (
                      <button 
                        className="register-btn"
                        onClick={() => handleRegisterEvent(event.id)}
                        disabled={!isAuthenticated}
                        title={!isAuthenticated ? "Inicia sesión para participar" : ""}
                      >
                        {isAuthenticated ? 'Participar' : 'Iniciar sesión para participar'}
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
}

export default Events;
