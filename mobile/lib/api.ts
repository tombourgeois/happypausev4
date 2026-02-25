const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

let token: string | null = null;

async function request(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    token = null;
    throw new Error('Session expired');
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed: ${res.status}`);
  }

  return { data };
}

export const api = {
  setToken(t: string | null) {
    token = t;
  },

  getToken() {
    return token;
  },

  get(path: string) {
    return request('GET', path);
  },

  post(path: string, body?: unknown) {
    return request('POST', path, body);
  },

  patch(path: string, body?: unknown) {
    return request('PATCH', path, body);
  },

  getBaseUrl: () => API_URL,
};
