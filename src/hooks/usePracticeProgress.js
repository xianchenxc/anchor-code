import { useState, useEffect } from 'react'

const STORAGE_KEY = 'practice-mode-progress'

/**
 * Custom hook for managing practice mode progress persistence
 * Saves and restores the current question index in localStorage
 * 
 * @param {Array} totalItems - Array of all practice items
 * @returns {[number, Function]} - [currentIndex, setCurrentIndex]
 */
export function usePracticeProgress(totalItems) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Restore progress on mount
  useEffect(() => {
    if (totalItems.length === 0) return

    try {
      const savedProgress = localStorage.getItem(STORAGE_KEY)
      if (savedProgress !== null) {
        const savedIndex = parseInt(savedProgress, 10)
        if (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < totalItems.length) {
          setCurrentIndex(savedIndex)
        }
      }
    } catch (error) {
      console.error('Failed to restore practice progress:', error)
    }
  }, [totalItems.length])

  // Save progress when index changes
  useEffect(() => {
    if (totalItems.length > 0 && currentIndex >= 0 && currentIndex < totalItems.length) {
      try {
        localStorage.setItem(STORAGE_KEY, currentIndex.toString())
      } catch (error) {
        console.error('Failed to save practice progress:', error)
      }
    }
  }, [currentIndex, totalItems.length])

  return [currentIndex, setCurrentIndex]
}
