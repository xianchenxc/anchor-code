import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import serverService from '../services/serverService.js'
import MarkdownRenderer from './MarkdownRenderer.jsx'
import { usePracticeProgress } from '../hooks/usePracticeProgress.js'

// Constants
const QUESTION_TYPES = {
  QA: 'qa',
  CODING: 'coding'
}

// Navigation buttons component
function NavigationButtons({ onPrevious, onNext, onToggleAnswer, showAnswer, canGoPrevious, canGoNext, variant = 'indigo' }) {
  const buttonBaseClass = 'p-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
  const hoverClass = variant === 'purple' 
    ? 'hover:border-purple-400 hover:text-purple-600'
    : 'hover:border-indigo-400 hover:text-indigo-600'
  
  const toggleButtonClass = variant === 'purple'
    ? 'px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-400 hover:text-purple-600 transition-all'
    : 'px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-400 hover:text-indigo-600 transition-all'

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
function AnswerSection({ content, title = '答案', gradientClass = 'from-indigo-600 to-indigo-600' }) {
  return (
    <div className="flex-shrink-0 pt-4 mt-4 border-t border-gray-200/60 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1 h-6 bg-gradient-to-b ${gradientClass} rounded-full`}></div>
        <h4 className="text-gray-900 text-base font-bold">{title}</h4>
      </div>
      <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-4 border border-gray-200/60 shadow-sm">
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
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-bold rounded-full shadow-sm">
              问答题
            </span>
            <NavigationButtons
              onPrevious={onPrevious}
              onNext={onNext}
              onToggleAnswer={onToggleAnswer}
              showAnswer={showAnswer}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
              variant="indigo"
            />
          </div>
        </div>
        <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-relaxed mb-4">
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
          <span className="inline-block px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-bold rounded-full shadow-sm">
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
      <div className="flex-shrink-0 text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-relaxed mb-3">
        {item.question}
      </div>
      {item.description && (
        <div className="flex-shrink-0 text-gray-600 text-xs sm:text-sm leading-relaxed mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50/50 border-l-4 border-blue-500 rounded-r-xl shadow-sm">
          <MarkdownRenderer 
            content={item.description} 
            components={{
              p: ({ node, ...props }) => <p className="mb-1.5" {...props} />,
            }}
          />
        </div>
      )}
      
      <div className="flex-shrink-0 flex flex-col min-h-0 mb-4">
        <label className="block font-bold mb-2 text-sm text-gray-900">你的代码</label>
        <textarea
          className="w-full min-h-[180px] sm:min-h-[220px] p-3 font-mono text-xs sm:text-sm leading-relaxed resize-y bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="在这里编写你的代码..."
          spellCheck={false}
        />
      </div>
      
      {showAnswer && (
        <div className="flex-shrink-0 pt-4 border-t border-gray-200/60 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
            <h4 className="text-gray-900 text-base font-bold">参考答案</h4>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-xl p-4 border border-gray-200/60 shadow-sm max-h-[300px] overflow-y-auto">
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
function ProgressBar({ current, total }) {
  const progressPercent = useMemo(() => {
    return total > 0 ? ((current + 1) / total) * 100 : 0
  }, [current, total])

  return (
    <div
      className="flex-shrink-0 px-4 sm:px-5 md:px-6 lg:px-8 pt-2 pb-1.5 lg:pt-1.5 lg:pb-1 group relative"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`第 ${current + 1} 题，共 ${total} 题`}
    >
      <div className="h-1 sm:h-1.5 bg-gray-200/80 rounded-full overflow-hidden cursor-pointer">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900/95 backdrop-blur-sm text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-20 shadow-lg">
        {current + 1} / {total}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900/95 rotate-45"></div>
      </div>
    </div>
  )
}

// Loading state component
function LoadingState() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
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
        <div className="text-6xl mb-4 opacity-20">📝</div>
        <p className="text-gray-400 text-sm sm:text-base">暂无练习题目</p>
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
    }
  }, [currentIndex, canGoNext, setCurrentIndex])

  const handleToggleAnswer = useCallback(() => {
    setShowAnswer(prev => !prev)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && canGoPrevious) {
        handlePrevious()
      } else if (e.key === 'ArrowRight' && canGoNext) {
        handleNext()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [canGoPrevious, canGoNext, handlePrevious, handleNext])

  if (loading) {
    return <LoadingState />
  }
  
  if (total === 0) {
    return <EmptyState />
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 bg-white/90 backdrop-blur-xl rounded-lg shadow-md border border-gray-200/60 overflow-hidden animate-slide-up flex flex-col min-h-0">
          <ProgressBar current={currentIndex} total={total} />
          <div className="flex-1 overflow-y-auto min-h-0 pt-4 px-4 pb-2 sm:pt-5 sm:px-5 sm:pb-3 md:pt-6 md:px-6 md:pb-4 lg:pt-3 lg:px-8 lg:pb-6">
            {currentItem && (
              <PracticeCard 
                item={currentItem} 
                showAnswer={showAnswer}
                onToggleAnswer={handleToggleAnswer}
                onPrevious={handlePrevious}
                onNext={handleNext}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PracticeMode
