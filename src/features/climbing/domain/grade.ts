export interface GradeOption {
  label: string;
  rank: number;
}

export const BOULDERING_GRADES: GradeOption[] = [
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
];

export const LEAD_GRADES: GradeOption[] = [
  { label: "5.8", rank: 800 },
  { label: "5.9", rank: 900 },
  { label: "5.10a", rank: 1000 },
  { label: "5.10b", rank: 1010 },
  { label: "5.10c", rank: 1020 },
  { label: "5.10d", rank: 1030 },
  { label: "5.11a", rank: 1100 },
  { label: "5.11b", rank: 1110 },
  { label: "5.11c", rank: 1120 },
  { label: "5.11d", rank: 1130 },
  { label: "5.12a", rank: 1200 },
  { label: "5.12b", rank: 1210 },
  { label: "5.12c", rank: 1220 },
  { label: "5.12d", rank: 1230 },
  { label: "5.13a", rank: 1300 },
  { label: "5.13b", rank: 1310 },
  { label: "5.13c", rank: 1320 },
  { label: "5.13d", rank: 1330 },
];

const gradeTable = [...BOULDERING_GRADES, ...LEAD_GRADES];

export function getGradeRank(gradeLabel: string): number | null {
  const found = gradeTable.find(
    (g) => g.label.toLowerCase() === gradeLabel.toLowerCase(),
  );
  return found ? found.rank : null;
}

export function getGradeLabel(rank: number): string {
  const found = gradeTable.find((g) => g.rank === rank);
  return found ? found.label : "?";
}

export function compareGradeRank(a: number, b: number): number {
  return a - b;
}

export function gradeLabelToRank(label: string): number {
  const rank = getGradeRank(label);
  if (rank === null) return 0;
  return rank;
}

export function isBoulderingGrade(label: string): boolean {
  return label.startsWith("V") || label.startsWith("v");
}

export function getGradesForDiscipline(
  discipline: "bouldering" | "lead",
): GradeOption[] {
  return discipline === "bouldering" ? BOULDERING_GRADES : LEAD_GRADES;
}

export function getDefaultGradeForDiscipline(
  discipline: "bouldering" | "lead",
): GradeOption {
  return discipline === "bouldering"
    ? BOULDERING_GRADES[3]
    : LEAD_GRADES[1];
}

export const ALL_GRADES = gradeTable;
