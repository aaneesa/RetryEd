import { useState, useEffect, useRef } from 'react'
import './TypewriterFlow.css'

/**
 * TypewriterFlow — The Zen State Machine
 * One prompt at a time, centered on screen.
 * Previous questions become breadcrumb trail.
 */

const COMMON_QUESTIONS = [
  {
    id: 'audience',
    label: 'Target Audience',
    prompt: 'Who is this content designed for?',
    placeholder: 'e.g., Undergraduate CS students, High school biology...',
  },
  {
    id: 'goal',
    label: 'Learning Goal',
    prompt: 'What should learners achieve by the end?',
    placeholder: 'e.g., Understand sorting algorithms, Master cell biology...',
  },
  {
    id: 'difficulty',
    label: 'Difficulty Level',
    prompt: 'What difficulty level should we target?',
    placeholder: 'e.g., Beginner, Intermediate, Advanced...',
  },
]

const MINDMAP_QUESTIONS = [
  ...COMMON_QUESTIONS,
  {
    id: 'focus_area',
    label: 'Focus Area',
    prompt: 'Any specific area to emphasize in the mindmap?',
    placeholder: 'e.g., Practical applications, Theoretical foundations...',
  },
]

const CURRICULUM_QUESTIONS = [
  ...COMMON_QUESTIONS,
  {
    id: 'lesson_count',
    label: 'Lesson Count',
    prompt: 'How many lessons should the curriculum contain?',
    placeholder: 'e.g., 5-10 lessons, Auto (let the system decide)...',
  },
]

function TypewriterFlow({ mode, onComplete }) {
  const questions = mode === 'mindmap' ? MINDMAP_QUESTIONS : CURRICULUM_QUESTIONS
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [currentInput, setCurrentInput] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const inputRef = useRef(null)

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const progress = ((currentIndex) / questions.length) * 100

  useEffect(() => {
    // Focus input when question changes
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [currentIndex])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!currentInput.trim()) return

    const newAnswer = {
      id: currentQuestion.id,
      label: currentQuestion.label,
      prompt: currentQuestion.prompt,
      answer: currentInput.trim(),
    }

    const updatedAnswers = [...answers, newAnswer]
    setAnswers(updatedAnswers)
    setCurrentInput('')
    setIsAnimating(true)

    setTimeout(() => {
      setIsAnimating(false)
      if (isLast) {
        onComplete(updatedAnswers)
      } else {
        setCurrentIndex(prev => prev + 1)
      }
    }, 400)
  }

  const handleSkip = () => {
    const newAnswer = {
      id: currentQuestion.id,
      label: currentQuestion.label,
      prompt: currentQuestion.prompt,
      answer: 'Auto',
    }
    const updatedAnswers = [...answers, newAnswer]
    setAnswers(updatedAnswers)
    setIsAnimating(true)

    setTimeout(() => {
      setIsAnimating(false)
      if (isLast) {
        onComplete(updatedAnswers)
      } else {
        setCurrentIndex(prev => prev + 1)
      }
    }, 400)
  }

  return (
    <div className="typewriter-flow">
      {/* Progress Bar */}
      <div className="typewriter-progress">
        <div className="typewriter-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Breadcrumb Trail */}
      {answers.length > 0 && (
        <div className="typewriter-breadcrumbs fade-in">
          {answers.map((a, i) => (
            <div className="typewriter-breadcrumb" key={a.id}>
              <span className="breadcrumb-label">{a.label}</span>
              <span className="breadcrumb-answer">{a.answer}</span>
            </div>
          ))}
        </div>
      )}

      {/* Current Question */}
      <div className={`typewriter-question-wrapper ${isAnimating ? 'exiting' : 'entering'}`}>
        <div className="typewriter-question-counter">
          {currentIndex + 1} / {questions.length}
        </div>

        <h2 className="typewriter-prompt">
          {currentQuestion.prompt}
          <span className="typewriter-cursor">|</span>
        </h2>

        <form onSubmit={handleSubmit} className="typewriter-input-wrapper">
          <input
            ref={inputRef}
            className="typewriter-input"
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            placeholder={currentQuestion.placeholder}
            autoComplete="off"
            id={`input-${currentQuestion.id}`}
          />
          <div className="typewriter-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleSkip}
              id="btn-skip"
            >
              Skip
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!currentInput.trim()}
              id="btn-submit-answer"
            >
              {isLast ? 'Complete' : 'Next'}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Pedagogical Pulse */}
      <div className="typewriter-pulse-container">
        <div className={`pedagogical-pulse ${currentInput.length > 0 ? 'active' : ''}`} />
      </div>
    </div>
  )
}

export default TypewriterFlow
