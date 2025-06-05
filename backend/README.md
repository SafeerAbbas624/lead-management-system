# Lead Management Python Backend

This is the Python backend for the Lead Management System. It provides APIs for lead processing, DNC management, lead distribution, ROI tracking, and more.

## Features

- **Lead Processing**: Upload, clean, and normalize lead data from various sources
- **DNC Management**: Check leads against multiple DNC lists
- **Lead Distribution**: Distribute leads to clients based on percentage or fixed allocation
- **ROI Dashboard**: Track lead performance, costs, and revenue
- **Admin Panel**: Manage users, API keys, and system settings

## Setup

### Prerequisites

- Python 3.9+
- Supabase account with database and storage buckets set up

### Installation

1. Clone this repository
2. Install dependencies:
   \`\`\`
   pip install -r requirements.txt
   \`\`\`
3. Create a `.env` file with the following variables:
   \`\`\`
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   \`\`\`

### Running the API

\`\`\`bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

Or using Docker:

\`\`\`bash
docker-compose up
\`\`\`

The API will be available at http://localhost:8000

### API Documentation

API documentation is available at http://localhost:8000/docs when the server is running.

## API Endpoints

### Lead Processing

- `POST /process-csv`: Process a CSV/XLSX/JSON file of leads
- `GET /batches`: Get all upload batches
- `GET /batches/{batch_id}`: Get details of a specific batch
- `GET /batches/{batch_id}/leads`: Get leads from a specific batch

### DNC Management

- `POST /check-dnc`: Check if an email/phone is in DNC lists
- `POST /dnc-lists`: Create a new DNC list
- `GET /dnc-lists`: Get all DNC lists
- `POST /dnc-entries`: Add a new entry to a DNC list
- `POST /dnc-bulk-upload`: Process a file of DNC entries

### Lead Distribution

- `POST /distribute-leads`: Distribute leads to clients
- `GET /clients`: Get all clients

### ROI Tracking

- `POST /upload-revenue`: Upload revenue data for leads
- `POST /roi-metrics`: Get ROI metrics with filters
- `GET /supplier-performance`: Get performance metrics for suppliers

### Admin Features

- `POST /users`: Create a new user
- `GET /users`: Get all users
- `POST /api-keys`: Create a new API key
- `GET /api-keys`: Get all API keys
- `POST /log-activity`: Log user activity
- `GET /activity-logs`: Get activity logs

## Integration with Next.js Frontend

This backend is designed to work with a Next.js frontend. The integration is through API calls from the Next.js API routes to this Python backend.

The main integration point is in `app/api/process-csv/route.ts` in the Next.js application:

\`\`\`typescript
// Call Python backend API
const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
const response = await fetch(`${pythonBackendUrl}/process-csv`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    filePath,
    batchId,
    reprocess,
  }),
})
\`\`\`

Make sure your `PYTHON_BACKEND_URL` environment variable points to where your Python backend is hosted.
