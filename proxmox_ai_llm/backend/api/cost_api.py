from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
import logging

from proxmox_ai_llm.backend.database import get_database
from proxmox_ai_llm.backend.api.event_api import get_orchestrator

logger = logging.getLogger("multi_agent")

# API router
router = APIRouter(prefix="/cost", tags=["Cost Estimation"])

@router.get("/{workflow_id}")
async def get_cost_estimate(workflow_id: str):
    """
    Get detailed cost estimation for a workflow
    """
    try:
        db = get_database()
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        # Fetch cost estimation agent output
        outputs = db.fetch_agent_outputs(
            agent_name="cost_estimation",
            workflow_id=workflow_id
        )
        
        if not outputs:
            # Check if cost_estimation agent has been started for this workflow
            orchestrator = get_orchestrator()
            
            if not orchestrator:
                raise HTTPException(status_code=503, detail="Orchestrator not available")
                
            status = await orchestrator.get_workflow_status(workflow_id)
            
            if "cost_estimation" in status.get("started_agents", []):
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
            
        # Extract latest cost estimation
        latest_output = outputs[0]
        response = latest_output.get("response", "{}")
        
        # Parse JSON response
        try:
            import json
            if isinstance(response, str):
                cost_data = json.loads(response)
            else:
                cost_data = response
                
            # Add summary information
            summary = {
                "workflow_id": workflow_id,
                "status": "completed",
                "monthly_cost": cost_data.get("monthly_cost", 0),
                "annual_cost": cost_data.get("annual_cost", 0),
                "cost_tier": cost_data.get("cost_tier", "UNKNOWN")
            }
            
            return {
                "summary": summary,
                "details": cost_data
            }
        except json.JSONDecodeError:
            return {
                "workflow_id": workflow_id,
                "status": "error",
                "message": "Invalid cost estimation data"
            }
    except Exception as e:
        logger.error(f"Error getting cost estimate: {e}")
        raise HTTPException(status_code=500, detail=str(e))
