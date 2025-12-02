export const USER_ROLES = ['BUILDER', 'EXPLORER'] as const;

export type AppUserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<AppUserRole, string> = {
  BUILDER: 'Builder',
  EXPLORER: 'Explorer',
};

export const isBuilder = (role?: AppUserRole | null): boolean =>
  role === 'BUILDER';

export const canManageWorldContent = (role?: AppUserRole | null): boolean =>
  role === 'BUILDER';
