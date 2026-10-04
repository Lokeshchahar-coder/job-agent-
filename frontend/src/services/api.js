const PROD_BACKEND = 'https://job-agent-backend-zm1x.onrender.com';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production' ? PROD_BACKEND : 'http://localhost:5000');

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body, isFormData = false) {
  const headers = { ...authHeaders() };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Server error (${res.status})`);
  return data;
}

export async function signup(name, email, password) {
  const data = await request('POST', '/api/auth/signup', { name, email, password });
  localStorage.setItem('token', data.data.token);
  return data;
}

export async function login(email, password) {
  const data = await request('POST', '/api/auth/login', { email, password });
  localStorage.setItem('token', data.data.token);
  return data;
}

export function logout() {
  localStorage.removeItem('token');
}

export async function getCurrentUser() {
  return request('GET', '/api/auth/me');
}

export async function parseResume(file) {
  const formData = new FormData();
  formData.append('resume', file);
  return request('POST', '/api/resume/parse', formData, true);
}

export async function getMyResume() {
  return request('GET', '/api/resume');
}

export async function applyForJob(jobText) {
  const formData = new FormData();
  formData.append('jobText', jobText);
  formData.append('autoSend', 'true');
  return request('POST', '/api/apply', formData, true);
}

export async function getApplications() {
  return request('GET', '/api/applications');
}

export async function getApplicationById(id) {
  return request('GET', `/api/applications/${id}`);
}

export async function getGmailAuthUrl() {
  return request('GET', '/api/auth/google');
}

export async function getGmailStatus() {
  return request('GET', '/api/gmail/account');
}

export async function disconnectGmail() {
  return request('DELETE', '/api/gmail/account');
}

export async function updateProfile({ github, linkedin }) {
  return request('PUT', '/api/auth/profile', { github, linkedin });
}
