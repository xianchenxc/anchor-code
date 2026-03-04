import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'shore:study:mastery'

const MASTERY_LEVELS = {
  MASTERED: 'mastered',
  VAGUE: 'vague',
  UNKNOWN: 'unknown'
}

function safeParse(json) {
  try {
    const parsed = JSON.parse(json)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // ignore
  }
  return {}
}
// Global singleton state so that multiple hook calls share the same mastery map
let globalMasteryMap = {}
let hasLoadedFromStorage = false
const subscribers = new Set()

function loadFromStorageOnce() {
  if (hasLoadedFromStorage) return
  hasLoadedFromStorage = true
  if (typeof window === 'undefined') {
    globalMasteryMap = {}
    return
  }
  const stored = window.localStorage.getItem(STORAGE_KEY)
  globalMasteryMap = stored ? safeParse(stored) : {}
}

function persistGlobalMap() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(globalMasteryMap))
  } catch {
    // ignore persistence failures
  }
}

function updateGlobalMasteryMap(updater) {
  const next =
    typeof updater === 'function' ? updater(globalMasteryMap) : updater || {}
  globalMasteryMap = next
  persistGlobalMap()
  subscribers.forEach((cb) => cb(globalMasteryMap))
}

export function useStudyMastery() {
  // Initialize from global singleton
  const [masteryMap, setLocalMap] = useState(() => {
    loadFromStorageOnce()
    return globalMasteryMap
  })

  // Subscribe to global updates
  useEffect(() => {
    loadFromStorageOnce()
    setLocalMap(globalMasteryMap)
    const cb = (map) => setLocalMap(map)
    subscribers.add(cb)
    return () => {
      subscribers.delete(cb)
    }
  }, [])

  const getMastery = useCallback(
    (itemId) => {
      if (!itemId) return null
      return masteryMap[itemId] || null
    },
    [masteryMap]
  )

  const setMastery = useCallback((itemId, level) => {
    if (!itemId) return
    if (!level) {
      updateGlobalMasteryMap((prev) => {
        if (!prev[itemId]) return prev
        const next = { ...prev }
        delete next[itemId]
        return next
      })
      return
    }
    updateGlobalMasteryMap((prev) => {
      if (prev[itemId] === level) return prev
      return {
        ...prev,
        [itemId]: level
      }
    })
  }, [])

  const getNodeStats = useCallback(
    (nodeId, items = []) => {
      if (!nodeId || !Array.isArray(items) || items.length === 0) {
        return {
          total: 0,
          mastered: 0,
          vague: 0,
          unknown: 0
        }
      }

      let mastered = 0
      let vague = 0
      let unknown = 0

      items.forEach((item) => {
        const level = item && item.id ? masteryMap[item.id] : null
        if (!level) {
          return
        }
        if (level === MASTERY_LEVELS.MASTERED) {
          mastered += 1
          return
        }
        if (level === MASTERY_LEVELS.VAGUE) {
          vague += 1
          return
        }
        if (level === MASTERY_LEVELS.UNKNOWN) {
          unknown += 1
        }
      })

      return {
        total: items.length,
        mastered,
        vague,
        unknown
      }
    },
    [masteryMap]
  )

  return {
    masteryMap,
    masteryLevels: MASTERY_LEVELS,
    getMastery,
    setMastery,
    getNodeStats
  }
}

