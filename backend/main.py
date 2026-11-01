from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.health import router as health_router
from routes.analyze import router as analyze_router

app = FastAPI(
    title="GapGlint API",
    description="Evidence Intelligence Platform - See the Gaps. Trace the Claims. Decide with Evidence.",
    version="0.2.0"
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health_router)
app.include_router(analyze_router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to GapGlint API",
        "tagline": "See the Gaps. Trace the Claims. Decide with Evidence.",
        "endpoints": {
            "health": "/api/health",
            "analyze": "/api/analyze",
            "analyze_json": "/api/analyze/json"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
