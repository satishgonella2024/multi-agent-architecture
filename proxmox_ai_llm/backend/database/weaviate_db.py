import weaviate
from weaviate import Client
import json
import uuid
import time
import logging
from typing import Dict, Any, List, Optional, Union

logger = logging.getLogger("multi_agent")

class WeaviateDatabase:
    """
    Enhanced Weaviate database client with learning capabilities
    """
    def __init__(self, url: str = None, api_key: Optional[str] = None):
        """
        Initialize Weaviate database client
        
        Args:
            url: Weaviate server URL
            api_key: Weaviate API key (optional)
        """
        import os
        self.url = url or os.getenv("WEAVIATE_URL", "http://localhost:8080")
        self.api_key = api_key or os.getenv("WEAVIATE_API_KEY")
        self.client = None
        self._initialize_client()
        self._initialize_schema()
        
    def _initialize_client(self):
        """Initialize Weaviate client"""
        try:
            auth_config = weaviate.auth.AuthApiKey(api_key=self.api_key) if self.api_key else None
            
            self.client = Client(
                url=self.url,
                auth_client_secret=auth_config,
                additional_headers={
                    "X-Application-Name": "multi-agent-architecture"
                }
            )
            
            logger.info(f"Connected to Weaviate at {self.url}")
        except Exception as e:
            logger.error(f"Failed to connect to Weaviate: {e}")
            raise
            
    def _initialize_schema(self):
        """Initialize Weaviate schema"""
        try:
            # Check if schema already exists
            schema = self.client.schema.get()
            existing_classes = [c["class"] for c in schema["classes"]] if "classes" in schema else []
            
            # Define required classes
            classes_to_create = []
            
            # AgentOutput class for storing agent outputs
            if "AgentOutput" not in existing_classes:
                classes_to_create.append({
                    "class": "AgentOutput",
                    "description": "Output from AI agents",
                    "vectorizer": "text2vec-transformers",
                    "properties": [
                        {
                            "name": "agent",
                            "dataType": ["string"],
                            "description": "Name of the agent",
                            "indexSearchable": True
                        },
                        {
                            "name": "response",
                            "dataType": ["text"],
                            "description": "Agent response",
                            "indexSearchable": True,
                            "tokenization": "word"
                        },
                        {
                            "name": "timestamp",
                            "dataType": ["int"],
                            "description": "Timestamp of the response",
                            "indexSearchable": True
                        },
                        {
                            "name": "workflowId",
                            "dataType": ["string"],
                            "description": "ID of the workflow",
                            "indexSearchable": True
                        }
                    ]
                })
                
            # Workflow class for storing workflow state
            if "Workflow" not in existing_classes:
                classes_to_create.append({
                    "class": "Workflow",
                    "description": "Agent workflow state",
                    "vectorizer": "text2vec-transformers",
                    "properties": [
                        {
                            "name": "status",
                            "dataType": ["string"],
                            "description": "Workflow status",
                            "indexSearchable": True
                        },
                        {
                            "name": "prompt",
                            "dataType": ["text"],
                            "description": "Original user prompt",
                            "indexSearchable": True,
                            "tokenization": "word"
                        },
                        {
                            "name": "results",
                            "dataType": ["text"],
                            "description": "Workflow results JSON",
                            "indexSearchable": True
                        },
                        {
                            "name": "timestamp",
                            "dataType": ["int"],
                            "description": "Start timestamp",
                            "indexSearchable": True
                        },
                        {
                            "name": "completedTimestamp",
                            "dataType": ["int"],
                            "description": "Completion timestamp",
                            "indexSearchable": True
                        }
                    ]
                })
                
            # Feedback class for storing user feedback
            if "Feedback" not in existing_classes:
                classes_to_create.append({
                    "class": "Feedback",
                    "description": "User feedback on agent outputs",
                    "vectorizer": "text2vec-transformers",
                    "properties": [
                        {
                            "name": "workflowId",
                            "dataType": ["string"],
                            "description": "ID of the workflow",
                            "indexSearchable": True
                        },
                        {
                            "name": "rating",
                            "dataType": ["number"],
                            "description": "User rating (1-5)",
                            "indexSearchable": True
                        },
                        {
                            "name": "comments",
                            "dataType": ["text"],
                            "description": "User comments",
                            "indexSearchable": True,
                            "tokenization": "word"
                        },
                        {
                            "name": "timestamp",
                            "dataType": ["int"],
                            "description": "Feedback timestamp",
                            "indexSearchable": True
                        }
                    ]
                })
                
            # LearningData class for storing learning data
            if "LearningData" not in existing_classes:
                classes_to_create.append({
                    "class": "LearningData",
                    "description": "Learning data for improving agent performance",
                    "vectorizer": "text2vec-transformers",
                    "properties": [
                        {
                            "name": "category",
                            "dataType": ["string"],
                            "description": "Learning data category",
                            "indexSearchable": True
                        },
                        {
                            "name": "prompt",
                            "dataType": ["text"],
                            "description": "Input prompt",
                            "indexSearchable": True,
                            "tokenization": "word"
                        },
                        {
                            "name": "response",
                            "dataType": ["text"],
                            "description": "Ideal response",
                            "indexSearchable": True,
                            "tokenization": "word"
                        },
                        {
                            "name": "metadata",
                            "dataType": ["text"],
                            "description": "Additional metadata JSON",
                            "indexSearchable": True
                        },
                        {
                            "name": "source",
                            "dataType": ["string"],
                            "description": "Source of learning data",
                            "indexSearchable": True
                        },
                        {
                            "name": "timestamp",
                            "dataType": ["int"],
                            "description": "Creation timestamp",
                            "indexSearchable": True
                        }
                    ]
                })
                
            # Create classes in Weaviate
            for class_def in classes_to_create:
                self.client.schema.create_class(class_def)
                logger.info(f"Created Weaviate class: {class_def['class']}")
                
        except Exception as e:
            logger.error(f"Failed to initialize Weaviate schema: {e}")
            raise
            
    def store_agent_output(self, agent_name: str, response: Union[str, Dict[str, Any]], 
                         workflow_id: Optional[str] = None):
        """
        Store agent output in Weaviate
        
        Args:
            agent_name: Name of the agent
            response: Agent response
            workflow_id: Workflow ID (optional)
        """
        try:
            # Convert dictionary response to JSON string
            if isinstance(response, dict):
                response_str = json.dumps(response)
            else:
                response_str = response
                
            # Create data object
            data_object = {
                "agent": agent_name,
                "response": response_str,
                "timestamp": int(time.time() * 1000)
            }
            
            # Add workflow ID if provided
            if workflow_id:
                data_object["workflowId"] = workflow_id
                
            # Store in Weaviate
            object_uuid = str(uuid.uuid4())
            self.client.data_object.create(
                data_object=data_object,
                class_name="AgentOutput",
                uuid=object_uuid
            )
            
            logger.info(f"Stored output from agent {agent_name} with ID {object_uuid}")
            return object_uuid
        except Exception as e:
            logger.error(f"Failed to store agent output: {e}")
            raise
            
    def fetch_agent_outputs(self, agent_name: Optional[str] = None, 
                          workflow_id: Optional[str] = None,
                          limit: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch agent outputs from Weaviate
        
        Args:
            agent_name: Filter by agent name (optional)
            workflow_id: Filter by workflow ID (optional)
            limit: Maximum number of results to return
            
        Returns:
            outputs: List of agent outputs
        """
        try:
            # Build query
            query = self.client.query.get("AgentOutput", ["agent", "response", "timestamp", "workflowId"])
            
            # Apply filters
            where_filters = []
            
            if agent_name:
                where_filters.append({
                    "path": ["agent"],
                    "operator": "Equal",
                    "valueString": agent_name
                })
                
            if workflow_id:
                where_filters.append({
                    "path": ["workflowId"],
                    "operator": "Equal",
                    "valueString": workflow_id
                })
                
            if where_filters:
                if len(where_filters) == 1:
                    query = query.with_where(where_filters[0])
                else:
                    query = query.with_where({
                        "operator": "And",
                        "operands": where_filters
                    })
                
            # Sort by timestamp descending
            query = query.with_sort({
                "path": ["timestamp"],
                "order": "desc"
            })
            
            # Apply limit
            query = query.with_limit(limit)
            
            # Execute query
            result = query.do()
            
            # Extract data objects
            outputs = []
            if "data" in result and "Get" in result["data"] and "AgentOutput" in result["data"]["Get"]:
                outputs = result["data"]["Get"]["AgentOutput"]
                
            return outputs
        except Exception as e:
            logger.error(f"Failed to fetch agent outputs: {e}")
            return []
            
    def store_workflow_state(self, workflow_id: str, state: Dict[str, Any]):
        """
        Store workflow state in Weaviate
        
        Args:
            workflow_id: Workflow ID
            state: Workflow state
        """
        try:
            # Convert results dictionary to JSON string if present
            if "results" in state and isinstance(state["results"], dict):
                state["results"] = json.dumps(state["results"])
                
            # Create data object
            data_object = {
                "status": state.get("status", "unknown"),
                "prompt": state.get("prompt", ""),
                "results": state.get("results", "{}"),
                "timestamp": state.get("timestamp", int(time.time() * 1000))
            }
            
            # Add completed timestamp if present
            if "completed_timestamp" in state:
                data_object["completedTimestamp"] = state["completed_timestamp"]
                
            # Store in Weaviate
            self.client.data_object.create(
                data_object=data_object,
                class_name="Workflow",
                uuid=workflow_id
            )
            
            logger.info(f"Stored workflow state for {workflow_id}")
        except Exception as e:
            logger.error(f"Failed to store workflow state: {e}")
            raise
            
    def get_workflow_state(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """
        Get workflow state from Weaviate
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            state: Workflow state
        """
        try:
            # Query workflow state
            result = self.client.data_object.get_by_id(
                uuid=workflow_id,
                class_name="Workflow",
                with_vector=False
            )
            
            if result:
                # Convert results JSON string back to dictionary
                if "results" in result and isinstance(result["results"], str):
                    try:
                        result["results"] = json.loads(result["results"])
                    except json.JSONDecodeError:
                        pass
                return result
            return None
        except Exception as e:
            logger.error(f"Failed to get workflow state: {e}")
            return None
            
    def store_feedback(self, workflow_id: str, rating: float, comments: str = ""):
        """
        Store user feedback in Weaviate
        
        Args:
            workflow_id: Workflow ID
            rating: User rating (1-5)
            comments: User comments (optional)
        """
        try:
            # Create data object
            data_object = {
                "workflowId": workflow_id,
                "rating": rating,
                "comments": comments,
                "timestamp": int(time.time() * 1000)
            }
            
            # Store in Weaviate
            feedback_id = str(uuid.uuid4())
            self.client.data_object.create(
                data_object=data_object,
                class_name="Feedback",
                uuid=feedback_id
            )
            
            logger.info(f"Stored feedback for workflow {workflow_id}")
            
            # Trigger learning from feedback
            self._learn_from_feedback(workflow_id, rating, comments)
            
            return feedback_id
        except Exception as e:
            logger.error(f"Failed to store feedback: {e}")
            raise
            
    def _learn_from_feedback(self, workflow_id: str, rating: float, comments: str):
        """
        Learn from user feedback to improve agent performance
        
        Args:
            workflow_id: Workflow ID
            rating: User rating
            comments: User comments
        """
        try:
            # Skip learning for neutral or positive ratings without comments
            if rating >= 3 and not comments:
                return
                
            # Get workflow state
            workflow = self.get_workflow_state(workflow_id)
            if not workflow:
                logger.warning(f"Cannot learn from feedback: Workflow {workflow_id} not found")
                return
                
            # Get agent outputs for this workflow
            outputs = self.fetch_agent_outputs(workflow_id=workflow_id)
            
            # Extract learning data based on feedback
            if rating < 3:  # Negative feedback
                # Store problematic prompts for learning
                self.store_learning_data(
                    category="improvement_needed",
                    prompt=workflow.get("prompt", ""),
                    metadata={
                        "rating": rating,
                        "feedback": comments,
                        "workflow_id": workflow_id
                    },
                    source="user_feedback"
                )
                
            elif comments and (
                "better" in comments.lower() or 
                "improve" in comments.lower() or
                "suggestion" in comments.lower()
            ):
                # Store suggestions for improvement
                self.store_learning_data(
                    category="user_suggestion",
                    prompt=workflow.get("prompt", ""),
                    metadata={
                        "rating": rating,
                        "feedback": comments,
                        "workflow_id": workflow_id,
                        "outputs": {o.get("agent"): o.get("response") for o in outputs}
                    },
                    source="user_feedback"
                )
                
            logger.info(f"Processed learning from feedback for workflow {workflow_id}")
        except Exception as e:
            logger.error(f"Failed to learn from feedback: {e}")
            
    def store_learning_data(self, category: str, prompt: str, metadata: Dict[str, Any] = None,
                          response: str = "", source: str = "system"):
        """
        Store learning data for improving agent performance
        
        Args:
            category: Learning data category
            prompt: Input prompt
            metadata: Additional metadata (optional)
            response: Ideal response (optional)
            source: Source of learning data
        """
        try:
            # Create data object
            data_object = {
                "category": category,
                "prompt": prompt,
                "response": response,
                "metadata": json.dumps(metadata) if metadata else "{}",
                "source": source,
                "timestamp": int(time.time() * 1000)
            }
            
            # Store in Weaviate
            learning_id = str(uuid.uuid4())
            self.client.data_object.create(
                data_object=data_object,
                class_name="LearningData",
                uuid=learning_id
            )
            
            logger.info(f"Stored learning data with category {category}")
            return learning_id
        except Exception as e:
            logger.error(f"Failed to store learning data: {e}")
            raise
            
    def get_similar_learning_data(self, prompt: str, category: Optional[str] = None,
                                limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get similar learning data based on semantic search
        
        Args:
            prompt: Input prompt
            category: Filter by category (optional)
            limit: Maximum number of results
            
        Returns:
            learning_data: List of similar learning data
        """
        try:
            # Build query
            query = self.client.query.get(
                "LearningData", 
                ["category", "prompt", "response", "metadata", "source", "timestamp"]
            ).with_near_text({
                "concepts": [prompt]
            })
            
            # Apply category filter if specified
            if category:
                query = query.with_where({
                    "path": ["category"],
                    "operator": "Equal",
                    "valueString": category
                })
                
            # Apply limit
            query = query.with_limit(limit)
            
            # Execute query
            result = query.do()
            
            # Extract data objects
            learning_data = []
            if "data" in result and "Get" in result["data"] and "LearningData" in result["data"]["Get"]:
                learning_data = result["data"]["Get"]["LearningData"]
                
                # Parse metadata JSON
                for item in learning_data:
                    if "metadata" in item and isinstance(item["metadata"], str):
                        try:
                            item["metadata"] = json.loads(item["metadata"])
                        except json.JSONDecodeError:
                            item["metadata"] = {}
                
            return learning_data
        except Exception as e:
            logger.error(f"Failed to get similar learning data: {e}")
            return []
            
    def delete_all_records(self) -> bool:
        """
        Delete all records from the database (use with caution)
        
        Returns:
            success: True if successful
        """
        try:
            # Delete all classes
            classes = ["AgentOutput", "Workflow", "Feedback", "LearningData"]
            for class_name in classes:
                self.client.batch.delete_objects(
                    class_name=class_name,
                    where={
                        "operator": "NotEqual",
                        "path": ["id"],
                        "valueString": "dummy"  # Match all objects
                    }
                )
                
            logger.info(f"Deleted all records from database")
            return True
        except Exception as e:
            logger.error(f"Failed to delete all records: {e}")
            return False
