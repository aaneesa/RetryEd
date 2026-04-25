import { useState, useEffect, useRef } from 'react'
import './SimulationFeed.css'

/**
 * SimulationFeed — The State-Driven Rendering Engine
 * Renders sequential event cards triggered by state changes.
 * Simulates improvement over time (scores increasing).
 */
function SimulationFeed({ events, isLoading, onStartPipeline, pipelineResults }) {
  const [visibleEvents, setVisibleEvents] = useState([])
  const feedRef = useRef(null)
  const hasStarted = useRef(false)

  // Progressive event reveal
  useEffect(() => {
    if (events.length > visibleEvents.length) {
      const timer = setTimeout(() => {
        setVisibleEvents(events.slice(0, visibleEvents.length + 1))
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [events, visibleEvents])

  // Auto-scroll to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [visibleEvents])

  const handleStart = () => {
    if (!hasStarted.current) {
      hasStarted.current = true
      onStartPipeline()
    }
  }

  const getScoreColor = (score) => {
    if (!score) return ''
    const num = parseInt(score)
    if (num <= 3) return 'score-low'
    if (num <= 6) return 'score-mid'
    return 'score-high'
  }

  const getProgressPercentage = () => {
    if (!events.length) return 0
    const completeCount = events.filter(e => e.status === 'complete').length
    return Math.round((completeCount / 14) * 100) // 14 total events (7 agents × 2)
  }

  return (
    <div className="simulation-feed">
      {/* Pre-start state */}
      {!isLoading && events.length === 0 && !pipelineResults && (
        <div className="simulation-empty fade-in-up">
          <div className="simulation-empty-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/>
              <polygon points="28,22 28,42 44,32" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>
          <h2>Ready to Build Curriculum</h2>
          <p>The 7-agent pipeline will process your content through concept extraction, graph building, cognitive scoring, topological sorting, lesson generation, weak spot tracking, and adaptive refinement.</p>
          <div className="simulation-agents-preview">
            {['Miner', 'Graph Builder', 'Scorer', 'Curriculum', 'Lessons', 'Weak Spots', 'Refiner'].map((agent, i) => (
              <div className="agent-preview-chip" key={i}>
                <span className="agent-preview-num">{i + 1}</span>
                <span>{agent}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleStart} id="btn-start-pipeline">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <polygon points="6,4 6,16 16,10" fill="currentColor"/>
            </svg>
            Start Pipeline
          </button>
        </div>
      )}

      {/* Active simulation */}
      {(isLoading || events.length > 0) && (
        <div className="simulation-active">
          <div className="simulation-header">
            <div className="simulation-header-left">
              <h3>Pipeline Simulation</h3>
              {isLoading && <div className="spinner" />}
            </div>
            <div className="simulation-progress-bar">
              <div
                className="simulation-progress-fill"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          <div className="simulation-event-feed" ref={feedRef}>
            {visibleEvents.map((event, i) => (
              <div
                className={`simulation-event-card fade-in-up ${event.status}`}
                key={event.id || i}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="event-card-left">
                  <div className={`event-status-indicator ${event.status}`}>
                    {event.status === 'complete' ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    )}
                  </div>
                  {i < visibleEvents.length - 1 && (
                    <div className={`event-connector ${event.status}`} />
                  )}
                </div>
                <div className="event-card-content">
                  <div className="event-card-header">
                    <h4>{event.title}</h4>
                    {event.score && (
                      <span className={`event-score ${getScoreColor(event.score)}`}>
                        {event.score}
                      </span>
                    )}
                  </div>
                  <p>{event.description}</p>
                  <span className="event-timestamp">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && visibleEvents.length > 0 && (
              <div className="simulation-thinking fade-in">
                <div className="pedagogical-pulse active" />
                <span>Processing next agent...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SimulationFeed
