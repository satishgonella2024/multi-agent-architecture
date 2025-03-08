import json
import logging
import asyncio
import uuid
import time
from typing import Dict, Any, Optional, List

from confluent_kafka import Consumer, Producer
from proxmox_ai_llm.backend.utils.ollama import query_ollama

logger = logging.getLogger("multi_agent")

async def validate_infrastructure(generator_result: Dict[str, Any], command_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate infrastructure code against requirements and best practices
    
    Args:
        generator_result: Generator agent result with Terraform code
        command_result: Command agent result with user intent and parameters
        
    Returns:
        validation_result: Validation result
    """
    logger.info("Validating infrastructure code against requirements")
    
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
            "validation_score": 0,
            "validation_status": "FAILED",
            "issues": [],
            "suggestions": []
        }
    
    # Extract intent and parameters from command result
    intent = ""
    parameters = {}
    original_prompt = ""
    
    if isinstance(command_result, dict):
        intent = command_result.get("intent", "")
        parameters = command_result.get("parameters", {})
        original_prompt = command_result.get("original_prompt", "")
    elif isinstance(command_result, str):
        try:
            # Try to parse as JSON
            parsed = json.loads(command_result)
            intent = parsed.get("intent", "")
            parameters = parsed.get("parameters", {})
            original_prompt = parsed.get("original_prompt", "")
        except json.JSONDecodeError:
            # Cannot parse command result
            pass
    
    # Prepare prompt for validation
    validation_prompt = f"""
    As an infrastructure validator, check if the following Terraform code meets the requirements and follows best practices.
    
    Original Request: {original_prompt}
    Intent: {intent}
    Parameters: {json.dumps(parameters, indent=2)}
    
    Terraform Code:
    ```
    {terraform_code}
    ```
    
    Validate the code based on:
    1. Requirement fulfillment (does it implement what was requested?)
    2. Terraform best practices
    3. Resource naming and tagging
    4. Error handling and resilience
    5. Code organization and readability
    
    Respond in JSON format only with the following structure:
    {{
      "validation_score": <0-100 score based on validation quality>,
      "issues": [
        {{
          "severity": "high|medium|low",
          "description": "Description of the issue",
          "affected_resource": "The specific resource with the issue"
        }}
      ],
      "suggestions": [
        {{
          "description": "Improvement suggestion",
          "implementation": "How to implement the improvement"
        }}
      ],
      "requirement_check": {{
        "fulfilled": true|false,
        "missing_requirements": ["list of missing requirements if any"]
      }}
    }}
    """
    
    # Query Ollama for validation
    try:
        response = query_ollama(validation_prompt)
        
        # Extract JSON from response
        try:
            # Find JSON content
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            
            if json_start >= 0 and json_end > json_start:
                json_content = response[json_start:json_end]
                validation_result = json.loads(json_content)
                
                # Add overall validation status
                validation_score = validation_result.get("validation_score", 0)
                if validation_score >= 80:
                    validation_status = "PASSED"
                elif validation_score >= 50:
                    validation_status = "PASSED_WITH_WARNINGS"
                else:
                    validation_status = "FAILED"
                    
                validation_result["validation_status"] = validation_status
                
                # Add the original terraform code for reference
                validation_result["analyzed_terraform"] = terraform_code
                
                return validation_result
            else:
                logger.warning("Could not find JSON content in validation response")
                return {
                    "error": "Failed to parse validation result",
                    "validation_score": 0,
                    "validation_status": "FAILED",
                    "issues": [],
                    "suggestions": []
                }
        except json.JSONDecodeError as e:
            logger.warning(f"Invalid JSON in validation response: {e}")
            return {
                "error": f"Invalid validation result: {e}",
                "validation_score": 0,
                "validation_status": "FAILED",
                "issues": [],
                "suggestions": []
            }
    except Exception as e:
        logger.error(f"Error validating infrastructure: {e}")
        return {
            "error": str(e),
            "validation_score": 0,
            "validation_status": "FAILED",
            "issues": [],
            "suggestions": []
        }

class ValidatorAgent:
    """
    Agent for validating infrastructure code against requirements and best practices
    """
    def __init__(self, kafka_bootstrap_servers: str = "localhost:9092"):
        """
        Initialize Validator Agent
        
        Args:
            kafka_bootstrap_servers: Kafka bootstrap servers
        """
        self.kafka_bootstrap_servers = kafka_bootstrap_servers
        self.consumer = None
        self.producer = None
        self.topic = "multi-agent-validator"
        self._setup_kafka()
        
    def _setup_kafka(self):
        """Set up Kafka consumer and producer"""
        self.consumer = Consumer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'group.id': 'validator-agent',
            'auto.offset.reset': 'earliest'
        })
        
        self.producer = Producer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'client.id': 'validator-agent'
        })
        
        # Subscribe to agent topic
        self.consumer.subscribe([self.topic])
        logger.info(f"Validator Agent subscribed to topic: {self.topic}")
        
    async def run(self):
        """Run the validator agent event loop"""
        logger.info("Starting Validator Agent")
        
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
                
                if event_type == 'task.validator.start':
                    await self._handle_task(value)
            except Exception as e:
                logger.error(f"Error in Validator Agent: {e}")
                await asyncio.sleep(1)
                
    async def _handle_task(self, event: Dict[str, Any]):
        """
        Handle validator task
        
        Args:
            event: Kafka event with task details
        """
        workflow_id = event.get('correlation_id')
        payload = event.get('payload', {})
        
        try:
            logger.info(f"Processing validator task for workflow {workflow_id}")
            
            # Get dependencies
            dependencies = payload.get('dependencies', {})
            generator_result = dependencies.get('generator', {})
            command_result = dependencies.get('command', {})
            
            if not generator_result:
                raise ValueError("Missing generator result in dependencies")
                
            if not command_result:
                raise ValueError("Missing command result in dependencies")
                
            # Validate infrastructure
            validation_result = await validate_infrastructure(generator_result, command_result)
            
            # Publish completion event
            self._publish_result(workflow_id, "completed", validation_result)
            logger.info(f"Completed validator task for workflow {workflow_id}")
        except Exception as e:
            logger.error(f"Error validating infrastructure for workflow {workflow_id}: {e}")
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
            'event_type': f'task.validator.{status}',
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
            
# Helper function to run the validator agent
async def run_validator_agent(kafka_bootstrap_servers: str = "localhost:9092"):
    """
    Run the validator agent
    
    Args:
        kafka_bootstrap_servers: Kafka bootstrap servers
    """
    agent = ValidatorAgent(kafka_bootstrap_servers=kafka_bootstrap_servers)
    try:
        await agent.run()
    finally:
        agent.close()
        
# Entry point for running the agent
def start_validator_agent():
    """Start the validator agent as a standalone process"""
    asyncio.run(run_validator_agent())
