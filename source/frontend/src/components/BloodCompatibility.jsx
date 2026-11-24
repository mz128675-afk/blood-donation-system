// ============================================================
// BloodCompatibility — "who can give blood to whom?"
// Tap a blood group to see which groups it can RECEIVE from
// and which groups it can DONATE to. (Standard transfusion rules.)
//
//   O- : gives to everyone, receives only from O-
//   AB+ : receives from everyone, gives only to AB+
// ============================================================
import { useState } from 'react'
import { BLOOD_GROUPS } from '../config.js'

// Who can GIVE blood to this group?
const CAN_RECEIVE_FROM = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
}

// Who can RECEIVE blood from this group?
const CAN_DONATE_TO = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
}

export default function BloodCompatibility() {
  const [selected, setSelected] = useState('O+')

  return (
    <section className="compat">
      <h3>Who can donate to whom?</h3>
      <p className="muted">Tap a blood group to see its matches.</p>

      <div className="compat-groups">
        {BLOOD_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            className={'compat-chip' + (selected === g ? ' active' : '')}
            onClick={() => setSelected(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="compat-panels">
        <div className="compat-panel">
          <h4>{selected} can receive from</h4>
          <div className="chip-row">
            {CAN_RECEIVE_FROM[selected].map((g) => (
              <span key={g} className="mini-chip receive">{g}</span>
            ))}
          </div>
          <p className="muted small">
            {selected === 'O-'
              ? 'O- is the universal donor — it can give to everyone, but can only receive O-.'
              : selected === 'AB+'
                ? 'AB+ is the universal receiver — it can receive from every group.'
                : 'Only these groups are a safe match for ' + selected + '.'}
          </p>
        </div>

        <div className="compat-panel">
          <h4>{selected} can donate to</h4>
          <div className="chip-row">
            {CAN_DONATE_TO[selected].map((g) => (
              <span key={g} className="mini-chip donate">{g}</span>
            ))}
          </div>
          <p className="muted small">
            {CAN_DONATE_TO[selected].length === 8
              ? 'O- can donate to every blood group.'
              : CAN_DONATE_TO[selected].length === 1
                ? 'AB+ can only donate to AB+.'
                : 'These groups can safely receive ' + selected + ' blood.'}
          </p>
        </div>
      </div>
    </section>
  )
}
