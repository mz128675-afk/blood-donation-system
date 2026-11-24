-- ============================================================
-- Blood Donation Management System — database schema
-- Database: blood_donation
--
-- HOW TO USE (XAMPP):
--   1. Open phpMyAdmin (http://localhost/phpmyadmin)
--   2. Click "Import", choose this file, click "Go"
--   3. The database, tables and sample data are created for you
--
-- TABLES:
--   donors         — people who registered as blood donors
--   blood_requests — blood requests from patients / hospitals
--   users          — admin login accounts
-- ============================================================

CREATE DATABASE IF NOT EXISTS blood_donation
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE blood_donation;

-- -------------------------
-- Table: donors
-- -------------------------
CREATE TABLE IF NOT EXISTS donors (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(100) NOT NULL,
  blood_group        ENUM('A+','A-','B+','B-','O+','O-','AB+','AB-') NOT NULL,
  city               VARCHAR(100) NOT NULL,
  phone              VARCHAR(20)  NOT NULL,
  last_donation_date DATE NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------
-- Table: blood_requests
-- -------------------------
CREATE TABLE IF NOT EXISTS blood_requests (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(100) NOT NULL,
  blood_group  ENUM('A+','A-','B+','B-','O+','O-','AB+','AB-') NOT NULL,
  city         VARCHAR(100) NOT NULL,
  hospital     VARCHAR(150) NOT NULL,
  urgency      ENUM('Normal','Urgent','Critical') NOT NULL DEFAULT 'Normal',
  status       ENUM('Pending','Fulfilled') NOT NULL DEFAULT 'Pending',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------
-- Table: users (admin login)
-- -------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin') NOT NULL DEFAULT 'admin'
);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- 10 sample donors from Pakistani cities, all blood groups
INSERT INTO donors (name, blood_group, city, phone, last_donation_date) VALUES
  ('Ahmed Raza',      'O+',  'Gujrat',      '0301-2345678', '2026-08-15'),
  ('Fatima Noor',     'A+',  'Lahore',      '0321-7654321', '2026-09-02'),
  ('Bilal Ahmed',     'B+',  'Rawalpindi',  '0333-1122334', '2026-07-20'),
  ('Ayesha Khan',     'O-',  'Islamabad',   '0345-5566778', '2026-10-05'),
  ('Usman Ali',       'AB+', 'Faisalabad',  '0300-9988776', '2026-06-11'),
  ('Zainab Tariq',    'A-',  'Gujrat',      '0312-4455667', NULL),
  ('Hassan Malik',    'B-',  'Lahore',      '0322-3344556', '2026-09-18'),
  ('Maryam Siddiqui', 'O+',  'Karachi',     '0331-7788990', '2026-08-30'),
  ('Ali Hussain',     'AB-', 'Rawalpindi',  '0346-2233445', NULL),
  ('Sana Iqbal',      'B+',  'Gujrat',      '0302-6677889', '2026-10-22');

-- 4 sample blood requests (mixed statuses)
INSERT INTO blood_requests (patient_name, blood_group, city, hospital, urgency, status) VALUES
  ('Muhammad Asif',  'O+',  'Gujrat',      'Aziz Bhatti Shaheed Hospital', 'Urgent',   'Pending'),
  ('Hina Shahid',    'A-',  'Lahore',      'Services Hospital',            'Critical', 'Pending'),
  ('Kamran Yousuf',  'B+',  'Rawalpindi',  'Holy Family Hospital',         'Normal',   'Fulfilled'),
  ('Rabia Anwar',    'AB+', 'Islamabad',   'PIMS Hospital',                'Urgent',   'Pending');

-- Demo admin account: username "admin", password "admin123"
-- The hash below is made with PHP password_hash() (bcrypt).
-- This is a DEMO password — change it before real use.
INSERT INTO users (username, password_hash, role) VALUES
  ('admin', '$2y$10$anDemfvJGCnQVrYQCM3gZeG6zHNV8ChYb5uM2Buv/vMFkWJJLTzV.', 'admin');
