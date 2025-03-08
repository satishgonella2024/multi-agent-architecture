import json
import logging
import asyncio
import uuid
import time
from typing import Dict, Any, Optional

from confluent_kafka import Consumer, Producer
from proxmox_ai_llm.backend.utils.ollama import query_ollama

logger = logging.getLogger("multi_agent")

async def generate_infrastructure_code(command_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate infrastructure code based on command output
    
    Args:
        command_result: Command agent result
        
    Returns:
        generator_result: Generated infrastructure code
    """
    logger.info(f"Generating infrastructure code for intent: {command_result.get('intent')}")
    
    # Extract information from command result
    intent = command_result.get('intent', 'unknown')
    resource_type = command_result.get('resource_type', 'unknown')
    parameters = command_result.get('parameters', {})
    original_prompt = command_result.get('original_prompt', '')
    
    # Construct a prompt for Ollama to generate infrastructure code
    ollama_prompt = f"""
    You are an infrastructure code generator. Generate Terraform code for AWS based on the following requirements:
    
    Original Request: {original_prompt}
    Intent: {intent}
    Resource Type: {resource_type}
    Parameters: {json.dumps(parameters, indent=2)}
    
    Generate complete, working Terraform code that addresses the requirements.
    Include provider configuration, resource definitions, variables, and outputs.
    
    Format your response as a valid Terraform configuration that can be directly applied.
    """
    
    # Query Ollama
    try:
        response = query_ollama(ollama_prompt)
        
        # Extract Terraform code
        terraform_code = extract_code_blocks(response)
        
        if not terraform_code:
            logger.warning("Could not extract Terraform code from response")
            terraform_code = response
        
        # Generate metadata about the code
        metadata = await analyze_terraform_code(terraform_code, command_result)
        
        return {
            "terraform": terraform_code,
            "metadata": metadata,
            "command": command_result
        }
    except Exception as e:
        logger.error(f"Error generating infrastructure code: {e}")
        return {
            "error": str(e),
            "command": command_result
        }

def extract_code_blocks(text: str) -> str:
    """
    Extract code blocks from text
    
    Args:
        text: Text containing code blocks
        
    Returns:
        code: Extracted code
    """
    # Try to extract code blocks between markdown-style triple backticks
    code_blocks = []
    lines = text.split('\n')
    in_code_block = False
    current_block = []
    
    for line in lines:
        if line.strip().startswith('```') and not in_code_block:
            in_code_block = True
            # Skip the line with backticks
            continue
        elif line.strip().startswith('```') and in_code_block:
            in_code_block = False
            # Join the current block and add to code blocks
            if current_block:
                code_blocks.append('\n'.join(current_block))
                current_block = []
            # Skip the line with backticks
            continue
        
        if in_code_block:
            current_block.append(line)
    
    # Join all code blocks
    if code_blocks:
        return '\n\n'.join(code_blocks)
    else:
        # If no code blocks found, try to find code by heuristics
        # (this is a fallback mechanism)
        if 'provider "aws"' in text or 'resource "aws_' in text:
            # Look for Terraform-specific content
            terraform_content = []
            for line in lines:
                if ('provider' in line or 'resource' in line or 'variable' in line or 
                    'output' in line or 'module' in line or 'data' in line):
                    terraform_content.append(line)
                # Include indented lines that might be part of a block
                elif line.startswith('  '):
                    terraform_content.append(line)
                # Include lines with Terraform syntax elements
                elif '=' in line or '{' in line or '}' in line:
                    terraform_content.append(line)
            
            if terraform_content:
                return '\n'.join(terraform_content)
                
    # Return the original text as a fallback
    return text

async def analyze_terraform_code(terraform_code: str, command_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze Terraform code to extract metadata
    
    Args:
        terraform_code: Terraform code
        command_result: Command agent result
        
    Returns:
        metadata: Metadata about the code
    """
    # Simple analysis for now
    resources = []
    resource_count = 0
    
    # Count AWS resources
    lines = terraform_code.split('\n')
    for line in lines:
        if 'resource "aws_' in line:
            resource_count += 1
            # Extract resource type
            parts = line.split('"')
            if len(parts) >= 3:
                resources.append(parts[1])
    
    # Basic metadata
    metadata = {
        "resource_count": resource_count,
        "resources": resources,
        "intent": command_result.get('intent', 'unknown'),
        "resource_type": command_result.get('resource_type', 'unknown'),
        "generated_at": int(time.time() * 1000)
    }
    
    return metadata

class GeneratorAgent:
    """
    Agent for generating infrastructure code
    """
    def __init__(self, kafka_bootstrap_servers: str = "localhost:9092"):
        """
        Initialize Generator Agent
        
        Args:
            kafka_bootstrap_servers: Kafka bootstrap servers
        """
        self.kafka_bootstrap_servers = kafka_bootstrap_servers
        self.consumer = None
        self.producer = None
        self.topic = "multi-agent-generator"
        self._setup_kafka()
        
    def _setup_kafka(self):
        """Set up Kafka consumer and producer"""
        self.consumer = Consumer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'group.id': 'generator-agent',
            'auto.offset.reset': 'earliest'
        })
        
        self.producer = Producer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'client.id': 'generator-agent'
        })
        
        # Subscribe to agent topic
        self.consumer.subscribe([self.topic])
        logger.info(f"Generator Agent subscribed to topic: {self.topic}")
        
    async def run(self):
        """Run the generator agent event loop"""
        logger.info("Starting Generator Agent")
        
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
                
                if event_type == 'task.generator.start':
                    await self._handle_task(value)
            except Exception as e:
                logger.error(f"Error in Generator Agent: {e}")
                await asyncio.sleep(1)
                
    async def _handle_task(self, event: Dict[str, Any]):
        """
        Handle generator task
        
        Args:
            event: Kafka event with task details
        """
        workflow_id = event.get('correlation_id')
        payload = event.get('payload', {})
        
        try:
            logger.info(f"Processing generator task for workflow {workflow_id}")
            
            # Get command result from dependencies
            dependencies = payload.get('dependencies', {})
            command_result = dependencies.get('command', {})
            
            if not command_result:
                raise ValueError("Missing command result in dependencies")
                
            # Generate infrastructure code
            generator_result = await generate_infrastructure_code(command_result)
            
            # Publish completion event
            self._publish_result(workflow_id, "completed", generator_result)
            logger.info(f"Completed generator task for workflow {workflow_id}")
        except Exception as e:
            logger.error(f"Error generating infrastructure code for workflow {workflow_id}: {e}")
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
            'event_type': f'task.generator.{status}',
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
            
# Helper function to run the generator agent
async def run_generator_agent(kafka_bootstrap_servers: str = "localhost:9092"):
    """
    Run the generator agent
    
    Args:
        kafka_bootstrap_servers: Kafka bootstrap servers
    """
    agent = GeneratorAgent(kafka_bootstrap_servers=kafka_bootstrap_servers)
    try:
        await agent.run()
    finally:
        agent.close()
        
# Entry point for running the agent
def start_generator_agent():
    """Start the generator agent as a standalone process"""
    asyncio.run(run_generator_agent())
