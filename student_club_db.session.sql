-- ============================================================
-- Student Club Hub — MySQL Workbench Setup Script
-- Run this ONCE in MySQL Workbench to create the database.
-- Spring Boot (DatabaseSeeder) will create all tables and
-- seed departments, admin user, and sample events on startup.
-- ============================================================

-- Step 1: Create the database (drops existing one if present)
DROP DATABASE IF EXISTS student_club_db;
CREATE DATABASE student_club_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Step 2: Verify it was created
SHOW DATABASES LIKE 'student_club_db';

-- ============================================================
-- That's it! Do NOT manually insert users or departments here.
-- Spring Boot's DatabaseSeeder handles all seed data on startup.
--
-- Default seeded credentials:
--   Admin:   admin@club.com   / admin123
--   Student: student@club.com / student123
-- ============================================================
