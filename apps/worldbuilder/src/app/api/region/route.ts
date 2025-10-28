import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const regions = await prisma.region.findMany();
  return NextResponse.json(regions);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const created = await prisma.region.create({ data });
  return NextResponse.json(created);
}
