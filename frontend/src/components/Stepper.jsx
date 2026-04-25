import './Stepper.css'

/**
 * Stepper — The Workflow State Machine
 * Displays progress based on mode and current step.
 * Driven entirely by state, not manual navigation.
 */

const CURRICULUM_STEPS = [
  { id: 'ingest', label: 'Ingest', icon: '📥' },
  { id: 'define', label: 'Define', icon: '✏️' },
  { id: 'simulate', label: 'Simulate', icon: '⚡' },
  { id: 'deliver', label: 'Deliver', icon: '📄' },
]

const MINDMAP_STEPS = [
  { id: 'ingest', label: 'Ingest', icon: '📥' },
  { id: 'define', label: 'Define', icon: '✏️' },
  { id: 'explore', label: 'Explore', icon: '🔍' },
  { id: 'simulate', label: 'Curriculum', icon: '⚡', optional: true },
  { id: 'deliver', label: 'Deliver', icon: '📄' },
]

function Stepper({ mode, currentStep }) {
  const steps = mode === 'mindmap' ? MINDMAP_STEPS : CURRICULUM_STEPS

  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="stepper" id="workflow-stepper">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        const isComplete = index < currentIndex
        const isFuture = index > currentIndex

        return (
          <div key={step.id} className="stepper-item-wrapper">
            <div
              className={`stepper-item ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''} ${isFuture ? 'future' : ''} ${step.optional ? 'optional' : ''}`}
              id={`stepper-step-${step.id}`}
            >
              <div className="stepper-indicator">
                {isComplete ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span className="stepper-number">{index + 1}</span>
                )}
              </div>
              <span className="stepper-label">
                {step.label}
                {step.optional && <span className="stepper-optional">(opt)</span>}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`stepper-connector ${isComplete ? 'complete' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Stepper
