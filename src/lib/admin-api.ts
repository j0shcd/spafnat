/**
 * Admin API Helper
 *
 * Thin fetch wrapper that handles JWT token from localStorage for all admin API calls.
 * Token is stored at key 'spaf_admin_token' and sent as Authorization: Bearer header.
 * On any 401 response, token is cleared (session expired).
 */

const TOKEN_KEY = 'spaf_admin_token';

interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  details?: string[];
}

/**
 * Fetch wrapper that adds JWT Authorization header
 */
async function adminFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: HeadersInit = {
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add Content-Type for JSON payloads (unless it's FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(path, {
      ...options,
      headers,
    });

    // If 401 Unauthorized, clear token (session expired)
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    const data = await response.json();

    return {
      ok: response.ok,
      data: response.ok ? data : undefined,
      error: !response.ok ? data.error : undefined,
      details: !response.ok ? data.details : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ===== Auth API =====

export async function apiLogin(username: string, password: string): Promise<ApiResponse<{ token: string }>> {
  const response = await adminFetch<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  // Store token on successful login
  if (response.ok && response.data?.token) {
    localStorage.setItem(TOKEN_KEY, response.data.token);
  }

  return response;
}

export async function apiLogout(): Promise<ApiResponse> {
  const response = await adminFetch('/api/auth/logout', {
    method: 'POST',
  });

  // Clear token regardless of response
  localStorage.removeItem(TOKEN_KEY);

  return response;
}

export async function apiVerify(): Promise<ApiResponse> {
  return adminFetch('/api/auth/verify', {
    method: 'GET',
  });
}

// ===== Document API =====

export interface DocumentFile {
  key: string;
  size: number;
  lastModified: string;
}

export async function apiListDocuments(): Promise<ApiResponse<DocumentFile[]>> {
  const response = await adminFetch<{ files: DocumentFile[]; count: number }>('/api/admin/files?type=documents', {
    method: 'GET',
  });

  // Unwrap files array from response
  if (response.ok && response.data) {
    return { ...response, data: response.data.files };
  }
  return { ...response, data: [] };
}

export async function apiUploadDocument(file: File, docKey: string, filename: string): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'document');
  formData.append('key', filename); // Use actual filename, not docKey

  return adminFetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function apiDeleteDocument(filename: string): Promise<ApiResponse> {
  return adminFetch('/api/admin/delete-document', {
    method: 'POST',
    body: JSON.stringify({ key: filename }), // Use filename, not docKey
  });
}

// ===== Photo API =====

export interface PhotoFile {
  key: string;
  size: number;
  lastModified: string;
  url: string; // /api/media/{key}
}

export async function apiListPhotos(year: string): Promise<ApiResponse<PhotoFile[]>> {
  const response = await adminFetch<{ photos: PhotoFile[]; count: number; year: string }>(`/api/gallery?year=${year}`, {
    method: 'GET',
  });

  // Unwrap photos array from response
  if (response.ok && response.data) {
    return { ...response, data: response.data.photos };
  }
  return { ...response, data: [] };
}

export async function apiUploadPhoto(file: File, year: string): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'photo');
  formData.append('key', year);

  return adminFetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function apiDeletePhoto(r2Key: string): Promise<ApiResponse> {
  return adminFetch('/api/admin/delete-photo', {
    method: 'POST',
    body: JSON.stringify({ key: r2Key }),
  });
}

// ===== Helper Functions =====

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
