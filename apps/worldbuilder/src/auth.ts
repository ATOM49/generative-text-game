import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { AppUserRole } from '@/lib/auth/roles';

const DEFAULT_ROLE: AppUserRole = 'EXPLORER';

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
    async jwt({ token, user }) {
      if (user) {
        token.role = (user.role as AppUserRole) ?? DEFAULT_ROLE;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = (token.role as AppUserRole) ?? DEFAULT_ROLE;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
