import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const waterbodies = await prisma.waterBody.findMany();
  return NextResponse.json(waterbodies);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const created = await prisma.waterBody.create({ data });
  return NextResponse.json(created);
}
