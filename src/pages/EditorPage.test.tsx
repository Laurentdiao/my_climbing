import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClimbingLog, Gym } from "../features/climbing/domain/types";
import { EditorPage } from "./EditorPage";

const sampleData: ClimbingLog = {
  siteTitle: "Test Log",
  gyms: [
    { id: "gym-a", name: "Gym A", city: "", color: "#84cc16" },
    { id: "gym-b", name: "Gym B", city: "", color: "#f97316" },
  ],
  users: [
    { id: "user-a", name: "Alice", bio: "", homeGym: "", color: "#3b82f6" },
  ],
  sessions: [],
};

vi.mock("../features/climbing/adapters/staticDataRepository", () => ({
  loadClimbingLog: vi.fn(() => Promise.resolve(sampleData)),
  getGymById: (data: ClimbingLog, gymId: string): Gym | undefined =>
    data.gyms.find((g) => g.id === gymId),
}));

describe("EditorPage", () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => storage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete storage[key];
        }),
        clear: vi.fn(() => {
          storage = {};
        }),
      },
    });
  });

  it("keeps the selected lead grade when saving a new entry", async () => {
    render(<EditorPage />);

    expect(await screen.findByText("Gym A")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "新建记录" }));

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    // form combobox order: [0] user, [1] gym, [2] timeOfDay, [3] discipline, [4] grade
    const disciplineSelect = selects[3];
    const gradeSelect = selects[4];

    fireEvent.change(disciplineSelect, { target: { value: "lead" } });
    expect(gradeSelect.value).toBe("5.9");

    fireEvent.change(gradeSelect, { target: { value: "5.10a" } });
    expect(gradeSelect.value).toBe("5.10a");

    fireEvent.click(screen.getByRole("button", { name: "保存到本地" }));

    await waitFor(() => {
      const raw = localStorage.getItem("climbing-local-changes");
      expect(raw).not.toBeNull();
      const changes = JSON.parse(raw!);
      expect(changes.added[0].entries[0]).toMatchObject({
        discipline: "lead",
        gradeLabel: "5.10a",
        gradeRank: 1000,
      });
    });
  });
});
