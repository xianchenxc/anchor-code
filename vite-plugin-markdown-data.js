import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, relative, resolve } from 'path'
import matter from 'gray-matter'

/**
 * Format directory name to display name
 * Uses minimal mapping table for special cases,
 * otherwise applies kebab-case to Title Case conversion
 */
const categoryNameMap = {
  // Special cases that cannot be auto-converted
  'javascript': 'JavaScript',
  'node-js': 'Node.js',
  'web3': 'Web3',
  'react-native': 'React Native',
  'web-assembly': 'WebAssembly'
}

/**
 * Format category name from directory name
 * @param {string} dirName - Directory name (e.g., 'javascript', 'node-js')
 * @returns {string} Formatted display name (e.g., 'JavaScript', 'Node.js')
 */
function formatCategoryName(dirName) {
  // Check mapping table first
  if (categoryNameMap[dirName]) {
    return categoryNameMap[dirName]
  }
  
  // Generic rule: kebab-case → Title Case
  // e.g., 'react-hooks' → 'React Hooks'
  return dirName
    .split('-')
    .map(word => {
      // Handle words starting with numbers (e.g., 'web3')
      if (/^\d/.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Sort function for directories/files with numeric prefix support
 * Numeric prefixes (e.g., '01-basics') sort before semantic names (e.g., 'basics')
 * @param {string} a - First name
 * @param {string} b - Second name
 * @returns {number} Comparison result
 */
function sortByName(a, b) {
  // Extract numeric prefix if exists (e.g., '01-basics' → 1, 'basics' → null)
  const getNumericPrefix = (name) => {
    const match = name.match(/^(\d+)-/)
    return match ? parseInt(match[1], 10) : null
  }
  
  const aPrefix = getNumericPrefix(a)
  const bPrefix = getNumericPrefix(b)
  
  // If both have numeric prefixes, sort by prefix
  if (aPrefix !== null && bPrefix !== null) {
    return aPrefix - bPrefix
  }
  
  // If only a has prefix, a comes first
  if (aPrefix !== null) {
    return -1
  }
  
  // If only b has prefix, b comes first
  if (bPrefix !== null) {
    return 1
  }
  
  // If neither has prefix, sort alphabetically
  return a.localeCompare(b)
}

/**
 * Get markdown files in 1-level subdir structure:
 * - content/<category>/*.md
 * - content/<category>/<subdir>/*.md (only one extra level)
 * @param {string} contentDir
 * @returns {string[]} Paths relative to contentDir, e.g. ['javascript/01-var-let-const.md', 'javascript/qa/foo.md']
 */
function getMarkdownFilesFlat(contentDir) {
  const files = []
  const entries = readdirSync(contentDir)
  for (const entry of entries) {
    const fullPath = join(contentDir, entry)
    const stat = statSync(fullPath)
    if (!stat.isDirectory()) continue
    const categoryDir = fullPath

    // Root md files: content/<category>/*.md
    const categoryEntries = readdirSync(categoryDir)
    for (const entryName of categoryEntries) {
      const entryPath = join(categoryDir, entryName)
      const entryStat = statSync(entryPath)
      if (entryStat.isFile() && entryName.endsWith('.md')) {
        files.push(relative(contentDir, join(categoryDir, entryName)))
      }
    }

    // One-level subdir md files: content/<category>/<subdir>/*.md
    for (const entryName of categoryEntries) {
      const entryPath = join(categoryDir, entryName)
      const entryStat = statSync(entryPath)
      if (!entryStat.isDirectory()) continue

      const subdirEntries = readdirSync(entryPath)
      for (const md of subdirEntries) {
        if (!md.endsWith('.md')) continue
        const mdPath = join(entryPath, md)
        if (statSync(mdPath).isFile()) {
          files.push(relative(contentDir, join(entryPath, md)))
        }
      }
    }
  }
  return files
}

/**
 * Extract code blocks from markdown content
 * Returns array of objects with { content, language, fullBlock }
 */
function extractCodeBlocks(content) {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  const matches = []
  let match
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || ''
    const codeContent = match[2].trim()
    const fullBlock = match[0] // Keep the full code block with ```
    matches.push({
      content: codeContent,
      language: language,
      fullBlock: fullBlock
    })
  }
  
  return matches
}

/**
 * Remove code blocks from markdown content
 */
function removeCodeBlocks(content) {
  return content.replace(/```[\w]*\n[\s\S]*?```/g, '').trim()
}

/**
 * Slug for section ids. Allows non-Latin titles by falling back to s{index}.
 * @param {string} title
 * @param {number} index
 * @returns {string}
 */
function slugifySection(title, index) {
  if (typeof title !== 'string' || !title.trim()) {
    return `s${index + 1}`
  }
  const base = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return base || `s${index + 1}`
}

/**
 * Split markdown body into logical sections for knowledge cards.
 * Default rule: use `##` as card-level heading; if none, treat whole body as one section.
 * Each section has { title, body } where title comes from the H2 text when present.
 */
function splitIntoSections(body, fallbackTitle) {
  const text = (body || '').trim()
  if (!text) return []

  const lines = text.split('\n')
  const sections = []
  let currentTitle = null
  let currentLines = []

  const pushSection = () => {
    const raw = currentLines.join('\n').trim()
    if (!raw) return
    sections.push({
      title: currentTitle || fallbackTitle,
      body: raw
    })
  }

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)\s*$/)
    if (match) {
      if (currentLines.length > 0) {
        pushSection()
      }
      currentTitle = match[1].trim()
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }

  if (currentLines.length > 0) {
    pushSection()
  }

  if (sections.length === 0) {
    return [
      {
        title: fallbackTitle,
        body: text
      }
    ]
  }

  return sections
}

/**
 * Process markdown files (flat: content/<category>/*.md) and generate structured data.
 * Model: categories are top-level only; each category directly owns itemIds.
 */
function processMarkdownFiles(contentDir) {
  const categories = {}
  const rawQuestions = []
  const files = getMarkdownFilesFlat(contentDir)

  for (const file of files) {
    const filePath = join(contentDir, file)
    const rawContent = readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content: body } = matter(rawContent)

    const pathParts = file.split('/')
    const categoryId = pathParts[0]
    const fileName = pathParts[pathParts.length - 1].replace(/\.md$/, '')
    // baseKey for item ids/sort keys should be unique within category:
    // - root: <fileName> => e.g. css-basics
    // - one-level subdir: <subdir>-<fileName> => e.g. css-qa-foo
    const subdirParts = pathParts.length > 2 ? pathParts.slice(1, -1) : []
    const baseKey = subdirParts.length ? `${subdirParts.join('-')}-${fileName}` : fileName

    if (!categories[categoryId]) {
      categories[categoryId] = {
        id: categoryId,
        name: frontmatter.category || formatCategoryName(categoryId),
        itemIds: []
      }
    }

    let processedContent = body.trim()
    let template = frontmatter.template ? frontmatter.template.trim() : ''
    let description = frontmatter.description || ''

    if (frontmatter.type === 'practice' && frontmatter.questionType === 'coding') {
      const codeBlocks = extractCodeBlocks(processedContent)
      if (codeBlocks.length > 0) {
        processedContent = codeBlocks[0].fullBlock
        const remainingContent = removeCodeBlocks(body.trim()).trim()
        if (!description && remainingContent) description = remainingContent
      }
    }

    const itemType = frontmatter.type === 'practice' ? 'practice' : 'knowledge'
    const cardMode = frontmatter.cardMode || 'single'

    // Practice 内容或显式 single 模式：整篇作为一张卡（保持现有行为）
    if (cardMode === 'single' || itemType === 'practice') {
      const itemId = `${categoryId}-${baseKey}`
      const item = {
        id: itemId,
        categoryId,
        type: itemType,
        questionType: itemType === 'practice' ? (frontmatter.questionType || 'qa') : undefined,
        title: frontmatter.title || frontmatter.question || fileName,
        question: frontmatter.question || '',
        summary: frontmatter.summary ?? '',
        difficulty: frontmatter.difficulty || 'basic',
        frequency: frontmatter.frequency || 'medium',
        description,
        content: processedContent || frontmatter.content || '',
        template,
        _fileName: baseKey
      }
      categories[categoryId].itemIds.push(itemId)
      rawQuestions.push(item)
    } else {
      // section 模式：按 H2 拆成多张知识卡片
      const baseTitle = frontmatter.title || frontmatter.question || fileName
      const sections = splitIntoSections(processedContent, baseTitle)

      sections.forEach((section, index) => {
        const sectionTitle = section.title || baseTitle
        const sectionSlug = slugifySection(sectionTitle, index)

        // 简单从首段提取摘要（如无 frontmatter.summary）
        let sectionSummary = frontmatter.summary || ''
        if (!sectionSummary) {
          const paragraphs = section.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
          if (paragraphs.length > 0) {
            sectionSummary = paragraphs[0].replace(/^#+\s*/, '').slice(0, 160)
          }
        }

        const itemId = `${categoryId}-${baseKey}-${sectionSlug}`
        const item = {
          id: itemId,
          categoryId,
          type: itemType,
          questionType: undefined,
          title: sectionTitle,
          question: '',
          summary: sectionSummary,
          difficulty: frontmatter.difficulty || 'basic',
          frequency: frontmatter.frequency || 'medium',
          description,
          content: section.body,
          template,
          _fileName: `${baseKey}-${index + 1}`,
          sourceFileId: `${categoryId}-${baseKey}`
        }
        categories[categoryId].itemIds.push(itemId)
        rawQuestions.push(item)
      })
    }
  }

  const questions = questionsSortAndStripMeta(rawQuestions)

  const categoriesArray = Object.values(categories)
    .sort((a, b) => sortByName(a.id, b.id))
    .map((cat) => ({
      ...cat,
      itemIds: sortItemIdsByFileName(cat.itemIds, rawQuestions)
    }))

  return { categories: categoriesArray, questions }
}

/**
 * Sort questions by generated file key and remove build-only fields.
 * @param {Array} questions
 * @returns {Array}
 */
function questionsSortAndStripMeta(questions) {
  return [...questions]
    .sort((a, b) => sortByName(a._fileName, b._fileName))
    .map((item) => {
      const { _fileName, ...rest } = item
      return rest
    })
}

/**
 * Sort category item ids by corresponding question order.
 * @param {string[]} itemIds
 * @param {Array} questions
 * @returns {string[]}
 */
function sortItemIdsByFileName(itemIds, rawQuestions) {
  const keyById = new Map(rawQuestions.map((q) => [q.id, q._fileName || q.id]))
  return [...itemIds].sort((a, b) => sortByName(keyById.get(a) || a, keyById.get(b) || b))
}

/**
 * Vite plugin to process Markdown files at build time
 * Outputs to publicDataDir: categories.json (tree with itemIds), questions.json (items with categoryId)
 * Worker loads these via fetch(baseUrl + 'data/categories.json').
 */
export default function markdownDataPlugin(options = {}) {
  const {
    contentDir = 'content',
    publicDataDir = 'public/data'
  } = options

  let root

  function writeOutputs(data) {
    const outputDir = resolve(root, publicDataDir)
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }
    writeFileSync(resolve(outputDir, 'categories.json'), JSON.stringify({ categories: data.categories }, null, 2), 'utf-8')
    writeFileSync(resolve(outputDir, 'questions.json'), JSON.stringify({ items: data.questions }, null, 2), 'utf-8')
  }

  return {
    name: 'vite-plugin-markdown-data',

    configResolved(resolvedConfig) {
      root = resolvedConfig.root
    },

    async buildStart() {
      const fullContentDir = resolve(root, contentDir)
      const data = processMarkdownFiles(fullContentDir)
      writeOutputs(data)
      console.log(`✓ Processed ${data.categories.length} categories, ${data.questions.length} items`)
    },

    configureServer(server) {
      const contentPath = resolve(root, contentDir)
      
      // Use Vite's watcher to monitor directory structure changes
      // This is needed to catch directory renames, which handleHotUpdate doesn't catch
      server.watcher.add(contentPath)
      
      // Track if we're already processing to avoid duplicate processing
      let isProcessing = false
      
      // Handle file and directory changes
      const handleChange = async (path, eventType = 'change') => {
        const filePath = resolve(path)
        
        // Only process if the change is within the content directory
        if (!filePath.startsWith(contentPath)) {
          return
        }
        
        // Skip markdown file changes - they're handled by handleHotUpdate
        // This avoids duplicate processing
        if (filePath.endsWith('.md') && (eventType === 'change' || eventType === 'add' || eventType === 'unlink')) {
          return
        }
        
        // Prevent concurrent processing
        if (isProcessing) {
          return
        }
        isProcessing = true
        
        try {
          // Small delay to ensure file system operations are complete
          // This is especially important for directory renames
          await new Promise(resolve => setTimeout(resolve, 150))
          const data = processMarkdownFiles(contentPath)
          writeOutputs(data)
          
          // Determine change type for better logging
          let changeType = 'file'
          try {
            if (existsSync(filePath)) {
              const stat = statSync(filePath)
              changeType = stat.isDirectory() ? 'directory' : 'file'
            } else {
              changeType = eventType.includes('Dir') ? 'directory' : 'file'
            }
          } catch {
            // If we can't determine, use event type
            changeType = eventType.includes('Dir') ? 'directory' : 'file'
          }
          
          const relativePath = relative(contentPath, filePath)
          const eventName = eventType === 'addDir' ? 'created' : 
                           eventType === 'unlinkDir' ? 'deleted' :
                           eventType === 'add' ? 'added' :
                           eventType === 'unlink' ? 'removed' : 'changed'
          console.log(`✓ Updated data from ${changeType} ${eventName}: ${relativePath || 'root'}`)
          
          // Trigger HMR
          server.ws.send({
            type: 'full-reload'
          })
        } catch (error) {
          console.warn('Error processing markdown files:', error.message)
        } finally {
          isProcessing = false
        }
      }
      
      // Listen to directory events (these are not caught by handleHotUpdate)
      server.watcher.on('addDir', (path) => handleChange(path, 'addDir'))
      server.watcher.on('unlinkDir', (path) => handleChange(path, 'unlinkDir'))
      // Also listen to non-markdown file changes (e.g., metadata files)
      server.watcher.on('add', (path) => {
        if (!path.endsWith('.md')) {
          handleChange(path, 'add')
        }
      })
      server.watcher.on('unlink', (path) => {
        if (!path.endsWith('.md')) {
          handleChange(path, 'unlink')
        }
      })
    },
    
    handleHotUpdate({ file, server }) {
      const contentPath = resolve(root, contentDir)
      const filePath = resolve(root, file)
      if (filePath.startsWith(contentPath) && file.endsWith('.md')) {
        const data = processMarkdownFiles(contentPath)
        writeOutputs(data)
        console.log(`✓ Updated data from Markdown file: ${relative(contentPath, filePath)}`)
        
        // Trigger HMR
        server.ws.send({
          type: 'full-reload'
        })
        
        return []
      }
    }
  }
}
