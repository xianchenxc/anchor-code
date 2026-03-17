/**
 * Vector service inside Worker: load precomputed embeddings and perform vector search.
 * Uses transformers.js feature-extraction pipeline to embed queries at runtime.
 */

import { pipeline } from '@huggingface/transformers'
import * as dataService from './dataService.js'

let embeddingsById = new Map()
let embeddingDimension = 0
let embeddingsInited = false

let extractor = null
let loadingExtractor = null

const EMBEDDING_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
const MAX_QUERY_LENGTH = 2000

/**
 * Load embeddings.json generated at build time from baseUrl + 'data/embeddings.json'.
 * Silently falls back to disabled state if file is missing or invalid.
 * @param {string} baseUrl
 */
export async function initFromBaseUrl(baseUrl) {
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  const embeddingsUrl = new URL('data/embeddings.json', base).href
  try {
    const res = await fetch(embeddingsUrl)
    if (!res.ok) {
      return
    }
    const json = await res.json()
    if (!Array.isArray(json?.items) || !json.items.length) {
      return
    }
    embeddingsById = new Map()
    for (const entry of json.items) {
      if (!entry?.id || !Array.isArray(entry.embedding)) continue
      embeddingsById.set(entry.id, entry.embedding)
    }
    embeddingDimension = typeof json.dimension === 'number' ? json.dimension : (embeddingsById.values().next().value?.length || 0)
    embeddingsInited = embeddingDimension > 0 && embeddingsById.size > 0
  } catch {
    embeddingsById = new Map()
    embeddingDimension = 0
    embeddingsInited = false
  }
}

export function hasEmbeddings() {
  return embeddingsInited
}

async function ensureExtractor() {
  if (extractor) return extractor
  if (loadingExtractor) return loadingExtractor
  loadingExtractor = (async () => {
    const instance = await pipeline('feature-extraction', EMBEDDING_MODEL, {
      quantized: true
    })
    extractor = instance
    loadingExtractor = null
    return extractor
  })()
  return loadingExtractor
}

function buildQueryText(query) {
  if (!query || typeof query !== 'string') {
    return '(empty)'
  }
  return query.trim().slice(0, MAX_QUERY_LENGTH) || '(empty)'
}

function normalizeVector(vec) {
  let norm = 0
  for (let i = 0; i < vec.length; i++) {
    norm += vec[i] * vec[i]
  }
  norm = Math.sqrt(norm) || 1
  const out = new Array(vec.length)
  for (let i = 0; i < vec.length; i++) {
    out[i] = vec[i] / norm
  }
  return out
}

function cosineSimilarity(a, b) {
  const len = Math.min(a.length, b.length)
  let dot = 0
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
  }
  return dot
}

function toEmbeddingList(output) {
  if (output?.tolist) return output.tolist()
  if (Array.isArray(output) && output.every(Array.isArray)) return output
  if (Array.isArray(output)) return output.map((v) => (Array.isArray(v) ? v : [v]))
  return []
}

function heapifyUp(heap, index) {
  let i = index
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2)
    if (heap[i].score >= heap[parent].score) break
    const tmp = heap[i]
    heap[i] = heap[parent]
    heap[parent] = tmp
    i = parent
  }
}

function heapifyDown(heap, index) {
  const length = heap.length
  let i = index
  while (true) {
    const left = 2 * i + 1
    const right = 2 * i + 2
    let smallest = i

    if (left < length && heap[left].score < heap[smallest].score) {
      smallest = left
    }
    if (right < length && heap[right].score < heap[smallest].score) {
      smallest = right
    }
    if (smallest === i) break

    const tmp = heap[i]
    heap[i] = heap[smallest]
    heap[smallest] = tmp
    i = smallest
  }
}

/**
 * Get relevant items using vector search when embeddings are available.
 * Falls back to empty array if embeddings or extractor are not ready.
 * @param {string} query
 * @param {string|null} categoryId
 * @param {number} maxItems
 * @returns {Promise<Array>}
 */
export async function getRelevantContentByEmbedding(query, categoryId = null, maxItems = 10) {
  if (!embeddingsInited) return []
  const itemsToSearch = categoryId ? dataService.getQuestionsByCategoryId(categoryId) : dataService.getItems()
  if (!itemsToSearch.length) return []

  const extractorInstance = await ensureExtractor()
  const text = buildQueryText(query)
  const output = await extractorInstance(text, { pooling: 'mean', normalize: true })
  const list = toEmbeddingList(output)
  const queryVec = list[0] || list
  if (!Array.isArray(queryVec) || !queryVec.length) return []

  const normQuery = normalizeVector(queryVec)
  const heap = []
  for (const item of itemsToSearch) {
    const emb = embeddingsById.get(item.id)
    if (!emb || !Array.isArray(emb) || !emb.length) continue
    const score = cosineSimilarity(normQuery, emb)

    if (heap.length < maxItems) {
      heap.push({ item, score })
      heapifyUp(heap, heap.length - 1)
      continue
    }

    if (!heap.length || score <= heap[0].score) {
      continue
    }

    heap[0] = { item, score }
    heapifyDown(heap, 0)
  }

  // heap 中是按 score 升序的小顶堆，转换为按 score 降序输出
  return heap
    .slice()
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
}

