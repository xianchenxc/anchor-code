/**
 * Prompt templates for AI chat and interview modes
 * Provides reusable prompt generation functions for different scenarios
 */

/**
 * Build system message for learning/chat mode
 * @param {string|null} currentTopic - Optional current learning topic for context
 * @returns {string} System message content
 */
export function buildLearningSystemMessage(currentTopic = null) {
  let systemContent = '你是一个专业的编程知识助手，擅长用中文解释技术概念。请用清晰易懂的中文回答，可以结合代码示例。回答要准确、简洁、有针对性。'
  
  if (currentTopic) {
    systemContent += `\n\n当前学习内容：${currentTopic}`
  }
  
  return systemContent
}

/**
 * Build chat messages for learning mode with conversation history
 * @param {string} userQuestion - Current user question
 * @param {Array<{role: string, content: string}>} conversationHistory - Previous conversation messages
 * @param {string|null} currentTopic - Optional current learning topic
 * @param {number} maxHistoryLength - Maximum number of history messages to include (default: 6)
 * @returns {Array<{role: string, content: string}>} Formatted chat messages
 */
export function buildLearningChatMessages(
  userQuestion,
  conversationHistory = [],
  currentTopic = null,
  maxHistoryLength = 6
) {
  const messages = []

  // Add system message with context
  const systemContent = buildLearningSystemMessage(currentTopic)
  messages.push({ role: 'system', content: systemContent })

  // Add conversation history (limited to keep context manageable)
  const recentHistory = conversationHistory.slice(-maxHistoryLength)
  recentHistory.forEach((msg) => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content })
    }
  })

  // Add current user question
  messages.push({ role: 'user', content: userQuestion })

  return messages
}

/**
 * Build prompt for interview question generation
 * @param {string} categoryName - Interview category (e.g., "JavaScript", "React", "Web3")
 * @param {string} difficultyLevel - Difficulty level ("easy", "medium", "hard")
 * @returns {string} Prompt for generating interview question
 */
export function buildInterviewQuestionPrompt(categoryName, difficultyLevel) {
  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  
  return `你是一个技术面试官，擅长 ${categoryName} 领域的面试。
请用中文提问一个技术问题，难度为${difficultyMap[difficultyLevel] || '中等'}。
问题应该：
1. 针对 ${categoryName} 领域的核心知识点
2. 难度适中，适合考察候选人的理解程度
3. 问题表述清晰，有明确的考察点
4. 可以涉及概念、原理、应用场景或最佳实践

请直接输出问题，不要包含其他说明文字。`
}

/**
 * Build prompt for evaluating interview answers
 * @param {string} question - The interview question
 * @param {string} answer - The candidate's answer
 * @returns {string} Prompt for evaluating the answer
 */
export function buildInterviewEvaluationPrompt(question, answer) {
  return `你是一个技术面试评估专家。
请评估以下回答的质量，给出1-10分和具体的中文反馈。

问题：${question}
回答：${answer}

评估标准：
1. 准确性：回答是否正确，是否有错误
2. 完整性：是否全面回答了问题，是否遗漏关键点
3. 表达清晰度：逻辑是否清晰，表达是否流畅
4. 技术深度：是否展现了深入的理解，是否有独到见解

请按照以下格式输出：
【评分】X/10
【优点】
- ...
【不足】
- ...
【建议】
- ...

请用中文回答，评价要客观、专业、有建设性。`
}

/**
 * Build chat messages for interview mode
 * @param {string} categoryName - Interview category
 * @param {string} difficultyLevel - Difficulty level
 * @param {string} question - Current interview question
 * @param {string} answer - User's answer (optional, for evaluation)
 * @param {Array<{role: string, content: string}>} conversationHistory - Previous conversation messages
 * @param {number} maxHistoryLength - Maximum number of history messages to include (default: 4)
 * @returns {Array<{role: string, content: string}>} Formatted chat messages
 */
export function buildInterviewChatMessages(
  categoryName,
  difficultyLevel,
  question,
  answer = null,
  conversationHistory = [],
  maxHistoryLength = 4
) {
  const messages = []

  // Add system message
  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  const systemContent = `你是一个技术面试官，擅长 ${categoryName} 领域的面试。当前面试难度为${difficultyMap[difficultyLevel] || '中等'}。`
  messages.push({ role: 'system', content: systemContent })

  // Add limited conversation history
  const recentHistory = conversationHistory.slice(-maxHistoryLength)
  recentHistory.forEach((msg) => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content })
    }
  })

  // Add current question and answer if provided
  if (question) {
    messages.push({ role: 'assistant', content: `问题：${question}` })
  }
  if (answer) {
    messages.push({ role: 'user', content: answer })
  }

  return messages
}
