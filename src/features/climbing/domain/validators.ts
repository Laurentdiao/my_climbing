import { z } from "zod/v4";
import { SAFE_ID_PATTERN } from "./ids";

const gymSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(SAFE_ID_PATTERN, "gym id must use lowercase letters, numbers, and hyphens"),
  name: z.string().min(1),
  city: z.string(),
  color: z.string(),
});

const userSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(SAFE_ID_PATTERN, "user id must use lowercase letters, numbers, and hyphens"),
  name: z.string().min(1),
  bio: z.string(),
  homeGym: z.string(),
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
  userId: z.string().min(1),
  timeOfDay: z.string(),
  notes: z.string(),
  entries: z.array(entrySchema).min(1, "session must have at least one entry"),
});

export const climbingLogSchema = z.object({
  siteTitle: z.string().min(1),
  gyms: z.array(gymSchema).min(1),
  users: z.array(userSchema).min(1),
  sessions: z.array(sessionSchema),
});
