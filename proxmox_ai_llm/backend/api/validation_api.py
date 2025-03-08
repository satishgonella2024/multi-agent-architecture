from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
import logging
import json

from proxmox_ai_llm.backend.database import get_database
from proxmox_ai_llm.backend.api.event_api import get_orchestrator

logger = logging.getLogger("multi_agent")

# API router
router = APIRouter(prefix="/validation", tags=["Validation"])

@router.get("/{workflow_id}")
async def get_validation_result(workflow_id: str):
    """
    Get validation results for a workflow
    """
    try:
        db = get_database()
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        # Fetch validator agent output
        outputs = db.fetch_agent_outputs(
            agent_name="validator",
            workflow_id=workflow_id
        )
        
        if not outputs:
            # Check if validator agent has been started for this workflow
            orchestrator = get_orchestrator()
            
            if not orchestrator:
                raise HTTPException(status_code=503, detail="Orchestrator not available")
                
            status = await orchestrator.get_workflow_status(workflow_id)
            
            if "validator" in status.get("started_agents", []):
                return {
                    "workflow_id": workflow_id,
                    "status": "processing",
                    "message": "Validation is currently processing"
                }
            else:
                return {
                    "workflow_id": workflow_id,
                    "status": "pending",
                    "message": "Validation has not been started yet"
                }
            
        # Extract latest validation result
        latest_output = outputs[0]
        response = latest_output.get("response", "{}")
        
        # Parse JSON response
        try:
            if isinstance(response, str):
                validation_data = json.loads(response)
            else:
                validation_data = response
                
            # Add summary information
            summary = {
                "workflow_id": workflow_id,
                "status": "completed",
                "validation_score": validation_data.get("validation_score", 0),
                "validation_status": validation_data.get("validation_status", "UNKNOWN")
            }
            
            return {
                "summary": summary,
                "details": validation_data
            }
        except json.JSONDecodeError:
            return {
                "workflow_id": workflow_id,
                "status": "error",
                "message": "Invalid validation data"
            }
    except Exception as e:
        logger.error(f"Error getting validation result: {e}")
        raise HTTPException(status_code=500, detail=str(e))
