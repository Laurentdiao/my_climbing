import { describe, it, expect } from "vitest";
import type { ClimbingLog } from "./types";
import {
  getDashboardStats,
  filterSessions,
  getSessionEntriesTotal,
  getSessionById,
} from "./stats";
import {
  BOULDERING_GRADES,
  compareGradeRank,
  getDefaultGradeForDiscipline,
  getGradesForDiscipline,
  gradeLabelToRank,
  LEAD_GRADES,
} from "./grade";

const sampleData: ClimbingLog = {
  siteTitle: "Test Log",
  gyms: [
    { id: "gym-a", name: "Gym A", city: "", color: "#000" },
    { id: "gym-b", name: "Gym B", city: "", color: "#111" },
  ],
  users: [
    { id: "user-a", name: "Alice", bio: "", homeGym: "", color: "#3b82f6" },
    { id: "user-b", name: "Bob", bio: "", homeGym: "", color: "#84cc16" },
  ],
  sessions: [
    {
      id: "2026-01-01-gym-a",
      climbedAt: "2026-01-01",
      gymId: "gym-a",
      userId: "user-a",
      timeOfDay: "evening",
      notes: "",
      entries: [
        {
          id: "e1",
          discipline: "bouldering",
          gradeLabel: "V3",
          gradeRank: 30,
          quantity: 3,
          notes: "",
          videoUrl: "",
          videoPlatform: "",
          videoTitle: "",
        },
        {
          id: "e2",
          discipline: "bouldering",
          gradeLabel: "V5",
          gradeRank: 50,
          quantity: 1,
          notes: "",
          videoUrl: "",
          videoPlatform: "",
          videoTitle: "",
        },
      ],
    },
    {
      id: "2026-02-15-gym-b",
      climbedAt: "2026-02-15",
      gymId: "gym-b",
      userId: "user-b",
      timeOfDay: "afternoon",
      notes: "",
      entries: [
        {
          id: "e3",
          discipline: "bouldering",
          gradeLabel: "V3",
          gradeRank: 30,
          quantity: 2,
          notes: "",
          videoUrl: "",
          videoPlatform: "",
          videoTitle: "",
        },
        {
          id: "e4",
          discipline: "bouldering",
          gradeLabel: "V4",
          gradeRank: 40,
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

describe("getDashboardStats", () => {
  const stats = getDashboardStats(sampleData);

  it("counts total sessions", () => {
    expect(stats.totalSessions).toBe(2);
  });

  it("aggregates total problems by quantity, not row count", () => {
    expect(stats.totalProblems).toBe(7);
  });

  it("builds monthly trend", () => {
    expect(stats.monthlyTrend).toHaveLength(2);
    const jan = stats.monthlyTrend.find((m) => m.month === "2026-01");
    const feb = stats.monthlyTrend.find((m) => m.month === "2026-02");
    expect(jan?.quantity).toBe(4);
    expect(feb?.quantity).toBe(3);
  });

  it("builds gym distribution by quantity", () => {
    const gymA = stats.gymDistribution.find((g) => g.gymId === "gym-a");
    const gymB = stats.gymDistribution.find((g) => g.gymId === "gym-b");
    expect(gymA?.quantity).toBe(4);
    expect(gymB?.quantity).toBe(3);
  });

  it("builds grade distribution sorted by rank", () => {
    expect(stats.gradeDistribution).toHaveLength(3);
    expect(stats.gradeDistribution[0].gradeLabel).toBe("V3");
    expect(stats.gradeDistribution[0].quantity).toBe(5);
  });

  it("returns recent sessions sorted by date desc", () => {
    expect(stats.recentSessions[0].id).toBe("2026-02-15-gym-b");
  });
});

describe("filterSessions", () => {
  it("filters by gymId", () => {
    const result = filterSessions(sampleData, { gymId: "gym-a" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2026-01-01-gym-a");
  });

  it("filters by userId", () => {
    const result = filterSessions(sampleData, { userId: "user-b" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2026-02-15-gym-b");
  });

  it("filters by min grade rank", () => {
    const result = filterSessions(sampleData, { minGradeRank: 40 });
    expect(result).toHaveLength(2);
  });
});

describe("getSessionById", () => {
  it("returns session by id", () => {
    const session = getSessionById(sampleData, "2026-01-01-gym-a");
    expect(session?.id).toBe("2026-01-01-gym-a");
  });

  it("returns undefined for unknown id", () => {
    const session = getSessionById(sampleData, "nope");
    expect(session).toBeUndefined();
  });
});

describe("getSessionEntriesTotal", () => {
  it("sums quantity not row count", () => {
    const session = sampleData.sessions[0];
    expect(session.entries.length).toBe(2);
    expect(getSessionEntriesTotal(session.entries)).toBe(4);
  });
});

describe("grade helpers", () => {
  it("converts grade label to rank", () => {
    expect(gradeLabelToRank("V3")).toBe(30);
    expect(gradeLabelToRank("V0")).toBe(0);
    expect(gradeLabelToRank("5.10a")).toBe(1000);
    expect(gradeLabelToRank("unknown")).toBe(0);
  });

  it("compares grade ranks", () => {
    expect(compareGradeRank(30, 50)).toBeLessThan(0);
    expect(compareGradeRank(1000, 30)).toBeGreaterThan(0);
    expect(compareGradeRank(30, 30)).toBe(0);
  });

  it("keeps bouldering and lead grade systems separate", () => {
    expect(getGradesForDiscipline("bouldering")).toBe(BOULDERING_GRADES);
    expect(getGradesForDiscipline("lead")).toBe(LEAD_GRADES);
    expect(BOULDERING_GRADES.every((g) => g.label.startsWith("V"))).toBe(true);
    expect(LEAD_GRADES.every((g) => g.label.startsWith("5."))).toBe(true);
  });

  it("uses discipline-specific default grades", () => {
    expect(getDefaultGradeForDiscipline("bouldering")).toEqual({
      label: "V3",
      rank: 30,
    });
    expect(getDefaultGradeForDiscipline("lead")).toEqual({
      label: "5.9",
      rank: 900,
    });
  });
});
