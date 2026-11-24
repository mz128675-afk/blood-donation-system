// ============================================================
// App — the main page of the Blood Donation Management System.
// Hero section on top, simple tab navigation below it:
// Search Donors | Register Donor | Request Blood | Admin.
// The toast (success message) lives here so every tab can
// show one through the showToast prop.
// ============================================================
import { useCallback, useRef, useState } from 'react'
import DonorSearch from './components/DonorSearch.jsx'
import RegisterDonor from './components/RegisterDonor.jsx'
import RequestBlood from './components/RequestBlood.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import Toast from './components/Toast.jsx'

const TABS = [
  { id: 'search', label: 'Find a Donor' },
  { id: 'register', label: 'Register as Donor' },
  { id: 'request', label: 'Request Blood' },
  { id: 'admin', label: 'Admin' },
]

export default function App() {
  const [tab, setTab] = useState('search')
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  // Show a toast for 4 seconds, then hide it.
  const showToast = useCallback((message) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 4000)
  }, [])

  function goTo(tabId) {
    setTab(tabId)
    document.querySelector('main')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="app">
      {/* ---------- Hero ---------- */}
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <span className="hero-eyebrow">Blood Donation Management System</span>
            <h1>One drop can <span className="hero-red">save a life.</span></h1>
            <p>
              Find a donor in seconds, register as a donor, or send a blood
              request — and help the blood bank match every patient in time.
            </p>
            <div className="hero-cta">
              <button onClick={() => goTo('search')}>Find a Donor</button>
              <button className="outline" onClick={() => goTo('register')}>Become a Donor</button>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <svg className="drop" viewBox="0 0 100 120" width="120" height="144">
              <path
                d="M50 4 C50 4 12 52 12 74 A38 38 0 0 0 88 74 C88 52 50 4 50 4 Z"
                fill="#DC2626"
              />
              <ellipse cx="38" cy="76" rx="8" ry="12" fill="#fff" opacity="0.35" />
            </svg>
            <svg className="heartbeat" viewBox="0 0 220 40" width="220" height="40">
              <polyline
                points="0,20 50,20 65,20 75,6 88,34 98,20 115,20 130,20 140,12 150,28 160,20 220,20"
                fill="none"
                stroke="#DC2626"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="hero-note">Every 2 seconds, someone needs blood.</p>
          </div>
        </div>
      </header>

      {/* ---------- Tabs ---------- */}
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'search' && <DonorSearch />}
        {tab === 'register' && <RegisterDonor showToast={showToast} />}
        {tab === 'request' && <RequestBlood showToast={showToast} />}
        {tab === 'admin' && <AdminDashboard showToast={showToast} />}
      </main>

      <footer className="footer">
        Built with React + Vite — Blood Donation Management System by Mirza Zubair
      </footer>

      <Toast message={toast} />
    </div>
  )
}
