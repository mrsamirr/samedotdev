import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs'

export async function GET() {
	try {
	const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const userId = session.user.id;
	const groups = await prisma.designGroup.findMany({ 
		where: { userId }, 
		orderBy: { createdAt: 'asc' },
		include: {
			_count: {
				select: { designs: true }
			}
		}
	})
	return NextResponse.json({ groups })
	} catch (error) {
		console.error('GET /api/groups error', error)
		return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
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
		
		if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
			return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
		}
		
		const group = await prisma.designGroup.create({ data: { name: body.name.trim(), userId } })
		return NextResponse.json({ group }, { status: 201 })
	} catch (error) {
		console.error('POST /api/groups error', error)
		return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
	}
} 