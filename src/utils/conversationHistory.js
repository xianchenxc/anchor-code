/**
 * Conversation history management utilities
 */

/**
 * Limit conversation history to a maximum number of messages.
 * Keeps the most recent messages while preserving system messages.
 * @param {Array<{role: string, content: string}>} messages - Full conversation history
 * @param {number} maxMessages - Maximum number of messages to keep (default: 10)
 * @returns {Array<{role: string, content: string}>} Limited conversation history
 */
export function limitConversationHistory(messages = [], maxMessages = 10) {
  if (messages.length <= maxMessages) {
    return messages
  }

  const systemMessages = messages.filter(msg => msg.role === 'system')
  const conversationMessages = messages.filter(
    msg => msg.role === 'user' || msg.role === 'assistant'
  )
  const recentMessages = conversationMessages.slice(-maxMessages)

  return [...systemMessages, ...recentMessages]
}
