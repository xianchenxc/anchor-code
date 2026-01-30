import { useState, useCallback } from 'react'
import ModelLoader from './ModelLoader.jsx'
import ChatInterface from './ChatInterface.jsx'
import serverService from '../services/serverService.js'
import { limitConversationHistory } from '../utils/conversationHistory.js'
import { formatErrorMessage } from '../utils/errorMessages.js'

/**
 * Chat mode component for learning through conversation
 * Allows users to ask questions about programming concepts
 * 
 * @param {Object} props
 * @param {string} props.currentTopic - Optional current learning topic for context
 */
export default function ChatMode({ currentTopic = null }) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [modelReady, setModelReady] = useState(false)

  // Build chat messages with context (async from serverService)
  const buildChatMessages = useCallback(async (userQuestion, conversationHistory = []) => {
    return serverService.buildLearningChatMessages(userQuestion, conversationHistory, currentTopic, 6)
  }, [currentTopic])

  // Handle sending a message
  const handleSendMessage = useCallback(async (userMessage) => {
    if (!modelReady || isLoading) {
      return
    }

    setIsLoading(true)

    // Use functional update to get latest messages and add user message
    let conversationHistory = []
    setMessages((prevMessages) => {
      const userMsg = { role: 'user', content: userMessage }
      const updatedMessages = [...prevMessages, userMsg]
      const limitedMessages = limitConversationHistory(updatedMessages, 10)
      conversationHistory = limitedMessages.slice(0, -1) // Exclude the user message we just added
      
      // Add placeholder assistant message for streaming
      const assistantMsg = { role: 'assistant', content: '' }
      return [...limitedMessages, assistantMsg]
    })

    try {
      // Build chat messages with conversation context
      const chatMessages = await buildChatMessages(userMessage, conversationHistory)
      
      // Generate response with streaming support
      const response = await serverService.generate(chatMessages, {
        maxLength: 512,
        temperature: 0.7,
        topK: 50,
        topP: 0.9,
        // Enable streaming for real-time updates
        onChunk: (chunk, fullText) => {
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages]
            const lastIndex = newMessages.length - 1
            if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
              newMessages[lastIndex] = { 
                role: 'assistant', 
                content: fullText.trim() 
              }
            }
            return newMessages
          })
        }
      })

      // Final update with complete response and limit history
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages]
        const lastIndex = newMessages.length - 1
        if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
          newMessages[lastIndex] = { 
            role: 'assistant', 
            content: response.trim() 
          }
        }
        return limitConversationHistory(newMessages, 10)
      })
    } catch (error) {
      console.error('Error generating response:', error)
      const errorMsg = {
        role: 'assistant',
        content: formatErrorMessage(error, '生成回答')
      }
      setMessages((prevMessages) => {
        // Remove placeholder and add error message
        const newMessages = prevMessages.slice(0, -1)
        return limitConversationHistory([...newMessages, errorMsg], 10)
      })
    } finally {
      setIsLoading(false)
    }
  }, [modelReady, isLoading, buildChatMessages])

  // Handle clearing chat
  const handleClear = useCallback(() => {
    setMessages([])
  }, [])

  // Handle model ready
  const handleModelReady = useCallback(() => {
    setModelReady(true)
  }, [])

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8 md:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-teal-600 dark:text-teal-400 mb-3">
          聊天式学习
        </h2>
        <p className="text-gray-600 dark:text-gray-400 m-0 text-sm sm:text-base">
          与 AI 助手对话，深入学习前端开发知识。可以提问任何前端技术问题，AI 会基于项目中的前端开发知识库（JavaScript、React、Web3）为你提供专业解答。
        </p>
        {currentTopic && (
          <div className="mt-4 px-4 py-2.5 bg-teal-50 dark:bg-teal-900/30 border border-teal-200/80 dark:border-teal-700 rounded-xl text-sm text-teal-800 dark:text-teal-200">
            <strong>当前主题：</strong>{currentTopic}
          </div>
        )}
      </div>

      <ModelLoader autoLoad onModelReady={handleModelReady}>
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onClear={handleClear}
          placeholder="输入你的前端开发问题，例如：什么是闭包？如何理解 React Hooks？Web3 钱包如何连接？"
        />
      </ModelLoader>
    </div>
  )
}
