export async function getAccessToken() {
  const { getSupabaseBrowser } = await import("@/lib/supabase/client");
  const { data } = await getSupabaseBrowser().auth.getSession();
  return data.session?.access_token;
}
export async function authenticatedFetch(url, options = {}) {
  const token = await getAccessToken();
  return fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
}
