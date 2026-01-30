/**
 * Unified server Worker: data + agent + model.
 * initOptions() uses build-injected BASE_URL + self.location.origin to fetch data/*.json. No args from main thread.
 * Data/agent methods throw if not initialized (same as server not ready).
 */

import * as Comlink from 'comlink'
import { env } from '@huggingface/transformers'
import * as dataService from './server/dataService.js'
import * as agentService from './server/agentService.js'
import { ModelService } from './modelService.js'

env.allowLocalModels = false
env.allowRemoteModels = true
env.backends.onnx.wasm.proxy = false

/** Base path injected at build (Vite import.meta.env.BASE_URL, e.g. '/anchor-code/') */
const BASE_PATH = typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/'

const modelService = new ModelService()

const workerAPI = {
  /** Load data from served JSON (data/categories.json, data/questions.json). baseUrl = origin + BASE_PATH (build-injected). Throws on fetch failure. */
  async initOptions() {
    const basePath = BASE_PATH.endsWith('/') ? BASE_PATH : BASE_PATH + '/'
    const baseUrl = (self.location?.origin || '') + basePath
    await dataService.initFromBaseUrl(baseUrl)
  },

  getCategories() {
    return dataService.getCategories()
  },

  getQuestionsBySubcategoryId(subcategoryId) {
    return dataService.getQuestionsBySubcategoryId(subcategoryId)
  },

  getAllPracticeQuestions() {
    return dataService.getAllPracticeQuestions()
  },

  buildLearningChatMessages(userQuestion, conversationHistory = [], currentTopic = null, maxHistoryLength = 6) {
    return agentService.buildLearningChatMessages(userQuestion, conversationHistory, currentTopic, maxHistoryLength)
  },

  buildInterviewQuestionPrompt(categoryName, categoryId, difficultyLevel) {
    return agentService.buildInterviewQuestionPrompt(categoryName, categoryId, difficultyLevel)
  },

  buildInterviewEvaluationPrompt(question, answer, categoryId = null) {
    return agentService.buildInterviewEvaluationPrompt(question, answer, categoryId)
  },

  buildInterviewChatMessages(categoryName, difficultyLevel, question, answer = null, conversationHistory = [], maxHistoryLength = 4) {
    return agentService.buildInterviewChatMessages(categoryName, difficultyLevel, question, answer, conversationHistory, maxHistoryLength)
  },

  async loadModel(modelName = null, onProgress = null) {
    const progressCallback = onProgress ? Comlink.proxy(onProgress) : null
    return await modelService.loadModel(modelName, progressCallback)
  },

  async generateTextStream(promptOrMessages, options = {}) {
    const { requestId, ...generationOptions } = options
    const onChunk = requestId
      ? (chunk, fullText) => {
          self.postMessage({ type: 'streaming-chunk', requestId, chunk, fullText })
        }
      : null

    let fullText = ''
    const stream = modelService.generateTextStream(promptOrMessages, generationOptions)
    for await (const { chunk, fullText: newFullText } of stream) {
      fullText = newFullText
      if (onChunk) onChunk(chunk, fullText)
    }
    return fullText
  },

  async getStatus() {
    return await modelService.getStatus()
  },

  async getModelInfo() {
    return await modelService.getModelInfo()
  },

  async unload() {
    return await modelService.unload()
  }
}

Comlink.expose(workerAPI)
