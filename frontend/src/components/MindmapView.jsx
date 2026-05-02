import { useEffect } from 'react'
import './MindmapView.css'

/**
 * MindmapView — The Conditional Rendering Mode
 * Displays concept graph when mode === "mindmap" and step === "explore"
 * Renders Mermaid mindmap code as a visual graph using mermaid.js CDN
 */
function MindmapView({ mindmapData, isLoading, onGenerateMindmap, onContinueToCurriculum }) {
  useEffect(() => {
    if (mindmapData) {
      renderMermaid(mindmapData)
    }
  }, [mindmapData])

  const renderMermaid = async (code) => {
    const container = document.getElementById('mindmap-render-container')
    if (!container) return

    try {
      // Load mermaid from CDN if not already loaded
      if (!window.mermaid) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
        script.onload = () => {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
              primaryColor: '#00D1FF', // Electric Blue
              primaryTextColor: '#FFFFFF',
              primaryBorderColor: '#00D1FF',
              lineColor: '#555555',
              secondaryColor: '#FF6B6B', // Coral
              tertiaryColor: '#B197FC', // Lavender
              background: '#0F172A', // Deep Slate
              mainBkg: '#1E293B',
              nodeBkg: '#1E293B',
              nodeBorder: '#334155',
              clusterBkg: '#1E293B',
              clusterBorder: '#334155',
              titleColor: '#F8FAFC',
              edgeLabelBackground: '#1E293B',
              // Font settings
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '14px',
            },
          })
          doRender(code, container)
        }
        document.head.appendChild(script)
      } else {
        doRender(code, container)
      }
    } catch (err) {
      container.innerHTML = `<pre class="mindmap-code">${code}</pre>`
    }
  }

  const doRender = async (rawCode, container) => {
    let code = rawCode.trim()
    try {
      // Strip out ```mermaid if it still exists
      if (code.startsWith('```mermaid')) {
        code = code.substring(10).trim()
      } else if (code.startsWith('mermaid')) {
        code = code.substring(7).trim()
      }
      if (code.endsWith('```')) {
        code = code.substring(0, code.length - 3).trim()
      }

      const id = `mindmap-svg-${Date.now()}`
      const { svg } = await window.mermaid.render(id, code)
      container.innerHTML = svg
      // Style the rendered SVG
      const svgEl = container.querySelector('svg')
      if (svgEl) {
        svgEl.style.maxWidth = '100%'
        svgEl.style.height = 'auto'
      }
    } catch (err) {
      console.error('Mermaid render error:', err)
      container.innerHTML = `<div class="mindmap-fallback"><pre class="mindmap-code">${code}</pre></div>`
    }
  }

  return (
    <div className="mindmap-view">
      {!mindmapData && !isLoading && (
        <div className="mindmap-empty fade-in-up">
          <div className="mindmap-empty-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="52" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="52" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="52" cy="52" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="26" y1="26" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="38" y1="26" x2="48" y2="16" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="26" y1="38" x2="16" y2="48" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="38" y1="38" x2="48" y2="48" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <h2>Generate Concept Mindmap</h2>
          <p>Explore relationships between concepts extracted from your document</p>
          <button className="btn btn-primary btn-lg" onClick={onGenerateMindmap} id="btn-generate-mindmap">
            Generate Mindmap
          </button>
        </div>
      )}

      {isLoading && !mindmapData && (
        <div className="mindmap-loading fade-in">
          <div className="spinner spinner-lg" />
          <h3>Generating your concept map...</h3>
          <p>Gemini is analyzing relationships between concepts</p>
        </div>
      )}

      {mindmapData && (
        <div className="mindmap-content fade-in">
          <div className="mindmap-header">
            <h3>Concept Mindmap</h3>
            <span className="badge badge-success">Generated</span>
          </div>
          <div className="mindmap-canvas" id="mindmap-render-container">
            {/* Mermaid will render here */}
          </div>
          <div className="mindmap-actions">
            <button className="btn btn-primary btn-lg" onClick={onContinueToCurriculum} id="btn-continue-curriculum">
              Continue to Curriculum Building
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn btn-secondary" onClick={onGenerateMindmap} id="btn-regenerate-mindmap">
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MindmapView
