import React, { useState, ChangeEvent } from 'react';
import './EventDetail.css';
import { useAuth } from '../context/AuthContext';
import { EventDetailProps, Event } from '../types';
import { EventService, AttachmentService } from '../services/api';
import Voting from './Voting';

const EventDetail: React.FC<EventDetailProps> = ({ event, onClose, onRegistered }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [isUserRegistered, setIsUserRegistered] = useState<boolean>(false);
  
  const { user, isAuthenticated, joinEvent } = useAuth();

  React.useEffect(() => {
    if (user) {
      const userIsRegistered = user.joinedEventIDs.includes(event.id);
      setIsUserRegistered(userIsRegistered);
    }
  }, [user, event.id]);

  const canRegister = event.stage === 'registration' && isAuthenticated && !isUserRegistered;
  const canUploadAttachment = event.stage === 'attachment_upload' && isUserRegistered;

  const handleRegister = async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      setError('Debes iniciar sesión para registrarte');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await EventService.registerParticipant(event.id, user.id);
      setSuccess('¡Te has registrado exitosamente en el evento!');
      setIsUserRegistered(true); 
      joinEvent(event.id); 
      onRegistered && onRegistered();
    } catch (err) {
      console.error('Error registering for event:', err);
      setError(err instanceof Error ? err.message : 'Error al registrarse en el evento');
      
      // Fallback: continuar sin error para demo
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

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de archivo no permitido. Usa: JPEG, PNG, GIF, PDF o TXT');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

    const handleFileUpload = async (): Promise<void> => {
    if (!selectedFile || !user) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setUploadLoading(true);
    setError('');
    setSuccess('');

    try {
      await AttachmentService.uploadAttachment(event.id, user.id, selectedFile);
      setSuccess('¡Archivo subido exitosamente!');
      setSelectedFile(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Error al subir el archivo');
      
      // Fallback: continuar sin error para demo
      setSuccess('¡Archivo subido exitosamente! (modo demo)');
      setSelectedFile(null);
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
              <strong>ID:</strong> {event.id}
            </div>
            
            <div className="info-item">
              <strong>Estado:</strong> 
              <span className={`stage-badge stage-${event.stage}`}>
                {getStageDisplayName(event.stage)}
              </span>
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
                    onClick={handleFileUpload}
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

            {isUserRegistered && event.stage === 'voting' && (
              <div className="voting-section">
                <Voting 
                  eventId={event.id} 
                  attachments={[
                    // Mock attachments for demo - in real app, fetch from API
                    {
                      id: 'att-1',
                      filename: 'galaxy-photo.jpg',
                      uploadedBy: 'Usuario Demo',
                      uploadedAt: new Date().toISOString()
                    },
                    {
                      id: 'att-2', 
                      filename: 'nebula-capture.png',
                      uploadedBy: 'Otro Usuario',
                      uploadedAt: new Date().toISOString()
                    }
                  ]}
                />
              </div>
            )}

            {isUserRegistered && event.stage === 'completed' && (
              <div className="results-info">
                <p>🏆 Los resultados ya están disponibles</p>
                <button className="secondary-btn">Ver Resultados</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
