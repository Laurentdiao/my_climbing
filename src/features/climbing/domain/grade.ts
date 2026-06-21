const BOULDERING_GRADES = [
  { label: "V0", rank: 0 },
  { label: "V1", rank: 10 },
  { label: "V2", rank: 20 },
  { label: "V3", rank: 30 },
  { label: "V4", rank: 40 },
  { label: "V5", rank: 50 },
  { label: "V6", rank: 60 },
  { label: "V7", rank: 70 },
  { label: "V8", rank: 80 },
  { label: "V9", rank: 90 },
  { label: "V10", rank: 100 },
  { label: "V11", rank: 110 },
  { label: "V12", rank: 120 },
];

export function getGradeRank(gradeLabel: string): number | null {
  const found = BOULDERING_GRADES.find(
    (g) => g.label.toLowerCase() === gradeLabel.toLowerCase(),
  );
  return found ? found.rank : null;
}

export function getGradeLabel(rank: number): string {
  const found = BOULDERING_GRADES.find((g) => g.rank === rank);
  return found ? found.label : `V?`;
}

export function compareGradeRank(a: number, b: number): number {
  return a - b;
}

export function gradeLabelToRank(label: string): number {
  const rank = getGradeRank(label);
  if (rank === null) return 0;
  return rank;
}
