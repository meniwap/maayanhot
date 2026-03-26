import type { UserRole } from '@maayanhot/contracts';

import type { UserProfile } from './entities';

type RoleCarrier = UserRole | Pick<UserProfile, 'primaryRole' | 'roleSet'>;

const resolveRoles = (actor: RoleCarrier): UserRole[] => {
  if (typeof actor === 'string') {
    return [actor];
  }

  return actor.roleSet.length > 0 ? actor.roleSet : [actor.primaryRole];
};

const hasAnyRole = (actor: RoleCarrier, allowedRoles: UserRole[]) => {
  const roleSet = new Set(resolveRoles(actor));

  return allowedRoles.some((role) => roleSet.has(role));
};

export const canCreateSpring = (actor: RoleCarrier) => hasAnyRole(actor, ['admin']);

export const canModerateReports = (actor: RoleCarrier) => hasAnyRole(actor, ['moderator', 'admin']);
