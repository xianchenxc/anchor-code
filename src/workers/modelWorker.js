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
   * Generate text using the loaded model
   * @param {string|Array<{role: string, content: string}>} promptOrMessages - Input prompt or chat messages
   * @param {Object} options - Generation options
   * @param {number} options.maxLength - Maximum output length
   * @param {number} options.temperature - Sampling temperature
   * @param {number} options.topK - Top-k sampling
   * @param {number} options.topP - Top-p (nucleus) sampling
   * @param {boolean} options.streaming - Whether to use streaming
   * @param {Function} options.onChunk - Optional callback for streaming chunks (chunk: string, fullText: string) => void
   * @returns {Promise<string>}
   */
  async generateText(promptOrMessages, options = {}) {
    // Extract and wrap onChunk callback if provided
    const { onChunk, ...generationOptions } = options
    const onChunkProxy = onChunk ? Comlink.proxy(onChunk) : null

    return await modelService.generateText(promptOrMessages, {
      ...generationOptions,
      streaming: !!onChunkProxy,
      onChunk: onChunkProxy
    })
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
