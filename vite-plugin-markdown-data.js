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
 */
function extractCodeBlocks(content) {
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g
  const matches = []
  let match
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    matches.push(match[1].trim())
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
        // Use first code block as content (answer)
        processedContent = codeBlocks[0]
        const remainingContent = removeCodeBlocks(body.trim()).trim()
        // Use remaining content as description if description is not in frontmatter
        if (!description && remainingContent) {
          description = remainingContent
        }
      }
    }
    
    // Create item from markdown
    // All types use 'content' field for main content (knowledge content or practice answer)
    const item = {
      id: frontmatter.id || `${categoryId}-${subcategory}-${fileName}`,
      type: frontmatter.questionType || (frontmatter.type === 'practice' ? 'qa' : undefined),
      title: frontmatter.title || frontmatter.question || fileName,
      question: frontmatter.question || '',
      description: description,
      content: processedContent || frontmatter.content || '',
      template: template,
      _fileName: fileName, // Store original filename for sorting
    }
    
    categories[categoryId].children[subcategory].items.push(item)
  }
  
  // Sort items by filename (supports numeric prefix for strict ordering)
  Object.values(categories).forEach(cat => {
    Object.values(cat.children).forEach(subcat => {
      // Sort by actual filename, not by item id
      subcat.items.sort((a, b) => {
        return sortByName(a._fileName, b._fileName)
      })
      // Remove internal sorting field before output
      subcat.items.forEach(item => {
        delete item._fileName
      })
    })
  })
  
  // Convert to array format and sort by filename (numeric prefix or alphabetical)
  return {
    categories: Object.values(categories)
      .sort((a, b) => sortByName(a.id, b.id))
      .map(cat => {
        // Convert children object to array and sort by directory name
        const childrenArray = Object.values(cat.children)
          .sort((a, b) => sortByName(a.subcategory, b.subcategory))
        
        return {
          ...cat,
          children: childrenArray
        }
      })
  }
}

/**
 * Vite plugin to process Markdown files at build time
 */
export default function markdownDataPlugin(options = {}) {
  const {
    contentDir = 'content',
    outputFile = 'src/data/questions.json'
  } = options
  
  let config
  let root
  
  return {
    name: 'vite-plugin-markdown-data',
    
    configResolved(resolvedConfig) {
      config = resolvedConfig
      root = resolvedConfig.root
    },
    
    async buildStart() {
      const fullContentDir = resolve(root, contentDir)
      const fullOutputFile = resolve(root, outputFile)
      
      // Ensure output directory exists
      const outputDir = resolve(fullOutputFile, '..')
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true })
      }
      
      // Process markdown files (no config needed - convention over configuration)
      const data = processMarkdownFiles(fullContentDir)
      
      // Write output file
      writeFileSync(fullOutputFile, JSON.stringify(data, null, 2), 'utf-8')
      
      console.log(`✓ Processed ${data.categories.length} categories from Markdown files`)
    },
    
    configureServer(server) {
      // Watch the entire content directory for changes (including directory renames)
      const contentPath = resolve(root, contentDir)
      const fullOutputFile = resolve(root, outputFile)
      
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
          
          // Reprocess all markdown files
          const data = processMarkdownFiles(contentPath)
          writeFileSync(fullOutputFile, JSON.stringify(data, null, 2), 'utf-8')
          
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
      // Watch for markdown file changes in content directory
      const contentPath = resolve(root, contentDir)
      const filePath = resolve(root, file)
      
      // Handle markdown file changes (this is faster for file edits)
      if (filePath.startsWith(contentPath) && file.endsWith('.md')) {
        // Reprocess all markdown files
        const fullContentDir = resolve(root, contentDir)
        const fullOutputFile = resolve(root, outputFile)
        const data = processMarkdownFiles(fullContentDir)
        writeFileSync(fullOutputFile, JSON.stringify(data, null, 2), 'utf-8')
        
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
