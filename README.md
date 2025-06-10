# Lead Management System

A comprehensive lead management system built with Next.js, FastAPI, and Supabase. Streamline your lead generation, processing, and conversion tracking with powerful analytics and reporting tools.

## ✨ Features

### 📊 Dashboard
- **Overview Tab**
  - Real-time statistics and KPIs
  - Recent uploads with status tracking
  - Leads by status distribution
  - Quick actions for common tasks

- **Analytics Tab**
  - Lead trends over time
  - Source performance metrics
  - Conversion funnel visualization
  - Lead quality scoring

- **Performance Tab**
  - Supplier ROI analysis
  - Campaign performance metrics
  - Lead-to-close ratio tracking
  - Revenue attribution

- **Reports Tab**
  - Custom report generation
  - Scheduled report delivery
  - Multiple export formats (PDF, CSV, Excel)
  - Report templates

### 👥 Leads Management
- **Leads List**
  - Filterable and sortable lead database
  - Bulk actions on multiple leads
  - Advanced search functionality
  - Custom views and saved filters

- **Lead Details**
  - Comprehensive lead profile
  - Interaction history
  - Notes and attachments
  - Activity timeline

### 📤 Lead Uploads
- **Bulk Upload**
  - Drag and drop interface
  - Support for CSV, Excel formats
  - Field mapping assistant
  - Data validation and preview

- **Upload History**
  - Track all file uploads
  - View processing status
  - Download processed files
  - Error reports and logs

### 📊 Data Processing
- **Deduplication**
  - Automatic duplicate detection
  - Fuzzy matching algorithms
  - Merge and resolve conflicts
  - Duplicate prevention rules

- **Data Enrichment**
  - Email verification
  - Phone number validation
  - Company information lookup
  - Social profile linking

### 📋 DNC Management
- **DNC List**
  - Centralized Do Not Call registry
  - Automatic DNC scrubbing
  - Compliance reporting
  - DNC request handling

- **Compliance**
  - TCPA compliance tools
  - Consent management
  - Audit trails
  - Compliance documentation

### 📈 ROI Dashboard
- **Performance Metrics**
  - Cost per lead analysis
  - Revenue attribution
  - Campaign ROI tracking
  - Conversion rate optimization

- **Supplier Analytics**
  - Supplier performance scoring
  - Lead quality by source
  - Cost vs. quality analysis
  - Supplier payment tracking

### ⚙️ Admin Panel
- **User Management**
  - Role-based access control
  - User activity logs
  - Permission management
  - Team collaboration tools

- **System Settings**
  - Custom fields configuration
  - Workflow automation
  - API key management
  - System integrations

### 👤 User Profile
- **Account Settings**
  - Profile information
  - Notification preferences
  - Password management
  - Two-factor authentication

- **Activity Feed**
  - Recent actions
  - System notifications
  - Task assignments
  - Team updates

### 📱 Mobile Responsive
- **Fully Responsive**
  - Optimized for all devices
  - Touch-friendly interface
  - Offline capabilities
  - Mobile notifications

### 🔒 Security Features
- **Data Protection**
  - End-to-end encryption
  - Regular security audits
  - Data backup and recovery
  - GDPR compliance tools

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: React Query, React Hook Form
- **Data Visualization**: Recharts, React Day Picker
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **UI Components**: Radix UI Primitives
- **Notifications**: Sonner
- **Error Handling**: React Error Boundary

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Authentication**: Supabase Auth
- **API Documentation**: OpenAPI (Swagger)
- **Data Validation**: Pydantic

### Database
- **Primary**: Supabase (PostgreSQL)
- **ORMs**: Supabase Client, SQLAlchemy
- **Migrations**: Alembic

### Data Processing
- **File Parsing**: XLSX, PapaParse, csv-parse
- **Date Handling**: date-fns, date-fns-tz

### DevOps
- **Version Control**: Git
- **Package Manager**: pnpm
- **Environment Management**: .env files
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript

## Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- pnpm (recommended) or npm/yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SafeerAbbas624/lead-management-system.git
   cd lead-management-system
   ```

2. **Install frontend dependencies**
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Environment Setup**
   - Copy `.env.example` to `.env` in both root and backend directories
   - Update the variables with your Supabase credentials

5. **Database Setup**
   - Run database migrations (if any)
   ```bash
   cd backend
   alembic upgrade head
   ```

### Running the Application

**Frontend Development Server**
```bash
# From root directory
pnpm dev
# or
npm run dev
```

**Backend Development Server**
```bash
# From backend directory
uvicorn app.main:app --reload
```

The application will be available at `http://localhost:3000`

### Building for Production
```bash
# Build frontend
pnpm build

# Start production server
pnpm start
```

## Environment Variables

### Frontend (`.env`)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_LOGGING=true
```

### Backend (`.env`)
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Application
ENVIRONMENT=development
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=INFO
```

## Project Structure

```
lead-management-system/
├── app/                    # Next.js 14+ app directory
│   ├── api/                # API route handlers
│   ├── dashboard/          # Dashboard pages
│   ├── (auth)/             # Authentication pages
│   └── layout.tsx          # Root layout
│
├── components/            # Reusable React components
│   ├── dashboard/          # Dashboard components
│   ├── ui/                 # Shadcn UI components
│   └── providers/          # Context providers
│
├── backend/               # FastAPI backend
│   ├── alembic/           # Database migrations
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/          # Core configurations
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic
│   └── main.py            # FastAPI application
│
├── public/               # Static assets
├── styles/                # Global styles
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## API Documentation

### Interactive API Docs
- **Swagger UI**: Available at `/api/docs`
- **ReDoc**: Available at `/api/redoc`

### Key Endpoints

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/lead-trends` - Get lead trends over time
- `GET /api/dashboard/source-performance` - Get performance by lead source
- `GET /api/dashboard/recent-uploads` - Get recent file uploads
- `GET /api/dashboard/leads-by-status` - Get leads count by status
- `GET /api/dashboard/conversion-funnel` - Get conversion funnel data

#### Leads
- `POST /api/leads/upload` - Upload new leads
- `GET /api/leads` - List leads with filters
- `GET /api/leads/{lead_id}` - Get lead details
- `PUT /api/leads/{lead_id}` - Update lead
- `DELETE /api/leads/{lead_id}` - Delete lead

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Write tests for new features
- Update documentation when necessary
- Keep code style consistent (ESLint + Prettier)
- Make sure all tests pass before submitting PR

### Code of Conduct
Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- And all the amazing open-source libraries we depend on!