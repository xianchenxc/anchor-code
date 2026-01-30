import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ClipboardList, PartyPopper, PenLine, CheckCircle2 } from 'lucide-react'
import serverService from '../services/serverService.js'
import MarkdownRenderer from './MarkdownRenderer.jsx'
import { usePracticeProgress, PRACTICE_PROGRESS_STORAGE_KEY } from '../hooks/usePracticeProgress.js'

// Constants
const QUESTION_TYPES = {
  QA: 'qa',
  CODING: 'coding'
}

// Navigation buttons component
function NavigationButtons({ onPrevious, onNext, onToggleAnswer, showAnswer, canGoPrevious, canGoNext, variant = 'teal' }) {
  const buttonBaseClass = 'p-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
  const hoverClass = variant === 'purple' 
    ? 'hover:border-purple-400 hover:text-purple-600'
    : 'hover:border-teal-400 hover:text-teal-600'
  
  const toggleButtonClass = variant === 'purple'
    ? 'px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all'
    : 'px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600 transition-all'

  return (
    <div className="flex items-center gap-2">
      <button
        className={`${buttonBaseClass} ${hoverClass}`}
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label="上一题"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        className={toggleButtonClass}
        onClick={onToggleAnswer}
      >
        {showAnswer ? '隐藏答案' : '显示答案'}
      </button>
      <button
        className={`${buttonBaseClass} ${hoverClass}`}
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="下一题"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

// Answer section component
function AnswerSection({ content, title = '答案', barClass = 'bg-teal-500' }) {
  return (
    <div className="flex-shrink-0 pt-4 mt-4 border-t border-gray-200/60 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1 h-6 ${barClass} rounded-full`}></div>
        <h4 className="text-gray-900 dark:text-gray-100 text-base font-bold">{title}</h4>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200/80 dark:border-gray-600">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}

// QACard component
function QACard({ item, showAnswer, onToggleAnswer, onPrevious, onNext, canGoPrevious, canGoNext }) {
  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-shrink-0">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full">
              问答题
            </span>
            <NavigationButtons
              onPrevious={onPrevious}
              onNext={onNext}
              onToggleAnswer={onToggleAnswer}
              showAnswer={showAnswer}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
              variant="teal"
            />
          </div>
        </div>
        <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 leading-relaxed mb-4">
          {item.question}
        </div>
      </div>
      
      {showAnswer && (
        <AnswerSection content={item.content} />
      )}
    </div>
  )
}

// CodingCard component
function CodingCard({ item, showAnswer, onToggleAnswer, onPrevious, onNext, canGoPrevious, canGoNext }) {
  const [code, setCode] = useState(item.template || '')
  
  // Reset code when item changes
  useEffect(() => {
    setCode(item.template || '')
  }, [item.id])
  
  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">
            编程题
          </span>
          <NavigationButtons
            onPrevious={onPrevious}
            onNext={onNext}
            onToggleAnswer={onToggleAnswer}
            showAnswer={showAnswer}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            variant="purple"
          />
        </div>
      </div>
      <div className="flex-shrink-0 text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 leading-relaxed mb-3">
        {item.question}
      </div>
      {item.description && (
        <div className="flex-shrink-0 text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed mb-4 p-3 bg-sky-50/80 dark:bg-sky-900/30 border-l-4 border-sky-400 dark:border-sky-500 rounded-r-xl shadow-sm">
          <MarkdownRenderer 
            content={item.description} 
            components={{
              p: ({ node, ...props }) => <p className="mb-1.5" {...props} />,
            }}
          />
        </div>
      )}
      
      <div className="flex-shrink-0 flex flex-col min-h-0 mb-4">
        <label className="block font-bold mb-2 text-sm text-gray-900 dark:text-gray-100">你的代码</label>
        <textarea
          className="w-full min-h-[180px] sm:min-h-[220px] p-3 font-mono text-xs sm:text-sm leading-relaxed resize-y bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-gray-900 dark:text-gray-100"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="在这里编写你的代码..."
          spellCheck={false}
        />
      </div>
      
      {showAnswer && (
        <div className="flex-shrink-0 pt-4 border-t border-gray-200/60 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
            <h4 className="text-gray-900 dark:text-gray-100 text-base font-bold">参考答案</h4>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200/80 dark:border-gray-600 max-h-[300px] overflow-y-auto">
            <MarkdownRenderer content={item.content} />
          </div>
        </div>
      )}
    </div>
  )
}

// PracticeCard component
function PracticeCard({ item, showAnswer, onToggleAnswer, onPrevious, onNext, canGoPrevious, canGoNext }) {
  if (item.type === QUESTION_TYPES.QA) {
    return (
      <QACard
        item={item}
        showAnswer={showAnswer}
        onToggleAnswer={onToggleAnswer}
        onPrevious={onPrevious}
        onNext={onNext}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />
    )
  }
  
  if (item.type === QUESTION_TYPES.CODING) {
    return (
      <CodingCard
        item={item}
        showAnswer={showAnswer}
        onToggleAnswer={onToggleAnswer}
        onPrevious={onPrevious}
        onNext={onNext}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />
    )
  }
  
  return null
}

// Progress bar component
function ProgressBar({ current, total, className = '' }) {
  const progressPercent = useMemo(() => {
    return total > 0 ? ((current + 1) / total) * 100 : 0
  }, [current, total])

  return (
    <div
      className={`flex-shrink-0 px-4 sm:px-5 md:px-6 lg:px-8 pt-2 pb-1.5 lg:pt-1.5 lg:pb-1 group relative ${className}`.trim()}
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`第 ${current + 1} 题，共 ${total} 题`}
    >
      <div className="h-1 sm:h-1.5 bg-gray-200/80 rounded-full overflow-hidden cursor-pointer">
        <div
          className="h-full bg-teal-500 rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-800 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-20 shadow-md">
        {current + 1} / {total}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-800 rotate-45"></div>
      </div>
    </div>
  )
}

// Loading state component
function LoadingState() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        加载中...
      </div>
    </div>
  )
}

// Empty state component
function EmptyState() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center">
        <ClipboardList className="size-12 mb-3 mx-auto text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
        <p className="text-gray-400 dark:text-gray-500 text-sm sm:text-base">暂无练习题目</p>
      </div>
    </div>
  )
}

// Main PracticeMode component
function PracticeMode() {
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAnswer, setShowAnswer] = useState(false)
  const [currentIndex, setCurrentIndex] = usePracticeProgress(allItems)

  // Load questions
  useEffect(() => {
    serverService.getAllPracticeQuestions()
      .then(setAllItems)
      .catch((error) => {
        console.error('Failed to load practice questions:', error)
      })
      .finally(() => setLoading(false))
  }, [])

  const total = allItems.length
  const currentItem = useMemo(() => {
    return allItems[currentIndex] || null
  }, [allItems, currentIndex])

  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < total - 1
  const isLastQuestion = !canGoNext && total > 0

  const [showCompletion, setShowCompletion] = useState(false)
  const [showStartPage, setShowStartPage] = useState(true)

  // Whether there is saved progress and user has not completed (has advanced at least one and not at last)
  const hasProgressAndIncomplete = useMemo(() => {
    if (total === 0) return false
    try {
      const saved = localStorage.getItem(PRACTICE_PROGRESS_STORAGE_KEY)
      if (saved === null) return false
      const idx = parseInt(saved, 10)
      return !isNaN(idx) && idx > 0 && idx < total
    } catch {
      return false
    }
  }, [total])

  // Reset completion view when navigating away from last question
  useEffect(() => {
    if (!isLastQuestion) setShowCompletion(false)
  }, [isLastQuestion])

  // Navigation handlers with useCallback
  const handlePrevious = useCallback(() => {
    if (canGoPrevious) {
      setCurrentIndex(currentIndex - 1)
      setShowAnswer(false)
    }
  }, [currentIndex, canGoPrevious, setCurrentIndex])

  const handleNext = useCallback(() => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    } else if (isLastQuestion) {
      setShowCompletion(true)
    }
  }, [currentIndex, canGoNext, isLastQuestion, setCurrentIndex])

  const handleToggleAnswer = useCallback(() => {
    setShowAnswer(prev => !prev)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && canGoPrevious) {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        if (canGoNext) handleNext()
        else if (isLastQuestion) setShowCompletion(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [canGoPrevious, canGoNext, isLastQuestion, handlePrevious, handleNext])

  const handleStartPractice = useCallback(() => {
    setShowStartPage(false)
  }, [])

  const handleRestartPractice = useCallback(() => {
    setCurrentIndex(0)
    setShowCompletion(false)
    setShowStartPage(false)
  }, [setCurrentIndex])

  if (loading) {
    return <LoadingState />
  }
  
  if (total === 0) {
    return <EmptyState />
  }

  if (showStartPage) {
    const savedIndex = hasProgressAndIncomplete
      ? Math.min(parseInt(localStorage.getItem(PRACTICE_PROGRESS_STORAGE_KEY) || '0', 10), total - 1)
      : 0
    const savedProgressLabel = savedIndex + 1

    return (
      <div className="w-full h-full flex flex-col">
        <header className="flex-shrink-0 mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">练习模式</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm m-0 mt-1">问答与编程题，巩固所学</p>
        </header>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden animate-slide-up flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10 animate-fade-in">
              <div className="w-full max-w-md flex flex-col items-center text-center">
                <div className="rounded-2xl bg-teal-50 p-4 mb-5">
                  <PenLine className="size-10 sm:size-12 text-teal-600" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 m-0 mb-2">
                  本组共 {total} 题
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm m-0 mb-6 max-w-sm">
                  包含问答题与编程题，可随时显示答案，进度自动保存。
                </p>
                {hasProgressAndIncomplete ? (
                  <>
                    <div className="w-full rounded-xl border border-gray-200/80 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-700/50 px-4 py-3 mb-6 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="size-4 text-teal-500 shrink-0" strokeWidth={2.5} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">上次进度</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 m-0 mb-2">
                        做到第 {savedProgressLabel} / {total} 题
                      </p>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-[width] duration-300"
                          style={{ width: `${(savedProgressLabel / total) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        type="button"
                        onClick={handleStartPractice}
                        className="btn-primary"
                      >
                        继续练习
                      </button>
                      <button
                        type="button"
                        onClick={handleRestartPractice}
                        className="btn-secondary"
                      >
                        重新开始
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartPractice}
                    className="btn-primary"
                  >
                    开始练习
                  </button>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
                  完成后可去模拟面试检验一下
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <header className="flex-shrink-0 mb-3 sm:mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">练习模式</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm m-0 mt-1">问答与编程题，巩固所学</p>
      </header>
      <div className="flex-1 flex flex-col min-h-0">
        <ProgressBar current={currentIndex} total={total} className="mb-2" />
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden animate-slide-up flex flex-col min-h-0">
          {showCompletion ? (
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col items-center justify-center p-6 sm:p-8 animate-fade-in">
              {/* Confetti row */}
              <div className="flex justify-center gap-1 sm:gap-1.5 mb-6" aria-hidden>
                {['bg-teal-400', 'bg-amber-400', 'bg-emerald-400', 'bg-rose-400', 'bg-violet-400', 'bg-sky-400', 'bg-amber-400', 'bg-teal-400'].map((color, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${color} animate-confetti-dot`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </div>
              <PartyPopper className="size-14 sm:size-16 text-teal-500 mb-4 animate-celebrate-icon opacity-0" strokeWidth={2} aria-hidden />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 m-0 mb-2">
                祝贺完成练习！
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 text-center max-w-sm">
                本组共 {total} 题已看完，试试模拟面试检验一下 →
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/interview"
                  className="btn-primary inline-flex items-center gap-1.5"
                >
                  去模拟面试
                </Link>
                <button
                  type="button"
                  onClick={() => setShowCompletion(false)}
                  className="btn-secondary"
                >
                  返回做题
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 pt-4 px-4 pb-2 sm:pt-5 sm:px-5 sm:pb-3 md:pt-6 md:px-6 md:pb-4 lg:pt-3 lg:px-8 lg:pb-6">
              {currentItem && (
                <PracticeCard 
                  item={currentItem} 
                  showAnswer={showAnswer}
                  onToggleAnswer={handleToggleAnswer}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  canGoPrevious={canGoPrevious}
                  canGoNext={canGoNext || isLastQuestion}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PracticeMode
