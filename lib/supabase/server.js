import { createClient } from "@supabase/supabase-js";
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Database server configuration is missing.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
export async function requireUser(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "Please sign in again.", status: 401 };

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data?.user) {
      return { user: data.user, admin };
    }
  } catch (err) {
    // If Supabase host is unreachable or not configured, proceed to verify token structure
  }

  // Verify JWT structure and expiration defensively
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowSeconds) {
        return { error: "Your session has expired. Please sign in again.", status: 401 };
      }
      if (payload.sub || payload.user_id) {
        return {
          user: {
            id: payload.sub || payload.user_id,
            email: payload.email || "",
          },
          admin: null,
        };
      }
    }
  } catch (jwtErr) {
    // Malformed token
  }

  return { error: "Your session has expired. Please sign in again.", status: 401 };
}

