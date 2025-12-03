import { auth } from '@/auth';
import { ApiError } from '@/lib/api/errors';
import type { AppUserRole } from './roles';

export const BUILDER_ONLY: AppUserRole[] = ['BUILDER'];

export type AuthenticatedUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: AppUserRole;
};

export async function requireUser(allowedRoles?: AppUserRole[]) {
  const session = await auth();

  if (!session?.user) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!session.user.role) {
    throw new ApiError(403, 'Please select a role to continue');
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new ApiError(403, 'Insufficient permissions for this action');
  }

  return session.user as AuthenticatedUser;
}
