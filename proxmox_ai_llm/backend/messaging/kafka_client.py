from confluent_kafka import Producer, Consumer, KafkaError, KafkaException
import json
import uuid
import time
import logging
from typing import Dict, Any, List, Callable, Optional
import os

logger = logging.getLogger("multi_agent")

class KafkaClient:
    """
    Kafka client for event-driven communication between agents
    """
    def __init__(self, bootstrap_servers: str = None, 
                 client_id: str = "multi-agent-architecture"):
        """
        Initialize Kafka client
        
        Args:
            bootstrap_servers: Kafka bootstrap servers
            client_id: Client ID for Kafka
        """
        self.bootstrap_servers = bootstrap_servers or os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        self.client_id = client_id
        self.producer = None
        self.consumers = {}
        self._initialize_producer()
        
    def _initialize_producer(self):
        """Initialize Kafka producer"""
        self.producer = Producer({
            'bootstrap.servers': self.bootstrap_servers,
            'client.id': f"{self.client_id}-producer",
            'acks': 'all',  # Wait for all replicas to acknowledge
            'retries': 5,   # Retry on transient errors
            'retry.backoff.ms': 500,
        })
        logger.info(f"Initialized Kafka producer: {self.bootstrap_servers}")
        
    def publish_event(self, topic: str, event_type: str, payload: Dict[str, Any], 
                      correlation_id: Optional[str] = None) -> str:
        """
        Publish event to Kafka topic
        
        Args:
            topic: Kafka topic
            event_type: Type of event
            payload: Event payload
            correlation_id: Correlation ID for tracking request flow (optional)
            
        Returns:
            event_id: Generated event ID
        """
        event_id = str(uuid.uuid4())
        correlation_id = correlation_id or event_id
        
        message = {
            'event_id': event_id,
            'correlation_id': correlation_id,
            'event_type': event_type,
            'timestamp': int(time.time() * 1000),
            'payload': payload
        }
        
        try:
            self.producer.produce(
                topic=topic,
                key=event_id,
                value=json.dumps(message).encode('utf-8'),
                on_delivery=self._delivery_callback
            )
            # Trigger any available delivery callbacks
            self.producer.poll(0)
            logger.info(f"Published event {event_id} to topic {topic}")
            return event_id
        except KafkaException as e:
            logger.error(f"Failed to publish event to {topic}: {e}")
            raise
            
    def _delivery_callback(self, err, msg):
        """Callback for message delivery reports"""
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")
            
    def create_consumer(self, group_id: str, topics: List[str], 
                        auto_offset_reset: str = 'earliest') -> str:
        """
        Create Kafka consumer
        
        Args:
            group_id: Consumer group ID
            topics: List of topics to subscribe to
            auto_offset_reset: Where to start consuming from if no offset is stored
            
        Returns:
            consumer_id: Generated consumer ID
        """
        consumer_id = str(uuid.uuid4())
        consumer = Consumer({
            'bootstrap.servers': self.bootstrap_servers,
            'group.id': group_id,
            'client.id': f"{self.client_id}-{group_id}-{consumer_id[:8]}",
            'auto.offset.reset': auto_offset_reset,
            'enable.auto.commit': True,
            'max.poll.interval.ms': 300000,  # 5 minutes
        })
        
        consumer.subscribe(topics)
        self.consumers[consumer_id] = {
            'consumer': consumer,
            'topics': topics,
            'group_id': group_id
        }
        
        logger.info(f"Created consumer {consumer_id} for group {group_id}, topics: {topics}")
        return consumer_id
    
    def consume_events(self, consumer_id: str, callback: Callable[[Dict[str, Any]], None], 
                       timeout: float = 1.0, max_messages: int = 100) -> int:
        """
        Consume events from subscribed topics
        
        Args:
            consumer_id: Consumer ID returned from create_consumer
            callback: Callback function to process messages
            timeout: Maximum time to block waiting for messages (seconds)
            max_messages: Maximum number of messages to process in one call
            
        Returns:
            count: Number of messages processed
        """
        if consumer_id not in self.consumers:
            raise ValueError(f"Consumer {consumer_id} not found")
            
        consumer = self.consumers[consumer_id]['consumer']
        count = 0
        
        try:
            for _ in range(max_messages):
                msg = consumer.poll(timeout)
                
                if msg is None:
                    break
                
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        logger.debug(f"Reached end of partition: {msg.topic()} [{msg.partition()}]")
                    else:
                        logger.error(f"Error consuming message: {msg.error()}")
                    continue
                
                try:
                    value = json.loads(msg.value().decode('utf-8'))
                    callback(value)
                    count += 1
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    
            return count
        except Exception as e:
            logger.error(f"Error consuming events: {e}")
            raise
            
    def close_consumer(self, consumer_id: str):
        """Close consumer and clean up"""
        if consumer_id in self.consumers:
            try:
                self.consumers[consumer_id]['consumer'].close()
                del self.consumers[consumer_id]
                logger.info(f"Closed consumer {consumer_id}")
            except Exception as e:
                logger.error(f"Error closing consumer {consumer_id}: {e}")
                
    def close(self):
        """Close all consumers and producer"""
        for consumer_id in list(self.consumers.keys()):
            self.close_consumer(consumer_id)
            
        if self.producer:
            self.producer.flush()
            logger.info("Closed Kafka producer")
