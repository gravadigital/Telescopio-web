import React, { useState, useEffect } from 'react';
import { DistributedVotingService, AttachmentService } from '../services/api';
import { Assignment, Attachment } from '../types';
import './RankingVotePanel.css';

interface RankingVotePanelProps {
  eventId: string;
  participantId: string;
  onVotesSubmitted: () => void;
}

interface AttachmentWithRank extends Attachment {
  rank?: number;
}

const RankingVotePanel: React.FC<RankingVotePanelProps> = ({
  eventId,
  participantId,
  onVotesSubmitted
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attachments, setAttachments] = useState<AttachmentWithRank[]>([]);

  useEffect(() => {
    loadAssignment();
  }, [eventId, participantId]);

  const loadAssignment = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const assignmentData = await DistributedVotingService.getParticipantAssignment(
        eventId,
        participantId
      );
      setAssignment(assignmentData);

      // Cargar detalles de los attachments asignados
      const allAttachments = await AttachmentService.getEventAttachments(eventId);
      const assignedAttachments = allAttachments.filter(att =>
        assignmentData.attachment_ids.includes(att.id)
      );
      setAttachments(assignedAttachments);
    } catch (err) {
      setError('Failed to load your assignment. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRankChange = (attachmentId: string, rank: number): void => {
    setAttachments(prev =>
      prev.map(att =>
        att.id === attachmentId ? { ...att, rank } : att
      )
    );
  };

  const handleSubmit = async (): Promise<void> => {
    // Validar que todos tengan ranking
    const unranked = attachments.filter(att => !att.rank);
    if (unranked.length > 0) {
      setError('Please rank all assigned attachments before submitting');
      return;
    }

    // Validar que no haya rankings duplicados
    const ranks = attachments.map(att => att.rank).filter(r => r);
    const uniqueRanks = new Set(ranks);
    if (ranks.length !== uniqueRanks.size) {
      setError('Each attachment must have a unique rank. No duplicates allowed.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const votes = attachments.map(att => ({
        attachment_id: att.id,
        rank_position: att.rank!
      }));

      await DistributedVotingService.submitRankingVotes(
        eventId,
        participantId,
        votes
      );

      setSuccess('Your rankings have been submitted successfully!');
      onVotesSubmitted();
    } catch (err) {
      setError('Failed to submit rankings. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="ranking-vote-panel">
        <div className="loading">Loading your assignment...</div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="ranking-vote-panel">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="ranking-vote-panel">
        <div className="error">No assignment found for this event</div>
      </div>
    );
  }

  if (assignment.is_completed) {
    return (
      <div className="ranking-vote-panel">
        <div className="completed-assignment">
          <h3>✅ Assignment Completed</h3>
          <p>You have already submitted your rankings for this event.</p>
          {assignment.quality_score !== null && assignment.quality_score !== undefined && (
            <p className="quality-score">
              Your quality score: <strong>{(assignment.quality_score * 100).toFixed(1)}%</strong>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ranking-vote-panel">
      <h3>🎯 Rank Your Assigned Attachments</h3>
      <p className="instructions">
        Rank these {attachments.length} attachments from best (1) to worst ({attachments.length}).
        Each attachment must have a unique rank.
      </p>

      <div className="attachments-list">
        {attachments.map((att) => (
          <div key={att.id} className="attachment-item">
            <div className="attachment-info">
              <strong>{att.original_name}</strong>
              <small>
                Uploaded: {new Date(att.uploaded_at).toLocaleDateString()} |
                Size: {(att.file_size / 1024 / 1024).toFixed(2)} MB
              </small>
            </div>
            <div className="rank-selector">
              <label>Rank:</label>
              <select
                value={att.rank || ''}
                onChange={(e) => handleRankChange(att.id, parseInt(e.target.value))}
              >
                <option value="">Select...</option>
                {Array.from({ length: attachments.length }, (_, i) => i + 1).map(rank => (
                  <option key={rank} value={rank}>
                    {rank} {rank === 1 ? '(Best)' : rank === attachments.length ? '(Worst)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="message error-message">{error}</div>}
      {success && <div className="message success-message">{success}</div>}

      <button
        className="primary-btn"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Submit Rankings'}
      </button>
    </div>
  );
};

export default RankingVotePanel;
