import type { ClimbingLog, Gym, Session } from "./types";

export const SAFE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface CreateGymIdOptions {
  now?: number;
  existingIds?: Iterable<string>;
}

export function isSafeDataId(value: string): boolean {
  return SAFE_ID_PATTERN.test(value);
}

export function createGymId(
  name: string,
  options: CreateGymIdOptions = {},
): string {
  const base = slugifyForId(name) || "gym";
  const timestamp = (options.now ?? Date.now()).toString(36);
  return makeUniqueId(`${base}-${timestamp}`, options.existingIds);
}

export function ensureSafeGymIds(
  gyms: Gym[],
  existingIds: Iterable<string> = [],
): { gyms: Gym[]; idMap: Map<string, string>; changed: boolean } {
  const usedIds = new Set(existingIds);
  const idMap = new Map<string, string>();
  let changed = false;

  const nextGyms = gyms.map((gym) => {
    const safeId = isSafeDataId(gym.id)
      ? gym.id
      : createRepairedGymId(gym);
    const id = makeUniqueId(safeId, usedIds);

    idMap.set(gym.id, id);
    if (id === gym.id) return gym;

    changed = true;
    return { ...gym, id };
  });

  return { gyms: nextGyms, idMap, changed };
}

export function normalizeLogGymIds(log: ClimbingLog): ClimbingLog {
  const { gyms, idMap, changed } = ensureSafeGymIds(log.gyms);
  if (!changed) return log;

  return {
    ...log,
    gyms,
    sessions: remapSessionGymIds(log.sessions, idMap),
  };
}

export function remapSessionGymIds(
  sessions: Session[],
  idMap: Map<string, string>,
): Session[] {
  return sessions.map((session) => {
    const gymId = idMap.get(session.gymId);
    if (!gymId || gymId === session.gymId) return session;
    return { ...session, gymId };
  });
}

function createRepairedGymId(gym: Pick<Gym, "id" | "name">): string {
  const base = slugifyForId(gym.id) || slugifyForId(gym.name) || "gym";
  return `${base}-${hashToBase36(gym.id || gym.name)}`;
}

function slugifyForId(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeUniqueId(id: string, existingIds: Iterable<string> = []): string {
  const usedIds = existingIds instanceof Set ? existingIds : new Set(existingIds);
  let candidate = id;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${id}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function hashToBase36(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
