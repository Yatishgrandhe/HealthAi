# Health AI - AI-Powered Healthcare Platform

Health AI is a modern, AI-powered healthcare platform designed for personalized health monitoring and diagnostics. It enables comprehensive health assessments, real-time monitoring, and AI-driven medical insights.

![Health AI Logo](public/health-ai-logo.png)

## 🚀 Features

### Core Features
- **AI-Powered Diagnostics**: Advanced health assessments and early disease detection
- **Mental Health Support**: 24/7 AI therapy sessions and mental health monitoring
- **Real-time Monitoring**: Continuous health tracking with wearable integration
- **Smart Medication Management**: AI-powered medication reminders and interactions checking
- **Personalized Care Plans**: Customized health recommendations and treatment plans

### Admin Features
- **User Management**: Complete patient administration and health monitoring
- **Health Analytics**: Real-time health data tracking and insights
- **AI Model Management**: Configure and monitor AI diagnostic models
- **System Settings**: Configurable health monitoring and alert thresholds
- **Audit Logging**: Complete system activity and health data tracking

### User Features
- **Secure Authentication**: Email/password and magic link login
- **Health Dashboard**: Comprehensive health overview and trends
- **Profile Management**: Health profile and preferences
- **Emergency Alerts**: Quick access to emergency health information

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Material-UI** - Modern UI components
- **Framer Motion** - Smooth animations
- **Tailwind CSS** - Utility-first styling

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Database-level security
- **Real-time subscriptions** - Live health data updates

### External Integrations
- **OpenAI API** - AI-powered health analysis and diagnostics
- **Health APIs** - Integration with health monitoring devices
- **Medical Databases** - Access to medical knowledge and guidelines
- **Wearable Devices** - Real-time health data collection

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- (Optional) External API keys

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HealthAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL script from `supabase-setup.sql`
   - Follow the [Admin Setup Guide](ADMIN_SETUP.md)

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

### Automatic Setup
1. Copy the contents of `supabase-setup.sql`
2. Go to your Supabase dashboard → SQL Editor
3. Paste and execute the entire script
4. Verify all tables are created in the Table Editor

### Manual Verification
Check that these tables exist:
- `users` - User profiles and health data
- `health_records` - Health assessment records
- `hospitals` - Partner hospitals
- `medications` - Medication management
- `health_checks` - Health monitoring records
- `therapy_sessions` - Mental health session records
- `audit_logs` - System audit trail
- `email_templates` - Email templates
- `admin_settings` - System configuration

## 👤 Admin Access

### Default Admin Account
- **Email**: `admin@healthai.com`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials immediately after setup!

### Admin Dashboard
Access the admin dashboard at `/admin` with admin credentials.

**Features**:
- User management and health monitoring
- Health analytics and insights
- AI model performance monitoring
- System settings configuration
- Real-time health statistics

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#0066CC) → Light Blue (#3399FF) → Dark Blue (#004499)
- **Accent**: Black (#000000), White (#FFFFFF)
- **Background**: Light Gray (#f8f9ff)

### Typography
- **Headings**: Inter, Montserrat, Poppins (bold)
- **Body**: Inter, Roboto (regular)

### Components
- **AnimatedLogo**: Health AI logo with medical cross and AI chip
- **Navigation**: Responsive navbar with smooth transitions
- **Cards**: Glassmorphism design with hover effects
- **Buttons**: Gradient backgrounds with scale animations

## 📱 Pages & Routes

### Public Pages
- `/` - Landing page with features and testimonials
- `/how-it-works` - Step-by-step process explanation
- `/health-tools` - Health assessment tools
- `/hospitals` - Partner hospitals directory
- `/login` - User authentication
- `/register` - User registration

### Protected Pages
- `/dashboard` - User health dashboard
- `/admin` - Admin dashboard (admin only)

## 🔐 Security Features

### Authentication
- **Supabase Auth**: Secure email/password authentication
- **Magic Links**: Passwordless login option
- **Session Management**: Automatic token refresh
- **Role-based Access**: User/admin role separation

### Data Protection
- **Row Level Security (RLS)**: Database-level access control
- **Encrypted Passwords**: bcrypt hashing
- **Input Validation**: Client and server-side validation
- **Audit Logging**: Complete action tracking
- **HIPAA Compliance**: Health data privacy protection

### Health Data Security
- **AI-powered Analysis**: Secure health data processing
- **Encrypted Storage**: All health data encrypted at rest
- **Real-time Monitoring**: Live health data security tracking
- **Configurable Privacy**: Adjustable data sharing settings

## 🚀 Deployment

### Vercel Deployment
1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** automatically on push to main branch

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional (for full functionality)
OPENAI_API_KEY=your_openai_key
HEALTH_API_KEY=your_health_api_key
WEARABLE_API_KEY=your_wearable_api_key
```

### Production Checklist
- [ ] Update Supabase project to production
- [ ] Change default admin credentials
- [ ] Configure production API keys
- [ ] Set up monitoring and alerts
- [ ] Test all health assessment flows
- [ ] Verify security and privacy settings
- [ ] Ensure HIPAA compliance

## 📊 Analytics & Monitoring

### Built-in Analytics
- **User Statistics**: Registration, activity, and engagement
- **Health Analytics**: Assessment results, trends, and insights
- **AI Performance**: Diagnostic accuracy and model performance
- **System Performance**: Response times and error rates

### Monitoring Tools
- **Supabase Dashboard**: Database performance and logs
- **Vercel Analytics**: Frontend performance and errors
- **Custom Admin Dashboard**: Real-time system monitoring
- **Health Data Monitoring**: Patient health trends and alerts

## 🔧 Development

### Project Structure
```
HealthAI/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── supabase-setup.sql      # Database schema
├── ADMIN_SETUP.md          # Admin setup guide
└── README.md              # This file
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Code Standards
- Follow TypeScript best practices
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed

## 📚 Documentation

### Guides
- [Admin Setup Guide](ADMIN_SETUP.md) - Complete admin system setup
- [API Documentation](API.md) - Backend API reference
- [Component Library](COMPONENTS.md) - UI component documentation

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Material-UI Documentation](https://mui.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 🆘 Support

### Common Issues
1. **Database Connection**: Verify Supabase credentials
2. **Admin Access**: Check user role and RLS policies
3. **Payment Processing**: Ensure API keys are configured
4. **Build Errors**: Check TypeScript and ESLint errors

### Getting Help
- Check the [troubleshooting section](ADMIN_SETUP.md#troubleshooting)
- Review the [Supabase documentation](https://supabase.com/docs)
- Open an issue on GitHub
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend platform
- **Material-UI** for the beautiful component library
- **Framer Motion** for smooth animations
- **OpenAI** for AI-powered features
- **Community contributors** for feedback and improvements

---

**Health AI** - Making healthcare monitoring instant, secure, and accessible worldwide. 🚀
