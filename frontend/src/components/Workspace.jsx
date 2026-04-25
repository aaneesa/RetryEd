import ProjectStatePanel from './ProjectStatePanel'
import IngestView from './IngestView'
import TypewriterFlow from './TypewriterFlow'
import MindmapView from './MindmapView'
import SimulationFeed from './SimulationFeed'
import DeliverableView from './DeliverableView'
import './Workspace.css'

/**
 * Workspace — The Split-Pane Architect
 * Left 30%: persistent state panel (visible after ingest)
 * Right 70%: dynamic rendering canvas
 */
function Workspace({
  mode,
  step,
  sessionId,
  collectedInputs,
  pipelineResults,
  mindmapData,
  events,
  isLoading,
  onFileUpload,
  onTextSubmit,
  onQuestionsComplete,
  onGenerateMindmap,
  onStartPipeline,
  onContinueToCurriculum,
  onStepChange,
}) {
  const showPanel = step !== 'ingest'

  const renderCanvas = () => {
    switch (step) {
      case 'ingest':
        return (
          <IngestView
            onFileUpload={onFileUpload}
            onTextSubmit={onTextSubmit}
            isLoading={isLoading}
          />
        )
      case 'define':
        return (
          <TypewriterFlow
            mode={mode}
            onComplete={onQuestionsComplete}
          />
        )
      case 'explore':
        return (
          <MindmapView
            mindmapData={mindmapData}
            isLoading={isLoading}
            onGenerateMindmap={onGenerateMindmap}
            onContinueToCurriculum={onContinueToCurriculum}
          />
        )
      case 'simulate':
        return (
          <SimulationFeed
            events={events}
            isLoading={isLoading}
            onStartPipeline={onStartPipeline}
            pipelineResults={pipelineResults}
          />
        )
      case 'deliver':
        return (
          <DeliverableView
            pipelineResults={pipelineResults}
            mode={mode}
            mindmapData={mindmapData}
            collectedInputs={collectedInputs}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={`workspace ${showPanel ? 'with-panel' : 'full-canvas'} ${step === 'deliver' ? 'deliver-mode' : ''}`}>
      {showPanel && (
        <div className="workspace-panel slide-in-left">
          <ProjectStatePanel
            mode={mode}
            step={step}
            collectedInputs={collectedInputs}
            sessionId={sessionId}
            events={events}
            pipelineResults={pipelineResults}
          />
        </div>
      )}
      <div className={`workspace-canvas ${showPanel ? '' : 'centered'}`}>
        {renderCanvas()}
      </div>
    </div>
  )
}

export default Workspace
