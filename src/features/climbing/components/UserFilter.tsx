import type { User } from "../domain/types";

interface UserFilterProps {
  users: User[];
  activeUserId: string | null;
  onSelect: (userId: string | null) => void;
}

export function UserFilter({ users, activeUserId, onSelect }: UserFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          activeUserId === null
            ? "bg-lime-400/20 text-lime-400"
            : "bg-stone-800 text-stone-400 hover:text-stone-200"
        }`}
      >
        All
      </button>
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelect(user.id)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeUserId === user.id
              ? "bg-lime-400/20 text-lime-400"
              : "bg-stone-800 text-stone-400 hover:text-stone-200"
          }`}
        >
          <span
            className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: user.color || "#a3e635" }}
          />
          {user.name}
        </button>
      ))}
    </div>
  );
}
