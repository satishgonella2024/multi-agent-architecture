from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from proxmox_ai_llm.backend.agents.event_orchestrator import EventOrchestrator
from proxmox_ai_llm.backend.api.event_api import router as event_api_router
from proxmox_ai_llm.backend.api.cost_api import router as cost_api_router
from proxmox_ai_llm.backend.api.validation_api import router as validation_api_router
from proxmox_ai_llm.backend.api.security_api import router as security_api_router
from proxmox_ai_llm.backend.api.architect_api import router as architect_api_router
from proxmox_ai_llm.backend.api.websocket_api import router as websocket_router
from proxmox_ai_llm.backend.api.websocket_api import manager as websocket_manager
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
    
    # Register WebSocket manager with orchestrator
    orchestrator.register_websocket_manager(websocket_manager)
    
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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(event_api_router, prefix="/api")
app.include_router(cost_api_router, prefix="/api/agents")
app.include_router(validation_api_router, prefix="/api/agents")
app.include_router(security_api_router, prefix="/api/agents")
app.include_router(architect_api_router, prefix="/api/agents")
app.include_router(websocket_router)

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