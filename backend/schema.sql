-- =============================================================================
-- AgriTrack PostgreSQL Database Schema
-- Compatible with PostgreSQL 13+ (Supabase, Neon, AWS RDS, Local PostgreSQL)
-- =============================================================================

-- This file is deliberately safe to run repeatedly. It creates missing tables,
-- indexes, and seed records without deleting existing application data.

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin')),
    farm_name VARCHAR(255),
    location VARCHAR(255),
    phone VARCHAR(64),
    account_status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'deactivated')),
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist if table was already created
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 1b. EMAIL OTP VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS otp_verifications (
    verification_id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON otp_verifications(LOWER(email));


-- 2. CROP CYCLES TABLE
CREATE TABLE IF NOT EXISTS crop_cycles (
    crop_cycle_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    crop_type VARCHAR(255) NOT NULL,
    farm_name VARCHAR(255),
    land_area NUMERIC(10, 2),
    land_area_unit VARCHAR(32) DEFAULT 'Acres',
    seeding_date DATE NOT NULL,
    expected_harvest_date DATE NOT NULL,
    actual_harvest_date DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'Growing' CHECK (status IN ('Planned', 'Growing', 'Ready to Harvest', 'Harvested')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_harvest_after_seeding CHECK (expected_harvest_date >= seeding_date)
);

-- 3. FARMING EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    expense_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    crop_cycle_id VARCHAR(64) REFERENCES crop_cycles(crop_cycle_id) ON DELETE SET NULL,
    type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    duration VARCHAR(128),
    labour_count INTEGER,
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. AGRICULTURAL INCOME & MANDI SALES TABLE
CREATE TABLE IF NOT EXISTS income (
    income_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    crop_cycle_id VARCHAR(64) REFERENCES crop_cycles(crop_cycle_id) ON DELETE SET NULL,
    crop_type VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    quantity_unit VARCHAR(32) NOT NULL DEFAULT 'quintal',
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price > 0),
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount > 0),
    sale_date DATE NOT NULL,
    buyer_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. ACTIVITY AUDIT TRAIL TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    action_type VARCHAR(32) NOT NULL,
    entity_type VARCHAR(32) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_crop_cycles_user_seeding ON crop_cycles(user_id, seeding_date DESC);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_user_harvest ON crop_cycles(user_id, expected_harvest_date ASC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_crop_cycle ON expenses(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_income_crop_cycle ON income(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_ts ON activity_logs(user_id, timestamp DESC);

-- =============================================================================
-- INITIAL SEED DATA
-- =============================================================================

-- Seed Users. The primary administrator uses password123; demo accounts use farmer123.
INSERT INTO users (uid, full_name, email, password_hash, role, farm_name, location, phone, account_status)
VALUES 
('admin_krishna', 'Krishna Prasath', 'krishnaprasath720@gmail.com', '$2b$10$LqPnrPd7dON2hM72FIfTJu4MUP71Fgaht3Ue4WXi/vcLnxPtp9saW', 'admin', 'AgriTrack Central Command', 'Tamil Nadu, India', '+91 98765 00001', 'active'),
('demo_farmer_1', 'Rajesh Kumar', 'farmer@agritrack.com', '$2a$10$w09Zl/GgP7bK5hDq4yTveO8B8Ufq8r0JbXbYvJ5Y6a7h.ZfS3i96K', 'farmer', 'Green Valley Agro Farm', 'Ludhiana, Punjab', '+91 98765 43210', 'active'),
('demo_admin_1', 'Dr. Anita Sharma', 'admin@agritrack.com', '$2a$10$w09Zl/GgP7bK5hDq4yTveO8B8Ufq8r0JbXbYvJ5Y6a7h.ZfS3i96K', 'admin', 'Agri Advisory Center', 'New Delhi, India', '+91 98111 22334', 'active'),
('demo_farmer_2', 'Suresh Patel', 'suresh@patelfarms.in', '$2a$10$w09Zl/GgP7bK5hDq4yTveO8B8Ufq8r0JbXbYvJ5Y6a7h.ZfS3i96K', 'farmer', 'Patel Organic Acres', 'Anand, Gujarat', '+91 97234 56789', 'active'),
('demo_farmer_3', 'Rameshwar Reddy', 'reddy@deccanfarms.com', '$2a$10$w09Zl/GgP7bK5hDq4yTveO8B8Ufq8r0JbXbYvJ5Y6a7h.ZfS3i96K', 'farmer', 'Deccan Agri Estate', 'Warangal, Telangana', '+91 94401 23456', 'deactivated')
ON CONFLICT (uid) DO NOTHING;

-- Seed Crop Cycles
INSERT INTO crop_cycles (crop_cycle_id, user_id, crop_type, farm_name, land_area, land_area_unit, seeding_date, expected_harvest_date, status, notes)
VALUES
('crop_101', 'demo_farmer_1', 'Basmati Rice (Pusa 1121)', 'North Field A1', 6.00, 'Acres', '2024-06-15', '2024-10-30', 'Growing', 'Premium grain variety; drip fertigation applied in mid-August.'),
('crop_102', 'demo_farmer_1', 'Hybrid Cotton (Bt-Cotton)', 'South Plot B3', 4.50, 'Acres', '2024-05-10', '2024-10-12', 'Ready to Harvest', 'High boll retention; ready for first manual picking.'),
('crop_103', 'demo_farmer_1', 'Sharbati Wheat (Golden Grain)', 'North Field A2', 8.00, 'Acres', '2024-11-15', '2025-03-25', 'Planned', 'Rabi crop scheduled post-rice harvest. Certified seeds secured.'),
('crop_104', 'demo_farmer_1', 'Sugarcane (Co-0238)', 'River Delta Plot', 3.00, 'Acres', '2023-11-01', '2024-09-15', 'Harvested', 'Excellent sucrose content; crushed at local cooperative mill.')
ON CONFLICT (crop_cycle_id) DO NOTHING;

-- Seed Expenses
INSERT INTO expenses (expense_id, user_id, crop_cycle_id, type, description, amount, duration, labour_count, expense_date)
VALUES
('exp_201', 'demo_farmer_1', 'crop_101', 'Seeds', 'Certified Pusa-1121 Paddy Seeds (50 kg)', 9500.00, 'Single purchase', NULL, '2024-06-12'),
('exp_202', 'demo_farmer_1', 'crop_101', 'Fertilizers', 'DAP & Urea micro-nutrient blend (12 bags)', 18200.00, 'Basal dose', NULL, '2024-06-25'),
('exp_203', 'demo_farmer_1', 'crop_101', 'Labour', 'Manual paddy transplantation labour crew', 22000.00, '3 days', 8, '2024-07-02'),
('exp_204', 'demo_farmer_1', 'crop_102', 'Pesticides', 'Organic Neem extract & bollworm prevention spray', 8600.00, '2 spray cycles', NULL, '2024-07-18'),
('exp_205', 'demo_farmer_1', 'crop_102', 'Machinery rental', 'Tractor with cultivator for inter-row weed clearance', 12500.00, '12 hours', NULL, '2024-08-05'),
('exp_206', 'demo_farmer_1', 'crop_104', 'Labour', 'Sugarcane harvesting and bundle tying team', 28000.00, '5 days', 10, '2024-09-14'),
('exp_207', 'demo_farmer_1', NULL, 'Electricity', 'Tubewell grid electricity bill for farm irrigation', 4800.00, 'Monthly', NULL, '2024-09-28'),
('exp_208', 'demo_farmer_1', NULL, 'Equipment', 'Replacement drip irrigation filters & nozzles', 6400.00, 'Hardware maintenance', NULL, '2024-10-02')
ON CONFLICT (expense_id) DO NOTHING;

-- Seed Income
INSERT INTO income (income_id, user_id, crop_cycle_id, crop_type, quantity, quantity_unit, unit_price, total_amount, sale_date, buyer_name, notes)
VALUES
('inc_301', 'demo_farmer_1', 'crop_104', 'Sugarcane (Co-0238)', 62.00, 'tonne', 3500.00, 217000.00, '2024-09-22', 'Kisan Sugar Mill Cooperative', 'Grade A sugar content delivery slip #4029'),
('inc_302', 'demo_farmer_1', 'crop_102', 'Hybrid Cotton (Bt-Cotton)', 18.00, 'quintal', 7200.00, 129600.00, '2024-10-05', 'Vardhman Textiles Mandi', 'First picking batch; high staple length premium'),
('inc_303', 'demo_farmer_1', 'crop_104', 'Sugarcane Tops (Fodder)', 110.00, 'bags', 180.00, 19800.00, '2024-09-26', 'Local Dairy Farmers Union', 'Byproduct green fodder sale')
ON CONFLICT (income_id) DO NOTHING;

-- Seed Activity Logs
INSERT INTO activity_logs (log_id, user_id, action_type, entity_type, entity_id, description, timestamp)
VALUES
('log_401', 'demo_farmer_1', 'created', 'cropCycle', 'crop_103', 'Planned new crop cycle: Sharbati Wheat (Golden Grain) on North Field A2 (8 Acres)', '2024-09-01 10:00:00+00'),
('log_402', 'demo_farmer_1', 'status_change', 'cropCycle', 'crop_104', 'Marked Sugarcane (Co-0238) as Harvested', '2024-09-18 16:30:00+00'),
('log_403', 'demo_farmer_1', 'created', 'income', 'inc_301', 'Recorded sale: 62 tonne Sugarcane to Kisan Sugar Mill Cooperative for ₹2,17,000', '2024-09-22 13:00:00+00'),
('log_404', 'demo_farmer_1', 'created', 'expense', 'exp_207', 'Added Electricity expense: Tubewell grid electricity bill for ₹4,800', '2024-09-28 12:00:00+00'),
('log_405', 'demo_farmer_1', 'status_change', 'cropCycle', 'crop_102', 'Updated Hybrid Cotton status to Ready to Harvest', '2024-10-01 11:00:00+00'),
('log_406', 'demo_farmer_1', 'created', 'income', 'inc_302', 'Recorded sale: 18 quintal Hybrid Cotton to Vardhman Textiles Mandi for ₹1,29,600', '2024-10-05 15:40:00+00')
ON CONFLICT (log_id) DO NOTHING;
