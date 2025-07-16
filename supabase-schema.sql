-- PulsePay Database Schema
-- Comprehensive schema for AI-powered emergency payment platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- USERS & AUTHENTICATION
-- ========================================

-- Extended user profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    date_of_birth DATE,
    emergency_contact TEXT,
    wallet_created BOOLEAN DEFAULT FALSE,
    setup_completed BOOLEAN DEFAULT FALSE,
    account_type TEXT DEFAULT 'user' CHECK (account_type IN ('user', 'admin', 'guest')),
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'expired')),
    fraud_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- WALLETS & BLOCKCHAIN
-- ========================================

-- Digital wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    wallet_address TEXT UNIQUE NOT NULL,
    wallet_type TEXT DEFAULT 'ethereum' CHECK (wallet_type IN ('ethereum', 'polygon', 'base')),
    balance DECIMAL(20, 8) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
    transaction_hash TEXT UNIQUE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'payment')),
    amount DECIMAL(20, 8) NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    block_number INTEGER,
    gas_used INTEGER,
    gas_price DECIMAL(20, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PAYMENTS & TRANSACTIONS
-- ========================================

-- Main payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('emergency', 'regular', 'refund')),
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT DEFAULT 'USD',
    recipient_name TEXT,
    recipient_address TEXT,
    recipient_phone TEXT,
    recipient_email TEXT,
    description TEXT,
    emergency_type TEXT CHECK (emergency_type IN ('medical', 'dental', 'pharmacy', 'ambulance', 'other')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    tx_hash TEXT UNIQUE,
    blockchain_network TEXT DEFAULT 'ethereum',
    fraud_score INTEGER DEFAULT 0,
    ai_verification_status TEXT DEFAULT 'pending' CHECK (ai_verification_status IN ('pending', 'approved', 'rejected', 'manual_review')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment verification logs
CREATE TABLE IF NOT EXISTS payment_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE NOT NULL,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('id_check', 'fraud_check', 'ai_analysis', 'manual_review')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'passed', 'failed', 'warning')),
    score DECIMAL(5, 2),
    details JSONB,
    verified_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- KYC & ID VERIFICATION
-- ========================================

-- KYC documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'drivers_license', 'national_id', 'utility_bill')),
    document_number TEXT,
    issuing_country TEXT,
    expiry_date DATE,
    document_url TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired')),
    ai_analysis_result JSONB,
    manual_review_notes TEXT,
    reviewed_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ID verification attempts
CREATE TABLE IF NOT EXISTS id_verification_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    verification_method TEXT NOT NULL CHECK (verification_method IN ('idanalyzer', 'openai', 'manual')),
    success BOOLEAN NOT NULL,
    confidence_score DECIMAL(5, 2),
    extracted_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- FRAUD DETECTION & SECURITY
-- ========================================

-- Fraud detection logs
CREATE TABLE IF NOT EXISTS fraud_detection_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    detection_type TEXT NOT NULL CHECK (detection_type IN ('device_fingerprint', 'behavioral_analysis', 'transaction_pattern', 'ai_analysis')),
    risk_score DECIMAL(5, 2) NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    flagged_reasons JSONB,
    action_taken TEXT CHECK (action_taken IN ('allow', 'block', 'review', 'flag')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device fingerprints
CREATE TABLE IF NOT EXISTS device_fingerprints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    device_hash TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    location_data JSONB,
    device_type TEXT,
    browser_info JSONB,
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- HEALTH & WELLNESS FEATURES
-- ========================================

-- Health tools usage
CREATE TABLE IF NOT EXISTS health_tools_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    tool_type TEXT NOT NULL CHECK (tool_type IN ('therapist_chat', 'posture_check', 'fitness_planner', 'saved_routines')),
    session_data JSONB,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Therapist chat sessions
CREATE TABLE IF NOT EXISTS therapist_chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    session_title TEXT,
    messages JSONB,
    ai_model_used TEXT,
    session_duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- AUDIT & LOGGING
-- ========================================

-- Audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage logs
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    api_endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- NOTIFICATIONS & COMMUNICATIONS
-- ========================================

-- Email notifications
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'payment_confirmation', 'security_alert', 'kyc_update', 'fraud_alert')),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_type ON user_profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_status ON user_profiles(kyc_status);

-- Wallets indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallets_active ON wallets(is_active);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_tx_hash ON payments(tx_hash);
CREATE INDEX IF NOT EXISTS idx_payments_emergency_type ON payments(emergency_type);

-- Wallet transactions indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_hash ON wallet_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);

-- KYC indexes
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(verification_status);

-- Fraud detection indexes
CREATE INDEX IF NOT EXISTS idx_fraud_logs_user_id ON fraud_detection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_payment_id ON fraud_detection_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_risk_level ON fraud_detection_logs(risk_level);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_tools_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND account_type = 'admin'
        )
    );

-- Wallets policies
CREATE POLICY "Users can view own wallets" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND account_type = 'admin'
        )
    );

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND account_type = 'admin'
        )
    );

-- KYC documents policies
CREATE POLICY "Users can view own KYC documents" ON kyc_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own KYC documents" ON kyc_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all KYC documents" ON kyc_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND account_type = 'admin'
        )
    );

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON kyc_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_therapist_chat_sessions_updated_at BEFORE UPDATE ON therapist_chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SAMPLE DATA INSERTS
-- ========================================

-- Insert sample admin user (password: admin123)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@pulsepay.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, email, full_name, account_type, kyc_verified, setup_completed)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@pulsepay.com',
    'PulsePay Admin',
    'admin',
    TRUE,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- User dashboard view
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.account_type,
    up.kyc_verified,
    up.setup_completed,
    w.wallet_address,
    w.balance,
    COUNT(p.id) as total_payments,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_spent,
    MAX(p.created_at) as last_payment_date
FROM user_profiles up
LEFT JOIN wallets w ON up.id = w.user_id AND w.is_active = TRUE
LEFT JOIN payments p ON up.id = p.user_id
GROUP BY up.id, up.email, up.full_name, up.account_type, up.kyc_verified, up.setup_completed, w.wallet_address, w.balance;

-- Payment analytics view
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as payment_date,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN emergency_type = 'medical' THEN 1 END) as medical_payments
FROM payments
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY payment_date DESC;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE user_profiles IS 'Extended user profiles with KYC and setup information';
COMMENT ON TABLE wallets IS 'Digital wallets for blockchain transactions';
COMMENT ON TABLE payments IS 'Main payments table for emergency and regular transactions';
COMMENT ON TABLE kyc_documents IS 'KYC document storage and verification status';
COMMENT ON TABLE fraud_detection_logs IS 'Fraud detection and security monitoring';
COMMENT ON TABLE audit_logs IS 'Audit trail for compliance and security';
COMMENT ON TABLE therapist_chat_sessions IS 'AI therapist chat sessions for health tools';

COMMENT ON COLUMN payments.emergency_type IS 'Type of emergency for categorization';
COMMENT ON COLUMN payments.fraud_score IS 'AI-calculated fraud risk score (0-100)';
COMMENT ON COLUMN payments.ai_verification_status IS 'AI verification status for payment approval';
COMMENT ON COLUMN user_profiles.fraud_score IS 'Overall user fraud risk score';
COMMENT ON COLUMN user_profiles.kyc_status IS 'KYC verification status for compliance'; 