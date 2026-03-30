import * as agentService from './agentService.js'

function parseTenPointScore(evaluationText) {
  const match = evaluationText?.match(/【评分】\s*(\d+(?:\.\d+)?)\s*\/\s*10|(\d+(?:\.\d+)?)\s*\/\s*10/)
  if (!match) return null
  const raw = parseFloat(match[1] || match[2])
  if (Number.isNaN(raw)) return null
  return Math.max(0, Math.min(10, Math.round(raw)))
}

function normalizePracticeEvaluationText(evaluationText, parsedScore) {
  const rawText = (evaluationText || '').trim()
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const deductionPoints = []
  for (const line of lines) {
    const isTitleLine = /^【?(评分|扣分点)】?/u.test(line)
    const scoreLine = /(\d+(?:\.\d+)?)\s*\/\s*10/.test(line)
    if (isTitleLine || scoreLine) continue

    const cleaned = line
      .replace(/^\d+[.)、]\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .trim()

    if (!cleaned) continue
    if (cleaned === '无' || cleaned === '无明显扣分点' || cleaned === '无扣分点') {
      deductionPoints.push('无明显扣分点')
      break
    }
    if (!deductionPoints.includes(cleaned)) deductionPoints.push(cleaned)
    if (deductionPoints.length >= 3) break
  }

  const score = parsedScore === null ? 0 : parsedScore
  const normalizedPoints = deductionPoints.length > 0 ? deductionPoints : ['无明显扣分点']
  const deductionBlock = normalizedPoints.map((item) => `- ${item}`).join('\n')
  const normalizedText = `【评分】${score}/10\n【扣分点】\n${deductionBlock}`

  return {
    score,
    deductionPoints: normalizedPoints,
    normalizedText
  }
}

/**
 * Evaluate practice answer and normalize output for UI.
 * @param {Object} params
 * @param {Object} params.input
 * @param {string} params.input.question
 * @param {string} params.input.answer
 * @param {string} params.input.referenceAnswer
 * @param {string} [params.input.questionType]
 * @param {string|null} [params.input.categoryId]
 * @param {Object} params.generationOptions
 * @param {import('../modelService.js').ModelService} params.modelService
 * @param {(chunk: string, fullText: string) => void | null} [params.onChunk]
 */
export async function evaluatePracticeAnswer({ input, generationOptions, modelService, onChunk = null }) {
  const {
    question,
    answer,
    referenceAnswer,
    questionType = 'qa',
    categoryId = null
  } = input || {}

  const status = await modelService.getStatus()
  if (!status.isLoaded) {
    await modelService.loadModel()
  }

  const prompt = await agentService.buildPracticeEvaluationPrompt(
    question,
    answer,
    referenceAnswer,
    questionType,
    categoryId
  )

  let rawText = ''
  const stream = modelService.generateTextStream(prompt, generationOptions)
  for await (const { chunk, fullText } of stream) {
    rawText = fullText
    if (onChunk) onChunk(chunk, rawText)
  }

  const score = parseTenPointScore(rawText)
  const normalized = normalizePracticeEvaluationText(rawText, score)
  const formatValid = /^【评分】\d+\s*\/\s*10[\s\S]*【扣分点】/u.test(rawText.trim())

  return {
    score: normalized.score,
    deductionPoints: normalized.deductionPoints,
    normalizedText: normalized.normalizedText,
    rawText: rawText.trim(),
    formatValid
  }
}
