from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import asyncio
import json
import time
import logging
from proxmox_ai_llm.backend.database import get_database
from proxmox_ai_llm.backend.agents.event_orchestrator import EventOrchestrator

logger = logging.getLogger("multi_agent")

# Pydantic models for request/response validation
class DeploymentPrompt(BaseModel):
    prompt: str = Field(..., description="User prompt for deployment")
    priority: Optional[str] = Field("normal", description="Task priority (low, normal, high)")
    notification_email: Optional[str] = Field(None, description="Email for notifications")

class WorkflowResponse(BaseModel):
    workflow_id: str = Field(..., description="Workflow ID")
    status: str = Field(..., description="Workflow status")
    message: str = Field(..., description="Status message")

class FeedbackRequest(BaseModel):
    workflow_id: str = Field(..., description="Workflow ID")
    rating: float = Field(..., ge=1, le=5, description="User rating (1-5)")
    comments: Optional[str] = Field("", description="User comments")

class LearningDataRequest(BaseModel):
    category: str = Field(..., description="Learning data category")
    prompt: str = Field(..., description="Input prompt")
    response: Optional[str] = Field("", description="Ideal response")
    metadata: Optional[Dict[str, Any]] = Field({}, description="Additional metadata")
    source: Optional[str] = Field("manual", description="Source of learning data")

# API router
router = APIRouter(prefix="/agents/event", tags=["Event-Driven Agents"])

# Global orchestrator instance (will be set in the main app)
def get_orchestrator():
    from proxmox_ai_llm.backend.api.main import orchestrator
    if orchestrator is None:
        raise HTTPException(status_code=503, detail="Event orchestrator not initialized")
    return orchestrator

@router.post("/orchestrate", response_model=WorkflowResponse)
async def trigger_event_orchestration(
    request: DeploymentPrompt,
    orchestrator: EventOrchestrator = Depends(get_orchestrator)
):
    """
    Trigger an event-driven agent workflow
    """
    try:
        # Start workflow in orchestrator
        workflow_id = await orchestrator.start_workflow(request.prompt)
        
        # Store additional metadata if provided
        if request.notification_email or request.priority != "normal":
            metadata = {
                "priority": request.priority,
                "notification_email": request.notification_email
            }
            
            db = get_database()
            if db:
                workflow_state = db.get_workflow_state(workflow_id)
                if workflow_state:
                    workflow_state["metadata"] = metadata
                    db.store_workflow_state(workflow_id, workflow_state)
        
        logger.info(f"Started event-driven workflow {workflow_id}")
        return {
            "workflow_id": workflow_id,
            "status": "started",
            "message": "Deployment workflow started successfully. Use the workflow_id to check status."
        }
    except Exception as e:
        logger.error(f"Error triggering event orchestration: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{workflow_id}")
async def get_workflow_status(
    workflow_id: str,
    orchestrator: EventOrchestrator = Depends(get_orchestrator)
):
    """
    Get the status of an event-driven workflow
    """
    try:
        status = await orchestrator.get_workflow_status(workflow_id)
        
        # Ensure status contains the required fields
        if not isinstance(status, dict):
            logger.warning(f"Invalid status format for workflow {workflow_id}")
            return {
                "workflow_id": workflow_id, 
                "status": "error", 
                "message": "Invalid status format"
            }
            
        if "status" not in status:
            logger.warning(f"Status field missing for workflow {workflow_id}")
            status["status"] = "unknown"
            
        if status["status"] == "not_found":
            logger.warning(f"Workflow {workflow_id} not found")
            return {
                "workflow_id": workflow_id,
                "status": "not_found",
                "message": f"Workflow {workflow_id} not found"
            }
        
        return status
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow status: {e}")
        # Return a valid response instead of throwing an error
        return {
            "workflow_id": workflow_id, 
            "status": "error", 
            "message": f"Error retrieving status: {str(e)}"
        }

@router.get("/outputs/{workflow_id}")
async def get_workflow_outputs(
    workflow_id: str,
    agent: Optional[str] = Query(None, description="Filter by agent name")
):
    """
    Get all agent outputs for a specific workflow
    """
    try:
        db = get_database()
        if not db:
            logger.error("Database not initialized")
            return {
                "workflow_id": workflow_id,
                "status": "error",
                "message": "Database not initialized",
                "outputs": []
            }
            
        # Fetch outputs for this workflow
        outputs = db.fetch_agent_outputs(
            agent_name=agent, 
            workflow_id=workflow_id
        )
        
        return {"workflow_id": workflow_id, "outputs": outputs}
    except Exception as e:
        logger.error(f"Error getting workflow outputs: {e}")
        return {
            "workflow_id": workflow_id,
            "status": "error",
            "message": str(e),
            "outputs": []
        }

@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """
    Submit feedback for a workflow
    """
    try:
        db = get_database()
        if not db:
            logger.error("Database not initialized")
            return {
                "status": "error",
                "message": "Database not initialized"
            }
            
        # Store feedback
        feedback_id = db.store_feedback(
            workflow_id=request.workflow_id,
            rating=request.rating,
            comments=request.comments
        )
        
        if not feedback_id:
            return {
                "status": "error",
                "message": "Failed to store feedback"
            }
        
        return {
            "feedback_id": feedback_id,
            "message": "Feedback submitted successfully"
        }
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        return {
            "status": "error",
            "message": f"Error submitting feedback: {str(e)}"
        }

@router.get("/cost-estimate/{workflow_id}")
async def get_cost_estimate(
    workflow_id: str,
    orchestrator: EventOrchestrator = Depends(get_orchestrator)
):
    """
    Get cost estimation for a workflow
    """
    try:
        db = get_database()
        if not db:
            logger.error("Database not initialized")
            return {
                "workflow_id": workflow_id,
                "status": "error",
                "message": "Database not initialized"
            }
            
        # Fetch cost estimation agent output
        outputs = db.fetch_agent_outputs(
            agent_name="cost_estimation",
            workflow_id=workflow_id
        )
        
        if not outputs:
            # Check if cost_estimation agent has been started yet
            try:
                status = await orchestrator.get_workflow_status(workflow_id)
                
                if not isinstance(status, dict):
                    return {
                        "workflow_id": workflow_id,
                        "status": "error",
                        "message": "Invalid workflow status format"
                    }
                
                started_agents = status.get("started_agents", [])
                if "cost_estimation" in started_agents:
                    return {
                        "workflow_id": workflow_id,
                        "status": "processing",
                        "message": "Cost estimation is currently processing"
                    }
                else:
                    return {
                        "workflow_id": workflow_id,
                        "status": "pending",
                        "message": "Cost estimation has not been started yet"
                    }
            except Exception as status_e:
                logger.error(f"Error getting workflow status for cost estimate: {status_e}")
                return {
                    "workflow_id": workflow_id,
                    "status": "error",
                    "message": f"Error checking workflow status: {str(status_e)}"
                }
            
        # Extract latest cost estimation
        try:
            latest_output = outputs[0]
            response = latest_output.get("response", "{}")
            
            # Parse JSON response
            if isinstance(response, str):
                cost_data = json.loads(response)
            else:
                cost_data = response
                
            return {
                "workflow_id": workflow_id,
                "status": "completed",
                "cost_estimate": cost_data
            }
        except (json.JSONDecodeError, IndexError) as parse_e:
            logger.error(f"Error parsing cost data: {parse_e}")
            return {
                "workflow_id": workflow_id,
                "status": "error",
                "message": f"Invalid cost estimation data: {str(parse_e)}"
            }
    except Exception as e:
        logger.error(f"Error getting cost estimate: {e}")
        return {
            "workflow_id": workflow_id,
            "status": "error",
            "message": f"Error getting cost estimate: {str(e)}"
        }

@router.post("/learning-data")
async def add_learning_data(request: LearningDataRequest):
    """
    Add new learning data for improving agent performance
    """
    try:
        db = get_database()
        if not db:
            logger.error("Database not initialized")
            return {
                "status": "error",
                "message": "Database not initialized"
            }
            
        # Store learning data
        learning_id = db.store_learning_data(
            category=request.category,
            prompt=request.prompt,
            response=request.response,
            metadata=request.metadata,
            source=request.source
        )
        
        if not learning_id:
            return {
                "status": "error",
                "message": "Failed to store learning data"
            }
        
        return {
            "learning_id": learning_id,
            "message": "Learning data added successfully"
        }
    except Exception as e:
        logger.error(f"Error adding learning data: {e}")
        return {
            "status": "error",
            "message": f"Error adding learning data: {str(e)}"
        }

@router.get("/learning-data/similar")
async def get_similar_learning_data(
    prompt: str = Query(..., description="Input prompt to find similar learning data"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(5, ge=1, le=20, description="Maximum number of results")
):
    """
    Get similar learning data based on semantic search
    """
    try:
        db = get_database()
        if not db:
            logger.error("Database not initialized")
            return {
                "status": "error",
                "message": "Database not initialized",
                "learning_data": []
            }
            
        # Get similar learning data
        learning_data = db.get_similar_learning_data(
            prompt=prompt,
            category=category,
            limit=limit
        )
        
        return {"learning_data": learning_data}
    except Exception as e:
        logger.error(f"Error getting similar learning data: {e}")
        return {
            "status": "error",
            "message": f"Error getting similar learning data: {str(e)}",
            "learning_data": []
        }