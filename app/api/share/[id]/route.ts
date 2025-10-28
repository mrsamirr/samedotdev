import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const id = segments[segments.length - 1]

    if (!id) {
      return NextResponse.json({ error: 'Missing design ID' }, { status: 400 })
    }

    // Fetch the design with user info (no auth required for sharing)
    const design = await prisma.design.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }

    // Return the design data for public sharing
    return NextResponse.json({
      design: {
        id: design.id,
        name: design.name,
        html: design.html,
        css: design.css,
        prompt: design.prompt,
        createdAt: design.createdAt,
        updatedAt: design.updatedAt,
        useCase: design.useCase,
        screenType: design.screenType,
        user: design.user
      }
    })

  } catch (error) {
    console.error('GET /api/share/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shared design' },
      { status: 500 }
    )
  }
}