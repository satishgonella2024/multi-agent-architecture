from proxmox_ai_llm.backend.database import get_database
from proxmox_ai_llm.backend.messaging import get_kafka_client
import asyncio
import json
import logging
import uuid
from typing import Dict, Any, Optional, List

logger = logging.getLogger("multi_agent")

# Define Kafka topics for each agent
AGENT_TOPICS = {
    "command": "multi-agent-command",
    "generator": "multi-agent-generator",
    "security": "multi-agent-security", 
    "architect": "multi-agent-architect",
    "validator": "multi-agent-validator",
    "deployment": "multi-agent-deployment",
    "feedback": "multi-agent-feedback",
    "cost_estimation": "multi-agent-cost-estimation"
}

# Define agent dependencies (which agents depend on outputs from other agents)
AGENT_DEPENDENCIES = {
    "command": [],
    "generator": ["command"],
    "security": ["generator"],
    "architect": ["generator"],
    "validator": ["generator"],
    "deployment": ["generator", "security", "validator"],
    "feedback": ["generator", "security", "architect"],
    "cost_estimation": ["generator", "architect"]
}

class EventOrchestrator:
    """
    Event-driven orchestrator for agent workflow using Kafka
    """
    def __init__(self, kafka_bootstrap_servers: str = None):
        """
        Initialize event orchestrator
        
        Args:
            kafka_bootstrap_servers: Kafka bootstrap servers
        """
        self.kafka = get_kafka_client()
        self.db = get_database()
        self.workflow_results = {}
        self.active_workflows = {}
        self.consumer_id = None
        
    async def start_workflow(self, prompt: str) -> str:
        """
        Start a new agent workflow with the given prompt
        
        Args:
            prompt: User prompt to initiate workflow
            
        Returns:
            workflow_id: Workflow ID for tracking
        """
        workflow_id = str(uuid.uuid4())
        
        # Store initial workflow state
        self.active_workflows[workflow_id] = {
            "status": "started",
            "prompt": prompt,
            "completed_agents": set(),
            "started_agents": set(),
            "results": {},
            "timestamp": int(asyncio.get_event_loop().time())
        }
        
        # Store in database for persistence
        if self.db:
            self.db.store_workflow_state(workflow_id, {
                "status": "started",
                "prompt": prompt,
                "timestamp": self.active_workflows[workflow_id]["timestamp"]
            })
        
        # Publish event to start command agent (entry point)
        self.kafka.publish_event(
            topic=AGENT_TOPICS["command"],
            event_type="task.command.start",
            payload={"prompt": prompt},
            correlation_id=workflow_id
        )
        
        logger.info(f"Started workflow {workflow_id} with prompt: {prompt}")
        return workflow_id
        
    async def setup_event_listeners(self):
        """Setup event listeners for all agent topics"""
        # Create consumer for all agent topics
        all_topics = list(AGENT_TOPICS.values())
        self.consumer_id = self.kafka.create_consumer(
            group_id="orchestrator",
            topics=all_topics
        )
        
        # Start consuming events in a background task
        asyncio.create_task(self._consume_events())
        logger.info(f"Set up event listeners for topics: {all_topics}")
        
    async def _consume_events(self):
        """
        Consume events from all agent topics
        """
        if not self.consumer_id:
            logger.error("Consumer ID is not set. Cannot consume events.")
            return
            
        while True:
            try:
                # Process up to 100 messages with 1 second timeout
                count = self.kafka.consume_events(
                    consumer_id=self.consumer_id,
                    callback=self._process_event,
                    timeout=1.0,
                    max_messages=100
                )
                
                # If no messages, sleep briefly to avoid CPU spinning
                if count == 0:
                    await asyncio.sleep(0.1)
            except Exception as e:
                logger.error(f"Error consuming events: {e}")
                await asyncio.sleep(1)
                
    def _process_event(self, event: Dict[str, Any]):
        """
        Process an event from Kafka
        
        Args:
            event: Kafka event
        """
        try:
            event_type = event.get("event_type", "")
            correlation_id = event.get("correlation_id")
            payload = event.get("payload", {})
            
            # Skip events without correlation ID (workflow ID)
            if not correlation_id or correlation_id not in self.active_workflows:
                logger.warning(f"Received event with unknown workflow ID: {correlation_id}")
                return
                
            # Process agent completion events
            if event_type.endswith(".completed"):
                agent_name = event_type.split(".")[1]
                self._handle_agent_completion(correlation_id, agent_name, payload)
                
            # Process agent failure events
            elif event_type.endswith(".failed"):
                agent_name = event_type.split(".")[1]
                self._handle_agent_failure(correlation_id, agent_name, payload)
        except Exception as e:
            logger.error(f"Error processing event: {e}")
            
    def _handle_agent_completion(self, workflow_id: str, agent_name: str, payload: Dict[str, Any]):
        """
        Handle agent completion event
        
        Args:
            workflow_id: Workflow ID
            agent_name: Agent name
            payload: Event payload with agent results
        """
        workflow = self.active_workflows[workflow_id]
        
        # Store agent result
        workflow["results"][agent_name] = payload
        workflow["completed_agents"].add(agent_name)
        
        # Store in database
        if self.db:
            self.db.store_agent_output(agent_name, payload, workflow_id)
            
        logger.info(f"Agent {agent_name} completed for workflow {workflow_id}")
        
        # Check which agents can be started next
        self._trigger_next_agents(workflow_id)
        
        # Check if workflow is complete
        if self._is_workflow_complete(workflow_id):
            self._complete_workflow(workflow_id)
            
    def _handle_agent_failure(self, workflow_id: str, agent_name: str, payload: Dict[str, Any]):
        """
        Handle agent failure event
        
        Args:
            workflow_id: Workflow ID
            agent_name: Agent name
            payload: Event payload with error details
        """
        workflow = self.active_workflows[workflow_id]
        
        # Store failure information
        error_message = payload.get("error", "Unknown error")
        workflow["results"][agent_name] = {"error": error_message}
        workflow["completed_agents"].add(agent_name)
        
        logger.error(f"Agent {agent_name} failed for workflow {workflow_id}: {error_message}")
        
        # We still try to continue with other agents that don't depend on this one
        self._trigger_next_agents(workflow_id)
        
        # Check if workflow is complete (or can't proceed further)
        if self._is_workflow_complete(workflow_id):
            self._complete_workflow(workflow_id, status="partial_failure")
            
    def _trigger_next_agents(self, workflow_id: str):
        """
        Trigger next agents based on dependencies
        
        Args:
            workflow_id: Workflow ID
        """
        workflow = self.active_workflows[workflow_id]
        completed_agents = workflow["completed_agents"]
        started_agents = workflow["started_agents"]
        
        # Find agents whose dependencies are satisfied
        for agent_name, dependencies in AGENT_DEPENDENCIES.items():
            # Skip if agent already started or completed
            if agent_name in started_agents or agent_name in completed_agents:
                continue
                
            # Check if all dependencies are completed
            if all(dep in completed_agents for dep in dependencies):
                self._start_agent(workflow_id, agent_name)
                
    def _start_agent(self, workflow_id: str, agent_name: str):
        """
        Start an agent by publishing an event
        
        Args:
            workflow_id: Workflow ID
            agent_name: Agent to start
        """
        workflow = self.active_workflows[workflow_id]
        workflow["started_agents"].add(agent_name)
        
        # Build payload with results from dependencies
        dependencies = AGENT_DEPENDENCIES[agent_name]
        dependency_results = {
            dep: workflow["results"].get(dep, {})
            for dep in dependencies
        }
        
        # Add the original prompt
        payload = {
            "prompt": workflow["prompt"],
            "dependencies": dependency_results
        }
        
        # Publish event to start the agent
        self.kafka.publish_event(
            topic=AGENT_TOPICS[agent_name],
            event_type=f"task.{agent_name}.start",
            payload=payload,
            correlation_id=workflow_id
        )
        
        logger.info(f"Started agent {agent_name} for workflow {workflow_id}")
        
    def _is_workflow_complete(self, workflow_id: str) -> bool:
        """
        Check if workflow is complete
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            is_complete: True if all agents completed or can't proceed
        """
        workflow = self.active_workflows[workflow_id]
        completed_agents = workflow["completed_agents"]
        
        # Check if all agents are completed
        if all(agent in completed_agents for agent in AGENT_TOPICS.keys()):
            return True
            
        # Check if there are any agents that can still be started
        for agent_name in AGENT_TOPICS.keys():
            if agent_name not in completed_agents and agent_name not in workflow["started_agents"]:
                dependencies = AGENT_DEPENDENCIES[agent_name]
                if all(dep in completed_agents for dep in dependencies):
                    return False  # Can still start this agent
                    
        # If we reach here, no more agents can be started
        return True
        
    def _complete_workflow(self, workflow_id: str, status: str = "completed"):
        """
        Complete workflow and store final results
        
        Args:
            workflow_id: Workflow ID
            status: Final workflow status
        """
        workflow = self.active_workflows[workflow_id]
        workflow["status"] = status
        
        # Store completed workflow in results and database
        self.workflow_results[workflow_id] = workflow
        
        if self.db:
            self.db.store_workflow_state(workflow_id, {
                "status": status,
                "prompt": workflow["prompt"],
                "results": workflow["results"],
                "timestamp": workflow["timestamp"],
                "completed_timestamp": int(asyncio.get_event_loop().time())
            })
            
        logger.info(f"Workflow {workflow_id} completed with status: {status}")
        
        # Clean up
        del self.active_workflows[workflow_id]
        
    async def get_workflow_status(self, workflow_id: str) -> Dict[str, Any]:
        """
        Get workflow status
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            status: Workflow status
        """
        # Check active workflows first
        if workflow_id in self.active_workflows:
            workflow = self.active_workflows[workflow_id]
            return {
                "workflow_id": workflow_id,
                "status": workflow["status"],
                "completed_agents": list(workflow["completed_agents"]),
                "started_agents": list(workflow["started_agents"]),
                "timestamp": workflow["timestamp"]
            }
            
        # Check completed workflows
        if workflow_id in self.workflow_results:
            workflow = self.workflow_results[workflow_id]
            return {
                "workflow_id": workflow_id,
                "status": workflow["status"],
                "completed_agents": list(workflow["completed_agents"]),
                "results": workflow["results"],
                "timestamp": workflow["timestamp"]
            }
            
        # Try to fetch from database
        if self.db:
            workflow_state = self.db.get_workflow_state(workflow_id)
            if workflow_state:
                return workflow_state
                
        # Workflow not found
        return {"workflow_id": workflow_id, "status": "not_found"}
        
    async def close(self):
        """Close Kafka client and cleanup"""
        if self.kafka and self.consumer_id:
            self.kafka.close_consumer(self.consumer_id)
