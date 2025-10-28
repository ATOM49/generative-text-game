import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const worldmap = await prisma.worldMap.findUnique({
    where: { id: params.id },
  });
  if (!worldmap)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(worldmap);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const data = await req.json();
  const updated = await prisma.worldMap.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await prisma.worldMap.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
