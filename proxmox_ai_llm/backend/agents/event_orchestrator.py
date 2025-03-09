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
        self.websocket_manager = None
        
    def register_websocket_manager(self, websocket_manager):
        """
        Register the WebSocket manager for real-time notifications
        
        Args:
            websocket_manager: WebSocket manager instance
        """
        self.websocket_manager = websocket_manager
        logger.info("WebSocket manager registered with orchestrator")
        
    async def start_workflow(self, prompt: str) -> str:
        """
        Start a new agent workflow with the given prompt
        
        Args:
            prompt: User prompt to initiate workflow
            
        Returns:
            workflow_id: Workflow ID for tracking
        """
        workflow_id = str(uuid.uuid4())
        logger.info(f"Creating new workflow: {workflow_id}")
        
        # Store initial workflow state
        self.active_workflows[workflow_id] = {
            "status": "started",
            "prompt": prompt,
            "completed_agents": set(),
            "started_agents": set(),
            "results": {},
            "timestamp": int(asyncio.get_event_loop().time())
        }
        
        logger.info(f"Active workflows after creation: {list(self.active_workflows.keys())}")
        
        # Store in database for persistence
        if self.db:
            try:
                self.db.store_workflow_state(workflow_id, {
                    "status": "started",
                    "prompt": prompt,
                    "timestamp": self.active_workflows[workflow_id]["timestamp"]
                })
                logger.info(f"Stored workflow state for {workflow_id} in database")
            except Exception as e:
                logger.error(f"Error storing initial workflow state: {e}")
                # Continue even if database storage fails
        
        # Publish event to start command agent (entry point)
        try:
            self.kafka.publish_event(
                topic=AGENT_TOPICS["command"],
                event_type="task.command.start",
                payload={"prompt": prompt},
                correlation_id=workflow_id
            )
            logger.info(f"Published command event for workflow {workflow_id}")
        except Exception as e:
            logger.error(f"Error publishing command event: {e}")
            # If Kafka fails, add a default command result so the workflow can continue
            self.active_workflows[workflow_id]["results"]["command"] = {
                "commands": [],
                "description": "Default command set (Kafka error)"
            }
            self.active_workflows[workflow_id]["completed_agents"].add("command")
            logger.info(f"Added default command result for workflow {workflow_id} due to Kafka error")
        
        # Notify WebSocket clients about workflow start
        if self.websocket_manager:
            try:
                asyncio.create_task(
                    self.websocket_manager.broadcast(
                        workflow_id,
                        {
                            "event_type": "workflow_started",
                            "workflow_id": workflow_id,
                            "timestamp": self.active_workflows[workflow_id]["timestamp"]
                        }
                    )
                )
                logger.info(f"Broadcasted workflow start for {workflow_id} via WebSocket")
            except Exception as e:
                logger.error(f"Error broadcasting workflow start: {e}")
                # Continue even if WebSocket notification fails
        
        logger.info(f"Started workflow {workflow_id} with prompt: {prompt}")
        return workflow_id
        
    async def setup_event_listeners(self):
        """Setup event listeners for all agent topics"""
        # Create consumer for all agent topics
        all_topics = list(AGENT_TOPICS.values())
        try:
            self.consumer_id = self.kafka.create_consumer(
                group_id="orchestrator",
                topics=all_topics
            )
            
            # Start consuming events in a background task
            asyncio.create_task(self._consume_events())
            logger.info(f"Set up event listeners for topics: {all_topics}")
        except Exception as e:
            logger.error(f"Failed to set up event listeners: {e}")
            
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
            if not event or not isinstance(event, dict):
                logger.warning("Received invalid event format")
                return

            event_type = event.get("event_type", "")
            correlation_id = event.get("correlation_id")
            payload = event.get("payload", {})
            
            # Skip events without correlation ID
            if not correlation_id:
                logger.warning("Received event without correlation ID")
                return
                
            # If workflow not in active_workflows, try to recover it
            if correlation_id not in self.active_workflows:
                logger.warning(f"Received event with unknown workflow ID: {correlation_id}, attempting recovery")
                
                # First check completed workflows
                if correlation_id in self.workflow_results:
                    logger.info(f"Found workflow {correlation_id} in completed workflows, restoring")
                    self.active_workflows[correlation_id] = self.workflow_results[correlation_id].copy()
                
                # If not in completed workflows, try database
                elif self.db:
                    workflow_state = self.db.get_workflow_state(correlation_id)
                    if workflow_state:
                        logger.info(f"Recovered workflow {correlation_id} from database")
                        # Reconstruct the workflow in active_workflows
                        self.active_workflows[correlation_id] = {
                            "status": workflow_state.get("status", "in_progress"),
                            "prompt": workflow_state.get("prompt", ""),
                            "completed_agents": set(),
                            "started_agents": set(),
                            "results": workflow_state.get("results", {}),
                            "timestamp": workflow_state.get("timestamp", int(asyncio.get_event_loop().time()))
                        }
                        
                        # Add command agent as started if we're receiving events
                        if "command" not in self.active_workflows[correlation_id]["started_agents"]:
                            self.active_workflows[correlation_id]["started_agents"].add("command")
                    else:
                        logger.error(f"Could not recover workflow {correlation_id}")
                        return
                else:
                    logger.error(f"No database available to recover workflow {correlation_id}")
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
            logger.error(f"Error processing event: {e}", exc_info=True)
            
    def _handle_agent_completion(self, workflow_id: str, agent_name: str, payload: Dict[str, Any]):
        """
        Handle agent completion event
        
        Args:
            workflow_id: Workflow ID
            agent_name: Agent name
            payload: Event payload with agent results
        """
        try:
            workflow = self.active_workflows[workflow_id]
            
            # Store agent result
            workflow["results"][agent_name] = payload
            workflow["completed_agents"].add(agent_name)
            
            # Store in database
            if self.db:
                try:
                    self.db.store_agent_output(agent_name, payload, workflow_id)
                except Exception as e:
                    logger.error(f"Error storing agent output: {e}")
                    # Continue even if database storage fails
                
            logger.info(f"Agent {agent_name} completed for workflow {workflow_id}")
            
            # Notify WebSocket clients about agent completion
            if self.websocket_manager:
                try:
                    asyncio.create_task(
                        self.websocket_manager.broadcast(
                            workflow_id,
                            {
                                "event_type": "agent_completed",
                                "agent": agent_name,
                                "workflow_id": workflow_id,
                                "timestamp": int(asyncio.get_event_loop().time())
                            }
                        )
                    )
                except Exception as e:
                    logger.error(f"Error broadcasting agent completion: {e}")
            
            # Check which agents can be started next
            self._trigger_next_agents(workflow_id)
            
            # Check if workflow is complete
            if self._is_workflow_complete(workflow_id):
                self._complete_workflow(workflow_id)
        except KeyError:
            logger.error(f"Workflow {workflow_id} not found in active workflows")
        except Exception as e:
            logger.error(f"Error handling agent completion: {e}")
            
    def _handle_agent_failure(self, workflow_id: str, agent_name: str, payload: Dict[str, Any]):
        """
        Handle agent failure event
        
        Args:
            workflow_id: Workflow ID
            agent_name: Agent name
            payload: Event payload with error details
        """
        try:
            workflow = self.active_workflows[workflow_id]
            
            # Store failure information
            error_message = payload.get("error", "Unknown error")
            workflow["results"][agent_name] = {"error": error_message}
            workflow["completed_agents"].add(agent_name)
            
            logger.error(f"Agent {agent_name} failed for workflow {workflow_id}: {error_message}")
            
            # Notify WebSocket clients about agent failure
            if self.websocket_manager:
                try:
                    asyncio.create_task(
                        self.websocket_manager.broadcast(
                            workflow_id,
                            {
                                "event_type": "agent_failed",
                                "agent": agent_name,
                                "workflow_id": workflow_id,
                                "error": error_message,
                                "timestamp": int(asyncio.get_event_loop().time())
                            }
                        )
                    )
                except Exception as e:
                    logger.error(f"Error broadcasting agent failure: {e}")
            
            # We still try to continue with other agents that don't depend on this one
            self._trigger_next_agents(workflow_id)
            
            # Check if workflow is complete (or can't proceed further)
            if self._is_workflow_complete(workflow_id):
                self._complete_workflow(workflow_id, status="partial_failure")
        except KeyError:
            logger.error(f"Workflow {workflow_id} not found in active workflows")
        except Exception as e:
            logger.error(f"Error handling agent failure: {e}")
            
    def _trigger_next_agents(self, workflow_id: str):
        """
        Trigger next agents based on dependencies
        
        Args:
            workflow_id: Workflow ID
        """
        try:
            workflow = self.active_workflows[workflow_id]
            completed_agents = workflow["completed_agents"]
            started_agents = workflow["started_agents"]
            
            # Ensure command agent has a valid result
            if "command" in completed_agents and "command" not in workflow["results"]:
                logger.warning(f"Command result missing for workflow {workflow_id}, using default values")
                workflow["results"]["command"] = {"commands": [], "description": "Default command set"}
            
            # Check for malformed command result
            if "command" in workflow["results"] and not isinstance(workflow["results"]["command"], dict):
                logger.warning(f"Invalid command result format for workflow {workflow_id}, using default values")
                workflow["results"]["command"] = {"commands": [], "description": "Default command set"}
            
            # Find agents whose dependencies are satisfied
            for agent_name, dependencies in AGENT_DEPENDENCIES.items():
                # Skip if agent already started or completed
                if agent_name in started_agents or agent_name in completed_agents:
                    continue
                    
                # Check if all dependencies are completed
                if all(dep in completed_agents for dep in dependencies):
                    self._start_agent(workflow_id, agent_name)
        except KeyError:
            logger.error(f"Workflow {workflow_id} not found in active workflows")
        except Exception as e:
            logger.error(f"Error triggering next agents: {e}")
                
    def _start_agent(self, workflow_id: str, agent_name: str):
        """
        Start an agent by publishing an event
        
        Args:
            workflow_id: Workflow ID
            agent_name: Agent to start
        """
        try:
            workflow = self.active_workflows[workflow_id]
            workflow["started_agents"].add(agent_name)
            
            # Build payload with results from dependencies
            dependencies = AGENT_DEPENDENCIES[agent_name]
            dependency_results = {}
            
            # Add results from dependencies with safety checks
            for dep in dependencies:
                if dep in workflow["results"]:
                    dependency_results[dep] = workflow["results"][dep]
                else:
                    logger.warning(f"Missing dependency {dep} for agent {agent_name} in workflow {workflow_id}")
                    # Add empty default result
                    dependency_results[dep] = {}
            
            # Add the original prompt
            payload = {
                "prompt": workflow["prompt"],
                "dependencies": dependency_results
            }
            
            # Publish event to start the agent
            try:
                self.kafka.publish_event(
                    topic=AGENT_TOPICS[agent_name],
                    event_type=f"task.{agent_name}.start",
                    payload=payload,
                    correlation_id=workflow_id
                )
                logger.info(f"Published start event for agent {agent_name} with workflow {workflow_id}")
            except Exception as e:
                logger.error(f"Error publishing event for agent {agent_name}: {e}")
                # If Kafka fails, mark the agent as failed
                self._handle_agent_failure(workflow_id, agent_name, {"error": f"Failed to start: {str(e)}"})
                return
            
            # Notify WebSocket clients about agent start
            if self.websocket_manager:
                try:
                    asyncio.create_task(
                        self.websocket_manager.broadcast(
                            workflow_id,
                            {
                                "event_type": "agent_started",
                                "agent": agent_name,
                                "workflow_id": workflow_id,
                                "timestamp": int(asyncio.get_event_loop().time())
                            }
                        )
                    )
                except Exception as e:
                    logger.error(f"Error broadcasting agent start: {e}")
            
            logger.info(f"Started agent {agent_name} for workflow {workflow_id}")
        except KeyError:
            logger.error(f"Workflow {workflow_id} not found in active workflows")
        except Exception as e:
            logger.error(f"Error starting agent {agent_name}: {e}")
        
    def _is_workflow_complete(self, workflow_id: str) -> bool:
        """
        Check if workflow is complete
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            is_complete: True if all agents completed or can't proceed
        """
        try:
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
        except KeyError:
            logger.error(f"Workflow {workflow_id} not found in active workflows")
            return True  # Consider complete if not found
        except Exception as e:
            logger.error(f"Error checking if workflow is complete: {e}")
            return False
        
    def _complete_workflow(self, workflow_id: str, status: str = "completed"):
        """
        Complete workflow and store final results
        
        Args:
            workflow_id: Workflow ID
            status: Final workflow status
        """
        try:
            workflow = self.active_workflows[workflow_id]
            workflow["status"] = status
            completion_timestamp = int(asyncio.get_event_loop().time())
            
            # Store completed workflow in results and database
            self.workflow_results[workflow_id] = workflow.copy()
            
            if self.db:
                try:
                    workflow_state = {
                        "status": status,
                        "prompt": workflow["prompt"],
                        "results": workflow["results"],
                        "timestamp": workflow["timestamp"],
                        "completed_timestamp": completion_timestamp
                    }
                    self.db.store_workflow_state(workflow_id, workflow_state)
                except Exception as e:
                    logger.error(f"Failed to store final workflow state: {e}")
                
            # Notify WebSocket clients about workflow completion
            if self.websocket_manager:
                try:
                    asyncio.create_task(
                        self.websocket_manager.broadcast(
                            workflow_id,
                            {
                                "event_type": "workflow_completed",
                                "workflow_id": workflow_id,
                                "status": status,
                                "timestamp": completion_timestamp
                            }
                        )
                    )
                except Exception as e:
                    logger.error(f"Error broadcasting workflow completion: {e}")
                
            logger.info(f"Workflow {workflow_id} completed with status: {status}")
            
            # Clean up
            del self.active_workflows[workflow_id]
        except KeyError:
            logger.error(f"Workflow {workflow_id} not found in active workflows")
        except Exception as e:
            logger.error(f"Error completing workflow: {e}")
        
    async def get_workflow_status(self, workflow_id: str) -> Dict[str, Any]:
        """
        Get workflow status
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            status: Workflow status
        """
        try:
            # Check active workflows first
            if workflow_id in self.active_workflows:
                workflow = self.active_workflows[workflow_id]
                return {
                    "workflow_id": workflow_id,
                    "status": workflow.get("status", "unknown"),
                    "completed_agents": list(workflow.get("completed_agents", set())),
                    "started_agents": list(workflow.get("started_agents", set())),
                    "timestamp": workflow.get("timestamp", 0)
                }
                
            # Check completed workflows
            if workflow_id in self.workflow_results:
                workflow = self.workflow_results[workflow_id]
                return {
                    "workflow_id": workflow_id,
                    "status": workflow.get("status", "unknown"),
                    "completed_agents": list(workflow.get("completed_agents", set())),
                    "results": workflow.get("results", {}),
                    "timestamp": workflow.get("timestamp", 0)
                }
                
            # Try to fetch from database
            if self.db:
                try:
                    workflow_state = self.db.get_workflow_state(workflow_id)
                    if workflow_state:
                        # Ensure we have standard fields
                        if "status" not in workflow_state:
                            workflow_state["status"] = "unknown"
                        return workflow_state
                except Exception as e:
                    logger.error(f"Error getting workflow state from database: {e}")
                    
            # Workflow not found
            return {"workflow_id": workflow_id, "status": "not_found"}
        except Exception as e:
            logger.error(f"Error getting workflow status: {e}")
            return {
                "workflow_id": workflow_id, 
                "status": "error", 
                "message": f"Error: {str(e)}"
            }
        
    async def close(self):
        """Close Kafka client and cleanup"""
        if self.kafka and self.consumer_id:
            try:
                self.kafka.close_consumer(self.consumer_id)
                logger.info("Closed Kafka consumer")
            except Exception as e:
                logger.error(f"Error closing Kafka consumer: {e}")