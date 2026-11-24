// ============================================================
// config.js — the ONLY place the API address lives.
// Change it here if your setup is different.
//
// XAMPP default setup:
//   1. Copy the api/ folder to C:\xampp\htdocs\blood-donation-system\api
//   2. Start Apache + MySQL in the XAMPP control panel
//   3. The API is then at http://localhost/blood-donation-system/api
// ============================================================
export const API_BASE_URL = 'http://localhost/blood-donation-system/api'

// The 8 blood groups — used in every select box in the app.
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
