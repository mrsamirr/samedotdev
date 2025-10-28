import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const id = segments[segments.length - 2] // Get ID from /designs/[id]/share

    if (!id) {
      return NextResponse.json({ error: 'Missing design ID' }, { status: 400 })
    }

    // Verify the design belongs to the user
    const design = await prisma.design.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }

    // Generate a shareable URL with the design ID
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/share/${id}`

    return NextResponse.json({
      shareUrl,
      designId: id,
      message: 'Share URL generated successfully'
    })

  } catch (error) {
    console.error('POST /api/designs/[id]/share error:', error)
    return NextResponse.json(
      { error: 'Failed to generate share URL' },
      { status: 500 }
    )
  }
}