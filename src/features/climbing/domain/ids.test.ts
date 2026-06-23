import { describe, expect, it } from "vitest";
import type { ClimbingLog } from "./types";
import {
  createGymId,
  createUserId,
  isSafeDataId,
  normalizeLogGymIds,
  normalizeLogUserIds,
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
      siteTitle: "Test",
      gyms: [
        {
          id: "香蕉攀岩（上地店）-abc",
          name: "香蕉攀岩（上地店）",
          city: "北京",
          color: "#84cc16",
        },
      ],
      users: [
        { id: "user-a", name: "小王", bio: "", homeGym: "", color: "#3b82f6" },
      ],
      sessions: [
        {
          id: "session-1",
          climbedAt: "2026-06-23",
          gymId: "香蕉攀岩（上地店）-abc",
          userId: "user-a",
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

describe("createUserId", () => {
  it("keeps Chinese names out of the internal id", () => {
    const id = createUserId("小王", { now: 1234567890 });

    expect(id).toMatch(/^user-[a-z0-9]+$/);
    expect(id).not.toContain("小王");
    expect(isSafeDataId(id)).toBe(true);
  });

  it("uses readable ASCII when the user name has it", () => {
    expect(createUserId("Alice!!", { now: 36 })).toBe("alice-10");
  });

  it("avoids collisions with existing user ids", () => {
    expect(
      createUserId("Alice", {
        now: 36,
        existingIds: ["alice-10"],
      }),
    ).toBe("alice-10-2");
  });
});

describe("normalizeLogUserIds", () => {
  it("repairs unsafe user ids and keeps sessions pointing at the repaired user", () => {
    const log: ClimbingLog = {
      siteTitle: "Test",
      gyms: [
        { id: "gym-a", name: "Gym A", city: "", color: "#84cc16" },
      ],
      users: [
        { id: "小王-abc", name: "小王", bio: "", homeGym: "", color: "#3b82f6" },
      ],
      sessions: [
        {
          id: "session-1",
          climbedAt: "2026-06-23",
          gymId: "gym-a",
          userId: "小王-abc",
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

    const normalized = normalizeLogUserIds(log);
    const repairedId = normalized.users[0].id;

    expect(repairedId).not.toBe("小王-abc");
    expect(isSafeDataId(repairedId)).toBe(true);
    expect(normalized.users[0].name).toBe("小王");
    expect(normalized.sessions[0].userId).toBe(repairedId);
  });
});
