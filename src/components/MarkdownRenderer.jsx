import ReactMarkdown from 'react-markdown'
// Use PrismLight instead of Prism to reduce bundle size by only including needed languages
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import oneLight from 'react-syntax-highlighter/dist/esm/styles/prism/one-light'
// Only import the languages we actually use to reduce bundle size
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'

// Register only the languages we need
SyntaxHighlighter.registerLanguage('javascript', javascript)

/**
 * Default components for markdown rendering
 * Provides consistent styling across the application
 * 
 * Colors can be customized via CSS variables:
 * - --markdown-code-bg: Code block background (default: #f9fafb)
 * - --markdown-inline-code-bg: Inline code background (default: #f3f4f6)
 * - --markdown-inline-code-text: Inline code text color (default: #1f2937)
 * - --markdown-text: Main text color (default: #374151)
 * - --markdown-heading: Heading text color (default: #111827)
 */
const defaultComponents = {
  p: ({ node, ...props }) => <p className="mb-3 sm:mb-4" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-4 sm:pl-6 mb-3 sm:mb-4" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-4 sm:pl-6 mb-3 sm:mb-4" {...props} />,
  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
  strong: ({ node, children, ...props }) => (
    <strong className="font-semibold" style={{ color: 'var(--markdown-heading, #111827)' }} {...props}>
      {children}
    </strong>
  ),
  pre: ({ node, children, ...props }) => {
    // Pre tag is used as wrapper by SyntaxHighlighter, return children directly
    return <>{children}</>
  },
  code: ({ node, inline, className: codeClassName, children, ...props }) => {
    // Check if this is a code block:
    // 1. inline === false (react-markdown standard)
    // 2. className contains 'language-' (code block with language identifier)
    const match = /language-(\w+)/.exec(codeClassName || '')
    const isCodeBlock = inline === false || (match && match[1])
    
    if (isCodeBlock) {
      const language = match ? match[1] : ''
      
      return (
        <SyntaxHighlighter
          style={oneLight}
          language={language}
          PreTag="div"
          className="rounded overflow-x-auto mb-3 sm:mb-4 text-xs sm:text-sm"
          customStyle={{
            margin: 0,
            padding: '0.75rem 1rem',
            lineHeight: '1.5',
          }}
          {...props}
        >
          {children}
        </SyntaxHighlighter>
      )
    }
    // Inline code
    return (
      <code 
        className={`px-1 sm:px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono inline ${codeClassName || ''}`}
        style={{
          backgroundColor: 'var(--markdown-inline-code-bg, #f3f4f6)',
          color: 'var(--markdown-inline-code-text, #1f2937)',
          ...props.style
        }}
        {...props}
      >
        {children}
      </code>
    )
  },
  h1: ({ node, ...props }) => (
    <h1 
      className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 mt-4 sm:mt-6" 
      style={{ color: 'var(--markdown-heading, #111827)' }}
      {...props} 
    />
  ),
  h2: ({ node, ...props }) => (
    <h2 
      className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 mt-3 sm:mt-5" 
      style={{ color: 'var(--markdown-heading, #111827)' }}
      {...props} 
    />
  ),
  h3: ({ node, ...props }) => (
    <h3 
      className="text-base sm:text-lg font-semibold mb-2 mt-3 sm:mt-4" 
      style={{ color: 'var(--markdown-heading, #111827)' }}
      {...props} 
    />
  ),
}

/**
 * Reusable Markdown renderer component with consistent styling
 * 
 * @param {Object} props
 * @param {string} props.content - Markdown content to render
 * @param {Object} props.components - Custom components to override defaults (optional)
 * @param {string} props.className - Additional CSS classes for wrapper
 * @param {Object} props.style - Additional inline styles (can include CSS variables)
 * 
 * @example
 * // Default usage
 * <MarkdownRenderer content={markdown} />
 * 
 * @example
 * // Customize colors via CSS variables
 * <MarkdownRenderer 
 *   content={markdown} 
 *   style={{
 *     '--markdown-code-bg': '#f0f0f0',
 *     '--markdown-inline-code-bg': '#e0e0e0'
 *   }}
 * />
 */
export { defaultComponents }
export default function MarkdownRenderer({ 
  content, 
  components = {}, 
  className = '',
  style = {}
}) {
  // Merge custom components with default components
  // Custom components override defaults
  const mergedComponents = { ...defaultComponents, ...components }

  return (
    <div 
      className={`leading-relaxed text-xs sm:text-sm prose prose-sm max-w-none ${className}`}
      style={{
        color: 'var(--markdown-text, #374151)',
        ...style
      }}
    >
      <ReactMarkdown components={mergedComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
