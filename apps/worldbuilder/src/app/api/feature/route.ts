import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const features = await prisma.feature.findMany();
  return NextResponse.json(features);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const created = await prisma.feature.create({ data });
  return NextResponse.json(created);
}
