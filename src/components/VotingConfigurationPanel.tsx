import React, { useState } from 'react';
import { DistributedVotingService } from '../services/api';
import './VotingConfigurationPanel.css';

interface VotingConfigurationPanelProps {
  eventId: string;
  totalAttachments: number;
  totalParticipants: number;
  onConfigured: () => void;
}

const VotingConfigurationPanel: React.FC<VotingConfigurationPanelProps> = ({
  eventId,
  totalAttachments,
  totalParticipants,
  onConfigured
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Calculate maximum possible m considering conflict of interest
  const maxPossibleM = totalAttachments >= totalParticipants 
    ? totalAttachments - 1  // Each participant can't evaluate their own file
    : totalAttachments;

  // Calculate recommended M, capped at maxPossibleM
  const baseRecommendedM = Math.ceil(2 * Math.log2(totalAttachments));
  const recommendedM = Math.min(baseRecommendedM, maxPossibleM);

  const [config, setConfig] = useState({
    attachments_per_evaluator: Math.max(Math.min(recommendedM, maxPossibleM), 2),
    quality_good_threshold: 0.6,
    quality_bad_threshold: 0.3,
    adjustment_magnitude: 3,
    min_evaluations_per_file: 3
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Intentar crear configuración
      try {
        await DistributedVotingService.createVotingConfig(eventId, config);
        console.log('✅ Voting configuration created');
      } catch (configErr: any) {
        // Si la configuración ya existe (409), continuar de todas formas
        if (configErr?.message?.includes('already exists') || configErr?.message?.includes('CONFIG_EXISTS')) {
          console.log('ℹ️ Voting configuration already exists, proceeding to generate assignments');
        } else {
          // Si es otro error, lanzar para manejarlo abajo
          throw configErr;
        }
      }

      // Generar asignaciones automáticamente
      await DistributedVotingService.generateAssignments(eventId);

      setSuccess('Voting configuration created and assignments generated successfully!');
      onConfigured();
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      setError(`Failed to configure voting system: ${errorMessage}`);
      console.error('Voting configuration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="voting-config-panel">
      <h3>⚙️ Configure Distributed Voting System</h3>

      <div className="info-box">
        <p><strong>Event Status:</strong></p>
        <ul>
          <li>Total Attachments: {totalAttachments}</li>
          <li>Total Participants: {totalParticipants}</li>
          <li>Recommended attachments per evaluator: ≥ {recommendedM}</li>
          <li>Maximum evaluable per participant: {maxPossibleM}</li>
          {totalAttachments >= totalParticipants && (
            <li className="warning-text">⚠️ Note: Participants cannot evaluate their own submissions (conflict of interest). Each participant can evaluate at most {maxPossibleM} files.</li>
          )}
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Attachments per Evaluator (m):
            <input
              type="number"
              min={2}
              max={maxPossibleM}
              value={config.attachments_per_evaluator}
              onChange={(e) => setConfig({
                ...config,
                attachments_per_evaluator: parseInt(e.target.value)
              })}
              required
            />
          </label>
          <small>Recommended: ≥ {recommendedM} for optimal convergence (2*log₂(k), M). Maximum: {maxPossibleM} (participants can't evaluate their own files)</small>
        </div>

        <div className="form-group">
          <label>
            Minimum Evaluations per File:
            <input
              type="number"
              min={1}
              value={config.min_evaluations_per_file}
              onChange={(e) => setConfig({
                ...config,
                min_evaluations_per_file: parseInt(e.target.value)
              })}
              required
            />
          </label>
          <small>Each file will be evaluated by at least this many participants</small>
        </div>

        <div className="form-group">
          <label>
            Quality Good Threshold (Q_good):
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.quality_good_threshold}
              onChange={(e) => setConfig({
                ...config,
                quality_good_threshold: parseFloat(e.target.value)
              })}
              required
            />
          </label>
          <small>Evaluators with quality ≥ this value receive rank bonus (0-1 scale)</small>
        </div>

        <div className="form-group">
          <label>
            Quality Bad Threshold (Q_bad):
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.quality_bad_threshold}
              onChange={(e) => setConfig({
                ...config,
                quality_bad_threshold: parseFloat(e.target.value)
              })}
              required
            />
          </label>
          <small>Evaluators with quality ≤ this value receive rank penalty (0-1 scale)</small>
        </div>

        <div className="form-group">
          <label>
            Rank Adjustment Magnitude:
            <input
              type="number"
              min="1"
              value={config.adjustment_magnitude}
              onChange={(e) => setConfig({
                ...config,
                adjustment_magnitude: parseInt(e.target.value)
              })}
              required
            />
          </label>
          <small>Number of positions to adjust in ranking for quality bonuses/penalties</small>
        </div>

        {error && <div className="message error-message">{error}</div>}
        {success && <div className="message success-message">{success}</div>}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Configuring...' : 'Create Configuration & Generate Assignments'}
        </button>
      </form>

      <div className="info-box algorithm-info">
        <h4>About Modified Borda Count (MBC)</h4>
        <p>
          The system uses a distributed voting algorithm where each participant evaluates
          a subset of submissions. The MBC formula aggregates rankings to produce a fair
          global ranking, while quality scores ensure high-quality evaluators have more influence.
        </p>
      </div>
    </div>
  );
};

export default VotingConfigurationPanel;
