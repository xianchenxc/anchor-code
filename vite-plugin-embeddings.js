/**
 * Vite plugin to run embedding generation during build only.
 * Runs after markdown plugin; dev mode unchanged.
 */

import { resolve } from 'path'
import { pathToFileURL } from 'url'

export default function embeddingsPlugin() {
  let root

  return {
    name: 'vite-plugin-embeddings',
    apply: 'build',

    configResolved(resolvedConfig) {
      root = resolvedConfig.root
    },

    async buildStart() {
      const scriptPath = resolve(root, 'scripts/generate-embeddings.js')
      const { generateEmbeddings } = await import(pathToFileURL(scriptPath).href)
      await generateEmbeddings()
    }
  }
}
