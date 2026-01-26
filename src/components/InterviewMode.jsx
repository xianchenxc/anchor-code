import { useState, useCallback, useRef, useEffect } from 'react'
import ModelLoader from './ModelLoader.jsx'
import ChatInterface from './ChatInterface.jsx'
import aiService from '../services/aiService.js'
import {
  buildInterviewQuestionPrompt,
  buildInterviewEvaluationPrompt
} from '../utils/promptTemplates.js'
import { formatErrorMessage } from '../utils/errorMessages.js'

/**
 * Interview mode component for mock technical interviews
 * AI acts as interviewer, asks questions, and evaluates answers
 * 
 * Interview categories: JavaScript, React, Web3
 */
const INTERVIEW_CATEGORIES = [
  { id: 'javascript', name: 'JavaScript', icon: '📜' },
  { id: 'react', name: 'React', icon: '⚛️' },
  { id: 'web3', name: 'Web3', icon: '⛓️' }
]

const DIFFICULTY_LEVELS = [
  { id: 'easy', name: '简单', description: '基础概念和语法' },
  { id: 'medium', name: '中等', description: '常见应用场景' },
  { id: 'hard', name: '困难', description: '深入原理和优化' }
]

export default function InterviewMode() {
  const [category, setCategory] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [interviewHistory, setInterviewHistory] = useState([])
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false)
  
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

  // Build prompt for asking a question
  const buildQuestionPrompt = useCallback((categoryName, difficultyLevel) => {
    return buildInterviewQuestionPrompt(categoryName, difficultyLevel)
  }, [])

  // Build prompt for evaluating an answer
  const buildEvaluationPrompt = useCallback((question, answer) => {
    return buildInterviewEvaluationPrompt(question, answer)
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
      const prompt = buildQuestionPrompt(categoryName, difficulty)
      const question = await aiService.generate(prompt, {
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
      const prompt = buildEvaluationPrompt(currentQuestionValue, userAnswer)
      const evaluation = await aiService.generate(prompt, {
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
      const nextQuestionPrompt = buildQuestionPrompt(categoryName, difficultyValue)
      const nextQuestion = await aiService.generate(nextQuestionPrompt, {
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
  }, [])

  // If no category selected, show selection screen
  if (!category) {
    return (
      <div className="w-full">
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            模拟面试
          </h2>
          <p className="text-gray-600 m-0 text-sm sm:text-base">
            AI 作为面试官，根据你选择的领域提问技术问题，并评估你的回答。
          </p>
        </div>

        <ModelLoader autoLoad onModelReady={handleModelReady}>
          <div className="space-y-6">
            {/* Category selection */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">选择面试领域</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {INTERVIEW_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className="flex flex-col items-center justify-center p-6 border-2 border-gray-200/60 rounded-xl hover:border-indigo-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 hover:shadow-md hover:scale-105 active:scale-95 transition-all text-center bg-white/90 backdrop-blur-sm"
                  >
                    <span className="text-4xl mb-2">{cat.icon}</span>
                    <span className="text-sm font-semibold text-gray-900">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty selection */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">选择难度级别</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {DIFFICULTY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setDifficulty(level.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      difficulty === level.id
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md scale-105'
                        : 'border-gray-200/60 hover:border-indigo-300 hover:bg-gray-50 hover:scale-105 active:scale-95'
                    } bg-white/90 backdrop-blur-sm`}
                  >
                    <div className="font-bold text-sm text-gray-900 mb-1">{level.name}</div>
                    <div className="text-xs text-gray-600">{level.description}</div>
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
    <div className="w-full">
      <div className="mb-6 sm:mb-8 md:mb-12">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">模拟面试</h2>
          <button
            onClick={handleReset}
            className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all font-medium"
          >
            重新选择
          </button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs sm:text-sm mb-4">
          <span className="px-4 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full font-semibold shadow-sm">
            {categoryName}
          </span>
          <span className="px-4 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full font-semibold shadow-sm">
            {difficultyName}
          </span>
          {interviewHistory.length > 0 && (
            <span className="px-4 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full font-semibold shadow-sm">
              已回答 {interviewHistory.length} 题
            </span>
          )}
        </div>
        {messages.length === 0 && (
          <button
            onClick={handleStartInterview}
            disabled={isLoading || !modelReady}
            className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
          >
            开始面试
          </button>
        )}
      </div>

      <ModelLoader autoLoad onModelReady={handleModelReady}>
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onClear={handleClear}
          placeholder={isWaitingForAnswer ? "输入你的回答..." : "等待问题..."}
        />
      </ModelLoader>
    </div>
  )
}
