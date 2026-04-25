import './ProjectStatePanel.css'

/**
 * ProjectStatePanel — The persistent left panel
 * Shows all collected inputs, session info, and pipeline status.
 */
function ProjectStatePanel({ mode, step, collectedInputs, sessionId, events, pipelineResults }) {
  return (
    <div className="state-panel">
      <div className="state-panel-header">
        <h3 className="state-panel-title">Project State</h3>
        <span className="badge badge-gold">{mode === 'mindmap' ? 'Mindmap' : 'Curriculum'}</span>
      </div>

      {/* Session Info */}
      <div className="state-section">
        <h4 className="state-section-title">Session</h4>
        <div className="state-item">
          <span className="state-label">ID</span>
          <span className="state-value mono">{sessionId ? sessionId.slice(0, 8) + '...' : '—'}</span>
        </div>
        <div className="state-item">
          <span className="state-label">Step</span>
          <span className="state-value">
            <span className="badge badge-gold">{step}</span>
          </span>
        </div>
      </div>

      {/* Document Info */}
      {collectedInputs.filename && (
        <div className="state-section">
          <h4 className="state-section-title">Document</h4>
          <div className="state-item">
            <span className="state-label">File</span>
            <span className="state-value">{collectedInputs.filename}</span>
          </div>
          {collectedInputs.textLength && (
            <div className="state-item">
              <span className="state-label">Length</span>
              <span className="state-value">{collectedInputs.textLength.toLocaleString()} chars</span>
            </div>
          )}
          {collectedInputs.textPreview && (
            <div className="state-preview">
              <p>{collectedInputs.textPreview.slice(0, 120)}...</p>
            </div>
          )}
        </div>
      )}

      {/* Collected Questions */}
      {collectedInputs.questions.length > 0 && (
        <div className="state-section">
          <h4 className="state-section-title">Responses</h4>
          {collectedInputs.questions.map((q, i) => (
            <div className="state-item" key={i}>
              <span className="state-label">{q.label}</span>
              <span className="state-value">{q.answer}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline Events */}
      {events.length > 0 && (
        <div className="state-section">
          <h4 className="state-section-title">Pipeline Events</h4>
          <div className="state-events-mini">
            {events.slice(-5).map((event, i) => (
              <div className="state-event-mini" key={i}>
                <div className={`state-event-dot ${event.status}`} />
                <span>{event.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Stats */}
      {pipelineResults && pipelineResults.stats && (
        <div className="state-section">
          <h4 className="state-section-title">Results</h4>
          <div className="state-stats-grid">
            <div className="state-stat">
              <span className="state-stat-value">{pipelineResults.stats.total_concepts}</span>
              <span className="state-stat-label">Concepts</span>
            </div>
            <div className="state-stat">
              <span className="state-stat-value">{pipelineResults.stats.total_lessons}</span>
              <span className="state-stat-label">Lessons</span>
            </div>
            <div className="state-stat">
              <span className="state-stat-value">{pipelineResults.stats.refined_lessons}</span>
              <span className="state-stat-label">Refined</span>
            </div>
            <div className="state-stat">
              <span className="state-stat-value">{pipelineResults.stats.weak_spots_count}</span>
              <span className="state-stat-label">Weak Spots</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectStatePanel
