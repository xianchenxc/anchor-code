import { useState, useEffect } from 'react'

const THEME_STORAGE_KEY = 'shore-theme'

function getInitialDark() {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Theme hook: syncs isDark with html class and localStorage.
 * @returns {{ isDark: boolean, toggleTheme: () => void }}
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const dark = getInitialDark()
    document.documentElement.classList.toggle('dark', dark)
    return dark
  })

  useEffect(() => {
    const html = document.documentElement
    if (isDark) html.classList.add('dark')
    else html.classList.remove('dark')
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => setIsDark((prev) => !prev)

  return { isDark, toggleTheme }
}
