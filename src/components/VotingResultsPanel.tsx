import React, { useState, useEffect } from 'react';
import { DistributedVotingService } from '../services/api';
import { VotingResults, VotingStatistics } from '../types';
import './VotingResultsPanel.css';

interface VotingResultsPanelProps {
  eventId: string;
}

const VotingResultsPanel: React.FC<VotingResultsPanelProps> = ({ eventId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [results, setResults] = useState<VotingResults | null>(null);
  const [statistics, setStatistics] = useState<VotingStatistics | null>(null);
  const [error, setError] = useState<string>('');
  const [showAdjusted, setShowAdjusted] = useState<boolean>(false);

  useEffect(() => {
    loadResults();
  }, [eventId]);

  const loadResults = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const [resultsData, statsData] = await Promise.all([
        DistributedVotingService.getDistributedResults(eventId),
        DistributedVotingService.getVotingStatistics(eventId)
      ]);
      setResults(resultsData);
      setStatistics(statsData);
    } catch (err) {
      setError('Failed to load voting results. Results may not be available yet.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="voting-results-panel">
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="voting-results-panel">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="voting-results-panel">
        <div className="no-results">No results available yet</div>
      </div>
    );
  }

  const displayRanking = showAdjusted ? results.adjusted_ranking : results.global_ranking;

  return (
    <div className="voting-results-panel">
      <h2>🏆 Voting Results</h2>

      {statistics && (
        <div className="statistics-box">
          <h3>📊 Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Completion Rate</span>
              <span className="stat-value">{(statistics.completion_rate * 100).toFixed(1)}%</span>
              <span className="stat-help">Participants who completed voting</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Votes</span>
              <span className="stat-value">{statistics.total_votes}</span>
              <span className="stat-help">Total rankings submitted</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Quality</span>
              <span className="stat-value">{(statistics.average_quality_score * 100).toFixed(1)}%</span>
              <span className="stat-help">Evaluator consistency score</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">High Quality Evaluators</span>
              <span className="stat-value">{statistics.participants_with_good_quality}</span>
              <span className="stat-help">Evaluators with quality ≥ 60%</span>
            </div>
          </div>
        </div>
      )}

      <div className="ranking-controls">
        <button
          className={`toggle-btn ${!showAdjusted ? 'active' : ''}`}
          onClick={() => setShowAdjusted(false)}
        >
          📊 Global Ranking
        </button>
        <button
          className={`toggle-btn ${showAdjusted ? 'active' : ''}`}
          onClick={() => setShowAdjusted(true)}
        >
          ⚖️ Quality-Adjusted Ranking
        </button>
      </div>

      <div className="ranking-info">
        {!showAdjusted ? (
          <p><strong>Global Ranking:</strong> Pure mathematical ranking using Modified Borda Count - all votes weighted equally</p>
        ) : (
          <p><strong>Quality-Adjusted Ranking:</strong> Rankings adjusted based on evaluator quality - higher quality evaluators have more influence</p>
        )}
      </div>

      <div className="ranking-table-container">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>File / Author</th>
              <th>MBC Score</th>
              <th>Votes</th>
              <th>Avg Rank</th>
              {showAdjusted && <th>Original Rank</th>}
            </tr>
          </thead>
          <tbody>
            {displayRanking.map((result, index) => (
              <tr
                key={result.attachment_id}
                className={index < 3 ? `top-${index + 1}` : ''}
              >
                <td className="rank-cell">
                  {showAdjusted ? result.adjusted_rank : result.global_rank}
                  {index === 0 && ' 🥇'}
                  {index === 1 && ' 🥈'}
                  {index === 2 && ' 🥉'}
                </td>
                <td className="filename-cell">
                  <div className="file-info">
                    <div className="filename">{result.filename}</div>
                    {result.participant_name && (
                      <div className="author">by {result.participant_name}</div>
                    )}
                  </div>
                </td>
                <td>{result.mbc_score.toFixed(4)}</td>
                <td>{result.vote_count}</td>
                <td>{result.average_rank.toFixed(2)}</td>
                {showAdjusted && <td>{result.global_rank}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="info-box">
        <h4>ℹ️ About the Results</h4>
        <p>
          <strong>MBC Score:</strong> Modified Borda Count score (0-1 scale).
          Higher scores indicate better rankings. Each evaluator ranks the files they reviewed,
          and the MBC algorithm combines these rankings mathematically.
        </p>
        <p>
          <strong>Votes:</strong> Number of times this file was evaluated by participants.
        </p>
        <p>
          <strong>Avg Rank:</strong> Average position where evaluators placed this file (lower is better).
        </p>
        <p>
          <strong>Global Ranking:</strong> Pure mathematical ranking based on the MBC algorithm,
          treating all evaluators equally.
        </p>
        <p>
          <strong>Adjusted Ranking:</strong> Ranking adjusted based on evaluator quality scores.
          High-quality evaluators (Q ≥ {results.global_ranking[0] ? '0.6' : 'threshold'}) receive
          rank bonuses for their submissions, while low-quality evaluators receive penalties.
        </p>
      </div>
    </div>
  );
};

export default VotingResultsPanel;
