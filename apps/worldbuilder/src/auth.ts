import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { AppUserRole } from '@/lib/auth/roles';

const ensureEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required auth environment variable: ${key}`);
  }
  return value;
};

const googleProvider = Google({
  clientId: ensureEnv('GOOGLE_CLIENT_ID'),
  clientSecret: ensureEnv('GOOGLE_CLIENT_SECRET'),
});

const facebookProvider = Facebook({
  clientId: ensureEnv('FACEBOOK_CLIENT_ID'),
  clientSecret: ensureEnv('FACEBOOK_CLIENT_SECRET'),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  trustHost: true,
  providers: [googleProvider, facebookProvider],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user.role as AppUserRole | undefined) ?? undefined;
        return token;
      }

      // Always fetch latest role on update trigger or when role is missing
      if ((trigger === 'update' || !token.role) && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.role = (dbUser?.role as AppUserRole | undefined) ?? undefined;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role as AppUserRole | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
