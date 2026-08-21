/**
 * Utility functions for making authenticated Admin API calls
 */

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kuettu_admin_token");
}

export async function adminFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  const token = getAdminToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-admin-token"] = token;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Send cookies as well
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Erreur serveur (${res.status})`,
        ...data,
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Erreur de connexion au serveur",
    };
  }
}
