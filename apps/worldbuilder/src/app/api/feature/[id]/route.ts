import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const feature = await prisma.feature.findUnique({ where: { id: params.id } });
  if (!feature)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(feature);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const data = await req.json();
  const updated = await prisma.feature.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await prisma.feature.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
