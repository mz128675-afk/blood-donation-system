// ============================================================
// api.js — one small helper for every API call.
// Every page in the app uses these functions, so the fetch
// code (and the "API not reachable" message) lives in one place.
//
// SECURITY: fetch sends cookies (credentials: 'include') so the
// PHP session from the admin login travels with each request.
// Protected endpoints (admin) check that session.
// If the server returns field-specific errors, they are attached
// to the thrown Error as err.errors so forms can show them
// next to the right field.
// ============================================================
import { API_BASE_URL } from './config.js'

// Low-level helper: call the API and return the parsed JSON.
// If the server cannot be reached at all (XAMPP not running,
// wrong URL), throw a clear, friendly error.
async function request(path, options = {}) {
  let res
  try {
    res = await fetch(API_BASE_URL + path, {
      credentials: 'include', // send the PHP session cookie (admin login)
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    })
  } catch (e) {
    throw new Error(
      'Cannot reach the API at ' + API_BASE_URL +
      '. Start XAMPP (Apache + MySQL), import database/schema.sql, ' +
      'and check the API URL in src/config.js.'
    )
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) {
    const err = new Error(data.error || 'Request failed (HTTP ' + res.status + ')')
    if (data.errors) err.errors = data.errors // field-specific errors from the server
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  // GET /donors.php?blood_group=O+&city=Gujrat (both filters optional)
  searchDonors: (bloodGroup, city) => {
    const params = new URLSearchParams()
    if (bloodGroup) params.set('blood_group', bloodGroup)
    if (city) params.set('city', city)
    const query = params.toString()
    return request('/donors.php' + (query ? '?' + query : ''))
  },

  // POST /donors.php — { name, blood_group, city, phone, last_donation_date? }
  registerDonor: (donor) =>
    request('/donors.php', { method: 'POST', body: JSON.stringify(donor) }),

  // GET /requests.php?status=Pending (status filter optional) — ADMIN ONLY
  listRequests: (status) =>
    request('/requests.php' + (status ? '?status=' + status : '')),

  // POST /requests.php — { patient_name, blood_group, city, hospital, urgency }
  createRequest: (req) =>
    request('/requests.php', { method: 'POST', body: JSON.stringify(req) }),

  // PUT /requests.php — { id, status } (status: Pending / Fulfilled) — ADMIN ONLY
  updateRequestStatus: (id, status) =>
    request('/requests.php', { method: 'PUT', body: JSON.stringify({ id, status }) }),

  // POST /login.php — { username, password }
  login: (username, password) =>
    request('/login.php', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // GET /login.php — who is logged in right now? (session check)
  checkLogin: () => request('/login.php'),

  // POST /logout.php — ends the admin session
  logout: () =>
    request('/logout.php', { method: 'POST', body: JSON.stringify({}) }),
}
