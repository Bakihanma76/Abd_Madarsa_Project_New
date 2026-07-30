const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export const apiRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
};

export const listResource = <T>(resource: string) => apiRequest<T[]>(`/${resource}`);
export const createResource = <T>(resource: string, data: unknown) =>
  apiRequest<T>(`/${resource}`, { method: 'POST', body: JSON.stringify(data) });
export const updateResource = <T>(resource: string, id: number, data: unknown) =>
  apiRequest<T>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteResource = (resource: string, id: number) =>
  apiRequest<void>(`/${resource}/${id}`, { method: 'DELETE' });
