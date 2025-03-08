import json
import logging
import asyncio
import uuid
import time
from typing import Dict, Any, Optional, List

from confluent_kafka import Consumer, Producer
from proxmox_ai_llm.backend.utils.ollama import query_ollama

logger = logging.getLogger("multi_agent")

async def review_architecture(generator_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Review and optimize infrastructure architecture
    
    Args:
        generator_result: Generator agent result with Terraform code
        
    Returns:
        architect_result: Architecture review result
    """
    logger.info("Reviewing infrastructure architecture")
    
    # Extract Terraform code from generator result
    terraform_code = ""
    if isinstance(generator_result, dict) and "terraform" in generator_result:
        terraform_code = generator_result["terraform"]
    elif isinstance(generator_result, str):
        try:
            # Try to parse as JSON
            parsed = json.loads(generator_result)
            if "terraform" in parsed:
                terraform_code = parsed["terraform"]
        except json.JSONDecodeError:
            # Assume the entire string is Terraform code
            terraform_code = generator_result
            
    if not terraform_code:
        return {
            "error": "No Terraform code found in generator result",
            "architecture_score": 0,
            "findings": [],
            "optimizations": []
        }
    
    # Prepare prompt for architecture review
    architect_prompt = f"""
    As a cloud architect, review the following Terraform code for AWS architecture best practices.
    Focus on:
    1. Performance optimization
    2. Cost efficiency
    3. Scalability
    4. High availability
    5. Operational excellence
    
    Terraform Code:
    ```
    {terraform_code}
    ```
    
    Respond in JSON format only with the following structure:
    {{
      "architecture_score": <0-100 score based on architecture quality>,
      "findings": [
        {{
          "category": "performance|cost|scalability|availability|operational",
          "description": "Description of the finding",
          "affected_resource": "The specific resource with the issue",
          "impact": "high|medium|low"
        }}
      ],
      "optimizations": [
        {{
          "description": "Architecture optimization recommendation",
          "implementation": "How to implement the improvement",
          "benefit": "The benefit of this optimization",
          "effort": "high|medium|low"
        }}
      ]
    }}
    """
    
    # Query Ollama for architecture review
    try:
        response = query_ollama(architect_prompt)
        
        # Extract JSON from response
        try:
            # Find JSON content
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            
            if json_start >= 0 and json_end > json_start:
                json_content = response[json_start:json_end]
                architect_result = json.loads(json_content)
                
                # Add overall architecture status
                architecture_score = architect_result.get("architecture_score", 0)
                if architecture_score >= 80:
                    architecture_status = "OPTIMAL"
                elif architecture_score >= 50:
                    architecture_status = "ADEQUATE"
                else:
                    architecture_status = "SUBOPTIMAL"
                    
                architect_result["architecture_status"] = architecture_status
                
                # Add the original terraform code for reference
                architect_result["analyzed_terraform"] = terraform_code
                
                return architect_result
            else:
                logger.warning("Could not find JSON content in architecture review response")
                return {
                    "error": "Failed to parse architecture review result",
                    "architecture_score": 0,
                    "findings": [],
                    "optimizations": [],
                    "architecture_status": "UNKNOWN"
                }
        except json.JSONDecodeError as e:
            logger.warning(f"Invalid JSON in architecture review response: {e}")
            return {
                "error": f"Invalid architecture review result: {e}",
                "architecture_score": 0,
                "findings": [],
                "optimizations": [],
                "architecture_status": "UNKNOWN"
            }
    except Exception as e:
        logger.error(f"Error reviewing architecture: {e}")
        return {
            "error": str(e),
            "architecture_score": 0,
            "findings": [],
            "optimizations": [],
            "architecture_status": "ERROR"
        }

class ArchitectAgent:
    """
    Agent for reviewing and optimizing infrastructure architecture
    """
    def __init__(self, kafka_bootstrap_servers: str = "localhost:9092"):
        """
        Initialize Architect Agent
        
        Args:
            kafka_bootstrap_servers: Kafka bootstrap servers
        """
        self.kafka_bootstrap_servers = kafka_bootstrap_servers
        self.consumer = None
        self.producer = None
        self.topic = "multi-agent-architect"
        self._setup_kafka()
        
    def _setup_kafka(self):
        """Set up Kafka consumer and producer"""
        self.consumer = Consumer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'group.id': 'architect-agent',
            'auto.offset.reset': 'earliest'
        })
        
        self.producer = Producer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'client.id': 'architect-agent'
        })
        
        # Subscribe to agent topic
        self.consumer.subscribe([self.topic])
        logger.info(f"Architect Agent subscribed to topic: {self.topic}")
        
    async def run(self):
        """Run the architect agent event loop"""
        logger.info("Starting Architect Agent")
        
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
                
                if event_type == 'task.architect.start':
                    await self._handle_task(value)
            except Exception as e:
                logger.error(f"Error in Architect Agent: {e}")
                await asyncio.sleep(1)
                
    async def _handle_task(self, event: Dict[str, Any]):
        """
        Handle architect task
        
        Args:
            event: Kafka event with task details
        """
        workflow_id = event.get('correlation_id')
        payload = event.get('payload', {})
        
        try:
            logger.info(f"Processing architect task for workflow {workflow_id}")
            
            # Get generator result from dependencies
            dependencies = payload.get('dependencies', {})
            generator_result = dependencies.get('generator', {})
            
            if not generator_result:
                raise ValueError("Missing generator result in dependencies")
                
            # Review architecture
            architect_result = await review_architecture(generator_result)
            
            # Publish completion event
            self._publish_result(workflow_id, "completed", architect_result)
            logger.info(f"Completed architect task for workflow {workflow_id}")
        except Exception as e:
            logger.error(f"Error reviewing architecture for workflow {workflow_id}: {e}")
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
            'event_type': f'task.architect.{status}',
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
            
# Helper function to run the architect agent
async def run_architect_agent(kafka_bootstrap_servers: str = "localhost:9092"):
    """
    Run the architect agent
    
    Args:
        kafka_bootstrap_servers: Kafka bootstrap servers
    """
    agent = ArchitectAgent(kafka_bootstrap_servers=kafka_bootstrap_servers)
    try:
        await agent.run()
    finally:
        agent.close()
        
# Entry point for running the agent
def start_architect_agent():
    """Start the architect agent as a standalone process"""
    asyncio.run(run_architect_agent())
