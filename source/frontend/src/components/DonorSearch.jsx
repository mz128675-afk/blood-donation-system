// ============================================================
// DonorSearch — find donors by blood group and city.
// The list filters INSTANTLY as you type or pick a group
// (300 ms debounce, so we don't call the API on every keystroke).
// The Search button forces an immediate search.
// Below the results: an interactive blood-group compatibility
// guide (who can donate to whom).
// ============================================================
import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { BLOOD_GROUPS } from '../config.js'
import BloodCompatibility from './BloodCompatibility.jsx'

export default function DonorSearch() {
  const [bloodGroup, setBloodGroup] = useState('')
  const [city, setCity] = useState('')
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Ask the API for donors (with the current filters).
  async function loadDonors(group, cityName) {
    setLoading(true)
    setError('')
    try {
      const data = await api.searchDonors(group, cityName)
      setDonors(data.donors)
    } catch (e) {
      setError(e.message)
      setDonors([])
    } finally {
      setLoading(false)
    }
  }

  // Instant filtering: whenever the group or city changes,
  // wait 300 ms (so typing doesn't spam the API) then search.
  // This also loads all donors when the page first opens.
  useEffect(() => {
    const timer = setTimeout(() => loadDonors(bloodGroup, city.trim()), 300)
    return () => clearTimeout(timer)
  }, [bloodGroup, city])

  function handleSearch(e) {
    e.preventDefault()
    loadDonors(bloodGroup, city.trim())
  }

  return (
    <section>
      <h2>Find a Blood Donor</h2>
      <p className="muted">Choose a blood group and a city — the list updates as you type.</p>

      <form className="search-bar" onSubmit={handleSearch}>
        <select
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
          aria-label="Blood group"
        >
          <option value="">All blood groups</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="City (for example: Gujrat)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {!error && !loading && (
        <p className="count">
          {donors.length} {donors.length === 1 ? 'donor' : 'donors'} found
          {bloodGroup ? ` with blood group ${bloodGroup}` : ''}
          {city.trim() ? ` in ${city.trim()}` : ''}
        </p>
      )}

      {!error && !loading && donors.length === 0 && (
        <p className="empty">No donor found. Try a different blood group or city.</p>
      )}

      <div className="grid">
        {donors.map((donor) => (
          <div className="card" key={donor.id}>
            <span className="blood-badge">{donor.blood_group}</span>
            <h3>{donor.name}</h3>
            <p><strong>City:</strong> {donor.city}</p>
            <p><strong>Phone:</strong> {donor.phone}</p>
            <p>
              <strong>Last donation:</strong>{' '}
              {donor.last_donation_date || 'Not donated yet'}
            </p>
          </div>
        ))}
      </div>

      <BloodCompatibility />
    </section>
  )
}
