import { robotsFor, type Indexability } from './config';

export function publicRobots(policy: Indexability = {}) {
  return robotsFor(policy);
}

export function isThinProfile(value: { bio?: string | null; description?: string | null; mediaCount?: number } | null | undefined) {
  if (!value) return true;
  return !(value.bio?.trim() || value.description?.trim() || (value.mediaCount ?? 0) > 0);
}
