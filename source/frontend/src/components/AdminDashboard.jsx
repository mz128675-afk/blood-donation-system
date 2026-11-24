// ============================================================
// AdminDashboard — admin login + stats + request management.
//   1. On load it asks the server "who is logged in?"
//      (GET /login.php). The SERVER decides — the browser's
//      localStorage is never trusted for login state.
//   2. Login form (username + password) -> POST /login.php.
//      The server creates a PHP session; later requests send
//      the session cookie, so protected endpoints know it's us.
//   3. After login: animated stats cards, requests table,
//      donors list. "Mark Fulfilled" sends PUT /requests.php.
//   4. Log Out calls POST /logout.php and clears the session.
// ============================================================
import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { validateLogin } from '../validation.js'

// AnimatedNumber — counts up from 0 to `value` in ~0.9 seconds.
// Used for the stats cards so the numbers feel alive.
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let raf
    const start = performance.now()
    const duration = 900
    function tick(now) {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic: fast start, soft landing
      setDisplay(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <>{display}</>
}

export default function AdminDashboard({ showToast }) {
  const [admin, setAdmin] = useState('')
  const [checking, setChecking] = useState(true) // asking the server who is logged in
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [donors, setDonors] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const liveErrors = validateLogin({ username, password })
  const showError = (field) => (touched[field] || submitted) && liveErrors[field]
  const hasErrors = Object.keys(liveErrors).length > 0

  // Load donors + requests (admin only — the server checks the session).
  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [donorData, requestData] = await Promise.all([
        api.searchDonors('', ''),
        api.listRequests(''),
      ])
      setDonors(donorData.donors)
      setRequests(requestData.requests)
    } catch (e) {
      setError(e.message)
      // A 401 here means the session ended — show the login form again.
      if (e.status === 401) setAdmin('')
    } finally {
      setLoading(false)
    }
  }

  // On first load: ask the server if an admin session already exists.
  useEffect(() => {
    api.checkLogin()
      .then((data) => {
        setAdmin(data.username)
        loadData()
      })
      .catch(() => setAdmin(''))
      .finally(() => setChecking(false))
  }, [])

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function handleLogin(e) {
    e.preventDefault()
    setSubmitted(true)
    setError('')
    if (hasErrors) return // stop here — the inline errors show what to fix

    setLoggingIn(true)
    try {
      const data = await api.login(username.trim(), password)
      setAdmin(data.username)
      setUsername('')
      setPassword('')
      setErrors({})
      setTouched({})
      setSubmitted(false)
      showToast('Welcome back, ' + data.username + '!')
      loadData()
    } catch (err) {
      if (err.errors) setErrors(err.errors)
      else setError(err.message)
    } finally {
      setLoggingIn(false)
    }
  }

  async function handleLogout() {
    try {
      await api.logout()
    } catch (e) {
      // Even if the call fails, clear the local state.
    }
    setAdmin('')
    setDonors([])
    setRequests([])
  }

  // Mark one request Fulfilled, then reload the lists.
  async function markFulfilled(id) {
    setError('')
    try {
      await api.updateRequestStatus(id, 'Fulfilled')
      showToast('Request #' + id + ' marked as Fulfilled.')
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const fieldError = (field) => errors[field] || showError(field)

  // ----- Still checking the session -----
  if (checking) {
    return (
      <section>
        <h2>Admin Dashboard</h2>
        <p className="muted">Checking login...</p>
      </section>
    )
  }

  // ----- Login form (shown when not logged in) -----
  if (!admin) {
    return (
      <section>
        <h2>Admin Login</h2>
        <p className="muted">Only the blood bank admin can open the dashboard.</p>
        <form className="form" onSubmit={handleLogin} noValidate>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => handleBlur('username')}
              placeholder="admin"
              className={fieldError('username') ? 'invalid' : ''}
            />
            {fieldError('username') && <span className="field-error">{fieldError('username')}</span>}
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="admin123"
              className={fieldError('password') ? 'invalid' : ''}
            />
            {fieldError('password') && <span className="field-error">{fieldError('password')}</span>}
          </label>
          <button type="submit" disabled={loggingIn}>
            {loggingIn ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <p className="muted">Demo login: username <strong>admin</strong>, password <strong>admin123</strong></p>
      </section>
    )
  }

  // ----- Dashboard (shown after login) -----
  const pending = requests.filter((r) => r.status === 'Pending').length
  const fulfilled = requests.filter((r) => r.status === 'Fulfilled').length

  return (
    <section>
      <div className="admin-head">
        <h2>Admin Dashboard</h2>
        <button className="secondary" onClick={handleLogout}>Log Out ({admin})</button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="stats">
        <div className="stat"><span className="stat-num"><AnimatedNumber value={donors.length} /></span><span>Total Donors</span></div>
        <div className="stat"><span className="stat-num"><AnimatedNumber value={requests.length} /></span><span>Total Requests</span></div>
        <div className="stat"><span className="stat-num"><AnimatedNumber value={pending} /></span><span>Pending</span></div>
        <div className="stat"><span className="stat-num"><AnimatedNumber value={fulfilled} /></span><span>Fulfilled</span></div>
      </div>

      <h3>Blood Requests</h3>
      {loading && <p>Loading...</p>}
      {!loading && requests.length === 0 && <p className="empty">No requests yet.</p>}
      {!loading && requests.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Blood</th>
                <th>City</th>
                <th>Hospital</th>
                <th>Urgency</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.patient_name}</td>
                  <td><span className="blood-badge small">{r.blood_group}</span></td>
                  <td>{r.city}</td>
                  <td>{r.hospital}</td>
                  <td><span className={'urgency ' + r.urgency.toLowerCase()}>{r.urgency}</span></td>
                  <td>{r.status}</td>
                  <td>
                    {r.status === 'Pending' && (
                      <button className="small-btn" onClick={() => markFulfilled(r.id)}>
                        Mark Fulfilled
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>Registered Donors</h3>
      {!loading && donors.length === 0 && <p className="empty">No donors yet.</p>}
      {!loading && donors.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Blood</th>
                <th>City</th>
                <th>Phone</th>
                <th>Last Donation</th>
              </tr>
            </thead>
            <tbody>
              {donors.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td><span className="blood-badge small">{d.blood_group}</span></td>
                  <td>{d.city}</td>
                  <td>{d.phone}</td>
                  <td>{d.last_donation_date || 'Not donated yet'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
