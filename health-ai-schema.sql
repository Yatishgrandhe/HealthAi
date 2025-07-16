-- Health AI Database Schema
-- Comprehensive schema for AI-powered health and wellness platform

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
    account_type TEXT DEFAULT 'user' CHECK (account_type IN ('user', 'admin', 'guest')),
    setup_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- HEALTH DATA STORAGE
-- ========================================

-- User health data table
CREATE TABLE IF NOT EXISTS user_health_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('therapist_chat', 'posture_check', 'fitness_planner', 'saved_routines', 'browser_data')),
    data_key TEXT NOT NULL,
    data_value JSONB,
    image_urls TEXT[], -- Array of image URLs instead of storing full images
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, data_type, data_key)
);

-- Browser data migration tracking
CREATE TABLE IF NOT EXISTS browser_data_migrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    migration_type TEXT NOT NULL,
    data_count INTEGER DEFAULT 0,
    migration_status TEXT DEFAULT 'pending' CHECK (migration_status IN ('pending', 'in_progress', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- THERAPIST CHAT
-- ========================================

-- Therapist chat sessions
CREATE TABLE IF NOT EXISTS therapist_chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    session_title TEXT,
    messages JSONB,
    ai_model_used TEXT,
    session_duration INTEGER,
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- POSTURE CHECK
-- ========================================

-- Posture check sessions
CREATE TABLE IF NOT EXISTS posture_check_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    session_title TEXT,
    posture_score INTEGER CHECK (posture_score >= 0 AND posture_score <= 100),
    analysis_data JSONB,
    image_urls TEXT[], -- Array of image URLs
    recommendations JSONB,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- FITNESS PLANNER
-- ========================================

-- Fitness plans
CREATE TABLE IF NOT EXISTS fitness_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    plan_name TEXT NOT NULL,
    plan_type TEXT CHECK (plan_type IN ('strength', 'cardio', 'flexibility', 'weight_loss', 'muscle_gain', 'general')),
    duration_days INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    exercises JSONB,
    nutrition_plan JSONB,
    goals JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    fitness_plan_id UUID REFERENCES fitness_plans(id) ON DELETE SET NULL,
    session_title TEXT,
    workout_data JSONB,
    duration_minutes INTEGER,
    calories_burned INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SAVED ROUTINES
-- ========================================

-- Saved routines
CREATE TABLE IF NOT EXISTS saved_routines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    routine_name TEXT NOT NULL,
    routine_type TEXT CHECK (routine_type IN ('workout', 'meditation', 'stretching', 'custom')),
    routine_data JSONB,
    image_urls TEXT[], -- Array of image URLs
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PROGRESS TRACKING
-- ========================================

-- Health progress tracking
CREATE TABLE IF NOT EXISTS health_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('mood', 'posture', 'fitness', 'weight', 'sleep', 'stress')),
    metric_value DECIMAL(10, 2),
    metric_unit TEXT,
    notes TEXT,
    image_urls TEXT[], -- Array of image URLs
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- IMAGE STORAGE (URLs only)
-- ========================================

-- Image metadata table (stores URLs and metadata, not actual images)
CREATE TABLE IF NOT EXISTS image_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    image_type TEXT CHECK (image_type IN ('posture', 'fitness', 'progress', 'routine', 'profile')),
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CROSS-ACCOUNT DATA LINKING
-- ========================================

-- Data sharing permissions
CREATE TABLE IF NOT EXISTS data_sharing_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    shared_with_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('therapist_chat', 'posture_check', 'fitness_planner', 'saved_routines', 'progress')),
    permission_level TEXT DEFAULT 'read' CHECK (permission_level IN ('read', 'write', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, shared_with_user_id, data_type)
);

-- ========================================
-- ANALYTICS & INSIGHTS
-- ========================================

-- Health analytics
CREATE TABLE IF NOT EXISTS health_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    analytics_type TEXT NOT NULL,
    analytics_data JSONB,
    insights JSONB,
    recommendations JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_type ON user_profiles(account_type);

-- Health data indexes
CREATE INDEX IF NOT EXISTS idx_user_health_data_user_id ON user_health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_data_type ON user_health_data(data_type);
CREATE INDEX IF NOT EXISTS idx_user_health_data_key ON user_health_data(data_key);

-- Therapist chat indexes
CREATE INDEX IF NOT EXISTS idx_therapist_chat_sessions_user_id ON therapist_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_chat_sessions_created_at ON therapist_chat_sessions(created_at);

-- Posture check indexes
CREATE INDEX IF NOT EXISTS idx_posture_check_sessions_user_id ON posture_check_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_posture_check_sessions_score ON posture_check_sessions(posture_score);

-- Fitness indexes
CREATE INDEX IF NOT EXISTS idx_fitness_plans_user_id ON fitness_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_plans_active ON fitness_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_created_at ON workout_sessions(created_at);

-- Saved routines indexes
CREATE INDEX IF NOT EXISTS idx_saved_routines_user_id ON saved_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_routines_favorite ON saved_routines(is_favorite);

-- Progress tracking indexes
CREATE INDEX IF NOT EXISTS idx_health_progress_user_id ON health_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_health_progress_metric_type ON health_progress(metric_type);
CREATE INDEX IF NOT EXISTS idx_health_progress_recorded_at ON health_progress(recorded_at);

-- Image metadata indexes
CREATE INDEX IF NOT EXISTS idx_image_metadata_user_id ON image_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_image_metadata_type ON image_metadata(image_type);

-- Data sharing indexes
CREATE INDEX IF NOT EXISTS idx_data_sharing_permissions_user_id ON data_sharing_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_data_sharing_permissions_shared_with ON data_sharing_permissions(shared_with_user_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_health_analytics_user_id ON health_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_health_analytics_type ON health_analytics(analytics_type);

-- ========================================
-- TRIGGERS & FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_health_data_updated_at BEFORE UPDATE ON user_health_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_therapist_chat_sessions_updated_at BEFORE UPDATE ON therapist_chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fitness_plans_updated_at BEFORE UPDATE ON fitness_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_routines_updated_at BEFORE UPDATE ON saved_routines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_sharing_permissions_updated_at BEFORE UPDATE ON data_sharing_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- User dashboard view
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    up.id as user_id,
    up.email,
    up.full_name,
    up.account_type,
    COUNT(DISTINCT tcs.id) as total_chat_sessions,
    COUNT(DISTINCT pcs.id) as total_posture_checks,
    COUNT(DISTINCT fp.id) as total_fitness_plans,
    COUNT(DISTINCT sr.id) as total_saved_routines,
    AVG(pcs.posture_score) as avg_posture_score,
    AVG(tcs.mood_score) as avg_mood_score
FROM user_profiles up
LEFT JOIN therapist_chat_sessions tcs ON up.id = tcs.user_id
LEFT JOIN posture_check_sessions pcs ON up.id = pcs.user_id
LEFT JOIN fitness_plans fp ON up.id = fp.user_id
LEFT JOIN saved_routines sr ON up.id = sr.user_id
GROUP BY up.id, up.email, up.full_name, up.account_type;

-- Health progress summary view
CREATE OR REPLACE VIEW health_progress_summary AS
SELECT 
    user_id,
    metric_type,
    AVG(metric_value) as avg_value,
    MAX(metric_value) as max_value,
    MIN(metric_value) as min_value,
    COUNT(*) as data_points,
    MAX(recorded_at) as last_recorded
FROM health_progress
GROUP BY user_id, metric_type;

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE posture_check_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sharing_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own health data" ON user_health_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own health data" ON user_health_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health data" ON user_health_data FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own chat sessions" ON therapist_chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON therapist_chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat sessions" ON therapist_chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own posture sessions" ON posture_check_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own posture sessions" ON posture_check_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posture sessions" ON posture_check_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own fitness plans" ON fitness_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own fitness plans" ON fitness_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fitness plans" ON fitness_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own workout sessions" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own workout sessions" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout sessions" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own saved routines" ON saved_routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own saved routines" ON saved_routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved routines" ON saved_routines FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON health_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON health_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON health_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own images" ON image_metadata FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own images" ON image_metadata FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own images" ON image_metadata FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON health_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own analytics" ON health_analytics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics" ON health_analytics FOR INSERT WITH CHECK (auth.uid() = user_id); 