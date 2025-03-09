#!/usr/bin/env python3
import os
import logging
import uvicorn
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware


# Load environment variables
load_dotenv()

def main():
    # Get config from environment
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('multi_agent.log')
        ]
    )
    
    logger = logging.getLogger("multi_agent")
    logger.info("Starting Multi-Agent Architecture API")
    
    # Start the FastAPI server
    uvicorn.run(
        "proxmox_ai_llm.backend.api.main:app",
        host=host,
        port=port,
        reload=True,
        log_level=log_level
    )

    app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

if __name__ == "__main__":
    main()
