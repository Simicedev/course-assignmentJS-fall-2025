export class ApiError extends Error {
  status: number;
  details: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// Normalize base URL: trim spaces and drop trailing slashes
const BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");
const apiKey = import.meta.env.VITE_NOROFF_API_KEY;
console.log(BASE_URL);
export async function apiClient(
  endpoint: string,
  options: RequestInit & { body?: any } = {}
) {
  // Get tokens from storage

  const accessToken = localStorage.getItem("accessToken");

  // Detect FormData
  const isFormData = options.body instanceof FormData;

  // Build headers
  const headers: Record<string, string> = {
    // Only set Content-Type for non-FormData when a body is provided
    ...(!isFormData && options.body !== undefined
      ? { "Content-Type": "application/json" }
      : {}),
    ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  // Build config
  const config: RequestInit = {
    method: options.method || (options.body ? "POST" : "GET"),
    ...options,
    headers,
    body: isFormData
      ? options.body
      : options.body
      ? JSON.stringify(options.body)
      : undefined,
  };

  try {
    // Ensure exactly one slash between base and endpoint and avoid double /social
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const social = "/social";
    let url = `${BASE_URL}${path}`;
    if (BASE_URL.endsWith(social) && path.startsWith(`${social}/`)) {
      url = `${BASE_URL}${path.slice(social.length)}`;
    }
    if (BASE_URL.endsWith(social) && path === social) {
      url = `${BASE_URL}`;
    }
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {}
      const message =
        errorData.errors?.[0]?.message ||
        errorData.message ||
        `An API error occurred (status ${response.status})`;
      throw new ApiError(message, response.status, errorData);
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error("API Client Error:", error);
    throw error;
  }
}

export const get = <T = any>(endpoint: string, options?: RequestInit) =>
  apiClient(endpoint, { ...options, method: "GET" }) as Promise<T>;

export const post = <T = any>(
  endpoint: string,
  body: any,
  options?: RequestInit
) => apiClient(endpoint, { ...options, method: "POST", body }) as Promise<T>;

export const put = <T = any>(
  endpoint: string,
  body: any,
  options?: RequestInit
) => apiClient(endpoint, { ...options, method: "PUT", body }) as Promise<T>;

export const del = <T = any>(endpoint: string, options?: RequestInit) =>
  apiClient(endpoint, { ...options, method: "DELETE" }) as Promise<T>;
