import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const worldId = searchParams.get('worldId');
  if (worldId) {
    // Fetch the first worldmap for the given worldId
    const worldmap = await prisma.worldMap.findFirst({ where: { worldId } });
    if (!worldmap) return NextResponse.json([], { status: 200 });
    return NextResponse.json([worldmap]);
  }
  // If no worldId, return all worldmaps
  const worldmaps = await prisma.worldMap.findMany();
  return NextResponse.json(worldmaps);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const created = await prisma.worldMap.create({ data });
  return NextResponse.json(created);
}
