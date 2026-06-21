interface GradePillProps {
  gradeLabel: string;
  size?: "sm" | "md";
}

const gradeColors: Record<string, string> = {
  V0: "bg-stone-600 text-stone-200",
  V1: "bg-emerald-800 text-emerald-200",
  V2: "bg-emerald-700 text-emerald-200",
  V3: "bg-lime-700 text-lime-200",
  V4: "bg-yellow-600 text-yellow-100",
  V5: "bg-amber-600 text-amber-100",
  V6: "bg-orange-600 text-orange-100",
  V7: "bg-orange-700 text-orange-100",
  V8: "bg-red-700 text-red-100",
  V9: "bg-red-800 text-red-100",
  V10: "bg-purple-800 text-purple-100",
};

const leadColors: Record<string, string> = {
  "5.8": "bg-stone-600 text-stone-200",
  "5.9": "bg-emerald-800 text-emerald-200",
  "5.10a": "bg-emerald-700 text-emerald-200",
  "5.10b": "bg-lime-700 text-lime-200",
  "5.10c": "bg-lime-700 text-lime-200",
  "5.10d": "bg-lime-600 text-lime-200",
  "5.11a": "bg-yellow-600 text-yellow-100",
  "5.11b": "bg-yellow-600 text-yellow-100",
  "5.11c": "bg-amber-600 text-amber-100",
  "5.11d": "bg-amber-600 text-amber-100",
  "5.12a": "bg-orange-600 text-orange-100",
  "5.12b": "bg-orange-700 text-orange-100",
  "5.12c": "bg-red-700 text-red-100",
  "5.12d": "bg-red-700 text-red-100",
  "5.13a": "bg-red-800 text-red-100",
  "5.13b": "bg-red-800 text-red-100",
  "5.13c": "bg-purple-800 text-purple-100",
  "5.13d": "bg-purple-800 text-purple-100",
};

export function GradePill({ gradeLabel, size = "md" }: GradePillProps) {
  const color =
    gradeColors[gradeLabel] ||
    leadColors[gradeLabel] ||
    "bg-stone-700 text-stone-300";

  return (
    <span
      className={`inline-flex items-center rounded-md font-mono font-semibold ${
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-sm"
      } ${color}`}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {gradeLabel}
    </span>
  );
}
