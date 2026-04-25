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
  const [expandedLesson, setExpandedLesson] = useState(0)

  const curriculum = pipelineResults?.curriculum || []
  const weakSpots = pipelineResults?.weak_spots || []
  const stats = pipelineResults?.stats || {}

  // Sort curriculum by rank
  const sortedCurriculum = useMemo(() => {
    return [...curriculum].sort((a, b) => (a.rank || 0) - (b.rank || 0))
  }, [curriculum])

  const handleDownloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let yPos = margin

    const checkPageBreak = (needed = 20) => {
      if (yPos + needed > pageHeight - margin) {
        doc.addPage()
        yPos = margin
        return true
      }
      return false
    }

    // ─── Cover Page ───
    doc.setFillColor(18, 18, 18)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Gold accent line
    doc.setDrawColor(212, 168, 83)
    doc.setLineWidth(1.5)
    doc.line(margin, 50, pageWidth - margin, 50)

    doc.setTextColor(245, 245, 245)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(32)
    doc.text('RetryEd', margin, 40)

    doc.setFontSize(14)
    doc.setTextColor(160, 160, 160)
    doc.text('Algorithmic Instructional Design Engine', margin, 58)

    doc.setFontSize(11)
    doc.setTextColor(212, 168, 83)
    doc.text(`Mode: ${mode === 'mindmap' ? 'Mindmap → Curriculum' : 'Direct Curriculum'}`, margin, 75)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 83)

    if (collectedInputs.filename) {
      doc.text(`Source: ${collectedInputs.filename}`, margin, 91)
    }

    // Stats Box
    doc.setFillColor(30, 30, 30)
    doc.roundedRect(margin, 105, contentWidth, 40, 3, 3, 'F')
    doc.setTextColor(212, 168, 83)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')

    const statX = margin + 15
    doc.text(String(stats.total_concepts || 0), statX, 122)
    doc.text(String(stats.total_lessons || 0), statX + 45, 122)
    doc.text(String(stats.refined_lessons || 0), statX + 90, 122)
    doc.text(String(stats.weak_spots_count || 0), statX + 135, 122)

    doc.setFontSize(7)
    doc.setTextColor(160, 160, 160)
    doc.text('CONCEPTS', statX, 132)
    doc.text('LESSONS', statX + 45, 132)
    doc.text('REFINED', statX + 90, 132)
    doc.text('WEAK SPOTS', statX + 135, 132)

    // Footer on cover
    doc.setDrawColor(212, 168, 83)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30)
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.text('Powered by LangChain · Groq · Gemini · Gagné\'s 9 Events of Instruction', margin, pageHeight - 22)

    // ─── Curriculum Pages ───
    doc.addPage()
    yPos = margin

    // Page header style function
    const drawPageHeader = (title) => {
      doc.setTextColor(40, 40, 40)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text(title, margin, yPos)
      yPos += 4
      doc.setDrawColor(212, 168, 83)
      doc.setLineWidth(0.8)
      doc.line(margin, yPos, margin + 40, yPos)
      yPos += 12
    }

    drawPageHeader('Curriculum Overview')

    // Table of contents
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)

    sortedCurriculum.forEach((lesson, i) => {
      checkPageBreak(8)
      const rank = lesson.rank || i + 1
      const title = lesson.concept_title || lesson.node_id || `Lesson ${rank}`
      const status = lesson.refined_content ? '✓ Refined' : '○ Original'
      const pn = lesson.Pn ? `Pn=${Number(lesson.Pn).toFixed(2)}` : ''

      doc.setTextColor(212, 168, 83)
      doc.setFont('helvetica', 'bold')
      doc.text(`${String(rank).padStart(2, '0')}`, margin, yPos)

      doc.setTextColor(40, 40, 40)
      doc.setFont('helvetica', 'normal')
      const truncTitle = title.length > 45 ? title.substring(0, 45) + '...' : title
      doc.text(truncTitle, margin + 12, yPos)

      doc.setTextColor(120, 120, 120)
      doc.setFontSize(7)
      doc.text(`${status}  ${pn}`, pageWidth - margin - 40, yPos)
      doc.setFontSize(9)

      yPos += 7
    })

    // ─── Detailed Lesson Pages ───
    sortedCurriculum.forEach((lesson, i) => {
      doc.addPage()
      yPos = margin

      const rank = lesson.rank || i + 1
      const title = lesson.concept_title || lesson.node_id || `Lesson ${rank}`

      // Lesson Header
      doc.setFillColor(248, 246, 243)
      doc.rect(0, 0, pageWidth, 45, 'F')

      doc.setTextColor(212, 168, 83)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(`LESSON ${String(rank).padStart(2, '0')}`, margin, 18)

      doc.setTextColor(30, 30, 30)
      doc.setFontSize(16)
      const titleLines = doc.splitTextToSize(title, contentWidth)
      doc.text(titleLines, margin, 28)

      // Metadata line
      yPos = 50
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      const metaInfo = [
        lesson.concept_type ? `Type: ${lesson.concept_type}` : '',
        lesson.Pn ? `Priority: ${Number(lesson.Pn).toFixed(2)}` : '',
        lesson.D !== undefined ? `Depth: ${lesson.D}` : '',
        lesson.A !== undefined ? `Abstraction: ${Number(lesson.A).toFixed(1)}` : '',
        lesson.U !== undefined ? `Uncertainty: ${Number(lesson.U).toFixed(1)}` : '',
      ].filter(Boolean).join('  |  ')
      doc.text(metaInfo, margin, yPos)
      yPos += 10

      // Section helper
      const addSection = (heading, content) => {
        if (!content) return
        checkPageBreak(25)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(212, 168, 83)
        doc.text(heading, margin, yPos)
        yPos += 6

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        const lines = doc.splitTextToSize(String(content), contentWidth)
        lines.forEach(line => {
          checkPageBreak(6)
          doc.text(line, margin, yPos)
          yPos += 5
        })
        yPos += 6
      }

      // Lesson sections
      addSection('Misconception', lesson.misconception)
      addSection('Hook', lesson.hook)
      addSection('Explanation', lesson.explanation)
      addSection('Example', lesson.example)
      addSection('Practice', lesson.practice)

      // Logic Trap Question
      if (lesson.logic_trap_question) {
        checkPageBreak(30)
        doc.setFillColor(242, 240, 237)
        doc.roundedRect(margin, yPos - 2, contentWidth, 8, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(30, 30, 30)
        doc.text('Logic Trap Question', margin + 4, yPos + 4)
        yPos += 12

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)

        const q = typeof lesson.logic_trap_question === 'object'
          ? lesson.logic_trap_question.question || JSON.stringify(lesson.logic_trap_question)
          : lesson.logic_trap_question
        const qLines = doc.splitTextToSize(String(q), contentWidth - 8)
        qLines.forEach(line => {
          checkPageBreak(6)
          doc.text(line, margin + 4, yPos)
          yPos += 5
        })
        yPos += 4

        if (lesson.logic_trap_question.options) {
          lesson.logic_trap_question.options.forEach((opt, oi) => {
            checkPageBreak(6)
            const letter = String.fromCharCode(65 + oi)
            doc.text(`${letter}) ${opt}`, margin + 8, yPos)
            yPos += 5
          })
          yPos += 4
        }

        if (lesson.correct_answer) {
          checkPageBreak(8)
          doc.setTextColor(74, 166, 80)
          doc.setFont('helvetica', 'bold')
          doc.text(`Correct Answer: ${lesson.correct_answer}`, margin + 4, yPos)
          yPos += 8
        }
      }

      // Reasoning Paths
      if (lesson.reasoning_paths) {
        addSection('Wrong Reasoning 1', lesson.reasoning_paths.wrong_1)
        addSection('Wrong Reasoning 2', lesson.reasoning_paths.wrong_2)
        addSection('Correct Reasoning', lesson.reasoning_paths.correct)
      }

      // Refined Content
      if (lesson.refined_content) {
        checkPageBreak(20)
        doc.setFillColor(212, 168, 83)
        doc.roundedRect(margin, yPos - 2, contentWidth, 8, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(30, 30, 30)
        doc.text('⚡ Adaptively Refined', margin + 4, yPos + 4)
        yPos += 12

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        const refLines = doc.splitTextToSize(String(lesson.refined_content), contentWidth)
        refLines.forEach(line => {
          checkPageBreak(6)
          doc.text(line, margin, yPos)
          yPos += 5
        })
        yPos += 6
      }

      // Student Simulation
      if (lesson.student_simulation) {
        const sim = lesson.student_simulation
        addSection('Student Simulation', `Answer: ${sim.answer} | Correct: ${sim.is_correct ? 'Yes' : 'No'}`)
        if (sim.reasoning_summary) addSection('Student Reasoning', sim.reasoning_summary)
        if (sim.confusion_point) addSection('Confusion Point', sim.confusion_point)
      }

      // Gagné Events (from curriculum data)
      if (lesson.gagne_events && Array.isArray(lesson.gagne_events)) {
        checkPageBreak(25)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(212, 168, 83)
        doc.text("Gagné's 9 Events", margin, yPos)
        yPos += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        lesson.gagne_events.forEach(evt => {
          checkPageBreak(5)
          doc.text(`• ${evt}`, margin + 4, yPos)
          yPos += 4.5
        })
      }

      // Page number
      doc.setTextColor(180, 180, 180)
      doc.setFontSize(8)
      doc.text(`${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    })

    // ─── Weak Spots Page ───
    if (weakSpots.length > 0) {
      doc.addPage()
      yPos = margin
      drawPageHeader('Weak Spots Analysis')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      doc.text(`${weakSpots.length} high-risk concepts identified (A ≥ 7.0 or U ≥ 7.0)`, margin, yPos)
      yPos += 10

      weakSpots.forEach((ws, i) => {
        checkPageBreak(15)
        doc.setFillColor(248, 240, 240)
        doc.roundedRect(margin, yPos - 3, contentWidth, 12, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(200, 60, 60)
        doc.text(`${i + 1}. ${ws.node_id ? ws.node_id.substring(0, 20) + '...' : 'Unknown'}`, margin + 4, yPos + 4)
        doc.setTextColor(120, 120, 120)
        doc.setFont('helvetica', 'normal')
        doc.text(`A=${Number(ws.A).toFixed(1)}  U=${Number(ws.U).toFixed(1)}  Risk: ${ws.risk_level}`, margin + 100, yPos + 4)
        yPos += 16
      })
    }

    doc.save(`RetryEd_Curriculum_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="deliverable-view">
      {/* Document Header */}
      <div className="deliverable-header fade-in-up">
        <div className="deliverable-title-section">
          <h1 className="deliverable-title">Generated Curriculum</h1>
          <p className="deliverable-meta">
            {stats.total_lessons || 0} lessons · {stats.refined_lessons || 0} refined · {stats.weak_spots_count || 0} weak spots identified
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleDownloadPDF} id="btn-download-pdf">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V10M8 10L5 7M8 10L11 7M2 12V13C2 13.6 2.4 14 3 14H13C13.6 14 14 13.6 14 13V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="deliverable-tabs">
        <button
          className={`deliverable-tab ${activeTab === 'curriculum' ? 'active' : ''}`}
          onClick={() => setActiveTab('curriculum')}
          id="tab-curriculum"
        >
          Curriculum ({sortedCurriculum.length})
        </button>
        <button
          className={`deliverable-tab ${activeTab === 'weakspots' ? 'active' : ''}`}
          onClick={() => setActiveTab('weakspots')}
          id="tab-weakspots"
        >
          Weak Spots ({weakSpots.length})
        </button>
      </div>

      {/* Curriculum Tab */}
      {activeTab === 'curriculum' && (
        <div className="deliverable-curriculum fade-in">
          {sortedCurriculum.map((lesson, i) => {
            const rank = lesson.rank || i + 1
            const title = lesson.concept_title || lesson.node_id || `Lesson ${rank}`
            const isExpanded = expandedLesson === i

            return (
              <div
                key={i}
                className={`deliverable-lesson-card ${isExpanded ? 'expanded' : ''} ${lesson.refined_content ? 'refined' : ''}`}
                onClick={() => setExpandedLesson(isExpanded ? null : i)}
                id={`lesson-card-${i}`}
              >
                <div className="lesson-card-header">
                  <div className="lesson-card-rank">{String(rank).padStart(2, '0')}</div>
                  <div className="lesson-card-info">
                    <h3 className="lesson-card-title">{title}</h3>
                    <div className="lesson-card-meta">
                      {lesson.concept_type && <span className="badge badge-gold">{lesson.concept_type}</span>}
                      {lesson.refined_content && <span className="badge badge-success">Refined</span>}
                      {lesson.Pn && <span className="lesson-card-pn">Pn={Number(lesson.Pn).toFixed(2)}</span>}
                    </div>
                  </div>
                  <div className={`lesson-card-expand-icon ${isExpanded ? 'rotated' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="lesson-card-content fade-in">
                    {lesson.misconception && (
                      <div className="lesson-section">
                        <h4>Misconception</h4>
                        <p>{lesson.misconception}</p>
                      </div>
                    )}
                    {lesson.hook && (
                      <div className="lesson-section">
                        <h4>Hook</h4>
                        <p>{lesson.hook}</p>
                      </div>
                    )}
                    {lesson.explanation && (
                      <div className="lesson-section">
                        <h4>Explanation</h4>
                        <p>{lesson.explanation}</p>
                      </div>
                    )}
                    {lesson.example && (
                      <div className="lesson-section">
                        <h4>Example</h4>
                        <p>{lesson.example}</p>
                      </div>
                    )}
                    {lesson.practice && (
                      <div className="lesson-section">
                        <h4>Practice</h4>
                        <p>{lesson.practice}</p>
                      </div>
                    )}
                    {lesson.logic_trap_question && (
                      <div className="lesson-section lesson-section-highlight">
                        <h4>Logic Trap Question</h4>
                        <p className="lesson-question">
                          {typeof lesson.logic_trap_question === 'object'
                            ? lesson.logic_trap_question.question
                            : lesson.logic_trap_question}
                        </p>
                        {lesson.logic_trap_question.options && (
                          <div className="lesson-options">
                            {lesson.logic_trap_question.options.map((opt, oi) => (
                              <span key={oi} className="lesson-option">
                                {String.fromCharCode(65 + oi)}) {opt}
                              </span>
                            ))}
                          </div>
                        )}
                        {lesson.correct_answer && (
                          <p className="lesson-correct-answer">✓ {lesson.correct_answer}</p>
                        )}
                      </div>
                    )}
                    {lesson.reasoning_paths && (
                      <div className="lesson-section">
                        <h4>Reasoning Paths</h4>
                        {lesson.reasoning_paths.correct && <p><strong>Correct:</strong> {lesson.reasoning_paths.correct}</p>}
                        {lesson.reasoning_paths.wrong_1 && <p><strong>Wrong 1:</strong> {lesson.reasoning_paths.wrong_1}</p>}
                        {lesson.reasoning_paths.wrong_2 && <p><strong>Wrong 2:</strong> {lesson.reasoning_paths.wrong_2}</p>}
                      </div>
                    )}
                    {lesson.refined_content && (
                      <div className="lesson-section lesson-section-refined">
                        <h4>⚡ Adaptively Refined Content</h4>
                        <p>{lesson.refined_content}</p>
                      </div>
                    )}
                    {lesson.student_simulation && (
                      <div className="lesson-section">
                        <h4>Student Simulation</h4>
                        <p>
                          Answer: <strong>{lesson.student_simulation.answer}</strong> — 
                          {lesson.student_simulation.is_correct
                            ? <span className="text-success"> Correct</span>
                            : <span className="text-error"> Failed</span>
                          }
                        </p>
                        {lesson.student_simulation.reasoning_summary && (
                          <p className="lesson-simulation-detail">{lesson.student_simulation.reasoning_summary}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Weak Spots Tab */}
      {activeTab === 'weakspots' && (
        <div className="deliverable-weakspots fade-in">
          {weakSpots.length === 0 ? (
            <div className="weakspots-empty">
              <p>No high-risk weak spots identified — all concepts are within acceptable thresholds.</p>
            </div>
          ) : (
            weakSpots.map((ws, i) => (
              <div className="weakspot-card" key={i}>
                <div className="weakspot-header">
                  <span className="badge badge-error">{ws.risk_level}</span>
                  <span className="weakspot-id">{ws.node_id ? ws.node_id.substring(0, 12) + '...' : 'Unknown'}</span>
                </div>
                <div className="weakspot-scores">
                  <div className="weakspot-score">
                    <span className="weakspot-score-label">Abstraction</span>
                    <div className="weakspot-score-bar">
                      <div className="weakspot-score-fill" style={{ width: `${(ws.A / 10) * 100}%` }} />
                    </div>
                    <span className="weakspot-score-value">{Number(ws.A).toFixed(1)}</span>
                  </div>
                  <div className="weakspot-score">
                    <span className="weakspot-score-label">Uncertainty</span>
                    <div className="weakspot-score-bar">
                      <div className="weakspot-score-fill uncertainty" style={{ width: `${(ws.U / 10) * 100}%` }} />
                    </div>
                    <span className="weakspot-score-value">{Number(ws.U).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default DeliverableView
