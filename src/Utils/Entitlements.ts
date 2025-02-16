import {TEntitlement} from '../BaseTypes';
import {IEntitlement} from '../Models';

export const collapseEntitlements = (entitlements: IEntitlement[]) => {
  const now = new Date();
  const activeEntitlements: Partial<Record<TEntitlement, IEntitlement>> = {};

  entitlements.forEach((entitlement) => {
    const start = new Date(entitlement.starts_at);
    const end = new Date(entitlement.ends_at);
    if (now >= start && now <= end && !activeEntitlements[entitlement.feature]) {
      activeEntitlements[entitlement.feature] = entitlement;
    }
  });

  return activeEntitlements;
};
