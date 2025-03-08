import os
import logging
from typing import Optional

from proxmox_ai_llm.backend.database.weaviate_db import WeaviateDatabase

logger = logging.getLogger("multi_agent")

# Initialize the database singleton
weaviate_db = None

def initialize_database():
    """Initialize the database connection"""
    global weaviate_db
    
    if weaviate_db is not None:
        return weaviate_db
        
    try:
        # Get database configuration from environment
        weaviate_url = os.getenv("WEAVIATE_URL", "http://localhost:8080")
        weaviate_api_key = os.getenv("WEAVIATE_API_KEY")
        
        # Initialize the database
        weaviate_db = WeaviateDatabase(url=weaviate_url, api_key=weaviate_api_key)
        logger.info(f"Initialized Weaviate database at {weaviate_url}")
        
        return weaviate_db
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return None

def get_database() -> Optional[WeaviateDatabase]:
    """Get the database singleton"""
    global weaviate_db
    
    if weaviate_db is None:
        weaviate_db = initialize_database()
        
    return weaviate_db
