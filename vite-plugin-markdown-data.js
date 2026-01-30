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
 * Recursively get all markdown files from a directory
 */
function getMarkdownFiles(dir, baseDir = dir, files = []) {
  const entries = readdirSync(dir)
  
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory()) {
      getMarkdownFiles(fullPath, baseDir, files)
    } else if (entry.endsWith('.md')) {
      files.push(relative(baseDir, fullPath))
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
 * Process markdown files and generate structured data
 * Uses convention-over-configuration: directory names are auto-formatted to display names
 */
function processMarkdownFiles(contentDir) {
  const categories = {}
  const files = getMarkdownFiles(contentDir)
  
  for (const file of files) {
    const filePath = join(contentDir, file)
    const rawContent = readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content: body } = matter(rawContent)
    
    // Extract category and subcategory from path
    // e.g., javascript/basics/var-let-const.md
    const pathParts = file.split('/')
    const fileName = pathParts[pathParts.length - 1].replace('.md', '')
    const subcategory = pathParts[pathParts.length - 2]
    const categoryId = pathParts[pathParts.length - 3]
    
    // Initialize category if not exists
    if (!categories[categoryId]) {
      // Priority: frontmatter.category > formatted directory name
      const categoryName = frontmatter.category || formatCategoryName(categoryId)
      categories[categoryId] = {
        id: categoryId,
        name: categoryName,
        children: {}
      }
    }
    
    // Initialize subcategory if not exists
    if (!categories[categoryId].children[subcategory]) {
      // Priority: frontmatter.subcategory > formatted directory name
      const subcategoryName = frontmatter.subcategory || formatCategoryName(subcategory)
      categories[categoryId].children[subcategory] = {
        id: `${categoryId}-${subcategory}`,
        name: subcategoryName,
        type: frontmatter.type || 'knowledge',
        subcategory: subcategory, // Store original subcategory name for sorting
        items: []
      }
    }
    
    // Process content based on type
    let processedContent = body.trim()
    let template = frontmatter.template ? frontmatter.template.trim() : ''
    let description = frontmatter.description || ''
    
    // For coding questions, extract code from markdown and use remaining content as description
    if (frontmatter.type === 'practice' && frontmatter.questionType === 'coding') {
      const codeBlocks = extractCodeBlocks(processedContent)
      if (codeBlocks.length > 0) {
        // Use first code block's full block (with ``` markers) as content (answer)
        // This preserves the code block format for ReactMarkdown to render correctly
        processedContent = codeBlocks[0].fullBlock
        const remainingContent = removeCodeBlocks(body.trim()).trim()
        // Use remaining content as description if description is not in frontmatter
        if (!description && remainingContent) {
          description = remainingContent
        }
      }
    }
    
    // Create item from markdown; categoryId = subcategory id for association
    const itemId = frontmatter.id || `${categoryId}-${subcategory}-${fileName}`
    const subcategoryId = `${categoryId}-${subcategory}`
    const item = {
      id: itemId,
      categoryId: subcategoryId,
      type: frontmatter.questionType || (frontmatter.type === 'practice' ? 'qa' : undefined),
      title: frontmatter.title || frontmatter.question || fileName,
      question: frontmatter.question || '',
      description: description,
      content: processedContent || frontmatter.content || '',
      template: template,
      _fileName: fileName,
    }
    categories[categoryId].children[subcategory].items.push(item)
  }

  // Sort items by filename and build two outputs: categories (with itemIds) and questions (flat with categoryId)
  const questions = []
  Object.values(categories).forEach(cat => {
    Object.values(cat.children).forEach(subcat => {
      subcat.items.sort((a, b) => sortByName(a._fileName, b._fileName))
      subcat.itemIds = subcat.items.map((i) => i.id)
      subcat.items.forEach((item) => {
        const { _fileName, ...rest } = item
        questions.push(rest)
      })
      delete subcat.items
    })
  })

  // Categories: tree with itemIds only (no full item bodies)
  const categoriesArray = Object.values(categories)
    .sort((a, b) => sortByName(a.id, b.id))
    .map((cat) => {
      const childrenArray = Object.values(cat.children)
        .sort((a, b) => sortByName(a.subcategory, b.subcategory))
      return { ...cat, children: childrenArray }
    })

  return { categories: categoriesArray, questions }
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
