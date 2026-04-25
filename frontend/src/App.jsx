import { useState, useCallback } from 'react'
import ModeSelection from './components/ModeSelection'
import Stepper from './components/Stepper'
import Workspace from './components/Workspace'
import './App.css'

const API_BASE = '/api'

/**
 * App — Root Component (State Machine Controller)
 *
 * Global State:
 *  - mode: "mindmap" | "curriculum" | null
 *  - step: "ingest" | "define" | "explore" | "simulate" | "deliver"
 *  - sessionId: string
 *  - collectedInputs: { questions[], file, textPreview }
 *  - pipelineResults: { curriculum[], weak_spots[], stats }
 *  - mindmapData: string (mermaid code)
 *  - events: [] simulation feed events
 */
function App() {
  const [mode, setMode] = useState(null)
  const [step, setStep] = useState('ingest')
  const [sessionId, setSessionId] = useState(null)
  const [collectedInputs, setCollectedInputs] = useState({
    questions: [],
    file: null,
    textPreview: '',
    filename: '',
  })
  const [pipelineResults, setPipelineResults] = useState(null)
  const [mindmapData, setMindmapData] = useState(null)
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Mode selection handler
  const handleModeSelect = useCallback((selectedMode) => {
    setMode(selectedMode)
    setStep('ingest')
    setError(null)
  }, [])

  // Reset to mode selection
  const handleReset = useCallback(() => {
    setMode(null)
    setStep('ingest')
    setSessionId(null)
    setCollectedInputs({ questions: [], file: null, textPreview: '', filename: '' })
    setPipelineResults(null)
    setMindmapData(null)
    setEvents([])
    setIsLoading(false)
    setError(null)
  }, [])

  // File upload handler
  const handleFileUpload = useCallback(async (file) => {
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setSessionId(data.session_id)
      setCollectedInputs(prev => ({
        ...prev,
        file: file,
        textPreview: data.preview,
        filename: data.filename,
        textLength: data.text_length,
      }))
      setStep('define')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Text submit handler
  const handleTextSubmit = useCallback(async (text) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submit failed')
      setSessionId(data.session_id)
      setCollectedInputs(prev => ({
        ...prev,
        textPreview: data.preview,
        filename: data.filename,
        textLength: data.text_length,
      }))
      setStep('define')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Collect questions from typewriter flow
  const handleQuestionsComplete = useCallback((answers) => {
    setCollectedInputs(prev => ({
      ...prev,
      questions: answers,
    }))
    if (mode === 'mindmap') {
      setStep('explore')
    } else {
      setStep('simulate')
    }
  }, [mode])

  // Trigger mindmap generation
  const handleGenerateMindmap = useCallback(async () => {
    if (!sessionId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/mindmap/${sessionId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Mindmap generation failed')
      setMindmapData(data.mermaid_code)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  // Trigger curriculum pipeline
  const handleStartPipeline = useCallback(async () => {
    if (!sessionId) return
    setIsLoading(true)
    setError(null)
    setEvents([])
    try {
      const res = await fetch(`${API_BASE}/curriculum/${sessionId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Pipeline start failed')

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE}/status/${sessionId}`)
          const statusData = await statusRes.json()
          setEvents(statusData.events || [])

          if (statusData.status === 'complete') {
            clearInterval(pollInterval)
            const resultsRes = await fetch(`${API_BASE}/results/${sessionId}`)
            const resultsData = await resultsRes.json()
            setPipelineResults(resultsData)
            setStep('deliver')
            setIsLoading(false)
          } else if (statusData.status === 'error') {
            clearInterval(pollInterval)
            setError(statusData.error || 'Pipeline failed')
            setIsLoading(false)
          }
        } catch (err) {
          clearInterval(pollInterval)
          setError(err.message)
          setIsLoading(false)
        }
      }, 2000)
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }, [sessionId])

  // Move to curriculum from mindmap mode
  const handleContinueToCurriculum = useCallback(() => {
    setStep('simulate')
  }, [])

  // If no mode selected, show mode selection gate
  if (!mode) {
    return <ModeSelection onSelect={handleModeSelect} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <button className="btn btn-ghost btn-sm" onClick={handleReset} id="btn-reset">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            RetryEd
          </button>
        </div>
        <div className="app-header-center">
          <Stepper mode={mode} currentStep={step} />
        </div>
        <div className="app-header-right">
          <div className="pedagogical-pulse-container">
            <div className={`pedagogical-pulse ${isLoading ? 'active' : step === 'deliver' ? 'idle' : ''}`} />
            <span className="pulse-label">
              {isLoading ? 'Processing' : step === 'deliver' ? 'Complete' : 'Ready'}
            </span>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner fade-in">
          <span>⚠ {error}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <main className="app-main">
        <Workspace
          mode={mode}
          step={step}
          sessionId={sessionId}
          collectedInputs={collectedInputs}
          pipelineResults={pipelineResults}
          mindmapData={mindmapData}
          events={events}
          isLoading={isLoading}
          onFileUpload={handleFileUpload}
          onTextSubmit={handleTextSubmit}
          onQuestionsComplete={handleQuestionsComplete}
          onGenerateMindmap={handleGenerateMindmap}
          onStartPipeline={handleStartPipeline}
          onContinueToCurriculum={handleContinueToCurriculum}
          onStepChange={setStep}
        />
      </main>
    </div>
  )
}

export default App
