import json
import logging
import asyncio
import uuid
import time
from typing import Dict, Any, Optional, List

from confluent_kafka import Consumer, Producer
from proxmox_ai_llm.backend.utils.ollama import query_ollama

logger = logging.getLogger("multi_agent")

async def analyze_security(generator_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze security vulnerabilities in infrastructure code
    
    Args:
        generator_result: Generator agent result with Terraform code
        
    Returns:
        security_result: Security analysis result
    """
    logger.info("Analyzing security vulnerabilities in Terraform code")
    
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
            "security_score": 0,
            "vulnerabilities": [],
            "recommendations": []
        }
    
    # Prepare prompt for security analysis
    security_prompt = f"""
    As a security analyst, analyze the following Terraform code for AWS security vulnerabilities.
    Focus on:
    1. Overly permissive security groups
    2. Public S3 buckets without proper configurations
    3. Missing encryption settings
    4. IAM permissions that violate least privilege
    5. Missing security best practices
    
    Terraform Code:
    ```
    {terraform_code}
    ```
    
    Respond in JSON format only with the following structure:
    {{
      "security_score": <0-100 score based on security>,
      "vulnerabilities": [
        {{
          "severity": "high|medium|low",
          "description": "Description of the vulnerability",
          "affected_resource": "The specific resource with the issue",
          "line_numbers": "Approximate line numbers if applicable"
        }}
      ],
      "recommendations": [
        {{
          "description": "Security recommendation",
          "implementation": "How to implement the fix",
          "importance": "high|medium|low"
        }}
      ]
    }}
    """
    
    # Query Ollama for security analysis
    try:
        response = query_ollama(security_prompt)
        
        # Extract JSON from response
        try:
            # Find JSON content
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            
            if json_start >= 0 and json_end > json_start:
                json_content = response[json_start:json_end]
                security_result = json.loads(json_content)
                
                # Add overall security status
                security_score = security_result.get("security_score", 0)
                if security_score >= 80:
                    security_status = "GOOD"
                elif security_score >= 50:
                    security_status = "NEEDS_IMPROVEMENT"
                else:
                    security_status = "CRITICAL"
                    
                security_result["security_status"] = security_status
                
                # Add the original terraform code for reference
                security_result["analyzed_terraform"] = terraform_code
                
                return security_result
            else:
                logger.warning("Could not find JSON content in security analysis response")
                return {
                    "error": "Failed to parse security analysis result",
                    "security_score": 0,
                    "vulnerabilities": [],
                    "recommendations": [],
                    "security_status": "UNKNOWN"
                }
        except json.JSONDecodeError as e:
            logger.warning(f"Invalid JSON in security analysis response: {e}")
            return {
                "error": f"Invalid security analysis result: {e}",
                "security_score": 0,
                "vulnerabilities": [],
                "recommendations": [],
                "security_status": "UNKNOWN"
            }
    except Exception as e:
        logger.error(f"Error analyzing security: {e}")
        return {
            "error": str(e),
            "security_score": 0,
            "vulnerabilities": [],
            "recommendations": [],
            "security_status": "ERROR"
        }

class SecurityAgent:
    """
    Agent for analyzing security vulnerabilities in infrastructure code
    """
    def __init__(self, kafka_bootstrap_servers: str = "localhost:9092"):
        """
        Initialize Security Agent
        
        Args:
            kafka_bootstrap_servers: Kafka bootstrap servers
        """
        self.kafka_bootstrap_servers = kafka_bootstrap_servers
        self.consumer = None
        self.producer = None
        self.topic = "multi-agent-security"
        self._setup_kafka()
        
    def _setup_kafka(self):
        """Set up Kafka consumer and producer"""
        self.consumer = Consumer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'group.id': 'security-agent',
            'auto.offset.reset': 'earliest'
        })
        
        self.producer = Producer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'client.id': 'security-agent'
        })
        
        # Subscribe to agent topic
        self.consumer.subscribe([self.topic])
        logger.info(f"Security Agent subscribed to topic: {self.topic}")
        
    async def run(self):
        """Run the security agent event loop"""
        logger.info("Starting Security Agent")
        
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
                
                if event_type == 'task.security.start':
                    await self._handle_task(value)
            except Exception as e:
                logger.error(f"Error in Security Agent: {e}")
                await asyncio.sleep(1)
                
    async def _handle_task(self, event: Dict[str, Any]):
        """
        Handle security task
        
        Args:
            event: Kafka event with task details
        """
        workflow_id = event.get('correlation_id')
        payload = event.get('payload', {})
        
        try:
            logger.info(f"Processing security task for workflow {workflow_id}")
            
            # Get generator result from dependencies
            dependencies = payload.get('dependencies', {})
            generator_result = dependencies.get('generator', {})
            
            if not generator_result:
                raise ValueError("Missing generator result in dependencies")
                
            # Analyze security
            security_result = await analyze_security(generator_result)
            
            # Publish completion event
            self._publish_result(workflow_id, "completed", security_result)
            logger.info(f"Completed security task for workflow {workflow_id}")
        except Exception as e:
            logger.error(f"Error analyzing security for workflow {workflow_id}: {e}")
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
            'event_type': f'task.security.{status}',
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
            
# Helper function to run the security agent
async def run_security_agent(kafka_bootstrap_servers: str = "localhost:9092"):
    """
    Run the security agent
    
    Args:
        kafka_bootstrap_servers: Kafka bootstrap servers
    """
    agent = SecurityAgent(kafka_bootstrap_servers=kafka_bootstrap_servers)
    try:
        await agent.run()
    finally:
        agent.close()
        
# Entry point for running the agent
def start_security_agent():
    """Start the security agent as a standalone process"""
    asyncio.run(run_security_agent())
