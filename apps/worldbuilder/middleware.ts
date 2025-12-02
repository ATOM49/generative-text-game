import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_ROUTES = ['/signin', '/api/auth'];

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const isPublic = PUBLIC_ROUTES.some((path) =>
    nextUrl.pathname.startsWith(path),
  );
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token && !isPublic) {
    if (nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const signInUrl = new URL('/signin', nextUrl);
    signInUrl.searchParams.set('callbackUrl', nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
