import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const region = await prisma.region.findUnique({ where: { id: params.id } });
  if (!region)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(region);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const data = await req.json();
  const updated = await prisma.region.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await prisma.region.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
