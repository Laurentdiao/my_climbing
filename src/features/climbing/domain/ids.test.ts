import { describe, expect, it } from "vitest";
import type { ClimbingLog } from "./types";
import {
  createGymId,
  isSafeDataId,
  normalizeLogGymIds,
} from "./ids";

describe("createGymId", () => {
  it("keeps Chinese names and punctuation out of the internal id", () => {
    const id = createGymId("香蕉攀岩（上地店）", { now: 1234567890 });

    expect(id).toMatch(/^gym-[a-z0-9]+$/);
    expect(id).not.toContain("香蕉");
    expect(isSafeDataId(id)).toBe(true);
  });

  it("uses readable ASCII when the gym name has it", () => {
    expect(createGymId("Beta Boulders!!", { now: 36 })).toBe(
      "beta-boulders-10",
    );
  });

  it("avoids collisions with existing gym ids", () => {
    expect(
      createGymId("Beta Boulders", {
        now: 36,
        existingIds: ["beta-boulders-10"],
      }),
    ).toBe("beta-boulders-10-2");
  });
});

describe("normalizeLogGymIds", () => {
  it("repairs unsafe gym ids and keeps sessions pointing at the repaired gym", () => {
    const log: ClimbingLog = {
      profile: {
        displayName: "Test",
        siteTitle: "Test",
        bio: "",
        homeGym: "",
      },
      gyms: [
        {
          id: "香蕉攀岩（上地店）-abc",
          name: "香蕉攀岩（上地店）",
          city: "北京",
          color: "#84cc16",
        },
      ],
      sessions: [
        {
          id: "session-1",
          climbedAt: "2026-06-23",
          gymId: "香蕉攀岩（上地店）-abc",
          timeOfDay: "evening",
          notes: "",
          entries: [
            {
              id: "entry-1",
              discipline: "bouldering",
              gradeLabel: "V3",
              gradeRank: 30,
              quantity: 1,
              notes: "",
              videoUrl: "",
              videoPlatform: "",
              videoTitle: "",
            },
          ],
        },
      ],
    };

    const normalized = normalizeLogGymIds(log);
    const repairedId = normalized.gyms[0].id;

    expect(repairedId).not.toBe("香蕉攀岩（上地店）-abc");
    expect(isSafeDataId(repairedId)).toBe(true);
    expect(normalized.gyms[0].name).toBe("香蕉攀岩（上地店）");
    expect(normalized.sessions[0].gymId).toBe(repairedId);
  });
});
