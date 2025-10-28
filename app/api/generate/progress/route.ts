import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Simple in-memory progress tracking
const progressMap = new Map<string, number>()

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('sessionId')
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }
  
  const progress = progressMap.get(sessionId) || 0
  
  return NextResponse.json({ progress })
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, progress } = await request.json()
    
    if (!sessionId || progress === undefined) {
      return NextResponse.json({ error: 'Missing sessionId or progress' }, { status: 400 })
    }
    
    progressMap.set(sessionId, progress)
    
    // Clean up completed sessions
    if (progress >= 100) {
      setTimeout(() => {
        progressMap.delete(sessionId)
      }, 5000)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}