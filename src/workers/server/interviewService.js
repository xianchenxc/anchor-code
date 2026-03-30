import * as agentService from './agentService.js'

/**
 * Generate one interview question from category and difficulty.
 * @param {Object} params
 * @param {Object} params.input
 * @param {string} params.input.categoryName
 * @param {string} params.input.categoryId
 * @param {string} params.input.difficultyLevel
 * @param {Object} params.generationOptions
 * @param {import('../modelService.js').ModelService} params.modelService
 * @param {(chunk: string, fullText: string) => void | null} [params.onChunk]
 */
export async function generateInterviewQuestion({ input, generationOptions, modelService, onChunk = null }) {
  const {
    categoryName,
    categoryId,
    difficultyLevel
  } = input || {}

  const status = await modelService.getStatus()
  if (!status.isLoaded) {
    await modelService.loadModel()
  }

  const prompt = agentService.buildInterviewQuestionPrompt(categoryName, categoryId, difficultyLevel)
  const stream = modelService.generateTextStream(prompt, generationOptions)

  let fullText = ''
  for await (const { chunk, fullText: nextFullText } of stream) {
    fullText = nextFullText
    if (onChunk) onChunk(chunk, fullText)
  }

  return {
    question: fullText.trim(),
    rawText: fullText.trim()
  }
}

/**
 * Evaluate one interview answer against current question.
 * @param {Object} params
 * @param {Object} params.input
 * @param {string} params.input.question
 * @param {string} params.input.answer
 * @param {string|null} [params.input.categoryId]
 * @param {Object} params.generationOptions
 * @param {import('../modelService.js').ModelService} params.modelService
 * @param {(chunk: string, fullText: string) => void | null} [params.onChunk]
 */
export async function evaluateInterviewAnswer({ input, generationOptions, modelService, onChunk = null }) {
  const {
    question,
    answer,
    categoryId = null
  } = input || {}

  const status = await modelService.getStatus()
  if (!status.isLoaded) {
    await modelService.loadModel()
  }

  const prompt = await agentService.buildInterviewEvaluationPrompt(question, answer, categoryId)
  const stream = modelService.generateTextStream(prompt, generationOptions)

  let fullText = ''
  for await (const { chunk, fullText: nextFullText } of stream) {
    fullText = nextFullText
    if (onChunk) onChunk(chunk, fullText)
  }

  return {
    evaluation: fullText.trim(),
    rawText: fullText.trim()
  }
}
