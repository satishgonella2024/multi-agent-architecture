import os
import logging
from typing import Optional

from proxmox_ai_llm.backend.messaging.kafka_client import KafkaClient

logger = logging.getLogger("multi_agent")

# Initialize the Kafka client singleton
kafka_client = None

def initialize_kafka_client():
    """Initialize the Kafka client connection"""
    global kafka_client
    
    if kafka_client is not None:
        return kafka_client
        
    try:
        # Get Kafka configuration from environment
        bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        
        # Initialize the Kafka client
        kafka_client = KafkaClient(bootstrap_servers=bootstrap_servers)
        logger.info(f"Initialized Kafka client with bootstrap servers: {bootstrap_servers}")
        
        return kafka_client
    except Exception as e:
        logger.error(f"Failed to initialize Kafka client: {e}")
        return None

def get_kafka_client() -> Optional[KafkaClient]:
    """Get the Kafka client singleton"""
    global kafka_client
    
    if kafka_client is None:
        kafka_client = initialize_kafka_client()
        
    return kafka_client
