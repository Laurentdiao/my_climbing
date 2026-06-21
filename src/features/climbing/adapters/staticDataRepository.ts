import type { ClimbingLog, Gym } from "../domain/types";

let cachedData: ClimbingLog | null = null;

export async function loadClimbingLog(): Promise<ClimbingLog> {
  if (cachedData) return cachedData;

  const data = (await import("../../../data/climbing-log.json")) as {
    default: ClimbingLog;
  };
  cachedData = data.default;
  return cachedData;
}

export function getGymById(data: ClimbingLog, gymId: string): Gym | undefined {
  return data.gyms.find((g) => g.id === gymId);
}
