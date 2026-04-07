-- =============================================================
-- Smart Campus Incident Hub — Sample SQL for MySQL
-- Run this MANUALLY only if you prefer pre-loaded data.
-- Hibernate auto-creates the schema via ddl-auto=update.
-- =============================================================

-- Passwords below are BCrypt hashes of "Admin@12345", "Tech@12345", "User@12345"
-- (The DataSeeder handles this automatically on first run — this is just for reference)

-- Create the database (if not using createDatabaseIfNotExist URL param)
CREATE DATABASE IF NOT EXISTS smartcampus_incidents
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartcampus_incidents;

-- Quick check: list tables after Hibernate auto-creates them
-- SHOW TABLES;

-- Manually insert an extra test ADMIN (optional):
-- INSERT INTO users (name, email, password, role, department, active, created_at, updated_at)
-- VALUES (
--   'Super Admin',
--   'superadmin@smartcampus.edu',
--   '$2a$12$XXXXXX....',   -- generate with BCrypt online tool
--   'ADMIN',
--   'IT',
--   1,
--   NOW(), NOW()
-- );
