import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const rivers = await prisma.river.findMany();
  return NextResponse.json(rivers);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const created = await prisma.river.create({ data });
  return NextResponse.json(created);
}
