import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { USER_ROLES } from '@/lib/auth/roles';
import type { AppUserRole } from '@/lib/auth/roles';
import { handleApiError } from '@/lib/api/errors';

const isValidRole = (value: unknown): value is AppUserRole =>
  typeof value === 'string' && USER_ROLES.includes(value as AppUserRole);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { role } = body;

    if (!isValidRole(role)) {
      return NextResponse.json(
        { error: 'Invalid role selection' },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
    });

    return NextResponse.json({ success: true, role });
  } catch (error) {
    return handleApiError(error);
  }
}
