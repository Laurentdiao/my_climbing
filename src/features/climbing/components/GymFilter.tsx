import type { Gym } from "../domain/types";

interface GymFilterProps {
  gyms: Gym[];
  activeGymId: string | null;
  onSelect: (gymId: string | null) => void;
}

export function GymFilter({ gyms, activeGymId, onSelect }: GymFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          activeGymId === null
            ? "bg-lime-400/20 text-lime-400"
            : "bg-stone-800 text-stone-400 hover:text-stone-200"
        }`}
      >
        All
      </button>
      {gyms.map((gym) => (
        <button
          key={gym.id}
          onClick={() => onSelect(gym.id)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeGymId === gym.id
              ? "bg-lime-400/20 text-lime-400"
              : "bg-stone-800 text-stone-400 hover:text-stone-200"
          }`}
        >
          <span
            className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: gym.color || "#a3e635" }}
          />
          {gym.name}
        </button>
      ))}
    </div>
  );
}
