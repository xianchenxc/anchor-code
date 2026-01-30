import { useState, useCallback, useRef, useEffect } from 'react'
import { FileCode, Atom, Link2 } from 'lucide-react'
import ModelLoader from './ModelLoader.jsx'
import ChatInterface from './ChatInterface.jsx'
import MarkdownRenderer from './MarkdownRenderer.jsx'
import serverService from '../services/serverService.js'
import { formatErrorMessage } from '../utils/errorMessages.js'

/**
 * Interview mode component for mock technical interviews
 * AI acts as interviewer, asks questions, and evaluates answers
 * 
 * Interview categories: JavaScript, React, Web3
 */
const INTERVIEW_CATEGORIES = [
  { id: 'javascript', name: 'JavaScript', Icon: FileCode },
  { id: 'react', name: 'React', Icon: Atom },
  { id: 'web3', name: 'Web3', Icon: Link2 }
]

const DIFFICULTY_LEVELS = [
  { id: 'easy', name: '简单', description: '基础概念和语法' },
  { id: 'medium', name: '中等', description: '常见应用场景' },
  { id: 'hard', name: '困难', description: '深入原理和优化' }
]

function InterviewSummary({ interviewHistory, categoryName, difficultyName, onRestart, onReset }) {
  const count = interviewHistory.length
  return (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200/80 bg-gray-50 rounded-t-xl">
        <p className="text-gray-700 text-sm m-0 mb-3">
          本次共答 {count} 题，可回顾下方题目与评价。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98] transition-all"
          >
            再面一次
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200/80 text-gray-700 hover:bg-gray-50 transition-all"
          >
            重新选择
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
        {interviewHistory.map((record, index) => (
          <div
            key={record.timestamp || index}
            className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/80 space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-teal-600">第 {index + 1} 题</span>
              <span className="text-xs text-gray-500">{categoryName} · {difficultyName}</span>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1">题目</h4>
              <p className="text-sm text-gray-900 whitespace-pre-wrap m-0">{record.question}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1">你的回答</h4>
              <p className="text-sm text-gray-800 whitespace-pre-wrap m-0">{record.answer}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1">评价</h4>
              <div className="text-sm text-gray-700">
                <MarkdownRenderer content={record.evaluation} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InterviewMode() {
  const [category, setCategory] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [interviewHistory, setInterviewHistory] = useState([])
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  
  // Use refs to store current values to avoid dependency issues
  const currentQuestionRef = useRef(null)
  const categoryRef = useRef(null)
  const difficultyRef = useRef(null)
  
  // Keep refs in sync with state
  useEffect(() => {
    currentQuestionRef.current = currentQuestion
  }, [currentQuestion])
  
  useEffect(() => {
    categoryRef.current = category
  }, [category])
  
  useEffect(() => {
    difficultyRef.current = difficulty
  }, [difficulty])

  // Build prompt for asking a question (async from serverService)
  const buildQuestionPrompt = useCallback(async (categoryName, categoryId, difficultyLevel) => {
    return serverService.buildInterviewQuestionPrompt(categoryName, categoryId, difficultyLevel)
  }, [])

  // Build prompt for evaluating an answer (async from serverService)
  const buildEvaluationPrompt = useCallback(async (question, answer, categoryId) => {
    return serverService.buildInterviewEvaluationPrompt(question, answer, categoryId)
  }, [])

  // Start a new interview
  const handleStartInterview = useCallback(async () => {
    if (!category || !modelReady || isLoading) {
      return
    }

    const categoryName = INTERVIEW_CATEGORIES.find(c => c.id === category)?.name || category
    setIsLoading(true)
    setMessages([])
    setCurrentQuestion(null)
    setIsWaitingForAnswer(false)
    setInterviewHistory([])

    try {
      const prompt = await buildQuestionPrompt(categoryName, category, difficulty)
      const question = await serverService.generate(prompt, {
        maxLength: 256,
        temperature: 0.8,
        topK: 50,
        topP: 0.9
      })

      const questionText = question.trim()
      setCurrentQuestion(questionText)
      setIsWaitingForAnswer(true)

      const welcomeMsg = {
        role: 'assistant',
        content: `欢迎参加 ${categoryName} 技术面试！\n\n**问题：**\n${questionText}\n\n请仔细思考后回答这个问题。`
      }
      setMessages([welcomeMsg])
    } catch (error) {
      console.error('Error generating question:', error)
      const errorMsg = {
        role: 'assistant',
        content: formatErrorMessage(error, '生成问题')
      }
      setMessages([errorMsg])
    } finally {
      setIsLoading(false)
    }
  }, [category, difficulty, modelReady, isLoading, buildQuestionPrompt])

  // Handle sending an answer
  const handleSendMessage = useCallback(async (userAnswer) => {
    if (!isWaitingForAnswer || isLoading) {
      return
    }

    const currentQuestionValue = currentQuestionRef.current
    const categoryValue = categoryRef.current
    const difficultyValue = difficultyRef.current

    if (!currentQuestionValue) {
      return
    }

    setIsLoading(true)
    setIsWaitingForAnswer(false)

    // Add user answer to chat using functional update
    setMessages((prevMessages) => {
      const userMsg = { role: 'user', content: userAnswer }
      return [...prevMessages, userMsg]
    })

    try {
      // Evaluate the answer
      const prompt = await buildEvaluationPrompt(currentQuestionValue, userAnswer, categoryValue)
      const evaluation = await serverService.generate(prompt, {
        maxLength: 512,
        temperature: 0.7,
        topK: 50,
        topP: 0.9
      })

      const evaluationText = evaluation.trim()
      
      // Add evaluation message
      setMessages((prevMessages) => {
        const assistantMsg = { role: 'assistant', content: evaluationText }
        return [...prevMessages, assistantMsg]
      })

      // Save to interview history using functional update
      setInterviewHistory((prevHistory) => {
        const interviewRecord = {
          question: currentQuestionValue,
          answer: userAnswer,
          evaluation: evaluationText,
          category: categoryValue,
          difficulty: difficultyValue,
          timestamp: new Date().toISOString()
        }
        return [...prevHistory, interviewRecord]
      })

      // Ask next question
      const categoryName = INTERVIEW_CATEGORIES.find(c => c.id === categoryValue)?.name || categoryValue
      const nextQuestionPrompt = await buildQuestionPrompt(categoryName, categoryValue, difficultyValue)
      const nextQuestion = await serverService.generate(nextQuestionPrompt, {
        maxLength: 256,
        temperature: 0.8,
        topK: 50,
        topP: 0.9
      })

      const nextQuestionText = nextQuestion.trim()
      setCurrentQuestion(nextQuestionText)
      setIsWaitingForAnswer(true)

      // Add next question message
      setMessages((prevMessages) => {
        const nextQuestionMsg = {
          role: 'assistant',
          content: `**下一个问题：**\n${nextQuestionText}\n\n请回答这个问题。`
        }
        return [...prevMessages, nextQuestionMsg]
      })
    } catch (error) {
      console.error('Error in interview flow:', error)
      const errorMsg = {
        role: 'assistant',
        content: formatErrorMessage(error, '处理回答')
      }
      setMessages((prevMessages) => {
        return [...prevMessages, errorMsg]
      })
      // Reset waiting state on error so user can try again
      setIsWaitingForAnswer(true)
    } finally {
      setIsLoading(false)
    }
  }, [isWaitingForAnswer, isLoading, buildEvaluationPrompt, buildQuestionPrompt])

  // Handle clearing interview
  const handleClear = useCallback(() => {
    setMessages([])
    setCurrentQuestion(null)
    setIsWaitingForAnswer(false)
    setInterviewHistory([])
  }, [])

  // Handle model ready
  const handleModelReady = useCallback(() => {
    setModelReady(true)
  }, [])

  // Reset to category selection
  const handleReset = useCallback(() => {
    setCategory(null)
    setMessages([])
    setCurrentQuestion(null)
    setIsWaitingForAnswer(false)
    setInterviewHistory([])
    setShowSummary(false)
  }, [])

  // End interview and show summary
  const handleEndInterview = useCallback(() => {
    setShowSummary(true)
  }, [])

  // Restart same category/difficulty (from summary view)
  const handleRestart = useCallback(() => {
    setShowSummary(false)
    setMessages([])
    setCurrentQuestion(null)
    setIsWaitingForAnswer(false)
    setInterviewHistory([])
    handleStartInterview()
  }, [handleStartInterview])

  // If no category selected, show selection screen
  if (!category) {
    return (
      <div className="w-full h-full flex flex-col">
        <header className="flex-shrink-0 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">模拟面试</h2>
          <p className="text-gray-600 dark:text-gray-400 m-0 mt-1 text-xs sm:text-sm">
            AI 作为前端开发技术面试官，根据你选择的领域提问技术问题，并基于项目知识库评估你的回答。
          </p>
        </header>

        <ModelLoader autoLoad onModelReady={handleModelReady}>
          <div className="space-y-5">
            {/* Category selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">选择面试领域</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {INTERVIEW_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className="flex flex-col items-center justify-center p-4 sm:p-5 border border-gray-200/80 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm active:scale-[0.98] transition-all text-center bg-white dark:bg-gray-800"
                  >
                    <cat.Icon className="size-8 sm:size-9 mb-2 text-teal-600 dark:text-teal-400" strokeWidth={2} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">选择难度级别</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DIFFICULTY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setDifficulty(level.id)}
                    className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-all bg-white dark:bg-gray-800 ${
                      difficulty === level.id
                        ? 'border-teal-400 dark:border-teal-500 bg-gray-100 dark:bg-gray-700/50 shadow-sm'
                        : 'border-gray-200/80 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:scale-[0.98]'
                    }`}
                  >
                    <div className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-0.5">{level.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{level.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ModelLoader>
      </div>
    )
  }

  // Interview in progress
  const categoryName = INTERVIEW_CATEGORIES.find(c => c.id === category)?.name || category
  const difficultyName = DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.name || difficulty

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Compact header: description, tags, buttons */}
      <div className="flex-shrink-0 mb-4">
        <p className="text-gray-600 m-0 text-xs sm:text-sm mb-3">
          AI 作为前端开发技术面试官，根据你选择的领域提问技术问题，并基于项目知识库评估你的回答。
        </p>
        {messages.length === 0 && !showSummary && (
          <p className="text-xs text-gray-500 mb-2">
            约 5～10 题，可随时点击「结束面试」查看总结。
          </p>
        )}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">
              {categoryName}
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
              {difficultyName}
            </span>
            {interviewHistory.length > 0 && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                已答 {interviewHistory.length} 题
              </span>
            )}
          </div>
          {/* Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleReset}
              className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all font-medium"
            >
              重新选择
            </button>
            {!showSummary && (
              <button
                type="button"
                onClick={handleEndInterview}
                className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all font-medium"
              >
                结束面试
              </button>
            )}
            {messages.length === 0 && !showSummary && (
              <button
                onClick={handleStartInterview}
                disabled={isLoading || !modelReady}
                className="bg-teal-600 text-white px-4 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                开始面试
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary view or chat area */}
      {showSummary ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <InterviewSummary
            interviewHistory={interviewHistory}
            categoryName={categoryName}
            difficultyName={difficultyName}
            onRestart={handleRestart}
            onReset={handleReset}
          />
        </div>
      ) : (
        <ModelLoader autoLoad onModelReady={handleModelReady}>
          <div className="flex-1 min-h-0 flex flex-col">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onClear={handleClear}
              placeholder={isWaitingForAnswer ? "输入你的回答..." : "等待问题..."}
              fillHeight
            />
          </div>
        </ModelLoader>
      )}
    </div>
  )
}
