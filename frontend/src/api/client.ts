// Fetch client configured for backend API
const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const API_HOST = rawApiUrl
  ? (rawApiUrl.startsWith('http') ? rawApiUrl : `https://${rawApiUrl}`)
  : '';
const BASE_URL = `${API_HOST}/api/v1`;

export const apiClient = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  return response.json();
};
