#!/usr/bin/env python3
"""
Create Kafka topics for multi-agent architecture
"""
import os
import sys
from confluent_kafka.admin import AdminClient, NewTopic
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("kafka-setup")

# Topic definitions
topics = [
    "multi-agent-command",
    "multi-agent-generator",
    "multi-agent-security",
    "multi-agent-architect",
    "multi-agent-validator",
    "multi-agent-deployment",
    "multi-agent-feedback",
    "multi-agent-cost-estimation"
]

def create_topics(bootstrap_servers="localhost:9092"):
    """Create Kafka topics"""
    admin_client = AdminClient({"bootstrap.servers": bootstrap_servers})
    
    # Get existing topics
    metadata = admin_client.list_topics(timeout=10)
    existing_topics = metadata.topics.keys()
    
    logger.info(f"Existing topics: {', '.join(existing_topics)}")
    
    # Create new topics
    new_topics = []
    for topic in topics:
        if topic not in existing_topics:
            new_topics.append(NewTopic(
                topic,
                num_partitions=1,
                replication_factor=1
            ))
    
    if not new_topics:
        logger.info("No new topics to create")
        return True
    
    # Create the topics
    fs = admin_client.create_topics(new_topics)
    
    # Wait for completion
    success = True
    for topic, f in fs.items():
        try:
            f.result()  # The result itself is None
            logger.info(f"Topic {topic} created")
        except Exception as e:
            logger.error(f"Failed to create topic {topic}: {e}")
            success = False
    
    return success

if __name__ == "__main__":
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    logger.info(f"Creating Kafka topics using bootstrap servers: {bootstrap_servers}")
    
    if create_topics(bootstrap_servers):
        logger.info("All topics created successfully")
        sys.exit(0)
    else:
        logger.error("Failed to create some topics")
        sys.exit(1)
