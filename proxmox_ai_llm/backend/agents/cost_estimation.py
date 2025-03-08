import json
import logging
import asyncio
import uuid
import time
import re
from typing import Dict, Any, Optional, List

from confluent_kafka import Consumer, Producer
from proxmox_ai_llm.backend.utils.ollama import query_ollama

logger = logging.getLogger("multi_agent")

async def estimate_costs(generator_result: Dict[str, Any], architect_result: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Estimate costs for AWS infrastructure deployment
    
    Args:
        generator_result: Generator agent result with Terraform code
        architect_result: Architect agent result (optional)
        
    Returns:
        cost_estimate: Cost estimation result
    """
    logger.info("Estimating costs for infrastructure deployment")
    
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
            "monthly_cost": 0,
            "resources_cost": [],
            "optimization_suggestions": []
        }
    
    # Extract resources from Terraform code
    resources = extract_resources(terraform_code)
    
    # Prepare prompt for cost estimation
    cost_prompt = f"""
    As an AWS cost analyst, estimate the monthly costs for the following Terraform infrastructure.
    
    Terraform Code:
    ```
    {terraform_code}
    ```
    
    Extracted AWS Resources:
    {json.dumps(resources, indent=2)}
    
    Respond in JSON format only with the following structure:
    {{
      "monthly_cost": <total estimated monthly cost in USD>,
      "resources_cost": [
        {{
          "resource_type": "resource type (e.g., EC2, S3)",
          "instance": "specific instance or configuration",
          "monthly_cost": <estimated monthly cost for this resource>,
          "assumptions": "assumptions made in the calculation"
        }}
      ],
      "cost_breakdown": {{
        "compute": <compute costs>,
        "storage": <storage costs>,
        "network": <network costs>,
        "other": <other costs>
      }},
      "optimization_suggestions": [
        {{
          "description": "Cost optimization suggestion",
          "potential_savings": <estimated monthly savings in USD>,
          "implementation": "How to implement the optimization"
        }}
      ]
    }}
    """
    
    # Query Ollama for cost estimation
    try:
        response = query_ollama(cost_prompt)
        
        # Extract JSON from response
        try:
            # Find JSON content
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            
            if json_start >= 0 and json_end > json_start:
                json_content = response[json_start:json_end]
                cost_result = json.loads(json_content)
                
                # Add additional context
                monthly_cost = cost_result.get("monthly_cost", 0)
                annual_cost = monthly_cost * 12
                
                cost_result["annual_cost"] = annual_cost
                cost_result["cost_tier"] = get_cost_tier(monthly_cost)
                cost_result["analyzed_resources"] = resources
                
                return cost_result
            else:
                logger.warning("Could not find JSON content in cost estimation response")
                return {
                    "error": "Failed to parse cost estimation result",
                    "monthly_cost": 0,
                    "resources_cost": [],
                    "optimization_suggestions": []
                }
        except json.JSONDecodeError as e:
            logger.warning(f"Invalid JSON in cost estimation response: {e}")
            return {
                "error": f"Invalid cost estimation result: {e}",
                "monthly_cost": 0,
                "resources_cost": [],
                "optimization_suggestions": []
            }
    except Exception as e:
        logger.error(f"Error estimating costs: {e}")
        return {
            "error": str(e),
            "monthly_cost": 0,
            "resources_cost": [],
            "optimization_suggestions": []
        }

def extract_resources(terraform_code: str) -> List[Dict[str, Any]]:
    """
    Extract AWS resources from Terraform code
    
    Args:
        terraform_code: Terraform code
        
    Returns:
        resources: List of AWS resources
    """
    resources = []
    
    # Extract EC2 instances
    ec2_pattern = r'resource\s+"aws_instance"\s+"([^"]+)"\s+{([^}]+)}'
    for match in re.finditer(ec2_pattern, terraform_code, re.DOTALL):
        resource_name = match.group(1)
        resource_block = match.group(2)
        
        # Extract instance type
        instance_type_match = re.search(r'instance_type\s*=\s*"?([^"\n]+)"?', resource_block)
        instance_type = instance_type_match.group(1) if instance_type_match else "t2.micro"
        
        resources.append({
            "resource_type": "aws_instance",
            "name": resource_name,
            "instance_type": instance_type
        })
    
    # Extract S3 buckets
    s3_pattern = r'resource\s+"aws_s3_bucket"\s+"([^"]+)"\s+{([^}]+)}'
    for match in re.finditer(s3_pattern, terraform_code, re.DOTALL):
        resource_name = match.group(1)
        resource_block = match.group(2)
        
        resources.append({
            "resource_type": "aws_s3_bucket",
            "name": resource_name
        })
    
    # Extract RDS instances
    rds_pattern = r'resource\s+"aws_db_instance"\s+"([^"]+)"\s+{([^}]+)}'
    for match in re.finditer(rds_pattern, terraform_code, re.DOTALL):
        resource_name = match.group(1)
        resource_block = match.group(2)
        
        # Extract instance class
        instance_class_match = re.search(r'instance_class\s*=\s*"?([^"\n]+)"?', resource_block)
        instance_class = instance_class_match.group(1) if instance_class_match else "db.t2.micro"
        
        resources.append({
            "resource_type": "aws_db_instance",
            "name": resource_name,
            "instance_class": instance_class
        })
    
    # Extract ELB instances
    elb_pattern = r'resource\s+"aws_([^_]+_load_balancer)"\s+"([^"]+)"\s+{([^}]+)}'
    for match in re.finditer(elb_pattern, terraform_code, re.DOTALL):
        resource_type = f"aws_{match.group(1)}"
        resource_name = match.group(2)
        
        resources.append({
            "resource_type": resource_type,
            "name": resource_name
        })
    
    return resources

def get_cost_tier(monthly_cost: float) -> str:
    """
    Get cost tier based on monthly cost
    
    Args:
        monthly_cost: Monthly cost in USD
        
    Returns:
        cost_tier: Cost tier (LOW, MEDIUM, HIGH)
    """
    if monthly_cost < 100:
        return "LOW"
    elif monthly_cost < 500:
        return "MEDIUM"
    else:
        return "HIGH"

class CostEstimationAgent:
    """
    Agent for estimating costs of infrastructure deployments
    """
    def __init__(self, kafka_bootstrap_servers: str = "localhost:9092"):
        """
        Initialize Cost Estimation Agent
        
        Args:
            kafka_bootstrap_servers: Kafka bootstrap servers
        """
        self.kafka_bootstrap_servers = kafka_bootstrap_servers
        self.consumer = None
        self.producer = None
        self.topic = "multi-agent-cost-estimation"
        self._setup_kafka()
        
    def _setup_kafka(self):
        """Set up Kafka consumer and producer"""
        self.consumer = Consumer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'group.id': 'cost-estimation-agent',
            'auto.offset.reset': 'earliest'
        })
        
        self.producer = Producer({
            'bootstrap.servers': self.kafka_bootstrap_servers,
            'client.id': 'cost-estimation-agent'
        })
        
        # Subscribe to agent topic
        self.consumer.subscribe([self.topic])
        logger.info(f"Cost Estimation Agent subscribed to topic: {self.topic}")
        
    async def run(self):
        """Run the cost estimation agent event loop"""
        logger.info("Starting Cost Estimation Agent")
        
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
                
                if event_type == 'task.cost_estimation.start':
                    await self._handle_task(value)
            except Exception as e:
                logger.error(f"Error in Cost Estimation Agent: {e}")
                await asyncio.sleep(1)
                
    async def _handle_task(self, event: Dict[str, Any]):
        """
        Handle cost estimation task
        
        Args:
            event: Kafka event with task details
        """
        workflow_id = event.get('correlation_id')
        payload = event.get('payload', {})
        
        try:
            logger.info(f"Processing cost estimation task for workflow {workflow_id}")
            
            # Get dependencies
            dependencies = payload.get('dependencies', {})
            generator_result = dependencies.get('generator', {})
            architect_result = dependencies.get('architect', {})
            
            if not generator_result:
                raise ValueError("Missing generator result in dependencies")
                
            # Estimate costs
            cost_result = await estimate_costs(generator_result, architect_result)
            
            # Publish completion event
            self._publish_result(workflow_id, "completed", cost_result)
            logger.info(f"Completed cost estimation task for workflow {workflow_id}")
        except Exception as e:
            logger.error(f"Error estimating costs for workflow {workflow_id}: {e}")
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
            'event_type': f'task.cost_estimation.{status}',
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
            
# Helper function to run the cost estimation agent
async def run_cost_estimation_agent(kafka_bootstrap_servers: str = "localhost:9092"):
    """
    Run the cost estimation agent
    
    Args:
        kafka_bootstrap_servers: Kafka bootstrap servers
    """
    agent = CostEstimationAgent(kafka_bootstrap_servers=kafka_bootstrap_servers)
    try:
        await agent.run()
    finally:
        agent.close()
        
# Entry point for running the agent
def start_cost_estimation_agent():
    """Start the cost estimation agent as a standalone process"""
    asyncio.run(run_cost_estimation_agent())
