import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	try {
	const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
	const userId = session.user.id;
	const url = new URL(request.url)
	const segments = url.pathname.split('/')
	const id = segments[segments.length - 1]
		
		if (!id) {
			return NextResponse.json({ error: 'Missing group ID' }, { status: 400 })
		}
		
	const group = await prisma.designGroup.findFirst({ where: { id, userId } })
	if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
	return NextResponse.json({ group })
	} catch (error) {
		console.error('GET /api/groups/[id] error', error)
		return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest) {
	try {
	const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
	const userId = session.user.id;
	const url = new URL(request.url)
	const segments = url.pathname.split('/')
	const id = segments[segments.length - 1]
		
		if (!id) {
			return NextResponse.json({ error: 'Missing group ID' }, { status: 400 })
		}
		
		const result = await prisma.designGroup.deleteMany({ where: { id, userId } })
		if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
	return NextResponse.json({ success: true })
	} catch (error) {
		console.error('DELETE /api/groups/[id] error', error)
		return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
	}
} 