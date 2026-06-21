import { z } from "zod/v4";

const profileSchema = z.object({
  displayName: z.string().min(1),
  siteTitle: z.string().min(1),
  bio: z.string(),
  homeGym: z.string(),
});

const gymSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, "gym id must be kebab-case"),
  name: z.string().min(1),
  city: z.string(),
  color: z.string(),
});

const disciplineSchema = z.enum(["bouldering", "lead"]);

const videoPlatformSchema = z.enum([
  "xiaohongshu",
  "wechat",
  "bilibili",
  "douyin",
  "other",
]);

const entrySchema = z.object({
  id: z.string().min(1),
  discipline: disciplineSchema,
  gradeLabel: z.string().min(1),
  gradeRank: z.number().int(),
  quantity: z.number().int().positive(),
  notes: z.string(),
  videoUrl: z
    .string()
    .refine((value) => value === "" || /^https?:\/\//i.test(value), "videoUrl must be empty or start with http(s)"),
  videoPlatform: videoPlatformSchema.or(z.literal("")),
  videoTitle: z.string(),
});

const sessionSchema = z.object({
  id: z.string().min(1),
  climbedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "climbedAt must be YYYY-MM-DD"),
  gymId: z.string().min(1),
  timeOfDay: z.string(),
  notes: z.string(),
  entries: z.array(entrySchema).min(1, "session must have at least one entry"),
});

export const climbingLogSchema = z.object({
  profile: profileSchema,
  gyms: z.array(gymSchema).min(1),
  sessions: z.array(sessionSchema),
});
