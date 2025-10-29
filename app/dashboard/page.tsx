"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  TrendingUp, 
  Users, 
  FileText, 
  Calendar,
  Eye,
  Share2,
  Download,
  BarChart3,
  Activity
} from 'lucide-react'
import SubscriptionStatus from '@/components/SubscriptionStatus'

interface DashboardStats {
  totalDesigns: number
  totalGroups: number
  creditsUsed: number
  creditsTotal: number
  recentActivity: Array<{
    id: string
    type: 'design_created' | 'design_shared' | 'design_downloaded'
    description: string
    createdAt: string
  }>
}

interface RecentDesign {
  id: string
  name: string
  html: string
  prompt: string
  createdAt: string
  useCase: string
  screenType: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentDesigns, setRecentDesigns] = useState<RecentDesign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const controller = new AbortController()
      const { signal } = controller

      const [statsRes, designsRes, groupsRes] = await Promise.all([
        fetch('/api/user/subscription-status', { signal }),
        fetch('/api/designs?limit=6', { signal }),
        fetch('/api/groups', { signal })
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats({
          totalDesigns: 0,
          totalGroups: 0,
          creditsUsed: data.user.creditsUsed,
          creditsTotal: data.user.creditsTotal,
          recentActivity: data.recentActivity || []
        })
      }

      if (designsRes.ok) {
        const designsData = await designsRes.json()
        setRecentDesigns(designsData.designs || [])
        setStats(prev => prev ? {
          ...prev,
          totalDesigns: designsData.designs?.length || 0
        } : null)
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setStats(prev => prev ? {
          ...prev,
          totalGroups: groupsData.groups?.length || 0
        } : null)
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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
                <span className="text-xl font-bold text-gray-900">same dev</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/files" className="text-gray-600 hover:text-gray-900">Files</Link>
                <Link href="/" className="text-gray-600 hover:text-gray-900">Designer</Link>
                <Link href="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                New Design
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your design activity and subscription</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Loading skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Designs</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalDesigns}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-blue-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Design Groups</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalGroups}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="text-green-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Credits Used</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.creditsUsed}</p>
                      <p className="text-sm text-gray-500">of {stats.creditsTotal}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-purple-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Credits Remaining</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.creditsTotal - stats.creditsUsed}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-orange-600" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Recent Designs */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Recent Designs</h2>
                      <Link 
                        href="/files"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View all
                      </Link>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {recentDesigns.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No designs yet</h3>
                        <p className="text-gray-600 mb-4">Create your first design to get started</p>
                        <Link
                          href="/"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus size={16} />
                          Create Design
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentDesigns.map(design => (
                          <div key={design.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              <iframe
                                srcDoc={design.html}
                                className="w-full h-full border-0 pointer-events-none transform scale-50 origin-top-left"
                                style={{ width: '200%', height: '200%' }}
                                sandbox=""
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">
                                {design.name || 'Untitled Design'}
                              </h3>
                              <p className="text-sm text-gray-600 truncate">
                                {design.prompt}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                  {design.useCase}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(design.createdAt)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/preview/${design.id}`}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <Eye size={16} />
                              </Link>
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/designs/${design.id}/share`, {
                                      method: 'POST'
                                    })
                                    if (response.ok) {
                                      const data = await response.json()
                                      await navigator.clipboard.writeText(data.shareUrl)
                                      alert('Share link copied!')
                                    }
                                  } catch (error) {
                                    console.error('Share failed:', error)
                                  }
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <Share2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription Status */}
              <div className="lg:col-span-1">
                <SubscriptionStatus />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}