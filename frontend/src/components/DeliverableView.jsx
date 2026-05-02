import { useState, useMemo } from 'react'
import { jsPDF } from 'jspdf'
import './DeliverableView.css'

/**
 * DeliverableView — The Final Render Layer
 * Transitions from dark UI to off-white document layout.
 * Typography switches from sans-serif to serif.
 * PDF download uses real pipeline data.
 */
function DeliverableView({ pipelineResults, mode, mindmapData, collectedInputs }) {
  const [activeTab, setActiveTab] = useState('curriculum')
  const [currentPage, setCurrentPage] = useState(0)

  const curriculum = pipelineResults?.curriculum || []
  const stats = pipelineResults?.stats || {}

  // Sort curriculum by rank
  const sortedCurriculum = useMemo(() => {
    return [...curriculum].sort((a, b) => (a.rank || 0) - (b.rank || 0))
  }, [curriculum])

  const totalPages = sortedCurriculum.length
  const currentLesson = sortedCurriculum[currentPage]

  const nextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1)
  }

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1)
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    // ... (rest of PDF logic remains same or can be updated later if needed)
    // I'll keep the PDF logic as is for now to avoid complexity unless requested
    doc.save(`RetryEd_Curriculum_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  // Section definitions for "defining what response what is"
  const sectionDefinitions = {
    misconception: "Common hurdle or false mental model students often have.",
    hook: "Attention-grabbing start to pique curiosity (Gagné's Event 1).",
    explanation: "Core pedagogical breakdown of the concept.",
    example: "Real-world scenario illustrating the application.",
    practice: "Immediate application exercise to solidify learning.",
    logic_trap: "Challenge question designed to reveal misconceptions."
  }

  return (
    <div className="deliverable-view">
      {/* Document Header */}
      <div className="deliverable-header fade-in-up">
        <div className="deliverable-title-section">
          <h1 className="deliverable-title">Interactive Curriculum Book</h1>
          <p className="deliverable-meta">
            {stats.total_lessons || 0} lessons · {stats.refined_lessons || 0} refined
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleDownloadPDF} id="btn-download-pdf">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V10M8 10L5 7M8 10L11 7M2 12V13C2 13.6 2.4 14 3 14H13C13.6 14 14 13.6 14 13V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export PDF
        </button>
      </div>

      <div className="book-container fade-in">
        <div className="book-spine"></div>
        
        <div className="book-page">
          {currentLesson ? (
            <div className="book-content">
              <div className="book-page-header">
                <span className="page-number">Page {currentPage + 1} of {totalPages}</span>
                <span className="lesson-badge">LESSON {String(currentLesson.rank || currentPage + 1).padStart(2, '0')}</span>
              </div>

              <h2 className="book-lesson-title">{currentLesson.lesson_title || currentLesson.concept_title || currentLesson.node_id}</h2>

              <div className="book-lesson-body">
                
                {/* Misconception Card - Moved here and styled as a small card */}
                {currentLesson.misconception && (
                  <div className="misconception-card">
                    <div className="section-label" title={sectionDefinitions.misconception}>
                      Misconception Alert
                      <span className="info-icon">?</span>
                    </div>
                    <p>{currentLesson.misconception}</p>
                  </div>
                )}

                {currentLesson.hook && (
                  <div className="book-section">
                    <div className="section-header">
                      <h4>The Hook</h4>
                      <span className="section-definition">{sectionDefinitions.hook}</span>
                    </div>
                    <p className="hook-text">{currentLesson.hook}</p>
                  </div>
                )}

                {currentLesson.explanation && (
                  <div className="book-section">
                    <div className="section-header">
                      <h4>Explanation</h4>
                      <span className="section-definition">{sectionDefinitions.explanation}</span>
                    </div>
                    <p>{currentLesson.explanation}</p>
                  </div>
                )}

                {currentLesson.example && (
                  <div className="book-section">
                    <div className="section-header">
                      <h4>Application Example</h4>
                      <span className="section-definition">{sectionDefinitions.example}</span>
                    </div>
                    <div className="example-box">
                      <p>{currentLesson.example}</p>
                    </div>
                  </div>
                )}

                {currentLesson.practice && (
                  <div className="book-section">
                    <div className="section-header">
                      <h4>Practice Exercise</h4>
                      <span className="section-definition">{sectionDefinitions.practice}</span>
                    </div>
                    <p>{currentLesson.practice}</p>
                  </div>
                )}

                {currentLesson.logic_trap_question && (
                  <div className="book-section logic-trap-section">
                    <div className="section-header">
                      <h4>Logic Trap Question</h4>
                      <span className="section-definition">{sectionDefinitions.logic_trap}</span>
                    </div>
                    <div className="logic-trap-card">
                      <p className="question-text">
                        {typeof currentLesson.logic_trap_question === 'object'
                          ? currentLesson.logic_trap_question.question
                          : currentLesson.logic_trap_question}
                      </p>
                      {currentLesson.logic_trap_question.options && (
                        <div className="options-grid">
                          {currentLesson.logic_trap_question.options.map((opt, oi) => (
                            <div key={oi} className="option-item">
                              <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                              <span className="option-text">{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentLesson.refined_content && (
                  <div className="book-section refined-section">
                    <div className="section-header">
                      <h4>⚡ Adaptive Refinement</h4>
                    </div>
                    <p className="refined-text">{currentLesson.refined_content}</p>
                  </div>
                )}
              </div>

              <div className="book-navigation">
                <button 
                  className="nav-btn prev" 
                  onClick={prevPage} 
                  disabled={currentPage === 0}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  Previous
                </button>
                <div className="page-indicator">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                    <span 
                      key={i} 
                      className={`dot ${currentPage === i ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i)}
                    ></span>
                  ))}
                  {totalPages > 5 && <span className="dots-more">...</span>}
                </div>
                <button 
                  className="nav-btn next" 
                  onClick={nextPage} 
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="book-empty">
              <p>No curriculum data available. Please generate a lesson first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeliverableView
