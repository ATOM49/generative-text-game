import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  console.error(error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation error', details: error.issues },
      { status: 400 },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          { error: 'A unique constraint would be violated.' },
          { status: 409 },
        );
      case 'P2025':
        return NextResponse.json(
          { error: 'Record not found.' },
          { status: 404 },
        );
      default:
        return NextResponse.json(
          { error: 'Database error occurred.' },
          { status: 500 },
        );
    }
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
