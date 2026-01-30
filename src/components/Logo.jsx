/**
 * Shore logo: pure icon (shore line + path reaching it).
 * Uses currentColor for light/dark mode.
 */
export function LogoIcon({ className = '', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M4 12h16" />
      <path d="M8 20L12 12l4-8" />
    </svg>
  )
}

/**
 * Shore logo: icon + wordmark "Shore".
 * Uses currentColor for light/dark mode.
 *
 * @param {'solid'|'outline'} variant - Wordmark style: solid fill or outline stroke
 */
export function LogoFull({ className = '', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 72 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      {/* Icon: shore mark, scaled ~70% so wordmark is optically balanced */}
      <g transform="scale(0.7) translate(0, 3.6)">
        <path d="M4 12h16" />
        <path d="M8 20L12 12l4-8" />
      </g>
      {/* Wordmark: Shore – slightly larger than icon cap height for better ratio */}
      <text
        x={19}
        y={16}
        fontSize={12}
        fontWeight={600}
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      >
        Shore
      </text>
    </svg>
  )
}
