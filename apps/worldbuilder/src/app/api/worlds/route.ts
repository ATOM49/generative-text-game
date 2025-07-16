import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const worlds = await prisma.world.findMany();
  return NextResponse.json(worlds);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const world = await prisma.world.create({ data });
  return NextResponse.json(world);
}
