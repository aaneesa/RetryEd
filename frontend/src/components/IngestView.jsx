import { useState, useRef } from 'react'
import './IngestView.css'

/**
 * IngestView — File Upload Component
 * Handles PDF upload or direct text paste.
 */
function IngestView({ onFileUpload, onTextSubmit, isLoading }) {
  const [mode, setMode] = useState('upload') // 'upload' | 'text'
  const [dragActive, setDragActive] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmitFile = () => {
    if (selectedFile) {
      onFileUpload(selectedFile)
    }
  }

  const handleSubmitText = () => {
    if (textInput.trim().length > 50) {
      onTextSubmit(textInput.trim())
    }
  }

  return (
    <div className="ingest-view fade-in-up">
      <div className="ingest-header">
        <h2 className="ingest-title">Upload Your Content</h2>
        <p className="ingest-desc">Provide educational material to begin processing</p>
      </div>

      {/* Mode Toggle */}
      <div className="ingest-toggle">
        <button
          className={`ingest-toggle-btn ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => setMode('upload')}
          id="toggle-upload"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V10M8 2L5 5M8 2L11 5M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Upload PDF
        </button>
        <button
          className={`ingest-toggle-btn ${mode === 'text' ? 'active' : ''}`}
          onClick={() => setMode('text')}
          id="toggle-text"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 4H13M3 8H10M3 12H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Paste Text
        </button>
      </div>

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div
          className={`ingest-dropzone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          id="upload-dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {selectedFile ? (
            <div className="ingest-file-info fade-in">
              <div className="ingest-file-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="8" y="4" width="24" height="32" rx="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 16H26M14 22H26M14 28H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h4>{selectedFile.name}</h4>
              <p>{(selectedFile.size / 1024).toFixed(1)} KB</p>
              <div className="ingest-file-actions">
                <button className="btn btn-primary" onClick={handleSubmitFile} disabled={isLoading} id="btn-upload-submit">
                  {isLoading ? <><div className="spinner" /> Processing...</> : 'Process Document'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="ingest-dropzone-content">
              <div className="ingest-upload-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 8V28M24 8L16 16M24 8L32 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 32V36C8 38.2 9.8 40 12 40H36C38.2 40 40 38.2 40 36V32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Drop your PDF here</h3>
              <p>or click to browse</p>
              <span className="ingest-hint">Supported: .pdf files only</span>
            </div>
          )}
        </div>
      )}

      {/* Text Mode */}
      {mode === 'text' && (
        <div className="ingest-text-area fade-in">
          <textarea
            className="ingest-textarea"
            placeholder="Paste your educational content here...&#10;&#10;Minimum 50 characters required."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            id="text-input-area"
          />
          <div className="ingest-text-footer">
            <span className="ingest-char-count">
              {textInput.length} characters
              {textInput.length < 50 && textInput.length > 0 && (
                <span className="ingest-char-warning"> — need {50 - textInput.length} more</span>
              )}
            </span>
            <button
              className="btn btn-primary"
              onClick={handleSubmitText}
              disabled={textInput.trim().length < 50 || isLoading}
              id="btn-text-submit"
            >
              {isLoading ? <><div className="spinner" /> Processing...</> : 'Process Text'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default IngestView
