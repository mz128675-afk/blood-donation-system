# Blood Donation Management System

A full-stack web app that connects blood donors with people who need blood. Built with React + PHP + MySQL for a university exhibition (Project #9 in the GitHub portfolio).

## What it does

- **Find a Donor** — search donors by blood group and city (for example: O+ in Gujrat)
- **Register as a Donor** — sign up with name, blood group, city, phone and last donation date
- **Request Blood** — send a blood request for a patient (blood group, city, hospital, urgency)
- **Admin Dashboard** — login, see stats (total donors, total requests, pending, fulfilled), manage requests (mark Fulfilled) and view all donors

## Tech used

- **React 19 + Vite** (frontend) — search page, forms, admin dashboard
- **PHP** (backend API, no framework) — PDO with prepared statements (SQL-injection safe)
- **MySQL** (database) — donors, blood_requests, users tables

## Project layout

```
blood-donation-system/
├── index.html, assets/, favicon.svg   — built frontend demo (GitHub Pages)
├── README.md
└── source/                 — full project source
    ├── database/
    │   └── schema.sql      — creates the database, tables + sample data
    ├── api/                — PHP API (copy to XAMPP htdocs)
    │   ├── config.php      — DB connection, CORS, JSON helpers
    │   ├── donors.php      — list/search + register donors
    │   ├── requests.php    — list/create requests + update status
    │   ├── login.php       — admin login
    │   └── logout.php      — admin logout
    └── frontend/           — Vite + React 19 app
        ├── src/config.js   — API base URL (change in ONE place)
        ├── src/api.js      — fetch wrapper for all API calls
        ├── src/validation.js — shared form validation rules
        ├── src/App.jsx     — tab navigation
        └── src/components/ — DonorSearch, RegisterDonor, RequestBlood, AdminDashboard, BloodCompatibility, Toast
```

## Setup (XAMPP on Windows)

1. **Database** — open phpMyAdmin (http://localhost/phpmyadmin), click **Import**, choose `source/database/schema.sql`, click **Go**. This creates the `blood_donation` database with 10 sample donors, 4 sample requests and the admin account.
2. **API** — copy the `source/api/` folder to `C:\xampp\htdocs\blood-donation-system\api` so the API lives at `http://localhost/blood-donation-system/api`.
3. **Frontend** — open a terminal in the `source/frontend/` folder and run:
   ```bash
   npm install
   npm run dev
   ```
   Then open the address Vite prints (usually http://localhost:5173).
4. **API URL** — if your setup is different, change the address in ONE place: `source/frontend/src/config.js` (`API_BASE_URL`).

> **Note:** the API uses `mb_strlen` for name-length checks, so the PHP **mbstring** extension must be enabled. It is enabled by default in XAMPP. On Linux, install it with `sudo apt install php-mbstring`.

## Demo admin login

- Username: `admin`
- Password: `admin123`

This is a **demo password — change it before real use** (make a new hash with `password_hash('new-password', PASSWORD_DEFAULT)` in PHP and update the `users` table).

## Security

What is protected:
- **Prepared statements everywhere** — every SQL query uses `?` placeholders with PDO, so user input can never break the SQL (no SQL injection).
- **Input validation on every endpoint** — the PHP API checks every field (required fields, valid blood group, Pakistani phone format `03XX-XXXXXXX`, real dates, last donation 3+ months ago) and rejects bad input with a `400` and field-specific errors. The React forms check the same rules first for instant feedback, but the server never trusts the browser alone.
- **Passwords** — stored as bcrypt hashes (`password_hash`), checked with `password_verify`. Plain-text passwords are never stored or compared.
- **Admin-only endpoints** — listing blood requests and changing a request's status require an admin login. Login creates a PHP session (new session id after login, HttpOnly cookie); protected endpoints check it with `requireAdmin()` and answer `401` without a session. The dashboard asks the server who is logged in — the browser's storage is never trusted for login state.
- **No leaked internals** — database errors are written to the server log only; the client gets a generic "Something went wrong" message, never raw errors or stack traces.
- **CORS** — only the frontend origin is allowed (see `ALLOWED_ORIGIN` in `api/config.php`, default `http://localhost:5173`), not a wide-open `*`. The API also sends credentials for the session cookie.
- **Output safety** — React escapes all rendered text by default; `dangerouslySetInnerHTML` is not used anywhere.
- **Credentials** — database credentials live only in `api/config.php` (XAMPP defaults for local use). No real production credentials anywhere in the project.

Intentionally simple (demo / student project, local use only):
- Demo admin account (`admin` / `admin123`) — change the password before any real use.
- No rate limiting on login, no HTTPS enforcement, no CSRF tokens — fine for a local exhibition demo, not for a public server.
- The frontend build is static; the live site needs a PHP + MySQL host for the API to work.

## Design

Premium, warm UI: blood-red `#DC2626` accents, warm off-white background, dark slate text, Sora headings + Inter body, hero section with a blood-drop and heartbeat motif, hover-lift cards, animated admin stat counters, instant search filtering, toasts on success, and an interactive blood-group compatibility guide.

## 3-minute exhibition demo script

1. **Search (30 sec)** — open "Find a Donor", pick blood group **O+**, type city **Gujrat**, press Search. The donor list appears (Ahmed Raza, O+, Gujrat).
2. **Register (45 sec)** — open "Register as Donor", fill in a new donor (any name, blood group, city, phone) and submit. The success message appears.
3. **Request (45 sec)** — open "Request Blood", fill in a patient (name, blood group, city, hospital, Urgency) and send. Status starts as Pending.
4. **Admin (60 sec)** — open "Admin", log in with **admin / admin123**. Show the stats cards (donors, requests, pending, fulfilled), find the new request in the table and press **Mark Fulfilled**. The status changes and the Fulfilled count goes up.

## Live demo

Frontend demo: https://mz128675-afk.github.io/blood-donation-system/ — this is the built React app. The demo shows the design and the forms, but the search/register/request features need the PHP + MySQL API (run it locally on XAMPP, or any PHP hosting) before the live site can talk to the database.
