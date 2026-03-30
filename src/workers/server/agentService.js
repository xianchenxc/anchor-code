/**
 * Agent layer inside Worker: system prompts, prompt templates, knowledge-base orchestration.
 * Uses contentExtractor (same process); inference is done via model in serverWorker.
 */

import {
  getRelevantContent,
  formatContentForPrompt,
  getCategoryContentForPrompt
} from './contentExtractor.js'

/**
 * Build prompt for interview question generation
 */
export function buildInterviewQuestionPrompt(categoryName, categoryId, difficultyLevel) {
  const difficultyMap = { easy: '简单', medium: '中等', hard: '困难' }
  let prompt = `你是一个专业的前端开发技术面试官，专门负责 ${categoryName} 领域的面试。
当前面试难度为：${difficultyMap[difficultyLevel] || '中等'}。

请用中文提问一个技术问题，要求：
1. 只根据 ${categoryName} 这个领域本身来出题，不需要额外的背景资料
2. 难度符合${difficultyMap[difficultyLevel] || '中等'}级别，适合考察前端开发岗位候选人的理解程度
3. 问题表述清晰，有明确的考察点
4. 可以涉及概念、原理、应用场景、最佳实践或代码实现
5. 问题应该贴近真实的前端开发工作场景`

  prompt += `\n\n请直接输出问题，不要包含其他说明文字。`
  return prompt
}

/**
 * Build prompt for evaluating interview answers
 */
export async function buildInterviewEvaluationPrompt(question, answer, categoryId = null) {
  let knowledgeBase = ''
  if (categoryId) {
    const categoryContent = getCategoryContentForPrompt(categoryId)
    if (categoryContent) {
      knowledgeBase = `\n\n以下是相关的知识点和标准答案，可以作为评估参考：\n\n${categoryContent}`
    }
  } else {
    const relevantItems = await getRelevantContent(question, null, 5)
    if (Array.isArray(relevantItems) && relevantItems.length > 0) {
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
 * Build prompt for evaluating practice answers (10-point scoring).
 * The output must strictly follow the "【评分】X/10" format for UI parsing.
 *
 * @param {string} question - Practice question text
 * @param {string} answer - User provided answer
 * @param {string} referenceAnswer - Reference answer used as the evaluation baseline
 * @param {string} questionType - Question type ("qa" | "coding")
 * @param {string|null} categoryId - Optional category id for knowledge-base grounding
 * @returns {Promise<string>} Prompt text
 */
export async function buildPracticeEvaluationPrompt(
  question,
  answer,
  referenceAnswer,
  questionType = 'qa',
  categoryId = null
) {
  let knowledgeBase = ''
  if (categoryId) {
    const categoryContent = getCategoryContentForPrompt(categoryId)
    if (categoryContent) {
      knowledgeBase = `\n\n以下是相关的知识点和标准答案，可以作为评估参考：\n\n${categoryContent}`
    }
  } else {
    const relevantItems = await getRelevantContent(question, null, 5)
    if (Array.isArray(relevantItems) && relevantItems.length > 0) {
      knowledgeBase = `\n\n以下是相关的知识点，可以作为评估参考：\n\n${formatContentForPrompt(relevantItems, 1500)}`
    }
  }

  const typeLabel = questionType === 'qa' ? '问答题' : '练习题'

  return `你是一个专业的前端开发技术练习题判分专家，具有丰富的前端开发经验与题目评估经验。
请对用户回答进行判分与反馈，题目类型为：${typeLabel}。

请严格基于“参考答案”评估用户回答的覆盖度、准确性与表述质量；如用户回答与参考答案存在偏差，请指出原因并给出改进建议。

问题：${question}
参考答案：${referenceAnswer}
你的回答：${answer}${knowledgeBase}

请严格按下面模板输出，不要输出模板外任何内容：
【评分】X/10
【扣分点】
- ...

正确示例（仅作格式参考）：
【评分】8/10
【扣分点】
- 回答中没有提及关键知识点
`
}

/**
 * Build chat messages for interview mode (system + history + question/answer)
 */
export function buildInterviewChatMessages(
  categoryName,
  difficultyLevel,
  question,
  answer = null,
  conversationHistory = [],
  maxHistoryLength = 4
) {
  const difficultyMap = { easy: '简单', medium: '中等', hard: '困难' }
  const messages = []
  messages.push({
    role: 'system',
    content: `你是一个技术面试官，擅长 ${categoryName} 领域的面试。当前面试难度为${difficultyMap[difficultyLevel] || '中等'}。`
  })
  const recentHistory = conversationHistory.slice(-maxHistoryLength)
  recentHistory.forEach((msg) => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content })
    }
  })
  if (question) messages.push({ role: 'assistant', content: `问题：${question}` })
  if (answer) messages.push({ role: 'user', content: answer })
  return messages
}
