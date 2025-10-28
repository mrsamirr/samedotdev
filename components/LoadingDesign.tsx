"use client"
import { useEffect, useState } from 'react'

interface LoadingDesignProps {
  prompt: string
  progress?: number
  stage?: string
  onCancel?: () => void
  canCancel?: boolean
}

export function LoadingDesign({ 
  prompt, 
  progress, 
  stage = "Processing",
  onCancel,
  canCancel = false 
}: LoadingDesignProps) {
  const [dots, setDots] = useState("")
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".")
    }, 600)
    return () => clearInterval(interval)
  }, [])

  const truncatedPrompt = prompt.length > 100 ? `${prompt.substring(0, 100)}...` : prompt

  return (
    <div className="flex items-center justify-center min-h-[320px] bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="text-center max-w-lg mx-auto px-8">
        {/* Professional minimal spinner */}
        <div className="relative mb-8">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" />
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">
              {stage}{dots}
            </h3>
            
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {truncatedPrompt}
            </p>
          </div>
          
          {progress !== undefined && (
            <div className="space-y-3">
              <div className="w-80 max-w-full mx-auto">
                <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-slate-900 h-1.5 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <p className="text-sm font-mono text-slate-500 tabular-nums">
                {Math.round(progress)}%
              </p>
            </div>
          )}
          
          {canCancel && onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus:underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}