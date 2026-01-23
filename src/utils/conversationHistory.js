/**
 * Conversation history management utilities
 * Provides functions to manage conversation history length and memory usage
 */

/**
 * Limit conversation history to a maximum number of messages
 * Keeps the most recent messages while preserving system messages
 * @param {Array<{role: string, content: string}>} messages - Full conversation history
 * @param {number} maxMessages - Maximum number of messages to keep (default: 10)
 * @returns {Array<{role: string, content: string}>} Limited conversation history
 */
export function limitConversationHistory(messages = [], maxMessages = 10) {
  if (messages.length <= maxMessages) {
    return messages
  }

  // Separate system messages from user/assistant messages
  const systemMessages = messages.filter(msg => msg.role === 'system')
  const conversationMessages = messages.filter(
    msg => msg.role === 'user' || msg.role === 'assistant'
  )

  // Keep the most recent conversation messages
  const recentMessages = conversationMessages.slice(-maxMessages)

  // Combine: system messages first, then recent conversation
  return [...systemMessages, ...recentMessages]
}

/**
 * Estimate the token count of a message (rough approximation)
 * Chinese characters count as 1 token, English words count as ~1 token per word
 * @param {string} text - Text content
 * @returns {number} Estimated token count
 */
export function estimateTokenCount(text) {
  if (!text) return 0
  
  // Rough estimation: Chinese characters + English words
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  
  return chineseChars + englishWords
}

/**
 * Limit conversation history by estimated token count
 * Keeps messages until the token limit is reached
 * @param {Array<{role: string, content: string}>} messages - Full conversation history
 * @param {number} maxTokens - Maximum token count (default: 2000)
 * @returns {Array<{role: string, content: string}>} Limited conversation history
 */
export function limitConversationByTokens(messages = [], maxTokens = 2000) {
  if (messages.length === 0) {
    return messages
  }

  // Always keep system messages
  const systemMessages = messages.filter(msg => msg.role === 'system')
  const conversationMessages = messages.filter(
    msg => msg.role === 'user' || msg.role === 'assistant'
  )

  // Calculate tokens from the end (most recent messages)
  let totalTokens = 0
  const keptMessages = []

  for (let i = conversationMessages.length - 1; i >= 0; i--) {
    const message = conversationMessages[i]
    const tokens = estimateTokenCount(message.content)
    
    if (totalTokens + tokens <= maxTokens) {
      keptMessages.unshift(message)
      totalTokens += tokens
    } else {
      break
    }
  }

  return [...systemMessages, ...keptMessages]
}

/**
 * Get conversation statistics
 * @param {Array<{role: string, content: string}>} messages - Conversation messages
 * @returns {Object} Statistics object
 */
export function getConversationStats(messages = []) {
  const stats = {
    totalMessages: messages.length,
    userMessages: 0,
    assistantMessages: 0,
    systemMessages: 0,
    estimatedTokens: 0
  }

  messages.forEach(msg => {
    if (msg.role === 'user') stats.userMessages++
    else if (msg.role === 'assistant') stats.assistantMessages++
    else if (msg.role === 'system') stats.systemMessages++
    
    stats.estimatedTokens += estimateTokenCount(msg.content)
  })

  return stats
}
