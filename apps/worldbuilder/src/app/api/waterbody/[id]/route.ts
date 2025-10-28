import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const waterbody = await prisma.waterBody.findUnique({
    where: { id: params.id },
  });
  if (!waterbody)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(waterbody);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const data = await req.json();
  const updated = await prisma.waterBody.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await prisma.waterBody.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
