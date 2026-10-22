import { invalidateGalleryYear } from '@/lib/galleryPrefetch';
import type { ConcoursItem, ConcoursCategory } from '@/config/concours';
import type { Delegation } from '@/config/delegations';

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

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('Content-Type') || '';
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(rawBody);
  }

  return rawBody;
}

function getApiErrorMessage(response: Response, data: unknown): string {
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }

  if (typeof data === 'string' && data.trim()) {
    return data.trim().startsWith('<!doctype html') || data.trim().startsWith('<html')
      ? 'Le serveur API ne répond pas. Lancez le serveur Cloudflare Pages Functions pour utiliser l’administration.'
      : data.trim();
  }

  if (response.status === 404) {
    return 'Endpoint API introuvable. Lancez le serveur Cloudflare Pages Functions pour utiliser l’administration.';
  }

  return response.ok
    ? 'Réponse API vide'
    : 'Le serveur API ne répond pas correctement. Veuillez réessayer.';
}

function getApiErrorDetails(data: unknown): string[] | undefined {
  if (data && typeof data === 'object' && 'details' in data && Array.isArray(data.details)) {
    return data.details.filter((detail): detail is string => typeof detail === 'string');
  }

  return undefined;
}

/**
 * Fetch wrapper that adds JWT Authorization header
 */
async function adminFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = new Headers(options.headers);

  // Add Authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Add Content-Type for JSON payloads (unless it's FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
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

    const data = await parseResponseBody(response) as T;

    return {
      ok: response.ok,
      data: response.ok ? data : undefined,
      error: !response.ok ? getApiErrorMessage(response, data) : undefined,
      details: !response.ok ? getApiErrorDetails(data) : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof SyntaxError
        ? 'Réponse API invalide. Vérifiez que le serveur Cloudflare Pages Functions est lancé.'
        : error instanceof Error ? error.message : 'Network error',
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
  originalFilename?: string | null;
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

export async function apiUploadDocument(
  file: File,
  filename: string,
  options?: { coverFile?: File }
): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'document');
  formData.append('key', filename); // Use actual filename, not docKey
  if (options?.coverFile) {
    formData.append('cover', options.coverFile);
  }

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
    cache: 'no-store',
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

  const result = await adminFetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });
  if (result.ok) invalidateGalleryYear(Number(year));
  return result;
}

export async function apiDeletePhoto(r2Key: string): Promise<ApiResponse> {
  const result = await adminFetch('/api/admin/delete-photo', {
    method: 'POST',
    body: JSON.stringify({ key: r2Key }),
  });
  if (result.ok) invalidateGalleryYear(Number(r2Key.split('/')[1]));
  return result;
}

// ===== Concours API =====

export type { ConcoursItem, ConcoursCategory } from '@/config/concours';

export async function apiListConcours(category: ConcoursCategory | 'all'): Promise<ApiResponse<Record<ConcoursCategory, ConcoursItem[]> | { items: ConcoursItem[] }>> {
  return adminFetch(`/api/concours?category=${category}`, {
    method: 'GET',
  });
}

export async function apiUploadConcours(file: File, category: ConcoursCategory): Promise<ApiResponse<{ item: ConcoursItem }>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  return adminFetch('/api/admin/concours/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function apiDeleteConcours(category: ConcoursCategory, r2Key: string): Promise<ApiResponse> {
  return adminFetch('/api/admin/concours/delete', {
    method: 'POST',
    body: JSON.stringify({ category, r2Key }),
  });
}

export async function apiReorderConcours(category: ConcoursCategory, r2Key: string, direction: 'up' | 'down'): Promise<ApiResponse<{ items: ConcoursItem[] }>> {
  return adminFetch('/api/admin/concours/reorder', {
    method: 'POST',
    body: JSON.stringify({ category, r2Key, direction }),
  });
}

// ===== Delegations API =====

export type { Gender, Delegation } from '@/config/delegations';

export type DelegationPayload = Omit<Delegation, 'id'> & { id?: string };

export async function apiListDelegations(): Promise<ApiResponse<Delegation[]>> {
  const response = await adminFetch<{ delegations: Delegation[] }>('/api/delegations', {
    method: 'GET',
    cache: 'no-store',
  });

  if (response.ok && response.data) {
    return { ...response, data: response.data.delegations };
  }
  return { ...response, data: [] };
}

export async function apiSaveDelegation(delegation: DelegationPayload): Promise<ApiResponse<{ delegation: Delegation; delegations: Delegation[] }>> {
  return adminFetch('/api/admin/delegations/save', {
    method: 'POST',
    body: JSON.stringify(delegation),
  });
}

export async function apiDeleteDelegation(id: string): Promise<ApiResponse<{ delegations: Delegation[] }>> {
  return adminFetch('/api/admin/delegations/delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// ===== Helper Functions =====

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
