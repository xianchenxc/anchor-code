import { useState, useRef, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer.jsx'

/**
 * Chat interface component for displaying messages and handling user input
 *
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects { role: 'user'|'assistant', content: string }
 * @param {Function} props.onSendMessage - Callback when user sends a message (message: string) => void
 * @param {boolean} props.isLoading - Whether AI is generating a response
 * @param {Function} props.onClear - Optional callback to clear chat history
 * @param {string} props.placeholder - Placeholder text for input (default: "输入你的问题...")
 * @param {boolean} props.fillHeight - If true, fill parent height without max-height cap (e.g. for Interview mode)
 */
export default function ChatInterface({
  messages = [],
  onSendMessage,
  isLoading = false,
  onClear,
  placeholder = "输入你的问题...",
  fillHeight = false
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    // Allow Shift+Enter for new line, Enter alone to send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className={`flex flex-col h-full min-h-0 ${fillHeight ? '' : 'max-h-[calc(100vh-200px)]'} bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-xl flex-shrink-0">
        <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400">
          AI 助手
        </h3>
        {onClear && messages.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all font-medium"
          >
            清除对话
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center py-12">
            <div className="text-gray-400 dark:text-gray-500">
              <MessageCircle className="size-14 mb-4 mx-auto text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
              <p className="text-sm sm:text-base">开始对话吧！输入你的问题，AI 会帮助你学习。</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm sm:text-base whitespace-pre-wrap break-words m-0 leading-relaxed">
                    {message.content}
                  </p>
                ) : (
                  <div className="text-sm sm:text-base">
                    <MarkdownRenderer 
                      content={message.content} 
                      isStreaming={isLoading && index === messages.length - 1}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3 max-w-[85%] sm:max-w-[75%] border border-gray-200/80 dark:border-gray-600">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="font-medium">AI 正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            style={{
              minHeight: '44px',
              maxHeight: '120px',
            }}
            onInput={(e) => {
              // Auto-resize textarea
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-teal-600 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-sm hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            发送
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  )
}
