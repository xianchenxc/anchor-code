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
    <div className={`flex flex-col h-full min-h-0 ${fillHeight ? '' : 'max-h-[calc(100vh-200px)]'} bg-white/90 backdrop-blur-xl rounded-lg border border-gray-200/60 shadow-md`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200/60 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 rounded-t-lg flex-shrink-0">
        <h3 className="text-sm font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          AI 助手
        </h3>
        {onClear && messages.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-white/60 transition-all font-medium"
          >
            清除对话
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center py-12">
            <div className="text-gray-400">
              <MessageCircle className="size-14 mb-4 mx-auto text-gray-300" strokeWidth={1.5} />
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
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'bg-gradient-to-br from-gray-50 to-indigo-50/30 text-gray-900 border border-gray-200/60'
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
            <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[75%] border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="font-medium">AI 正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-indigo-50/30 rounded-b-lg p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all bg-white"
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
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shrink-0"
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
