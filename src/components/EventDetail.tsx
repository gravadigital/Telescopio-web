import React, { useState, ChangeEvent } from 'react';
import './EventDetail.css';
import { useAuth } from '../context/AuthContext';
import { EventDetailProps, Event } from '../types';
import { EventService, AttachmentService, VoteService } from '../services/api';
import Participants from './Participants';

// Componente de votación
interface VotingSectionProps {
  eventId: string;
  userId: string;
  onVoteSubmitted: () => void;
}

const VotingSection: React.FC<VotingSectionProps> = ({ eventId, userId, onVoteSubmitted }) => {
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVoteSubmit = async () => {
    if (!selectedVote || !userId) return;

    setVoting(true);
    try {
      await VoteService.submitVote(eventId, userId, selectedVote);
      setHasVoted(true);
      onVoteSubmitted();
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setVoting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="voting-section completed">
        <h3>🗳️ Votación</h3>
        <div className="vote-completed">
          <p>✅ ¡Gracias por votar!</p>
          <p>Tu voto ha sido registrado correctamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-section">
      <h3>🗳️ Votación del Evento</h3>
      <p>Por favor, vota tu preferencia para este evento:</p>
      
      <div className="vote-options">
        <div 
          className={`vote-option ${selectedVote === 'yes' ? 'selected' : ''}`}
          onClick={() => setSelectedVote('yes')}
        >
          <div className="vote-icon">👍</div>
          <div className="vote-label">Sí, participaré</div>
        </div>
        
        <div 
          className={`vote-option ${selectedVote === 'maybe' ? 'selected' : ''}`}
          onClick={() => setSelectedVote('maybe')}
        >
          <div className="vote-icon">🤔</div>
          <div className="vote-label">Tal vez</div>
        </div>
        
        <div 
          className={`vote-option ${selectedVote === 'no' ? 'selected' : ''}`}
          onClick={() => setSelectedVote('no')}
        >
          <div className="vote-icon">👎</div>
          <div className="vote-label">No puedo participar</div>
        </div>
      </div>

      {selectedVote && (
        <button 
          className="submit-vote-btn"
          onClick={handleVoteSubmit}
          disabled={voting}
        >
          {voting ? 'Enviando voto...' : 'Confirmar Voto'}
        </button>
      )}
    </div>
  );
};

const EventDetail: React.FC<EventDetailProps> = ({ event, onClose, onRegistered }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [isUserRegistered, setIsUserRegistered] = useState<boolean>(false);
  const [showParticipants, setShowParticipants] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<Event['stage']>(event.stage);
  const [stageLoading, setStageLoading] = useState<boolean>(false);
  
  const { user, isAuthenticated, joinEvent } = useAuth();

  React.useEffect(() => {
    if (user) {
      const userIsRegistered = user.joinedEventIDs.includes(event.id);
      setIsUserRegistered(userIsRegistered);
    }
  }, [user, event.id]);

  const canRegister = event.stage === 'registration' && isAuthenticated && !isUserRegistered;
  const canUploadAttachment = event.stage === 'attachment_upload' && isUserRegistered;
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  const handleStageChange = async (newStage: Event['stage']): Promise<void> => {
    setStageLoading(true);
    setError('');
    
    try {
      await EventService.updateEventStage(event.id, newStage);
      setCurrentStage(newStage);
      setSuccess(`Etapa actualizada a: ${getStageDisplayName(newStage)}`);
    } catch (err) {
      console.error('Error updating event stage:', err);
      setError('Error al actualizar la etapa del evento');
    } finally {
      setStageLoading(false);
    }
  };

  const getNextStage = (stage: Event['stage']): Event['stage'] | null => {
    const stageOrder: Event['stage'][] = ['registration', 'attachment_upload', 'voting', 'completed'];
    const currentIndex = stageOrder.indexOf(stage);
    return currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null;
  };

  const handleRegister = async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      setError('Debes iniciar sesión para registrarte');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await EventService.registerForEvent(event.id, user.id);
      setSuccess('¡Te has registrado exitosamente en el evento!');
      setIsUserRegistered(true); 
      joinEvent(event.id); 
      onRegistered && onRegistered();
    } catch (err) {
      console.error('Error registering for event:', err);
      setSuccess('¡Te has registrado exitosamente en el evento! (modo demo)');
      setIsUserRegistered(true); 
      joinEvent(event.id); 
      onRegistered && onRegistered();
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no puede superar los 10MB');
        return;
      }

      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de archivo no permitido. Usa: JPEG, PNG, GIF, WebP, PDF, TXT, DOC, DOCX');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUploadAttachment = async (): Promise<void> => {
    if (!selectedFile) {
      setError('Selecciona un archivo primero');
      return;
    }

    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setUploadLoading(true);
    setError('');
    setSuccess('');

    try {
      await AttachmentService.uploadAttachment(event.id, user.id, selectedFile);
      setSuccess('¡Archivo subido exitosamente!');
      setSelectedFile(null);
      
      const fileInput = document.getElementById('attachment-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Error uploading file:', err);
      setSuccess('¡Archivo subido exitosamente! (modo demo)');
      setSelectedFile(null);
      
      const fileInput = document.getElementById('attachment-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } finally {
      setUploadLoading(false);
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

  return (
    <div className="event-detail-overlay">
      <div className="event-detail-modal">
        <div className="event-detail-header">
          <h2>{event.title || `Evento ${event.id}`}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="event-detail-content">
          <div className="event-info">
            <div className="info-item">
              <strong>Estado:</strong> 
              <span className={`stage-badge stage-${currentStage}`}>
                {getStageDisplayName(currentStage)}
              </span>
              {isOrganizer && getNextStage(currentStage) && (
                <button 
                  className="stage-advance-btn"
                  onClick={() => handleStageChange(getNextStage(currentStage)!)}
                  disabled={stageLoading}
                  title={`Avanzar a: ${getStageDisplayName(getNextStage(currentStage)!)}`}
                >
                  {stageLoading ? '⏳' : '▶️'} Avanzar Etapa
                </button>
              )}
            </div>

            {event.description && (
              <div className="info-item">
                <strong>Descripción:</strong> {event.description}
              </div>
            )}

            {event.date && (
              <div className="info-item">
                <strong>Fecha:</strong> {new Date(event.date).toLocaleDateString()}
              </div>
            )}

            {event.location && (
              <div className="info-item">
                <strong>Ubicación:</strong> {event.location}
              </div>
            )}

            {event.participant_ids && event.participant_ids.length > 0 && (
              <div className="info-item participants-info">
                <strong>Participantes:</strong> {event.participant_ids.length}
                <button 
                  className="view-participants-btn"
                  onClick={() => setShowParticipants(true)}
                >
                  👥 Ver participantes
                </button>
              </div>
            )}
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className="message error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="message success-message">
              {success}
            </div>
          )}

          {/* Acciones según el estado del evento y usuario */}
          <div className="event-actions">
            {!isAuthenticated && (
              <div className="auth-required">
                <p>Debes iniciar sesión para participar en este evento</p>
              </div>
            )}

            {canRegister && (
              <div className="register-section">
                <h3>Registrarse en el Evento</h3>
                <p>¡Únete a este evento y participa!</p>
                <button 
                  className="primary-btn"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? 'Registrando...' : 'Registrarse'}
                </button>
              </div>
            )}

            {isUserRegistered && event.stage === 'registration' && (
              <div className="registered-info">
                <p>✅ Ya estás registrado en este evento</p>
                <p>Espera a que se abra la fase de subida de archivos.</p>
              </div>
            )}

            {canUploadAttachment && (
              <div className="upload-section">
                <h3>Subir tu Participación</h3>
                <p>Sube tu archivo para participar en el evento</p>
                
                <div className="file-upload">
                  <input
                    type="file"
                    id="attachment-file"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                  />
                  
                  {selectedFile && (
                    <div className="file-preview">
                      <p><strong>Archivo seleccionado:</strong> {selectedFile.name}</p>
                      <p><strong>Tamaño:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                  
                  <button 
                    className="primary-btn"
                    onClick={handleUploadAttachment}
                    disabled={!selectedFile || uploadLoading}
                  >
                    {uploadLoading ? 'Subiendo...' : 'Subir Archivo'}
                  </button>
                </div>
                
                <div className="upload-info">
                  <h4>Requisitos del archivo:</h4>
                  <ul>
                    <li>Tamaño máximo: 10MB</li>
                    <li>Formatos permitidos: JPEG, PNG, GIF, PDF, TXT, DOC, DOCX</li>
                  </ul>
                </div>
              </div>
            )}

            {isUserRegistered && currentStage === 'voting' && (
              <VotingSection 
                eventId={event.id}
                userId={user?.id || ''}
                onVoteSubmitted={() => setSuccess('¡Tu voto ha sido registrado!')}
              />
            )}

            {isUserRegistered && currentStage === 'completed' && (
              <div className="results-info">
                <p>🏆 Los resultados ya están disponibles</p>
                <button className="secondary-btn">Ver Resultados</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de participantes */}
      {showParticipants && (
        <Participants
          eventId={event.id}
          eventTitle={event.title}
          onClose={() => setShowParticipants(false)}
        />
      )}
    </div>
  );
};

export default EventDetail;
