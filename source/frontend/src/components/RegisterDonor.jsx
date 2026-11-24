// ============================================================
// RegisterDonor — form to register a new blood donor.
// Validation runs on submit AND when you leave a field (blur),
// and each error appears right under its field. The same rules
// are checked again by the PHP API (never trust the browser
// alone). On success a toast appears and the form clears.
// ============================================================
import { useState } from 'react'
import { api } from '../api.js'
import { BLOOD_GROUPS } from '../config.js'
import { validateDonor } from '../validation.js'

export default function RegisterDonor({ showToast }) {
  const [name, setName] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [lastDonation, setLastDonation] = useState('')
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [saving, setSaving] = useState(false)

  const values = { name, bloodGroup, city, phone, lastDonation }
  const liveErrors = validateDonor(values)
  // Show an error only after the field was touched or the form was submitted.
  const showError = (field) => (touched[field] || submitted) && liveErrors[field]
  const hasErrors = Object.keys(liveErrors).length > 0

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setGeneralError('')
    if (hasErrors) return // stop here — the inline errors show what to fix

    setSaving(true)
    try {
      await api.registerDonor({
        name: name.trim(),
        blood_group: bloodGroup,
        city: city.trim(),
        phone: phone.trim(),
        last_donation_date: lastDonation || undefined,
      })
      showToast('Thank you, ' + name.trim() + '! You are now registered as a donor.')
      // Clear the form for the next donor.
      setName('')
      setBloodGroup('')
      setCity('')
      setPhone('')
      setLastDonation('')
      setErrors({})
      setTouched({})
      setSubmitted(false)
    } catch (err) {
      // Field errors from the server (same rules, checked again).
      if (err.errors) setErrors(err.errors)
      else setGeneralError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Server-side field errors win over the live ones.
  const fieldError = (field) => errors[field] || showError(field)

  return (
    <section>
      <h2>Register as a Donor</h2>
      <p className="muted">Fill in your details. Your blood group and city help patients find you.</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <label>
          Full name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlur('name')}
            placeholder="For example: Ahmed Raza"
            className={fieldError('name') ? 'invalid' : ''}
          />
          {fieldError('name') && <span className="field-error">{fieldError('name')}</span>}
        </label>

        <label>
          Blood group
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            onBlur={() => handleBlur('blood_group')}
            className={fieldError('blood_group') ? 'invalid' : ''}
          >
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {fieldError('blood_group') && <span className="field-error">{fieldError('blood_group')}</span>}
        </label>

        <label>
          City
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onBlur={() => handleBlur('city')}
            placeholder="For example: Gujrat"
            className={fieldError('city') ? 'invalid' : ''}
          />
          {fieldError('city') && <span className="field-error">{fieldError('city')}</span>}
        </label>

        <label>
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => handleBlur('phone')}
            placeholder="0301-2345678"
            className={fieldError('phone') ? 'invalid' : ''}
          />
          {fieldError('phone') && <span className="field-error">{fieldError('phone')}</span>}
        </label>

        <label>
          Last donation date (optional)
          <input
            type="date"
            value={lastDonation}
            onChange={(e) => setLastDonation(e.target.value)}
            onBlur={() => handleBlur('last_donation_date')}
            className={fieldError('last_donation_date') ? 'invalid' : ''}
          />
          {fieldError('last_donation_date') && <span className="field-error">{fieldError('last_donation_date')}</span>}
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Register as Donor'}
        </button>
      </form>

      {generalError && <p className="error">{generalError}</p>}
    </section>
  )
}
