from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
import logging

from proxmox_ai_llm.backend.agents.event_orchestrator import EventOrchestrator
from proxmox_ai_llm.backend.api.event_api import router as event_api_router

logger = logging.getLogger("multi_agent")

# Global orchestrator
orchestrator = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI app"""
    # Startup: Initialize components
    global orchestrator
    logger.info("Initializing event orchestrator")
    orchestrator = EventOrchestrator()
    await orchestrator.setup_event_listeners()
    
    yield
    
    # Shutdown: Cleanup resources
    logger.info("Shutting down event orchestrator")
    if orchestrator:
        await orchestrator.close()

# Create FastAPI app
app = FastAPI(
    title="Multi-Agent Architecture",
    description="Event-driven multi-agent system for AWS deployments",
    version="1.0.0",
    lifespan=lifespan
)

# Register API routers
app.include_router(event_api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Multi-Agent Architecture API is running"}
