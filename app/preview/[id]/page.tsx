"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Code2, Download, ExternalLink, Maximize2, Minimize2 } from 'lucide-react'
import Link from 'next/link'

interface PreviewDesign {
  id: string
  name: string
  html: string
  css: string
  prompt: string
  createdAt: string
  updatedAt: string
  useCase: string
  screenType: string
}

export default function PreviewPage() {
  const params = useParams()
  const id = params?.id as string
  const [design, setDesign] = useState<PreviewDesign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchDesign = async () => {
      try {
        const response = await fetch(`/api/designs/${id}`)
        if (response.ok) {
          const data = await response.json()
          setDesign(data.design)
        } else if (response.status === 404) {
          setError('Design not found')
        } else {
          setError('Failed to load design')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchDesign()
  }, [id])

  const downloadHtml = () => {
    if (!design) return
    
    const fullHtml = design.html.startsWith('<!DOCTYPE') || /<\s*html[\s>]/i.test(design.html)
      ? design.html
      : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${design.name || 'Design Preview'}</title>
  <style>${design.css || ''}</style>
</head>
<body>
${design.html}
</body>
</html>`

    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${design.name || design.id}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openInNewTab = () => {
    if (!design) return
    
    const fullHtml = design.html.startsWith('<!DOCTYPE') || /<\s*html[\s>]/i.test(design.html)
      ? design.html
      : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${design.name || 'Design Preview'}</title>
  <style>${design.css || ''}</style>
</head>
<body>
${design.html}
</body>
</html>`

    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading design preview...</p>
        </div>
      </div>
    )
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Design Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This design may have been removed.'}</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <ArrowLeft size={16} />
            Back to Designer
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      {!isFullscreen && (
        <div className="bg-white/80 backdrop-blur-xl border-b border-white/30 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="p-2 hover:bg-white/60 rounded-xl transition-all"
                >
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {design.name || 'Design Preview'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {design.useCase} • {design.screenType} • {new Date(design.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="px-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium hover:bg-white/90 flex items-center gap-2"
                >
                  <Code2 size={16} />
                  {showCode ? 'Hide Code' : 'View Code'}
                </button>
                <button
                  onClick={downloadHtml}
                  className="px-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium hover:bg-white/90 flex items-center gap-2"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={openInNewTab}
                  className="px-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium hover:bg-white/90 flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  Open
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium flex items-center gap-2"
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen controls */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-3 bg-black/20 backdrop-blur-sm text-white rounded-xl hover:bg-black/30 transition-all"
          >
            <Minimize2 size={20} />
          </button>
        </div>
      )}

      <div className={`${isFullscreen ? 'h-full' : 'max-w-7xl mx-auto p-6'}`}>
        <div className={`${isFullscreen ? 'h-full' : showCode ? 'grid lg:grid-cols-2 gap-6' : ''}`}>
          {/* Design Preview */}
          <div className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden ${isFullscreen ? 'h-full' : ''}`}>
            {!isFullscreen && (
              <div className="p-4 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-white/80">
                <h2 className="font-semibold text-gray-900">Live Preview</h2>
                <p className="text-sm text-gray-600">{design.prompt}</p>
              </div>
            )}
            <div className={`${isFullscreen ? 'h-full' : 'p-6'}`}>
              <div 
                className={`${isFullscreen ? 'h-full w-full' : 'border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm min-h-[500px]'}`}
              >
                <iframe
                  srcDoc={design.html.startsWith('<!DOCTYPE') || /<\s*html[\s>]/i.test(design.html)
                    ? design.html
                    : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body { 
      margin: 0; 
      padding: 20px; 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
    }
    ${design.css || ''}
  </style>
</head>
<body>
${design.html}
</body>
</html>`}
                  className="w-full h-full border-0"
                  title="Design Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          </div>

          {showCode && !isFullscreen && (
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden">
              <div className="p-4 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-white/80">
                <h2 className="font-semibold text-gray-900">Source Code</h2>
              </div>
              <div className="p-4 max-h-[600px] overflow-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">HTML</h3>
                    <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto">
                      <code>{design.html}</code>
                    </pre>
                  </div>
                  {design.css && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">CSS</h3>
                      <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto">
                        <code>{design.css}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}