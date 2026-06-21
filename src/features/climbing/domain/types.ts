export type Discipline = "bouldering" | "lead";

export type VideoPlatform =
  | "xiaohongshu"
  | "wechat"
  | "bilibili"
  | "douyin"
  | "other";

export interface Profile {
  displayName: string;
  siteTitle: string;
  bio: string;
  homeGym: string;
}

export interface Gym {
  id: string;
  name: string;
  city: string;
  color: string;
}

export interface Entry {
  id: string;
  discipline: Discipline;
  gradeLabel: string;
  gradeRank: number;
  quantity: number;
  notes: string;
  videoUrl: string;
  videoPlatform: VideoPlatform | "";
  videoTitle: string;
}

export interface Session {
  id: string;
  climbedAt: string;
  gymId: string;
  discipline: Discipline;
  timeOfDay: string;
  notes: string;
  entries: Entry[];
}

export interface ClimbingLog {
  profile: Profile;
  gyms: Gym[];
  sessions: Session[];
}
