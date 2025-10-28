"use client"

import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'

interface PageProgressBarProps {
  isVisible: boolean
  progress?: number
  message?: string
  onCancel?: () => void
  canCancel?: boolean
}

export function PageProgressBar({ 
  isVisible, 
  progress = 0, 
  message,
  onCancel,
  canCancel = false 
}: PageProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    if (isVisible && progress !== animatedProgress) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress)
      }, 150)
      return () => clearTimeout(timer)
    } else if (!isVisible) {
      setAnimatedProgress(0)
    }
  }, [isVisible, progress, animatedProgress])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl border-b border-slate-200/80">
      <div className="relative">
        {/* Professional progress bar */}
        <div className="h-0.5 bg-slate-100">
          <div 
            className="h-full bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 transition-all duration-1000 ease-out"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
        
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              {/* Minimal professional spinner */}
              <div className="relative">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
              </div>
              
              <div className="flex flex-col">
                <p className="text-sm font-medium text-slate-900">
                  {message || 'Processing...'}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {Math.round(animatedProgress)}% complete
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm font-mono text-slate-600 tabular-nums">
                {Math.round(animatedProgress)}%
              </div>
              
              {canCancel && onCancel && (
                <button
                  onClick={onCancel}
                  className="p-1.5 hover:bg-slate-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
                  aria-label="Cancel"
                >
                  <X size={14} className="text-slate-500 hover:text-slate-700" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}