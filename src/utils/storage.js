const API_BASE = 'http://localhost:4000/api'

const TOKEN_KEY = 'cm_auth_token'
const USER_KEY = 'cm_auth_user'

export function getAuthToken() {
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

export function setAuthToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token || '') } catch {}
}

export function clearAuthToken() {
  try { localStorage.removeItem(TOKEN_KEY) } catch {}
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCurrentUser(user) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user || null)) } catch {}
}

export function clearCurrentUser() {
  try { localStorage.removeItem(USER_KEY) } catch {}
}

async function api(path, options = {}) {
  const token = getAuthToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    clearAuthToken()
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    let msg = 'Request failed'
    try { const j = await res.json(); msg = j.error || msg } catch {}
    throw new Error(msg)
  }
  // For 204
  if (res.status === 204) return null
  return res.json()
}

export async function loadContacts(query = '') {
  const search = query ? `?q=${encodeURIComponent(query)}` : ''
  return api(`/contacts${search}`)
}

export async function createContact(contact) {
  return api('/contacts', { method: 'POST', body: JSON.stringify(contact) })
}

export async function updateContact(id, contact) {
  return api(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(contact) })
}

export async function deleteContact(id) {
  return api(`/contacts/${id}`, { method: 'DELETE' })
}

export async function toggleFavorite(id, value) {
  return api(`/contacts/${id}/favorite`, { method: 'POST', body: JSON.stringify({ value }) })
}

export async function loadCallHistory() {
  return api('/calls')
}

export async function logCallApi(entry) {
  return api('/calls', { method: 'POST', body: JSON.stringify(entry) })
}

export function seedIfEmpty() {
  // No-op with backend; keep for compatibility
}

// Auth APIs
export async function signup({ email, name, password }) {
  return api('/auth/signup', { method: 'POST', body: JSON.stringify({ email, name, password }) })
}

export async function login({ email, password }) {
  return api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}







// Group functions
export async function loadGroups() {
  return api('/groups')
}

export async function createGroup(name) {
  return api('/groups', { method: 'POST', body: JSON.stringify({ name }) })
}

export async function updateGroup(id, name) {
  return api(`/groups/${id}`, { method: 'PUT', body: JSON.stringify({ name }) })
}

export async function deleteGroup(id) {
  return api(`/groups/${id}`, { method: 'DELETE' })
}

export async function loadContactsByGroup(groupId) {
  return api(`/groups/${groupId}/contacts`)
}

export async function addContactToGroup(contactId, groupId) {
  return api(`/contacts/${contactId}/groups`, { method: 'POST', body: JSON.stringify({ groupId }) })
}

export async function removeContactFromGroup(contactId, groupId) {
  return api(`/contacts/${contactId}/groups/${groupId}`, { method: 'DELETE' })
}
