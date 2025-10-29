import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canUserPerformAction, consumeCredits } from '@/lib/subscription'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const userId = session.user.id;
		const url = new URL(request.url)
		const groupId = url.searchParams.get('group') || undefined
		const limitParam = url.searchParams.get('limit')
		const limit = limitParam ? parseInt(limitParam, 10) : undefined
		const take = Math.min(Number.isFinite(limit as number) ? (limit as number) : 100, 200)
		
		const designs = await prisma.design.findMany({
			where: { userId, ...(groupId ? { groupId } : {}) },
			orderBy: { updatedAt: 'desc' },
			take,
			include: {
				group: {
					select: {
						id: true,
						name: true
					}
				}
			}
		})
		return NextResponse.json(
			{ designs },
			{ headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' } }
		)
	} catch (error) {
		console.error('GET /api/designs error', error)
		return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const userId = session.user.id;
		const body = await request.json()
		
		// Validate required fields
		if (!body.html || !body.prompt) {
			return NextResponse.json({ error: 'Missing required fields: html and prompt' }, { status: 400 })
		}
		
		// Check credits and plan limits before creating design
		const creditsRequired = 6
		const can = await canUserPerformAction(userId, 'create_design_file', creditsRequired)
		if (!can.allowed) {
			return NextResponse.json({ error: can.reason || 'Action not allowed', ...(can.creditsRemaining !== undefined ? { creditsRemaining: can.creditsRemaining } : {}) }, { status: 403 })
		}
		
		if (body.groupId) {
			const group = await prisma.designGroup.findFirst({ where: { id: body.groupId, userId } })
			if (!group) return NextResponse.json({ error: 'Invalid group' }, { status: 400 })
		}
		const created = await prisma.design.create({
			data: {
				name: body.name ?? '',
				tags: (body.tags ?? []) as unknown as Prisma.InputJsonValue,
				previewUrl: body.previewUrl ?? null,
				version: 1,
				html: body.html,
				css: body.css ?? '',
				elements: body.elements ?? [],
				prompt: body.prompt,
				position: body.position,
				size: body.size,
				useCase: body.useCase,
				screenType: body.screenType,
				deepDesign: body.deepDesign,
				autoflow: body.autoflow,
				userId,
				groupId: body.groupId ?? null,
				versions: {
					create: {
						version: 1,
						designJson: { html: body.html, css: body.css ?? '', elements: body.elements ?? [] } as unknown as Prisma.InputJsonValue,
					}
				}
			},
			include: { versions: true }
		})
		
		// Consume credits and record usage after successful creation
		await consumeCredits(userId, creditsRequired, 'create_design_file', created.id)
		
		return NextResponse.json({ design: created }, { status: 201 })
	} catch (error) {
		console.error('POST /api/designs error', error)
		return NextResponse.json({ error: 'Failed to create design' }, { status: 500 })
	}
} 