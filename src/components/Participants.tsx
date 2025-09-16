import React, { useState, useEffect } from 'react';
import './Participants.css';
import { EventService } from '../services/api';
import { User } from '../types';

interface ParticipantsProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

const Participants: React.FC<ParticipantsProps> = ({ eventId, eventTitle, onClose }) => {
  const [participants, setParticipants] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchParticipants = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    
    try {
      const participantsData = await EventService.getEventParticipants(eventId);
      setParticipants(participantsData);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Error al cargar los participantes');
      
      // Fallback con datos mock para demostración
      const mockParticipants: User[] = [
        {
          id: 'user_1',
          name: 'María González',
          email: 'maria@example.com',
          role: 'participant',
          joinedEventIDs: [eventId],
          createdEventIDs: []
        },
        {
          id: 'user_2',
          name: 'Carlos Rodríguez',
          email: 'carlos@example.com',
          role: 'participant',
          joinedEventIDs: [eventId],
          createdEventIDs: []
        },
        {
          id: 'user_3',
          name: 'Ana López',
          email: 'ana@example.com',
          role: 'participant',
          joinedEventIDs: [eventId],
          createdEventIDs: []
        }
      ];
      setParticipants(mockParticipants);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const getRoleDisplayName = (role: User['role']): string => {
    const roles: Record<User['role'], string> = {
      'participant': 'Participante',
      'organizer': 'Organizador',
      'admin': 'Administrador'
    };
    return roles[role] || role;
  };

  const getRoleIcon = (role: User['role']): string => {
    const icons: Record<User['role'], string> = {
      'participant': '👤',
      'organizer': '👨‍💼',
      'admin': '👑'
    };
    return icons[role] || '👤';
  };

  return (
    <div className="participants-overlay">
      <div className="participants-modal">
        <div className="participants-header">
          <h2>👥 Participantes del Evento</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="event-title">
          <h3>🔭 {eventTitle}</h3>
        </div>

        {loading && (
          <div className="participants-loading">
            <div className="loading-spinner"></div>
            <p>Cargando participantes...</p>
          </div>
        )}

        {error && !loading && (
          <div className="participants-error">
            <p>❌ {error}</p>
            <button onClick={fetchParticipants} className="retry-btn">
              🔄 Reintentar
            </button>
          </div>
        )}

        {!loading && !error && participants.length === 0 && (
          <div className="participants-empty">
            <p>🌌 No hay participantes registrados aún.</p>
            <p>¡Sé el primero en unirte a este evento astronómico!</p>
          </div>
        )}

        {!loading && participants.length > 0 && (
          <div className="participants-content">
            <div className="participants-stats">
              <p>📊 <strong>{participants.length}</strong> participante{participants.length !== 1 ? 's' : ''} registrado{participants.length !== 1 ? 's' : ''}</p>
            </div>
            
            <div className="participants-list">
              {participants.map((participant, index) => (
                <div key={participant.id} className="participant-card">
                  <div className="participant-info">
                    <div className="participant-avatar">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="participant-details">
                      <h4>{participant.name}</h4>
                      <p className="participant-email">{participant.email}</p>
                      <span className={`participant-role role-${participant.role}`}>
                        {getRoleIcon(participant.role)} {getRoleDisplayName(participant.role)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="participant-position">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="participants-actions">
          <button className="close-modal-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Participants;
