import type { ClimbingLog, Gym } from "../domain/types";

export async function loadClimbingLog(): Promise<ClimbingLog> {
  const data = (await import("../../../data/climbing-log.json")) as {
    default: ClimbingLog;
  };
  return data.default;
}

export function getGymById(data: ClimbingLog, gymId: string): Gym | undefined {
  return data.gyms.find((g) => g.id === gymId);
}
