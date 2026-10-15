import firebaseConfig from "@/firebase-applet-config.json";

const PHOTO_ANALYSIS_MARKER = "[Photo Skin Analysis]";
const MAX_PER_DAY = 10;
const memoryCounts = new Map();
const MAX_MEMORY_ENTRIES = 2000;

function todayStartIso() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function hasExceededInMemory(userId) {
  const key = `${userId}:${todayStartIso()}`;
  const count = memoryCounts.get(key) || 0;
  if (memoryCounts.size > MAX_MEMORY_ENTRIES) memoryCounts.clear();
  memoryCounts.set(key, count + 1);
  return count >= MAX_PER_DAY;
}

/**
 * Counts today's photo analyses straight from the messages table (Firestore REST),
 * so the daily limit survives cold starts and multiple server instances.
 * Falls back to an in-memory counter when the table is unreachable.
 */
export async function hasExceededDailyPhotoLimit({ userId, token }) {
  if (!userId || !token) return hasExceededInMemory(userId || "anonymous");

  try {
    const url =
      `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}` +
      `/databases/${firebaseConfig.firestoreDatabaseId}/documents:runQuery?key=${firebaseConfig.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "messages" }],
          where: {
            compositeFilter: {
              op: "AND",
              filters: [
                {
                  fieldFilter: {
                    field: { fieldPath: "user_id" },
                    op: "EQUAL",
                    value: { stringValue: userId },
                  },
                },
                {
                  fieldFilter: {
                    field: { fieldPath: "createdAt" },
                    op: "GREATER_THAN_OR_EQUAL",
                    value: { stringValue: todayStartIso() },
                  },
                },
              ],
            },
          },
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`usage lookup failed: ${response.status}`);

    const rows = await response.json();
    const count = (Array.isArray(rows) ? rows : []).filter((row) => {
      const fields = row?.document?.fields;
      const content = fields?.content?.stringValue || "";
      const role = fields?.role?.stringValue || "";
      return role === "assistant" && content.startsWith(PHOTO_ANALYSIS_MARKER);
    }).length;

    return count >= MAX_PER_DAY;
  } catch {
    // Messages table unreachable (or non-Firebase session): use the local counter
    return hasExceededInMemory(userId);
  }
}
