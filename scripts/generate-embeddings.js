/**
 * Generate embeddings for knowledge items (build-time).
 * Reads questions.json, embeds each item's text, writes embeddings.json.
 * Uses @huggingface/transformers with a multilingual model for Chinese support.
 *
 * Run: pnpm run gen:embeddings
 * Or: invoked by vite build (embedding plugin runs after markdown plugin).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from '@huggingface/transformers'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DATA_DIR = resolve(ROOT, 'public/data')
const QUESTIONS_PATH = resolve(DATA_DIR, 'questions.json')
const EMBEDDINGS_PATH = resolve(DATA_DIR, 'embeddings.json')

/** Multilingual model; 384 dim; good for Chinese + English */
const EMBEDDING_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
const MAX_TEXT_LENGTH = 2000

/**
 * Build text to embed (same fields as contentExtractor searchText)
 * @param {Object} item - Question item from questions.json
 * @returns {string}
 */
function buildTextForEmbedding(item) {
  const parts = [
    item.title || '',
    item.question || '',
    item.content || '',
    item.description || ''
  ]
  const text = parts.filter(Boolean).join(' ').trim()
  return text.slice(0, MAX_TEXT_LENGTH) || '(empty)'
}

/**
 * Normalize pipeline output to number[][]
 * Pipeline returns Tensor; use .tolist() when available
 */
function toEmbeddingList(output) {
  if (output?.tolist) return output.tolist()
  if (Array.isArray(output) && output.every(Array.isArray)) return output
  if (Array.isArray(output)) return output.map((v) => (Array.isArray(v) ? v : [v]))
  return []
}

const BATCH_SIZE = 8

async function main() {
  if (!existsSync(QUESTIONS_PATH)) {
    throw new Error(
      `questions.json not found at ${QUESTIONS_PATH}. Run "pnpm dev" or "pnpm build" first to generate it.`
    )
  }

  const { items } = JSON.parse(readFileSync(QUESTIONS_PATH, 'utf-8'))
  if (!items || items.length === 0) {
    console.log('No items to embed. Skipping.')
    return
  }

  console.log(`Loading embedding model: ${EMBEDDING_MODEL}...`)
  const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL, {
    quantized: true
  })
  console.log(`Embedding ${items.length} items (batch size ${BATCH_SIZE})...`)

  const allEmbeddings = []
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const texts = batch.map((item) => buildTextForEmbedding(item))
    const output = await extractor(texts, { pooling: 'mean', normalize: true })
    const embeddings = toEmbeddingList(output)
    if (batch.length === 1 && Array.isArray(embeddings[0])) {
      allEmbeddings.push(embeddings[0])
    } else {
      for (const emb of embeddings) {
        allEmbeddings.push(Array.isArray(emb) ? emb : [emb])
      }
    }
  }

  const result = {
    dimension: allEmbeddings[0]?.length ?? 384,
    items: items.map((item, i) => ({ id: item.id, embedding: allEmbeddings[i] ?? [] }))
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
  writeFileSync(EMBEDDINGS_PATH, JSON.stringify(result), 'utf-8')
  console.log(`✓ Wrote ${EMBEDDINGS_PATH} (${items.length} items, dim ${result.dimension})`)
}

/** Export for Vite plugin; run directly when executed as script */
export async function generateEmbeddings() {
  await main()
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  generateEmbeddings().catch((err) => {
    console.error('Failed to generate embeddings:', err.message)
    process.exit(1)
  })
}
