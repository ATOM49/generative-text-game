import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const world = await prisma.world.findUnique({ where: { id: params.id } });
  if (!world) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(world);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const world = await prisma.world.update({ where: { id: params.id }, data });
  return NextResponse.json(world);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.world.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
