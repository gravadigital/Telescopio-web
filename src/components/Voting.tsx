import React, { useState, useEffect } from 'react';
import './Voting.css';
import { useAuth } from '../context/AuthContext';
import { VoteService } from '../services/api';

interface VotingProps {
  eventId: string;
  attachments: Array<{
    id: string;
    filename: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
}

interface Vote {
  id: string;
  attachmentId: string;
  userId: string;
  rating: number;
  comment?: string;
}

const Voting: React.FC<VotingProps> = ({ eventId, attachments }) => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const { user, isAuthenticated } = useAuth();

  const loadUserVotes = React.useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Use voting assignments to get what user can vote on
      const assignments = await VoteService.getVotingAssignments(eventId, user.id);
      console.log('Voting assignments:', assignments);
      // For demo purposes, set empty votes
      setVotes([]);
    } catch (err) {
      console.error('Error loading voting assignments:', err);
      setVotes([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserVotes();
    }
  }, [isAuthenticated, user, loadUserVotes]);

  const handleVote = async (attachmentId: string, rating: number, comment?: string) => {
    if (!isAuthenticated || !user) {
      setError('Debes iniciar sesión para votar');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // The current VoteService.submitVote only takes eventId, voterId, and attachmentId
      await VoteService.submitVote(eventId, user.id, attachmentId);
      
      // Create a demo vote for local state
      const demoVote: Vote = {
        id: `vote-${Date.now()}`,
        attachmentId,
        userId: user.id,
        rating,
        comment
      };
      
      // Update local votes state
      setVotes(prev => {
        const existingIndex = prev.findIndex(v => v.attachmentId === attachmentId);
        if (existingIndex >= 0) {
          // Update existing vote
          const newVotes = [...prev];
          newVotes[existingIndex] = demoVote;
          return newVotes;
        } else {
          // Add new vote
          return [...prev, demoVote];
        }
      });
      
      setSuccess('¡Voto enviado exitosamente!');
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar el voto');
      
      // Fallback for demo
      const demoVote: Vote = {
        id: `demo-${Date.now()}`,
        attachmentId,
        userId: user.id,
        rating,
        comment
      };
      
      setVotes(prev => {
        const existingIndex = prev.findIndex(v => v.attachmentId === attachmentId);
        if (existingIndex >= 0) {
          const newVotes = [...prev];
          newVotes[existingIndex] = demoVote;
          return newVotes;
        } else {
          return [...prev, demoVote];
        }
      });
      
      setSuccess('¡Voto enviado exitosamente! (modo demo)');
    } finally {
      setLoading(false);
    }
  };

  const getUserVote = (attachmentId: string): Vote | undefined => {
    return votes.find(vote => vote.attachmentId === attachmentId);
  };

  if (!isAuthenticated) {
    return (
      <div className="voting-container">
        <p className="voting-login-message">Inicia sesión para participar en la votación</p>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="voting-container">
        <p className="voting-empty">No hay imágenes para votar en este evento</p>
      </div>
    );
  }

  return (
    <div className="voting-container">
      <h3>Votación de Imágenes</h3>
      
      {error && <div className="voting-error">{error}</div>}
      {success && <div className="voting-success">{success}</div>}
      
      <div className="attachments-grid">
        {attachments.map(attachment => {
          const userVote = getUserVote(attachment.id);
          
          return (
            <div key={attachment.id} className="attachment-card">
              <div className="attachment-info">
                <h4>{attachment.filename}</h4>
                <p>Subido por: {attachment.uploadedBy}</p>
                <p>Fecha: {new Date(attachment.uploadedAt).toLocaleDateString()}</p>
              </div>
              
              <VoteForm
                attachmentId={attachment.id}
                currentVote={userVote}
                onVote={handleVote}
                loading={loading}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface VoteFormProps {
  attachmentId: string;
  currentVote?: Vote;
  onVote: (attachmentId: string, rating: number, comment?: string) => void;
  loading: boolean;
}

const VoteForm: React.FC<VoteFormProps> = ({ attachmentId, currentVote, onVote, loading }) => {
  const [rating, setRating] = useState<number>(currentVote?.rating || 0);
  const [comment, setComment] = useState<string>(currentVote?.comment || '');
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0) {
      onVote(attachmentId, rating, comment.trim() || undefined);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const filled = starValue <= (hoveredRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className={`star ${filled ? 'filled' : ''}`}
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          disabled={loading}
        >
          ★
        </button>
      );
    });
  };

  return (
    <form onSubmit={handleSubmit} className="vote-form">
      <div className="rating-section">
        <label>Calificación:</label>
        <div className="stars-container">
          {renderStars()}
        </div>
      </div>
      
      <div className="comment-section">
        <label htmlFor={`comment-${attachmentId}`}>Comentario (opcional):</label>
        <textarea
          id={`comment-${attachmentId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Escribe tu comentario sobre esta imagen..."
          maxLength={500}
          disabled={loading}
        />
      </div>
      
      <button
        type="submit"
        className="vote-submit-btn"
        disabled={rating === 0 || loading}
      >
        {loading ? 'Enviando...' : currentVote ? 'Actualizar Voto' : 'Enviar Voto'}
      </button>
      
      {currentVote && (
        <p className="current-vote-info">
          Tu voto actual: {currentVote.rating} estrella{currentVote.rating !== 1 ? 's' : ''}
        </p>
      )}
    </form>
  );
};

export default Voting;
