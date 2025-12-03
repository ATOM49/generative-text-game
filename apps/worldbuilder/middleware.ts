import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_ROUTES = ['/signin', '/api/auth', '/api/user/role'];
const ROLE_SELECTION_ROUTE = '/choose-role';

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const isPublic = PUBLIC_ROUTES.some((path) =>
    nextUrl.pathname.startsWith(path),
  );
  const isRoleSelectionRoute =
    nextUrl.pathname.startsWith(ROLE_SELECTION_ROUTE);
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

  if (token && !token.role && !isPublic && !isRoleSelectionRoute) {
    if (nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json(
        {
          error: 'Please select a role to continue',
          redirectTo: '/choose-role',
        },
        { status: 403 },
      );
    }

    const selectRoleUrl = new URL(ROLE_SELECTION_ROUTE, nextUrl);
    selectRoleUrl.searchParams.set('callbackUrl', nextUrl.href);
    return NextResponse.redirect(selectRoleUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
