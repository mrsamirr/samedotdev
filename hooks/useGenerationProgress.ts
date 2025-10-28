"use client"

import { useState, useEffect, useCallback } from 'react'

interface GenerationProgress {
  sessionId: string
  progress: number
  message: string
  isActive: boolean
}

export function useGenerationProgress() {
  const [activeGenerations, setActiveGenerations] = useState<Map<string, GenerationProgress>>(new Map())

  const startGeneration = useCallback((sessionId: string, message: string = 'Generating design...') => {
    setActiveGenerations(prev => new Map(prev.set(sessionId, {
      sessionId,
      progress: 0,
      message,
      isActive: true
    })))
  }, [])

  const updateProgress = useCallback((sessionId: string, progress: number, message?: string) => {
    setActiveGenerations(prev => {
      const current = prev.get(sessionId)
      if (!current) return prev
      
      const updated = new Map(prev)
      updated.set(sessionId, {
        ...current,
        progress: Math.min(100, Math.max(0, progress)),
        message: message || current.message
      })
      return updated
    })
  }, [])

  const completeGeneration = useCallback((sessionId: string) => {
    setActiveGenerations(prev => {
      const updated = new Map(prev)
      const current = updated.get(sessionId)
      if (current) {
        updated.set(sessionId, { ...current, progress: 100, isActive: false })
        // Remove after animation
        setTimeout(() => {
          setActiveGenerations(latest => {
            const final = new Map(latest)
            final.delete(sessionId)
            return final
          })
        }, 1000)
      }
      return updated
    })
  }, [])

  const cancelGeneration = useCallback((sessionId: string) => {
    setActiveGenerations(prev => {
      const updated = new Map(prev)
      updated.delete(sessionId)
      return updated
    })
  }, [])

  // Simulate progress for better UX
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGenerations(prev => {
        let hasChanges = false
        const updated = new Map()
        
        prev.forEach((generation, sessionId) => {
          if (generation.isActive && generation.progress < 90) {
            // Simulate gradual progress
            const increment = Math.random() * 5 + 1
            const newProgress = Math.min(90, generation.progress + increment)
            updated.set(sessionId, { ...generation, progress: newProgress })
            hasChanges = true
          } else {
            updated.set(sessionId, generation)
          }
        })
        
        return hasChanges ? updated : prev
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const hasActiveGenerations = activeGenerations.size > 0
  const totalProgress = Array.from(activeGenerations.values()).reduce((sum, gen) => sum + gen.progress, 0) / Math.max(1, activeGenerations.size)
  const currentMessage = Array.from(activeGenerations.values())[0]?.message || 'Generating...'

  return {
    activeGenerations: Array.from(activeGenerations.values()),
    hasActiveGenerations,
    totalProgress,
    currentMessage,
    startGeneration,
    updateProgress,
    completeGeneration,
    cancelGeneration
  }
}