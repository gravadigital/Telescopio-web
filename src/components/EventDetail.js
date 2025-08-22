import React, { useState } from 'react';
import './EventDetail.css';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG, apiRequest } from '../config/api';

function EventDetail({ event, onClose, onRegistered }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const { user, isAuthenticated } = useAuth();

  const isRegistered = user && event.participant_ids && event.participant_ids.includes(user.id);
  const canRegister = event.stage === 'registration' && isAuthenticated && !isRegistered;
  const canUploadAttachment = event.stage === 'attachment_upload' && isRegistered;

  const handleRegister = async () => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para registrarte');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiRequest(API_CONFIG.ENDPOINTS.EVENT_REGISTER(event.id), {
        method: 'POST',
        body: JSON.stringify({
          participant_name: user.name,
          participant_email: user.email
        }),
      });

      setSuccess('¡Te has registrado exitosamente en el evento!');
      onRegistered && onRegistered();
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no puede superar los 10MB');
        return;
      }

      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de archivo no permitido. Usa: JPEG, PNG, GIF, PDF o TXT');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUploadAttachment = async () => {
    if (!selectedFile) {
      setError('Selecciona un archivo primero');
      return;
    }

    setUploadLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENT_ATTACHMENT(event.id, user.id)}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSuccess('¡Archivo subido exitosamente!');
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('attachment-file');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      setError(`Error al subir archivo: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
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

  return (
    <div className="event-detail-overlay">
      <div className="event-detail-modal">
        <div className="event-detail-header">
          <h2>{event.title || event.name || `Evento ${event.id}`}</h2>
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

            {isRegistered && event.stage === 'registration' && (
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

            {isRegistered && event.stage === 'voting' && (
              <div className="voting-info">
                <p>🗳️ El evento está en fase de votación</p>
                <p>Pronto podrás votar por las participaciones.</p>
              </div>
            )}

            {isRegistered && event.stage === 'results' && (
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
}

export default EventDetail;
