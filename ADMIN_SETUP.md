# PulsePay Admin Setup Guide

This guide provides step-by-step instructions for setting up the PulsePay admin dashboard, Supabase database, and all necessary configurations.

## 🗄️ Database Setup

### 1. Supabase Project Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Run Database Schema**
   - Copy the contents of `supabase-setup.sql`
   - Go to your Supabase dashboard → SQL Editor
   - Paste and execute the entire SQL script
   - This creates all tables, RLS policies, and admin functions

3. **Verify Setup**
   - Check that all tables are created in the Table Editor
   - Verify RLS is enabled on all tables
   - Confirm the admin user is created

### 2. Environment Variables

Create a `.env.local` file in the `web/` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAIL=admin@pulsepay.com
NEXT_PUBLIC_ADMIN_PASSWORD=admin123

# External APIs (Optional for demo)
OPENAI_API_KEY=your_openai_api_key
TELESIGN_API_KEY=your_telesign_api_key
IDANALYZER_API_KEY=your_idanalyzer_api_key

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 👤 Admin Access Setup

### 1. Default Admin Account

The SQL setup creates a default admin account:
- **Email**: `admin@pulsepay.com`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials immediately after setup!

### 2. Change Admin Password

1. **Via Supabase Dashboard**
   ```sql
   UPDATE auth.users 
   SET encrypted_password = crypt('new_secure_password', gen_salt('bf'))
   WHERE email = 'admin@pulsepay.com';
   ```

2. **Via Admin Dashboard**
   - Login to `/admin`
   - Go to Settings tab
   - Use the password change functionality

### 3. Create Additional Admin Users

```sql
-- Create new admin user
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
    'newadmin@pulsepay.com',
    crypt('secure_password', gen_salt('bf')),
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

-- Add to users table with admin role
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_verified
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'newadmin@pulsepay.com'),
    'newadmin@pulsepay.com',
    'New Admin User',
    'admin',
    TRUE
);
```

## 🛠️ Admin Dashboard Features

### 1. User Management

**Location**: `/admin` → Users Tab

**Features**:
- View all users with their roles and verification status
- See user statistics (total payments, amounts, risk levels)
- Verify user accounts
- Promote users to admin or demote to regular user
- Block problematic users

**Actions**:
- ✅ **Verify User**: Mark user as verified
- 👑 **Promote to Admin**: Give admin privileges
- 🚫 **Block User**: Remove admin privileges
- 📊 **View Details**: See user's complete profile

### 2. Payment Monitoring

**Location**: `/admin` → Payments Tab

**Features**:
- View all payment transactions
- Monitor payment status (pending, completed, failed)
- Track transaction amounts and currencies
- View blockchain transaction hashes
- Filter by date, status, or user

**Data Displayed**:
- Transaction ID
- User email
- Amount and currency
- Payment status
- Creation date
- Hospital information

### 3. Fraud Detection

**Location**: `/admin` → Fraud Detection Tab

**Features**:
- Monitor all fraud check results
- View risk scores and levels
- Track fraud check providers
- Identify high-risk users
- Review fraud detection patterns

**Risk Levels**:
- 🟢 **Low**: 0-30% risk score
- 🟡 **Medium**: 31-60% risk score
- 🟠 **High**: 61-80% risk score
- 🔴 **Critical**: 81-100% risk score

### 4. System Settings

**Location**: `/admin` → Settings Tab

**Configurable Settings**:

#### Maintenance Mode
```json
{
  "enabled": false,
  "message": "System is under maintenance"
}
```

#### Fraud Thresholds
```json
{
  "low": 0.3,
  "medium": 0.6,
  "high": 0.8,
  "critical": 0.9
}
```

#### Payment Limits
```json
{
  "min": 10,
  "max": 50000,
  "daily_limit": 100000
}
```

#### API Keys
```json
{
  "openai": "sk-...",
  "telesign": "...",
  "idanalyzer": "..."
}
```

## 📊 Dashboard Statistics

### Real-time Metrics

The admin dashboard displays:

1. **User Statistics**
   - Total users (regular + admin)
   - Total admin users
   - New users in last 24 hours

2. **Payment Statistics**
   - Total payments processed
   - Total amount transacted
   - Average payment amount
   - Payment success rate

3. **Security Metrics**
   - Pending verifications
   - High fraud alerts
   - Failed payment attempts

4. **Recent Activity**
   - Latest user registrations
   - Recent payments
   - System events

## 🔧 Database Functions

### Available Functions

1. **`get_user_stats(user_uuid)`**
   - Returns user payment statistics
   - Usage: `SELECT get_user_stats('user-id-here');`

2. **`get_admin_stats()`**
   - Returns system-wide statistics
   - Usage: `SELECT get_admin_stats();`

3. **`process_payment(user_id, amount, hospital_id, description)`**
   - Processes payment with fraud check
   - Usage: `SELECT process_payment('user-id', 100.00, 'hospital-id', 'Emergency care');`

### Example Queries

```sql
-- Get all high-risk users
SELECT u.email, u.full_name, COUNT(fc.id) as high_risk_checks
FROM users u
JOIN fraud_checks fc ON u.id = fc.user_id
WHERE fc.risk_level IN ('high', 'critical')
GROUP BY u.id, u.email, u.full_name
ORDER BY high_risk_checks DESC;

-- Get payment statistics by month
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM payments
WHERE status = 'completed'
GROUP BY month
ORDER BY month DESC;

-- Get user verification status
SELECT 
    email,
    is_verified,
    role,
    created_at,
    last_login
FROM users
ORDER BY created_at DESC;
```

## 📧 Email Templates

### Default Templates

The system includes three default email templates:

1. **Welcome Email** (`welcome`)
   - Sent to new users upon registration
   - Variables: `user_name`, `login_url`

2. **Payment Confirmation** (`payment_confirmation`)
   - Sent after successful payment
   - Variables: `user_name`, `amount`, `currency`, `tx_hash`, `payment_date`, `hospital_name`

3. **Security Alert** (`alert`)
   - Sent for security issues
   - Variables: `user_name`, `alert_message`, `action_required`

### Customizing Templates

```sql
-- Update email template
UPDATE email_templates 
SET 
    subject = 'New Subject',
    html_content = '<html>...</html>',
    text_content = 'Plain text version'
WHERE name = 'welcome';

-- Add new template
INSERT INTO email_templates (name, subject, html_content, text_content, variables) 
VALUES (
    'custom_template',
    'Custom Subject',
    '<html>...</html>',
    'Plain text version',
    '{"variable1": "string", "variable2": "string"}'
);
```

## 🔐 Security Best Practices

### 1. Access Control

- **Role-based Access**: Only users with `admin` role can access `/admin`
- **RLS Policies**: Database-level security prevents unauthorized access
- **Session Management**: Automatic logout on inactivity

### 2. Data Protection

- **Encrypted Passwords**: All passwords are hashed using bcrypt
- **Audit Logging**: All admin actions are logged
- **Input Validation**: All user inputs are validated

### 3. Monitoring

- **Fraud Detection**: Real-time monitoring of suspicious activities
- **Payment Limits**: Configurable limits prevent abuse
- **Activity Logs**: Complete audit trail of all actions

## 🚀 Deployment

### 1. Production Setup

1. **Update Environment Variables**
   - Use production Supabase project
   - Set secure admin credentials
   - Configure production API keys

2. **Database Migration**
   - Run the SQL setup on production database
   - Verify all tables and policies are created
   - Test admin access

3. **Security Review**
   - Change default admin password
   - Review RLS policies
   - Test access controls

### 2. Monitoring

- **Set up alerts** for high fraud scores
- **Monitor payment failures**
- **Track user registration patterns**
- **Review audit logs regularly**

## 🆘 Troubleshooting

### Common Issues

1. **Admin Access Denied**
   - Verify user has `admin` role in database
   - Check RLS policies are correctly applied
   - Ensure user is verified

2. **Missing Data**
   - Check if tables were created properly
   - Verify RLS policies allow admin access
   - Review database permissions

3. **Email Templates Not Working**
   - Verify template exists in database
   - Check template variables are correct
   - Test email configuration

### Support

For additional support:
1. Check the Supabase documentation
2. Review the audit logs for errors
3. Verify all environment variables are set
4. Test with a fresh database setup

## 📝 Maintenance

### Regular Tasks

1. **Daily**
   - Review high-risk fraud alerts
   - Monitor payment failures
   - Check system statistics

2. **Weekly**
   - Review user registrations
   - Analyze payment patterns
   - Update fraud thresholds if needed

3. **Monthly**
   - Review audit logs
   - Update email templates
   - Backup database
   - Review admin user access

### Backup Strategy

```sql
-- Export important data
COPY (
    SELECT * FROM users WHERE role = 'admin'
) TO '/tmp/admin_users.csv' WITH CSV HEADER;

COPY (
    SELECT * FROM payments WHERE created_at > NOW() - INTERVAL '30 days'
) TO '/tmp/recent_payments.csv' WITH CSV HEADER;
```

---

## 🎯 Quick Start Checklist

- [ ] Create Supabase project
- [ ] Run `supabase-setup.sql`
- [ ] Set environment variables
- [ ] Change default admin password
- [ ] Test admin dashboard access
- [ ] Configure email templates
- [ ] Set up monitoring alerts
- [ ] Review security settings
- [ ] Test payment processing
- [ ] Verify fraud detection

Your PulsePay admin system is now ready to manage users, monitor payments, and ensure secure operations! 🚀 