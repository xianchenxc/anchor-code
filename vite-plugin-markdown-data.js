import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, relative, resolve } from 'path'
import matter from 'gray-matter'

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
 */
function processMarkdownFiles(contentDir, categoriesConfig) {
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
      const config = categoriesConfig[categoryId] || {}
      categories[categoryId] = {
        id: categoryId,
        name: config.name || frontmatter.category || categoryId,
        icon: config.icon || frontmatter.icon || '📁',
        children: {}
      }
    }
    
    // Initialize subcategory if not exists
    if (!categories[categoryId].children[subcategory]) {
      categories[categoryId].children[subcategory] = {
        id: `${categoryId}-${subcategory}`,
        name: frontmatter.subcategory || subcategory,
        type: frontmatter.type || 'knowledge',
        items: []
      }
    }
    
    // Process content based on type
    let processedContent = body.trim()
    let answer = ''
    let template = frontmatter.template ? frontmatter.template.trim() : ''
    let description = frontmatter.description || ''
    
    if (frontmatter.type === 'practice') {
      if (frontmatter.questionType === 'coding') {
        // For coding questions, extract code from markdown
        const codeBlocks = extractCodeBlocks(processedContent)
        if (codeBlocks.length > 0) {
          answer = codeBlocks[0] // First code block is the answer
          const remainingContent = removeCodeBlocks(processedContent).trim()
          // Use remaining content as description if description is not in frontmatter
          if (!description && remainingContent) {
            description = remainingContent
          }
        } else {
          answer = processedContent
        }
      } else {
        // For QA questions, the body is the answer
        answer = processedContent
      }
    }
    
    // Create item from markdown
    const item = {
      id: frontmatter.id || `${categoryId}-${subcategory}-${fileName}`,
      type: frontmatter.questionType || (frontmatter.type === 'practice' ? 'qa' : undefined),
      title: frontmatter.title || frontmatter.question || fileName,
      question: frontmatter.question || '',
      description: description,
      content: frontmatter.type === 'knowledge' ? processedContent : '',
      answer: answer || frontmatter.answer || '',
      template: template,
    }
    
    categories[categoryId].children[subcategory].items.push(item)
  }
  
  // Sort items by id for consistent ordering
  Object.values(categories).forEach(cat => {
    Object.values(cat.children).forEach(subcat => {
      subcat.items.sort((a, b) => a.id.localeCompare(b.id))
    })
  })
  
  // Convert to array format
  return {
    categories: Object.values(categories).map(cat => ({
      ...cat,
      children: Object.values(cat.children)
    }))
  }
}

/**
 * Vite plugin to process Markdown files at build time
 */
export default function markdownDataPlugin(options = {}) {
  const {
    contentDir = 'src/content',
    outputFile = 'src/data/questions.json',
    categoriesConfig = {}
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
      // Load categories config
      const categoriesConfigPath = resolve(root, 'src/data/categories.js')
      let categoriesConfigData = {}
      
      if (existsSync(categoriesConfigPath)) {
        try {
          // Read and parse categories config
          const categoriesConfigContent = readFileSync(categoriesConfigPath, 'utf-8')
          // Extract the object from export statement using regex
          // Match multiline object with nested structures
          const exportMatch = categoriesConfigContent.match(/export\s+(?:const|let|var)\s+categoryConfig\s*=\s*(\{[\s\S]*?\});/m)
          if (exportMatch) {
            // Safely evaluate the object literal
            categoriesConfigData = Function(`"use strict"; return (${exportMatch[1]})`)()
          }
        } catch (error) {
          console.warn('Could not load categories config:', error.message)
        }
      }
      
      const fullContentDir = resolve(root, contentDir)
      const fullOutputFile = resolve(root, outputFile)
      
      // Ensure output directory exists
      const outputDir = resolve(fullOutputFile, '..')
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true })
      }
      
      // Process markdown files
      const data = processMarkdownFiles(fullContentDir, categoriesConfigData)
      
      // Write output file
      writeFileSync(fullOutputFile, JSON.stringify(data, null, 2), 'utf-8')
      
      console.log(`✓ Processed ${data.categories.length} categories from Markdown files`)
    },
    
    handleHotUpdate({ file, server }) {
      // Watch for changes in content directory or categories config
      const contentPath = resolve(root, contentDir)
      const categoriesConfigPath = resolve(root, 'src/data/categories.js')
      const filePath = resolve(root, file)
      
      if ((filePath.startsWith(contentPath) && file.endsWith('.md')) || 
          filePath === categoriesConfigPath) {
        // Reload categories config
        let categoriesConfigData = {}
        
        if (existsSync(categoriesConfigPath)) {
          try {
            const categoriesConfigContent = readFileSync(categoriesConfigPath, 'utf-8')
            const exportMatch = categoriesConfigContent.match(/export\s+(?:const|let|var)\s+categoryConfig\s*=\s*(\{[\s\S]*?\});/m)
            if (exportMatch) {
              categoriesConfigData = Function(`"use strict"; return (${exportMatch[1]})`)()
            }
          } catch (error) {
            console.warn('Could not load categories config:', error.message)
          }
        }
        
        // Reprocess all markdown files
        const fullContentDir = resolve(root, contentDir)
        const fullOutputFile = resolve(root, outputFile)
        const data = processMarkdownFiles(fullContentDir, categoriesConfigData)
        writeFileSync(fullOutputFile, JSON.stringify(data, null, 2), 'utf-8')
        
        console.log(`✓ Updated data from ${file.endsWith('.md') ? 'Markdown' : 'categories config'} file`)
        
        // Trigger HMR
        server.ws.send({
          type: 'full-reload'
        })
        
        return []
      }
    }
  }
}
