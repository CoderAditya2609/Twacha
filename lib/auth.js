export async function getAccessToken() {
  try {
    const { getSupabaseBrowser } = await import("@/lib/supabase/client");
    const { data } = await getSupabaseBrowser().auth.getSession();
    if (data?.session?.access_token) {
      return data.session.access_token;
    }
  } catch (err) {
    // Supabase browser session unavailable
  }

  try {
    const { auth } = await import("@/lib/firebase");
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) return token;
    }
  } catch (err) {
    // Firebase auth unavailable
  }

  return null;
}

export async function authenticatedFetch(url, options = {}) {
  const token = await getAccessToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
