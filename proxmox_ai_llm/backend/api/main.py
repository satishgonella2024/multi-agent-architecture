from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
import logging

from proxmox_ai_llm.backend.agents.event_orchestrator import EventOrchestrator
from proxmox_ai_llm.backend.api.event_api import router as event_api_router
from proxmox_ai_llm.backend.database import initialize_database
from proxmox_ai_llm.backend.messaging import initialize_kafka_client
from proxmox_ai_llm.backend.agents import start_agents, stop_agents

logger = logging.getLogger("multi_agent")

# Global orchestrator
orchestrator = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI app"""
    # Startup: Initialize components
    global orchestrator
    
    # Initialize database
    database = initialize_database()
    if not database:
        logger.warning("Failed to initialize database")
    
    # Initialize Kafka client
    kafka = initialize_kafka_client()
    if not kafka:
        logger.warning("Failed to initialize Kafka client")
    
    # Initialize event orchestrator
    logger.info("Initializing event orchestrator")
    orchestrator = EventOrchestrator()
    await orchestrator.setup_event_listeners()
    
    # Start agent processes
    logger.info("Starting agent processes")
    start_agents()
    
    yield
    
    # Shutdown: Cleanup resources
    logger.info("Shutting down event orchestrator")
    if orchestrator:
        await orchestrator.close()
    
    # Stop agent processes
    logger.info("Stopping agent processes")
    stop_agents()

# Create FastAPI app
app = FastAPI(
    title="Multi-Agent Architecture",
    description="Event-driven multi-agent system for deployments",
    version="1.0.0",
    lifespan=lifespan
)

# Register API routers
app.include_router(event_api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Multi-Agent Architecture API is running"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "components": {
            "database": initialize_database() is not None,
            "kafka": initialize_kafka_client() is not None,
            "orchestrator": orchestrator is not None
        }
    }
