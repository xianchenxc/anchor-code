/**
 * Prompt templates for AI chat and interview modes
 * Provides reusable prompt generation functions for different scenarios
 */

import {
  getAllFrontendContent,
  getRelevantContent,
  formatContentForPrompt,
  getCategoryContentForPrompt,
  getCategoryInterviewQuestions,
  formatInterviewQuestionsForPrompt
} from './contentExtractor.js'

/**
 * Build system message for learning/chat mode
 * @param {string|null} currentTopic - Optional current learning topic for context
 * @param {string|null} userQuestion - Optional user question for extracting relevant content
 * @returns {string} System message content
 */
export function buildLearningSystemMessage(currentTopic = null, userQuestion = null) {
  let systemContent = `你是一个专业的前端开发技术专家，擅长用中文解释前端开发相关的技术概念。
你的专长领域包括：
- JavaScript（ES6+、异步编程、闭包、原型链等）
- React（Hooks、组件设计、性能优化、虚拟DOM等）
- Web3（区块链基础、智能合约、DEX、钱包连接等）
- 前端工程化、性能优化、最佳实践

请用清晰易懂的中文回答，可以结合代码示例。回答要准确、简洁、有针对性，重点突出前端开发岗位的实际应用场景。`
  
  if (currentTopic) {
    systemContent += `\n\n当前学习主题：${currentTopic}`
  }

  // Add relevant content from knowledge base
  let knowledgeBase = ''
  if (userQuestion) {
    // Extract relevant content based on user question
    const relevantItems = getRelevantContent(userQuestion, null, 8)
    if (relevantItems.length > 0) {
      knowledgeBase = formatContentForPrompt(relevantItems, 2000)
    }
  } else {
    // Use comprehensive frontend content as general knowledge base
    knowledgeBase = getAllFrontendContent()
  }

  if (knowledgeBase) {
    systemContent += `\n\n以下是项目中的前端开发知识库内容，请基于这些内容回答问题，确保答案的准确性和专业性：\n\n${knowledgeBase}`
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

  // Add system message with context, including user question for relevant content extraction
  const systemContent = buildLearningSystemMessage(currentTopic, userQuestion)
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
 * @param {string} categoryId - Category ID (e.g., "javascript", "react", "web3")
 * @param {string} difficultyLevel - Difficulty level ("easy", "medium", "hard")
 * @returns {string} Prompt for generating interview question
 */
export function buildInterviewQuestionPrompt(categoryName, categoryId, difficultyLevel) {
  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }

  // Get category-specific content and interview questions
  const categoryContent = getCategoryContentForPrompt(categoryId)
  const interviewQuestions = getCategoryInterviewQuestions(categoryId)
  const questionsContext = formatInterviewQuestionsForPrompt(interviewQuestions, 10)

  let prompt = `你是一个专业的前端开发技术面试官，专门负责 ${categoryName} 领域的面试。
当前面试难度为：${difficultyMap[difficultyLevel] || '中等'}。

请用中文提问一个技术问题，要求：
1. 针对 ${categoryName} 领域的核心知识点和实际应用场景
2. 难度符合${difficultyMap[difficultyLevel] || '中等'}级别，适合考察前端开发岗位候选人的理解程度
3. 问题表述清晰，有明确的考察点
4. 可以涉及概念、原理、应用场景、最佳实践或代码实现
5. 问题应该贴近真实的前端开发工作场景`

  if (categoryContent) {
    prompt += `\n\n以下是 ${categoryName} 领域的知识点，可以作为问题设计的参考：\n\n${categoryContent}`
  }

  if (questionsContext) {
    prompt += `\n\n${questionsContext}`
  }

  prompt += `\n\n请直接输出问题，不要包含其他说明文字。`

  return prompt
}

/**
 * Build prompt for evaluating interview answers
 * @param {string} question - The interview question
 * @param {string} answer - The candidate's answer
 * @param {string} categoryId - Category ID for getting relevant knowledge base
 * @returns {string} Prompt for evaluating the answer
 */
export function buildInterviewEvaluationPrompt(question, answer, categoryId = null) {
  // Get relevant content for evaluation reference
  let knowledgeBase = ''
  if (categoryId) {
    const categoryContent = getCategoryContentForPrompt(categoryId)
    if (categoryContent) {
      knowledgeBase = `\n\n以下是相关的知识点和标准答案，可以作为评估参考：\n\n${categoryContent}`
    }
  } else {
    // Try to extract relevant content from question
    const relevantItems = getRelevantContent(question, null, 5)
    if (relevantItems.length > 0) {
      knowledgeBase = `\n\n以下是相关的知识点，可以作为评估参考：\n\n${formatContentForPrompt(relevantItems, 1500)}`
    }
  }

  return `你是一个专业的前端开发技术面试评估专家，具有丰富的前端开发经验和面试评估经验。
请评估以下回答的质量，给出1-10分和具体的中文反馈。

问题：${question}
回答：${answer}${knowledgeBase}

评估标准（针对前端开发岗位）：
1. **准确性**：回答是否正确，是否有技术错误，是否符合前端开发最佳实践
2. **完整性**：是否全面回答了问题，是否遗漏关键知识点或应用场景
3. **表达清晰度**：逻辑是否清晰，表达是否流畅，能否清晰地解释技术概念
4. **技术深度**：是否展现了深入的理解，是否提到了原理、实现细节或优化方案
5. **实用性**：是否结合了实际的前端开发场景，是否提到了实际应用和最佳实践

请按照以下格式输出：
【评分】X/10
【优点】
- ...
【不足】
- ...
【建议】
- ...
【补充知识点】
- （可选，如果回答中遗漏了重要知识点，可以补充说明）

请用中文回答，评价要客观、专业、有建设性，重点评估是否符合前端开发岗位的要求。`
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
