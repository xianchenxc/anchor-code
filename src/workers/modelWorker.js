/**
 * Web Worker for model inference
 * Uses Comlink to expose ModelService as a remote proxy
 * Runs model loading and text generation in a background thread
 * to prevent blocking the main UI thread
 */

import * as Comlink from 'comlink'
import { env } from '@huggingface/transformers'
import { ModelService } from './modelService.js'

// Configure environment for Worker
// Disable local models for security and compatibility reasons:
// 1. Web Workers have limited file system access
// 2. Security: prevents loading models from local file system
// 3. This project only uses remote models from Hugging Face Hub
//
// Caching behavior:
// - transformers.js automatically caches model files to IndexedDB (transformers-cache)
// - First load: Downloads model files from Hugging Face Hub (~500MB) and caches them
// - Subsequent loads: Automatically loads from IndexedDB cache (much faster, no download)
// - Cache persists across browser sessions until manually cleared
env.allowLocalModels = false
env.allowRemoteModels = true
env.backends.onnx.wasm.proxy = false

// Initialize model service
const modelService = new ModelService()

// Create a wrapper object that exposes ModelService methods via Comlink
// This wrapper handles callback proxying for streaming and progress updates
const workerAPI = {
  /**
   * Load the model
   * @param {string|null} modelName - Model name to load, or null to use default
   * @param {Function} onProgress - Optional progress callback (progress: number) => void
   * @returns {Promise<{success: boolean, message: string, modelName?: string, backend?: string, dtype?: string, modelSize?: number}>}
   */
  async loadModel(modelName = null, onProgress = null) {
    // Wrap progress callback with Comlink.proxy if provided
    const progressCallback = onProgress ? Comlink.proxy(onProgress) : null

    return await modelService.loadModel(
      modelName,
      progressCallback // Direct progress callback (number)
    )
  },

  /**
   * Generate text using async generator for streaming
   * Uses postMessage for chunks since Comlink doesn't natively support async generators
   * @param {string|Array<{role: string, content: string}>} promptOrMessages - Input prompt or chat messages
   * @param {Object} options - Generation options
   * @param {number} options.maxLength - Maximum output length
   * @param {number} options.temperature - Sampling temperature
   * @param {number} options.topK - Top-k sampling
   * @param {number} options.topP - Top-p (nucleus) sampling
   * @param {string} options.requestId - Request ID for event-based streaming
   * @returns {Promise<string>}
   */
  async generateTextStream(promptOrMessages, options = {}) {
    const { requestId, ...generationOptions } = options

    // Create a callback that sends messages via postMessage
    // This bridges the async generator to event-based communication
    const onChunk = requestId ? (chunk, fullText) => {
      // Send streaming chunk via postMessage to avoid callback serialization issues
      self.postMessage({
        type: 'streaming-chunk',
        requestId: requestId,
        chunk: chunk,
        fullText: fullText
      })
    } : null

    // Use the async generator internally but convert to callback-based for Comlink
    let fullText = ''
    const stream = modelService.generateTextStream(promptOrMessages, generationOptions)
    
    for await (const { chunk, fullText: newFullText } of stream) {
      fullText = newFullText
      if (onChunk) {
        onChunk(chunk, fullText)
      }
    }

    return fullText
  },


  /**
   * Get current model status
   * @returns {Promise<{isLoaded: boolean, modelName: string, isLoading: boolean}>}
   */
  async getStatus() {
    return await modelService.getStatus()
  },

  /**
   * Get model information
   * @returns {Promise<{modelName: string, backend: string|null, dtype: string|null, modelSize: number, isLoaded: boolean, isLoading: boolean}>}
   */
  async getModelInfo() {
    return await modelService.getModelInfo()
  },

  /**
   * Unload the model to free memory
   * @returns {Promise<void>}
   */
  async unload() {
    return await modelService.unload()
  }
}

// Expose the API via Comlink
Comlink.expose(workerAPI)
