import React, { useState, useEffect } from 'react';
import './Events.css';
import EventDetail from './EventDetail';
import { useAuth } from '../context/AuthContext';
import { Event, EventsProps } from '../types';

const Events: React.FC<EventsProps> = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = (): void => {
    setLoading(true);
    
    // Datos hardcodeados para demo inicial
    const mockEvents: Event[] = [
      {
        id: '1',
        title: "Evento de Fotografía 2025",
        description: "Concurso de fotografía digital. Muestra tu mejor trabajo fotográfico y compite con otros artistas.",
        stage: "registration",
        date: "2025-09-15",
        location: "Centro Cultural de la Ciudad",
        participant_ids: []
      },
      {
        id: '2',
        title: "Hackathon Telescopio",
        description: "Desarrolla la próxima gran aplicación tecnológica en 48 horas intensivas.",
        stage: "registration",
        date: "2025-10-01",
        location: "Universidad Tecnológica",
        participant_ids: []
      },
      {
        id: '3',
        title: "Concurso de Arte Digital",
        description: "Crea obras de arte digital únicas usando las últimas tecnologías.",
        stage: "attachment_upload",
        date: "2025-08-15",
        location: "Galería Virtual Online",
        participant_ids: ['user_789']
      },
      {
        id: '4',
        title: "Competencia de Innovación",
        description: "Presenta tu idea innovadora que puede cambiar el mundo.",
        stage: "voting",
        date: "2025-07-10",
        location: "Centro de Innovación",
        participant_ids: ['user_101', 'user_202', 'user_303']
      },
      {
        id: '5',
        title: "Festival de Música Digital",
        description: "Crea la mejor pista musical electrónica del año.",
        stage: "completed",
        date: "2025-06-20",
        location: "Sala de Conciertos Virtual",
        participant_ids: ['user_404', 'user_505', 'user_606', 'user_707']
      }
    ];

    // Simular delay de carga
    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 500);
  };

  const handleRegisterEvent = (eventId: string): void => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
    }
  };

  const handleEventRegistered = (): void => {
    // Refrescar la lista de eventos (por ahora no hace nada)
    console.log('Evento registrado exitosamente');
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

  if (loading) {
    return (
      <div className="events-container">
        <div className="events-content">
          <h1>Cargando eventos...</h1>
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
              {events.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h3>{event.title}</h3>
                    <span className={`event-stage stage-${event.stage}`}>
                      {getStageDisplayName(event.stage)}
                    </span>
                  </div>
                  
                  <div className="event-details">
                    <p><strong>Descripción:</strong> {event.description}</p>
                    <p><strong>Fecha:</strong> {new Date(event.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                    <p><strong>Ubicación:</strong> {event.location}</p>
                    {event.participant_ids && event.participant_ids.length > 0 && (
                      <p><strong>Participantes:</strong> {event.participant_ids.length}</p>
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
};

export default Events;
