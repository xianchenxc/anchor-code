/**
 * Markdown renderer using Streamdown
 * Optimized for streaming AI content with graceful handling of incomplete Markdown chunks
 * 
 * Features:
 * - Code syntax highlighting with copy button (100+ languages via Shiki)
 * - Math formula support (LaTeX via KaTeX)
 * - GitHub Flavored Markdown (tables, task lists, strikethrough)
 * - Security hardening for untrusted content
 * - Memoized rendering for better performance
 */

import { Streamdown } from 'streamdown'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'

/**
 * Streamdown-based Markdown renderer
 * 
 * @param {Object} props
 * @param {string} props.content - Markdown content to render
 * @param {boolean} props.isStreaming - Whether content is currently streaming (optional)
 * @param {string} props.className - Additional CSS classes for wrapper
 * @param {Object} props.style - Additional inline styles
 */
export default function MarkdownRenderer({ 
  content, 
  isStreaming = false,
  className = '',
  style = {}
}) {
  return (
    <div 
      className={`leading-relaxed text-xs sm:text-sm prose prose-sm max-w-none ${className}`}
      style={{
        color: 'var(--markdown-text, #374151)',
        ...style
      }}
    >
      <Streamdown
        plugins={{
          code,  // Code syntax highlighting with copy button (supports 100+ languages)
          math,  // Math formula support (LaTeX)
        }}
        isAnimating={isStreaming}
      >
        {content}
      </Streamdown>
    </div>
  )
}
