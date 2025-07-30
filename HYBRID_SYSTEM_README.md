# 🔄 Hybrid Upload Processing System

## 🎯 **Architecture Overview**

The hybrid system combines the best of both worlds:

- **🎨 Frontend (Next.js)**: User interface, progress tracking, file upload, supplier selection
- **🐍 Python Backend (FastAPI)**: Heavy data processing, ML-based field mapping, database operations
- **📡 API Communication**: Seamless integration between frontend and backend

## 🏗️ **System Components**

### **Frontend Components:**
```
components/uploads/
├── upload-processor.tsx       # Main hybrid upload orchestrator
├── processing-monitor.tsx     # Real-time progress monitoring
└── file-uploader.tsx         # File selection and validation

app/api/hybrid/
├── start-processing/         # Proxy to start Python processing
├── process-step/            # Proxy for step-by-step processing
├── update-supplier/         # Proxy for supplier updates
└── session-status/          # Proxy for status monitoring
```

### **Backend Components:**
```
backend/
├── hybrid_upload_processor.py  # Main processing engine
├── hybrid_api.py              # FastAPI endpoints
├── field_mapper.py            # AI-powered field mapping
├── duplicate_checker.py       # Advanced duplicate detection
├── data_processor.py          # Data cleaning & normalization
└── main.py                   # FastAPI app with hybrid routes
```

## 🔄 **Processing Workflow**

### **Step-by-Step Process:**

1. **📁 File Upload** (Frontend)
   - User selects CSV/Excel file
   - Frontend validates file type and size
   - File sent to Python backend for parsing

2. **🗺️ Field Mapping** (Python Backend)
   - AI-powered field detection using ML models
   - Fuzzy matching with confidence scoring
   - Manual mapping rules integration

3. **🧹 Data Cleaning** (Python Backend)
   - Remove extra whitespace and special characters
   - Standardize text formats
   - Handle missing values

4. **📏 Data Normalization** (Python Backend)
   - Phone number standardization (E164 format)
   - Email normalization (lowercase, aliases)
   - Address standardization

5. **🏷️ Lead Tagging** (Python Backend)
   - Automatic tag assignment based on content
   - Exclusivity detection
   - Industry classification

6. **🤖 Auto Field Mapping** (Python Backend)
   - Map unmapped fields using ML models
   - Confidence-based field suggestions
   - Custom mapping rules

7. **🔍 Duplicate Detection** (Python Backend)
   - File-internal duplicate checking
   - Database duplicate verification
   - Multi-field matching algorithms

8. **👁️ Data Preview** (Frontend)
   - Display processed data sample
   - Show statistics and quality metrics
   - Allow user review before upload

9. **🏢 Supplier Selection** (Frontend)
   - User selects supplier from dropdown
   - Sets cost per lead
   - Updates backend session

10. **🚫 DNC Checking** (Python Backend)
    - Cross-reference with Do Not Contact lists
    - Remove DNC matches
    - Log compliance data

11. **💾 Database Upload** (Python Backend)
    - Insert clean leads into main table
    - Store duplicates in separate table
    - Create upload batch record

## 🚀 **Getting Started**

### **1. Backend Setup:**

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_KEY="your-supabase-key"
export PYTHON_BACKEND_URL="http://localhost:8000"

# Start the Python backend
python main.py
```

### **2. Frontend Setup:**

```bash
# Install Node.js dependencies
npm install

# Set environment variables in .env.local
PYTHON_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Start the frontend
npm run dev
```

### **3. Database Setup:**

```sql
-- Run the duplicate leads table creation script
\i database/duplicate_leads_table.sql
```

## 📡 **API Endpoints**

### **Hybrid Processing Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hybrid/start-processing` | POST | Start new processing session |
| `/api/hybrid/process-step` | POST | Process specific step |
| `/api/hybrid/session-status/{id}` | GET | Get session status |
| `/api/hybrid/update-supplier` | POST | Update supplier info |
| `/api/hybrid/preview-data/{id}` | GET | Get processed data preview |
| `/api/hybrid/active-sessions` | GET | List active sessions |

### **Python Backend Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `http://localhost:8000/api/hybrid/start-processing` | POST | Initialize processing |
| `http://localhost:8000/api/hybrid/process-step` | POST | Execute processing step |
| `http://localhost:8000/api/hybrid/suppliers` | GET | Get suppliers list |
| `http://localhost:8000/api/hybrid/health` | GET | Health check |

## 🔧 **Configuration**

### **Environment Variables:**

**Frontend (.env.local):**
```env
PYTHON_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

**Backend (.env):**
```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-role-key
DATABASE_URL=your-database-url
```

## 📊 **Monitoring & Debugging**

### **Real-time Monitoring:**
- **Processing Monitor Component**: Shows live progress updates
- **Session Status API**: Provides detailed step information
- **Error Handling**: Comprehensive error reporting and recovery

### **Logging:**
- **Frontend**: Browser console logs for API calls
- **Backend**: Python logging with detailed processing information
- **Database**: Upload batch tracking with statistics

## 🔍 **Testing the System**

### **1. Test File Upload:**
```bash
# Use the provided sample files
curl -X POST http://localhost:3000/api/hybrid/start-processing \
  -F "file=@raw_godzilla.csv"
```

### **2. Monitor Processing:**
```bash
# Check session status
curl http://localhost:3000/api/hybrid/session-status/{session-id}
```

### **3. Verify Results:**
- Check leads table for uploaded data
- Check duplicate_leads table for duplicates
- Verify upload_batches table for batch information

## 🚨 **Error Handling**

### **Common Issues:**

1. **Backend Connection Failed**
   - Ensure Python backend is running on port 8000
   - Check PYTHON_BACKEND_URL environment variable

2. **File Processing Errors**
   - Verify file format (CSV/Excel only)
   - Check file size limits
   - Ensure proper headers in file

3. **Database Connection Issues**
   - Verify Supabase credentials
   - Check database table existence
   - Ensure proper permissions

## 🔄 **Deployment**

### **Production Considerations:**

1. **Backend Deployment:**
   - Use Docker for Python backend
   - Set up proper environment variables
   - Configure logging and monitoring

2. **Frontend Deployment:**
   - Update PYTHON_BACKEND_URL for production
   - Ensure proper CORS configuration
   - Set up error tracking

3. **Database:**
   - Run migration scripts
   - Set up proper indexes
   - Configure backup strategies

## 📈 **Performance Optimization**

### **Backend Optimizations:**
- **Batch Processing**: Process large files in chunks
- **Async Operations**: Use FastAPI's async capabilities
- **Caching**: Cache field mapping rules and DNC lists
- **Connection Pooling**: Optimize database connections

### **Frontend Optimizations:**
- **Progress Updates**: Real-time status without overwhelming the backend
- **Error Recovery**: Automatic retry mechanisms
- **User Experience**: Clear progress indicators and error messages

## 🎉 **Benefits of Hybrid Approach**

1. **🚀 Performance**: Python backend handles heavy processing efficiently
2. **🎨 User Experience**: React frontend provides smooth, responsive UI
3. **🔧 Scalability**: Backend can be scaled independently
4. **🛠️ Maintainability**: Clear separation of concerns
5. **🔍 Monitoring**: Real-time progress tracking and error handling
6. **🔄 Flexibility**: Easy to add new processing steps or modify existing ones

The hybrid system provides the best of both worlds - powerful Python processing with a modern, responsive frontend interface!
