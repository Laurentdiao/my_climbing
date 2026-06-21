import { climbingLogSchema } from "../features/climbing/domain/validators";
import data from "../data/climbing-log.json";

function validate() {
  const result = climbingLogSchema.safeParse(data);

  if (!result.success) {
    console.error("❌ Data validation failed:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  const log = result.data;

  const gymIds = new Set(log.gyms.map((g) => g.id));
  const entryIds = new Set<string>();
  const sessionIds = new Set<string>();

  let warnings = 0;

  for (const session of log.sessions) {
    if (sessionIds.has(session.id)) {
      console.warn(`⚠ Duplicate session id: ${session.id}`);
      warnings++;
    }
    sessionIds.add(session.id);

    if (!gymIds.has(session.gymId)) {
      console.warn(
        `⚠ Session ${session.id} references unknown gymId: ${session.gymId}`,
      );
      warnings++;
    }

    for (const entry of session.entries) {
      if (entryIds.has(entry.id)) {
        console.warn(`⚠ Duplicate entry id: ${entry.id}`);
        warnings++;
      }
      entryIds.add(entry.id);

      if (entry.videoUrl && !entry.videoPlatform) {
        console.warn(
          `⚠ Entry ${entry.id} has videoUrl but no videoPlatform`,
        );
        warnings++;
      }

      if (entry.quantity > 1 && entry.videoUrl) {
        console.warn(
          `⚠ Entry ${entry.id} has quantity=${entry.quantity} and videoUrl — UI will show this as a "related video", not per-problem video`,
        );
      }
    }
  }

  const totalEntries = log.sessions.reduce(
    (sum, s) => sum + s.entries.length,
    0,
  );
  const totalQuantity = log.sessions.reduce(
    (sum, s) =>
      sum + s.entries.reduce((eSum, e) => eSum + e.quantity, 0),
    0,
  );

  console.log("✅ Data validation passed:");
  console.log(`   Profile: ${log.profile.displayName}`);
  console.log(`   Gyms: ${log.gyms.length}`);
  console.log(`   Sessions: ${log.sessions.length}`);
  console.log(`   Entry records: ${totalEntries}`);
  console.log(`   Total problems (by quantity): ${totalQuantity}`);
  if (warnings > 0) {
    console.log(`   Warnings: ${warnings}`);
  }

  process.exit(0);
}

validate();
