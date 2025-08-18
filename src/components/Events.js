import {useState, useEffect} from 'react';
import './Events.css';
import {API_CONFIG, apiRequest} from '../config/api';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiRequest(API_CONFIG.ENDPOINTS.EVENTS);
      
      const eventsArray = Array.isArray(data) ? data : (data.events || []);
      setEvents(eventsArray);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
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
    try {
      await apiRequest(API_CONFIG.ENDPOINTS.EVENT_REGISTER(eventId), {
        method: 'POST',
        body: JSON.stringify({
          participant_name: "Usuario Demo",
          participant_email: "demo@example.com"
        }),
      });

      alert('¡Te has registrado exitosamente en el evento!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
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
                  <h3>{event.title || `Evento ${event.id}`}</h3>
                  <span className="event-stage">{event.stage}</span>
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
                    className="register-btn"
                    onClick={() => handleRegisterEvent(event.id)}
                    disabled={event.stage === 'closed'}
                  >
                    {event.stage === 'closed' ? 'Evento Cerrado' : 'Registrarse'}
                  </button>
                  
                  <button className="details-btn">
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Events;