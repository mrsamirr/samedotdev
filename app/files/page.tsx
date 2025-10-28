"use client"

import { useEffect, useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar,
  Eye,
  Share2,
  Download,
  Trash2,
  Copy,
  Edit3
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Design {
  id: string
  name: string
  html: string
  css: string
  prompt: string
  createdAt: string
  updatedAt: string
  useCase: string
  screenType: string
  group?: {
    id: string
    name: string
  }
}

interface Group {
  id: string
  name: string
  description?: string
  createdAt: string
  _count: {
    designs: number
  }
}

export default function FilesPage() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'created'>('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [selectedGroup])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch groups
      const groupsRes = await fetch('/api/groups')
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setGroups(groupsData.groups || [])
      }

      // Fetch designs
      const designsQuery = selectedGroup !== 'all' ? `?group=${selectedGroup}` : ''
      const designsRes = await fetch(`/api/designs${designsQuery}`)
      if (designsRes.ok) {
        const designsData = await designsRes.json()
        setDesigns(designsData.designs || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewGroup = async () => {
    const name = prompt('Enter group name:')?.trim()
    if (!name) return

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      if (res.ok) {
        const data = await res.json()
        setGroups(prev => [...prev, data.group])
        setSelectedGroup(data.group.id)
      }
    } catch (error) {
      console.error('Failed to create group:', error)
    }
  }

  const deleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return

    try {
      const res = await fetch(`/api/designs/${designId}`, { method: 'DELETE' })
      if (res.ok) {
        setDesigns(prev => prev.filter(d => d.id !== designId))
      }
    } catch (error) {
      console.error('Failed to delete design:', error)
    }
  }

  const shareDesign = async (design: Design) => {
    try {
      const response = await fetch(`/api/designs/${design.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        await navigator.clipboard.writeText(data.shareUrl)
        alert('Share link copied to clipboard!')
      }
    } catch (error) {
      console.error('Failed to share design:', error)
      alert('Failed to generate share link')
    }
  }

  const filteredDesigns = designs
    .filter(design => 
      design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      design.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">UX</span>
                </div>
                <span className="text-xl font-bold text-gray-900">UX PILOT</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/files" className="text-blue-600 font-medium">Files</Link>
                <Link href="/" className="text-gray-600 hover:text-gray-900">Designer</Link>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                New Design File
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Files</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Order by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'created')}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="recent">Most recent</option>
                <option value="name">Name</option>
                <option value="created">Date created</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Groups</h3>
                <button
                  onClick={createNewGroup}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedGroup('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedGroup === 'all' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>All Designs</span>
                    <span className="text-xs text-gray-500">{designs.length}</span>
                  </div>
                </button>
                
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedGroup === group.id 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{group.name}</span>
                      <span className="text-xs text-gray-500">{group._count?.designs || 0}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredDesigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No designs found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? 'Try adjusting your search terms' : 'Create your first design to get started'}
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Design
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDesigns.map(design => (
                  <DesignCard
                    key={design.id}
                    design={design}
                    onDelete={deleteDesign}
                    onShare={shareDesign}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface DesignCardProps {
  design: Design
  onDelete: (id: string) => void
  onShare: (design: Design) => void
}

function DesignCard({ design, onDelete, onShare }: DesignCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow group">
      {/* Preview */}
      <div 
        className="h-32 bg-gray-50 rounded-t-lg overflow-hidden cursor-pointer relative"
        onClick={() => router.push(`/preview/${design.id}`)}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <iframe
            srcDoc={design.html}
            className="w-full h-full border-0 pointer-events-none transform scale-50 origin-top-left"
            style={{ width: '200%', height: '200%' }}
            sandbox=""
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/preview/${design.id}`)
              }}
              className="px-2 py-1 bg-white/90 text-gray-700 rounded text-xs hover:bg-white transition-colors flex items-center gap-1"
            >
              <Eye size={12} />
              Preview
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShare(design)
              }}
              className="px-2 py-1 bg-white/90 text-gray-700 rounded text-xs hover:bg-white transition-colors flex items-center gap-1"
            >
              <Share2 size={12} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate flex-1">
            {design.name || 'Untitled Design'}
          </h3>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreHorizontal size={16} />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                  <button
                    onClick={() => {
                      router.push(`/preview/${design.id}`)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <Eye size={14} />
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      onShare(design)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <Share2 size={14} />
                    Share
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(design.html)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <Copy size={14} />
                    Copy HTML
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      onDelete(design.id)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {design.prompt}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>Edited {formatDate(design.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
              {design.useCase}
            </span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
              {design.screenType}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}