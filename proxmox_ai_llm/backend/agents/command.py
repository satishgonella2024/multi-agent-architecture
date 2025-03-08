import json
import logging
import asyncio
import uuid
import time
from typing import Dict, Any, Optional

from confluent_kafka import Consumer, Producer
from proxmox_ai_llm.backend.utils.ollama import query_ollama

logger = logging.getLogger("multi_agent")

async def process_command(prompt: str) -> Dict[str, Any]:
    """
    Process command from user prompt
    
    Args:
        prompt: User prompt
        
    Returns:
        command_result: Command processing result
    """
    logger.info(f"Processing command: {prompt}")
    
    # Construct a prompt for Ollama to extract intent and parameters
    ollama_prompt = f"""
    You are a command processing agent for an infrastructure deployment system.
    
    Extract the main intent and parameters from the following user request:
    
    USER REQUEST: {prompt}
    
    Respond in JSON format only with the following structure:
    {{
      "intent": "deploy|update|delete|analyze|monitor",
      "resource_type": "the primary resource being managed",
      "parameters": {{
        // Key parameters extracted from the request
      }},
      "priority": "low|medium|high",
      "description": "A brief description of what the user is trying to do"
    }}
    """
    
    # Query Ollama
    try:
        response = query_ollama(ollama_prompt)
        
        # Try to parse JSON response
        try:
            # Find JSON content in the response
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            
            if json_start >= 0 and json_end > json_start:
                json_content = response[json_start:json_end]
                command_data = json.loads(json_content)
                
                result = {
                    "intent": command_data.get("intent", "unknown"),
                    "resource_type": command_data.get("resource_type", "unknown"),
                    "parameters": command_data.get("parameters", {}),
                    "priority": command_data.get("priority", "medium"),
                    "description": command_data.get("description", ""),
                    "original_prompt": prompt
                }
                
                logger.info(f"Extracted command intent: {result['intent']}")
                return result
            else:
                logger.warning("Could not extract JSON from Ollama response")
                return {
                    "intent": "unknown",
                    "resource_type": "unknown",
                    "parameters": {},
                    "priority": "medium",
                    "description": "Failed to parse command",
                    "original_prompt": prompt,
                    "error": "Could not extract command information"
                }
        except json.JSONDecodeError:
            logger.warning("Invalid JSON response from Ollama")
            return {
                "intent": "unknown",
                "resource_type": "unknown",
                "parameters": {},
                "priority": "medium",
                "description": "Failed to parse command",
                "original_prompt": prompt,
                "error": "Invalid command format"
            }
    except Exception as e:
        logger.error(f"Error processing command: {e}")
        return {
            "intent": "unknown",
            "resource_type": "unknown",
            "parameters": {},
            "priority": "medium",
            "description": "Error processing command",
            "original_prompt": prompt,
            "error": str(e)
        }

class CommandAgent:
    """
    Agent for processing commands from user prompts
    """
    def __init__(self, kafka_bootstrap_servers: str = "localhost:9092"):
        """
        Initialize Command Agent
        
        Args:
            kafka_bootstrap_servers: Kafka bootstrap servers
        """
        self.kafka_bootstrap_servers = kafka_bootstrap_servers
        self.consumer = None
        self.producer = None
        self.topic = "multi-agent-command"
        self._setup_kafka()
        
    def _setup_kafka(self):
        """Set up Kafka consumer and producer"""
        self.consumer = Consumer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'group.id': 'command-agent',
            'auto.offset.reset': 'earliest'
        })
        
        self.producer = Producer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'client.id': 'command-agent'
        })
        
        # Subscribe to agent topic
        self.consumer.subscribe([self.topic])
        logger.info(f"Command Agent subscribed to topic: {self.topic}")
        
    async def run(self):
        """Run the command agent event loop"""
        logger.info("Starting Command Agent")
        
        while True:
            try:
                # Poll for messages
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    await asyncio.sleep(0.1)
                    continue
                    
                if msg.error():
                    logger.error(f"Consumer error: {msg.error()}")
                    continue
                    
                # Process message
                value = json.loads(msg.value().decode('utf-8'))
                event_type = value.get('event_type')
                
                if event_type == 'task.command.start':
                    await self._handle_task(value)
            except Exception as e:
                logger.error(f"Error in Command Agent: {e}")
                await asyncio.sleep(1)
                
    async def _handle_task(self, event: Dict[str, Any]):
        """
        Handle command task
        
        Args:
            event: Kafka event with task details
        """
        workflow_id = event.get('correlation_id')
        payload = event.get('payload', {})
        
        try:
            logger.info(f"Processing command task for workflow {workflow_id}")
            
            # Extract prompt from payload
            prompt = payload.get('prompt')
            if not prompt:
                raise ValueError("Missing prompt in payload")
                
            # Process command
            command_result = await process_command(prompt)
            
            # Publish completion event
            self._publish_result(workflow_id, "completed", command_result)
            logger.info(f"Completed command task for workflow {workflow_id}")
        except Exception as e:
            logger.error(f"Error processing command for workflow {workflow_id}: {e}")
            self._publish_result(workflow_id, "failed", {"error": str(e)})
            
    def _publish_result(self, correlation_id: str, status: str, result: Dict[str, Any]):
        """
        Publish task result to Kafka
        
        Args:
            correlation_id: Correlation ID
            status: Task status (completed/failed)
            result: Task result
        """
        message = {
            'event_id': str(uuid.uuid4()),
            'correlation_id': correlation_id,
            'event_type': f'task.command.{status}',
            'timestamp': int(time.time() * 1000),
            'payload': result
        }
        
        # Publish to Kafka
        self.producer.produce(
            topic=self.topic,
            key=correlation_id,
            value=json.dumps(message).encode('utf-8')
        )
        self.producer.flush()
        
    def close(self):
        """Close Kafka consumer and producer"""
        if self.consumer:
            self.consumer.close()
            
# Helper function to run the command agent
async def run_command_agent(kafka_bootstrap_servers: str = "localhost:9092"):
    """
    Run the command agent
    
    Args:
        kafka_bootstrap_servers: Kafka bootstrap servers
    """
    agent = CommandAgent(kafka_bootstrap_servers=kafka_bootstrap_servers)
    try:
        await agent.run()
    finally:
        agent.close()
        
# Entry point for running the agent
def start_command_agent():
    """Start the command agent as a standalone process"""
    asyncio.run(run_command_agent())
