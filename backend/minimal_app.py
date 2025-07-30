"""
Minimal FastAPI app for testing the hybrid system
Bypasses problematic imports to get the hybrid system working
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Lead Management System API - Minimal",
    description="Minimal API for testing hybrid upload system",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include simple hybrid router
try:
    from simple_hybrid_api import router as hybrid_router
    app.include_router(hybrid_router)
    logger.info("Simple hybrid upload system loaded successfully")
    logger.info("Hybrid upload routes registered at /api/hybrid")
    HYBRID_AVAILABLE = True
except ImportError as e:
    logger.error(f"Failed to load hybrid system: {e}")
    HYBRID_AVAILABLE = False

@app.get("/")
async def root():
    return {
        "message": "Lead Management System API - Minimal",
        "version": "2.0.0",
        "status": "running",
        "hybrid_system": HYBRID_AVAILABLE,
        "endpoints": {
            "hybrid_upload": "/api/hybrid" if HYBRID_AVAILABLE else "Not available",
            "docs": "/docs",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "minimal-lead-management-api",
        "version": "2.0.0",
        "hybrid_available": HYBRID_AVAILABLE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("minimal_app:app", host="0.0.0.0", port=8000, reload=True)
