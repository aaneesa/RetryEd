import { useState } from 'react'
import './ModeSelection.css'

/**
 * ModeSelection — The Entry Controller (Mode Selection Gate)
 * Displays two large cards for mode selection.
 * Sets global state and transitions into the app.
 */
function ModeSelection({ onSelect }) {
  const [hoveredMode, setHoveredMode] = useState(null)
  const [selectedMode, setSelectedMode] = useState(null)

  const handleSelect = (mode) => {
    setSelectedMode(mode)
    // Small delay for the selection animation
    setTimeout(() => {
      onSelect(mode)
    }, 600)
  }

  return (
    <div className="mode-selection">
      {/* Ambient Background */}
      <div className="mode-bg-gradient" />
      <div className="mode-bg-grid" />

      {/* Header */}
      <div className="mode-header fade-in-up">
        <div className="mode-logo">
          <div className="mode-logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M10 16L14 20L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="mode-title">RetryEd</h1>
        </div>
        <p className="mode-subtitle">Algorithmic Instructional Design Engine</p>
      </div>

      {/* Selection Prompt */}
      <div className="mode-prompt fade-in-up" style={{ animationDelay: '0.15s' }}>
        <h2>How would you like to begin?</h2>
        <p>Choose your learning pathway to proceed</p>
      </div>

      {/* Mode Cards */}
      <div className="mode-cards">
        {/* Mindmap Mode */}
        <div
          className={`mode-card ${hoveredMode === 'mindmap' ? 'hovered' : ''} ${selectedMode === 'mindmap' ? 'selected' : ''} ${selectedMode && selectedMode !== 'mindmap' ? 'dimmed' : ''} fade-in-up`}
          style={{ animationDelay: '0.3s' }}
          onMouseEnter={() => setHoveredMode('mindmap')}
          onMouseLeave={() => setHoveredMode(null)}
          onClick={() => handleSelect('mindmap')}
          id="mode-card-mindmap"
        >
          <div className="mode-card-glow mindmap-glow" />
          <div className="mode-card-content">
            <div className="mode-card-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2"/>
                <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="38" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="10" cy="38" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="38" cy="38" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="19" y1="20" x2="13" y2="14" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="29" y1="20" x2="35" y2="14" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="19" y1="28" x2="13" y2="34" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="29" y1="28" x2="35" y2="34" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3 className="mode-card-title">Revise Concepts using Mindmaps</h3>
            <p className="mode-card-desc">
              Generate an interactive concept map from your material,
              explore relationships, then optionally build a full curriculum.
            </p>
            <div className="mode-card-tags">
              <span className="badge badge-gold">Exploratory</span>
              <span className="badge badge-info">Gemini Powered</span>
            </div>
            <div className="mode-card-flow">
              <span>Ingest</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span>Explore</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span className="optional">(Curriculum)</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span>Deliver</span>
            </div>
          </div>
          <div className="mode-card-select-indicator">
            <span>Select</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 10L17 10M17 10L13 6M17 10L13 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>

        {/* Curriculum Mode */}
        <div
          className={`mode-card ${hoveredMode === 'curriculum' ? 'hovered' : ''} ${selectedMode === 'curriculum' ? 'selected' : ''} ${selectedMode && selectedMode !== 'curriculum' ? 'dimmed' : ''} fade-in-up`}
          style={{ animationDelay: '0.45s' }}
          onMouseEnter={() => setHoveredMode('curriculum')}
          onMouseLeave={() => setHoveredMode(null)}
          onClick={() => handleSelect('curriculum')}
          id="mode-card-curriculum"
        >
          <div className="mode-card-glow curriculum-glow" />
          <div className="mode-card-content">
            <div className="mode-card-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="6" width="32" height="36" rx="3" stroke="currentColor" strokeWidth="2"/>
                <line x1="14" y1="14" x2="34" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="14" y1="20" x2="30" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="14" y1="26" x2="34" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="14" y1="32" x2="26" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="38" cy="38" r="8" fill="currentColor" opacity="0.15"/>
                <path d="M35 38L37 40L41 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="mode-card-title">Directly Jump to Curriculum Building</h3>
            <p className="mode-card-desc">
              Run the full 7-agent pipeline: extract concepts, build graph,
              score, order, generate lessons, and refine with simulated students.
            </p>
            <div className="mode-card-tags">
              <span className="badge badge-gold">Structured</span>
              <span className="badge badge-success">Groq Powered</span>
            </div>
            <div className="mode-card-flow">
              <span>Ingest</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span>Define</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span>Simulate</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span>Deliver</span>
            </div>
          </div>
          <div className="mode-card-select-indicator">
            <span>Select</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 10L17 10M17 10L13 6M17 10L13 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mode-footer fade-in" style={{ animationDelay: '0.6s' }}>
        <p>Powered by LangChain · Groq · Gemini · Gagné's 9 Events</p>
      </div>
    </div>
  )
}

export default ModeSelection
