-- PulsePay Supabase Database Setup
-- This file contains all necessary tables, RLS policies, and admin features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'guest');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE fraud_score AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role user_role DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    profile_image_url TEXT,
    emergency_contact JSONB,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Payments table
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    tx_hash TEXT,
    blockchain_network TEXT,
    hospital_id UUID,
    description TEXT,
    emergency_type TEXT,
    fraud_score fraud_score,
    verification_status verification_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    receipt_url TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Hospitals table
CREATE TABLE public.hospitals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT DEFAULT 'USA',
    phone TEXT,
    email TEXT,
    website TEXT,
    coordinates POINT,
    rating DECIMAL(3,2),
    specialties TEXT[],
    services TEXT[],
    amenities TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    partnership_level TEXT DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Banks table
CREATE TABLE public.banks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    partnership_level TEXT DEFAULT 'standard',
    services TEXT[],
    benefits TEXT[],
    headquarters TEXT,
    founded_year INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Fraud checks table
CREATE TABLE public.fraud_checks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL, -- 'device', 'email', 'phone', 'id'
    provider TEXT NOT NULL, -- 'telesign', 'idanalyzer', 'openai'
    score DECIMAL(3,2),
    risk_level fraud_score,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- ID verifications table
CREATE TABLE public.id_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'passport', 'drivers_license', 'national_id'
    document_number TEXT,
    verification_status verification_status DEFAULT 'pending',
    provider TEXT NOT NULL, -- 'idanalyzer', 'openai'
    extracted_data JSONB,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Audit logs table
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Email templates table
CREATE TABLE public.email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email logs table
CREATE TABLE public.email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'delivered', 'failed', 'bounced'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Admin settings table
CREATE TABLE public.admin_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);
CREATE INDEX idx_fraud_checks_user_id ON public.fraud_checks(user_id);
CREATE INDEX idx_fraud_checks_payment_id ON public.fraud_checks(payment_id);
CREATE INDEX idx_id_verifications_user_id ON public.id_verifications(user_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_hospitals_city ON public.hospitals(city);
CREATE INDEX idx_hospitals_coordinates ON public.hospitals USING GIST(coordinates);
CREATE INDEX idx_banks_name ON public.banks(name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banks_updated_at BEFORE UPDATE ON public.banks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_id_verifications_updated_at BEFORE UPDATE ON public.id_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit log trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
        VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
        VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_users_trigger AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_payments_trigger AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_fraud_checks_trigger AFTER INSERT OR UPDATE OR DELETE ON public.fraud_checks FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_id_verifications_trigger AFTER INSERT OR UPDATE OR DELETE ON public.id_verifications FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Hospitals policies (public read, admin write)
CREATE POLICY "Anyone can view hospitals" ON public.hospitals
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage hospitals" ON public.hospitals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Banks policies (public read, admin write)
CREATE POLICY "Anyone can view banks" ON public.banks
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage banks" ON public.banks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Fraud checks policies
CREATE POLICY "Users can view own fraud checks" ON public.fraud_checks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all fraud checks" ON public.fraud_checks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ID verifications policies
CREATE POLICY "Users can view own verifications" ON public.id_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications" ON public.id_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Audit logs policies (admin only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Email templates policies (admin only)
CREATE POLICY "Admins can manage email templates" ON public.email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Email logs policies (admin only)
CREATE POLICY "Admins can view email logs" ON public.email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin settings policies (admin only)
CREATE POLICY "Admins can manage settings" ON public.admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default admin user (password: admin123)
-- Note: This should be changed in production
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    uuid_generate_v4(),
    'admin@pulsepay.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    '',
    '',
    '',
    ''
);

-- Insert admin user profile
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_verified
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@pulsepay.com'),
    'admin@pulsepay.com',
    'PulsePay Admin',
    'admin',
    TRUE
);

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, html_content, text_content, variables) VALUES
(
    'welcome',
    'Welcome to PulsePay - Your Emergency Payment Platform',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PulsePay</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #E573B7 0%, #7B61FF 60%, #FFD166 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #7B61FF, #E573B7); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to PulsePay</h1>
            <p>Your AI-powered emergency payment platform</p>
        </div>
        <div class="content">
            <h2>Hello {{user_name}},</h2>
            <p>Welcome to PulsePay! We''re excited to have you on board.</p>
            <p>With PulsePay, you can:</p>
            <ul>
                <li>Make instant emergency payments</li>
                <li>Benefit from AI-powered security</li>
                <li>Access our global network of partner hospitals</li>
                <li>Enjoy 24/7 support</li>
            </ul>
            <a href="{{login_url}}" class="button">Get Started</a>
            <p>If you have any questions, don''t hesitate to contact our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 PulsePay. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Welcome to PulsePay

Hello {{user_name}},

Welcome to PulsePay! We''re excited to have you on board.

With PulsePay, you can:
- Make instant emergency payments
- Benefit from AI-powered security
- Access our global network of partner hospitals
- Enjoy 24/7 support

Get started: {{login_url}}

If you have any questions, don''t hesitate to contact our support team.

© 2024 PulsePay. All rights reserved.',
    '{"user_name": "string", "login_url": "string"}'
),
(
    'payment_confirmation',
    'Payment Confirmation - PulsePay',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #E573B7 0%, #7B61FF 60%, #FFD166 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .receipt { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #7B61FF; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Confirmed</h1>
            <p>Your emergency payment has been processed successfully</p>
        </div>
        <div class="content">
            <h2>Hello {{user_name}},</h2>
            <p>Your payment has been successfully processed and confirmed.</p>
            
            <div class="receipt">
                <h3>Payment Details</h3>
                <p><strong>Amount:</strong> {{amount}} {{currency}}</p>
                <p><strong>Transaction ID:</strong> {{tx_hash}}</p>
                <p><strong>Date:</strong> {{payment_date}}</p>
                <p><strong>Hospital:</strong> {{hospital_name}}</p>
                <p><strong>Status:</strong> <span style="color: #4CAF50;">Completed</span></p>
            </div>
            
            <p>Your payment has been sent to the hospital and they have been notified.</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 PulsePay. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Payment Confirmation

Hello {{user_name}},

Your payment has been successfully processed and confirmed.

Payment Details:
- Amount: {{amount}} {{currency}}
- Transaction ID: {{tx_hash}}
- Date: {{payment_date}}
- Hospital: {{hospital_name}}
- Status: Completed

Your payment has been sent to the hospital and they have been notified.

If you have any questions, please contact our support team.

© 2024 PulsePay. All rights reserved.',
    '{"user_name": "string", "amount": "string", "currency": "string", "tx_hash": "string", "payment_date": "string", "hospital_name": "string"}'
),
(
    'alert',
    'Security Alert - PulsePay',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Security Alert</h1>
            <p>Important account security notification</p>
        </div>
        <div class="content">
            <h2>Hello {{user_name}},</h2>
            <div class="alert">
                <h3>⚠️ Security Notice</h3>
                <p>{{alert_message}}</p>
                <p><strong>Action Required:</strong> {{action_required}}</p>
            </div>
            <p>If you believe this is an error or need assistance, please contact our support team immediately.</p>
            <p>For your security, we recommend:</p>
            <ul>
                <li>Changing your password</li>
                <li>Enabling two-factor authentication</li>
                <li>Reviewing your recent account activity</li>
            </ul>
        </div>
        <div class="footer">
            <p>&copy; 2024 PulsePay. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Security Alert

Hello {{user_name}},

⚠️ Security Notice

{{alert_message}}

Action Required: {{action_required}}

If you believe this is an error or need assistance, please contact our support team immediately.

For your security, we recommend:
- Changing your password
- Enabling two-factor authentication
- Reviewing your recent account activity

© 2024 PulsePay. All rights reserved.',
    '{"user_name": "string", "alert_message": "string", "action_required": "string"}'
);

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value, description) VALUES
('system_maintenance', '{"enabled": false, "message": "System is under maintenance"}', 'System maintenance mode settings'),
('fraud_thresholds', '{"low": 0.3, "medium": 0.6, "high": 0.8, "critical": 0.9}', 'Fraud detection thresholds'),
('payment_limits', '{"min": 10, "max": 50000, "daily_limit": 100000}', 'Payment amount limits'),
('api_keys', '{"openai": "", "telesign": "", "idanalyzer": ""}', 'External API keys'),
('email_settings', '{"smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_pass": ""}', 'Email service settings');

-- Create functions for common operations

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_payments', COUNT(*),
        'total_amount', COALESCE(SUM(amount), 0),
        'successful_payments', COUNT(*) FILTER (WHERE status = 'completed'),
        'pending_payments', COUNT(*) FILTER (WHERE status = 'pending'),
        'last_payment_date', MAX(created_at)
    ) INTO result
    FROM public.payments
    WHERE user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users', COUNT(*) FILTER (WHERE role = 'user'),
        'total_admins', COUNT(*) FILTER (WHERE role = 'admin'),
        'total_payments', (SELECT COUNT(*) FROM public.payments),
        'total_amount', (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'completed'),
        'pending_verifications', (SELECT COUNT(*) FROM public.id_verifications WHERE verification_status = 'pending'),
        'high_fraud_alerts', (SELECT COUNT(*) FROM public.fraud_checks WHERE risk_level IN ('high', 'critical')),
        'recent_activity', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'action', action,
                    'table_name', table_name,
                    'created_at', created_at
                )
            )
            FROM public.audit_logs
            WHERE created_at > NOW() - INTERVAL '24 hours'
            ORDER BY created_at DESC
            LIMIT 10
        )
    ) INTO result
    FROM public.users;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process payment with fraud check
CREATE OR REPLACE FUNCTION process_payment(
    p_user_id UUID,
    p_amount DECIMAL,
    p_hospital_id UUID,
    p_description TEXT
)
RETURNS JSONB AS $$
DECLARE
    payment_id UUID;
    fraud_score DECIMAL;
    result JSONB;
BEGIN
    -- Create payment record
    INSERT INTO public.payments (user_id, amount, hospital_id, description)
    VALUES (p_user_id, p_amount, p_hospital_id, p_description)
    RETURNING id INTO payment_id;
    
    -- Simulate fraud check (in real implementation, this would call external APIs)
    fraud_score := random() * 0.5; -- Random score between 0 and 0.5 for demo
    
    -- Record fraud check
    INSERT INTO public.fraud_checks (user_id, payment_id, check_type, provider, score, risk_level)
    VALUES (p_user_id, payment_id, 'payment', 'internal', fraud_score, 
            CASE 
                WHEN fraud_score < 0.3 THEN 'low'
                WHEN fraud_score < 0.6 THEN 'medium'
                WHEN fraud_score < 0.8 THEN 'high'
                ELSE 'critical'
            END);
    
    -- Update payment status based on fraud score
    IF fraud_score < 0.8 THEN
        UPDATE public.payments 
        SET status = 'completed', processed_at = NOW()
        WHERE id = payment_id;
        
        result := jsonb_build_object(
            'success', true,
            'payment_id', payment_id,
            'status', 'completed',
            'fraud_score', fraud_score
        );
    ELSE
        UPDATE public.payments 
        SET status = 'failed'
        WHERE id = payment_id;
        
        result := jsonb_build_object(
            'success', false,
            'payment_id', payment_id,
            'status', 'failed',
            'fraud_score', fraud_score,
            'reason', 'High fraud risk detected'
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a view for admin dashboard
CREATE VIEW admin_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.role,
    u.created_at as user_created_at,
    COUNT(p.id) as total_payments,
    COALESCE(SUM(p.amount), 0) as total_amount,
    MAX(p.created_at) as last_payment_date,
    COUNT(fc.id) as fraud_checks_count,
    COUNT(fc.id) FILTER (WHERE fc.risk_level IN ('high', 'critical')) as high_risk_checks
FROM public.users u
LEFT JOIN public.payments p ON u.id = p.user_id
LEFT JOIN public.fraud_checks fc ON u.id = fc.user_id
GROUP BY u.id, u.email, u.full_name, u.role, u.created_at;

-- Grant access to the view
GRANT SELECT ON admin_dashboard TO authenticated;

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.payments IS 'Payment transactions with blockchain integration';
COMMENT ON TABLE public.hospitals IS 'Partner hospitals and medical facilities';
COMMENT ON TABLE public.banks IS 'Partner banks and financial institutions';
COMMENT ON TABLE public.fraud_checks IS 'Fraud detection and risk assessment records';
COMMENT ON TABLE public.id_verifications IS 'Identity verification records';
COMMENT ON TABLE public.audit_logs IS 'System audit trail for compliance';
COMMENT ON TABLE public.email_templates IS 'Email template management';
COMMENT ON TABLE public.email_logs IS 'Email delivery tracking';
COMMENT ON TABLE public.admin_settings IS 'System configuration settings';

-- End of Supabase setup 