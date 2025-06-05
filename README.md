# Lead Management System

A comprehensive lead management system built with Next.js, FastAPI, and Supabase.

## Features

- Lead upload and processing
- Automatic field mapping
- Duplicate detection
- DNC (Do Not Call) list management
- Lead distribution
- Revenue tracking
- ROI metrics
- Supplier performance tracking

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Python
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/SafeerAbbas624/lead-management-system.git
cd lead-management-system
```

2. Install frontend dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Set up environment variables:
   - Create `.env` file in the root directory
   - Create `.env` file in the backend directory
   - Add necessary environment variables (see `.env.example`)

5. Start the development servers:

Frontend:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Backend:
```bash
cd backend
uvicorn app:app --reload
```

## Environment Variables

### Frontend (.env)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
```

## Project Structure

```
lead-management-system/
├── app/                 # Next.js app directory
├── components/          # React components
├── backend/            # FastAPI backend
│   ├── app.py         # Main FastAPI application
│   ├── models.py      # Data models
│   ├── database.py    # Database operations
│   └── utils/         # Utility functions
├── public/            # Static files
└── styles/           # Global styles
```

## API Documentation

The API documentation is available at `/api/docs` when running the backend server.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 