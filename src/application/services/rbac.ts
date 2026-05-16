export const PERMISSIONS = [
  'users.read',
  'users.manage',
  'roles.manage',
  'permissions.manage',
  'campaigns.read',
  'campaigns.manage',
  'pools.read',
  'pools.manage',
  'funnels.read',
  'funnels.manage',
  'stages.manage',
  'conversations.read.all',
  'conversations.read.assigned',
  'conversations.assign',
  'conversations.transfer',
  'conversations.close',
  'channels.manage',
  'templates.manage',
  'settings.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ALL_PERMISSIONS: Permission[] = [...PERMISSIONS];

export interface WithPermissions {
  permissions: Permission[];
}

export function can(user: WithPermissions | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function canAny(user: WithPermissions | null | undefined, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.some((p) => user.permissions.includes(p));
}

export function canAll(user: WithPermissions | null | undefined, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.every((p) => user.permissions.includes(p));
}
