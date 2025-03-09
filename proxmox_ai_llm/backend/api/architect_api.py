# proxmox_ai_llm/backend/api/architect_api.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
import logging
import json
from proxmox_ai_llm.backend.database import get_database
from proxmox_ai_llm.backend.api.event_api import get_orchestrator

logger = logging.getLogger("multi_agent")

router = APIRouter(prefix="/architect", tags=["Architecture Analysis"])

@router.get("/{workflow_id}")
async def get_architecture_analysis(workflow_id: str):
    """
    Get detailed architecture analysis for a workflow
    """
    try:
        db = get_database()
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        # Fetch architect agent output
        outputs = db.fetch_agent_outputs(
            agent_name="architect",
            workflow_id=workflow_id
        )
        
        if not outputs:
            # Check if architect agent has been started for this workflow
            orchestrator = get_orchestrator()
            if not orchestrator:
                raise HTTPException(status_code=503, detail="Orchestrator not available")
                
            status = await orchestrator.get_workflow_status(workflow_id)
            
            if "architect" in status.get("started_agents", []):
                return {
                    "workflow_id": workflow_id,
                    "status": "processing",
                    "message": "Architecture analysis is currently processing"
                }
            else:
                return {
                    "workflow_id": workflow_id,
                    "status": "pending",
                    "message": "Architecture analysis has not been started yet"
                }
            
        # Extract latest architecture analysis
        latest_output = outputs[0]
        response = latest_output.get("response", "{}")
        
        # Parse JSON response
        try:
            if isinstance(response, str):
                architecture_data = json.loads(response)
            else:
                architecture_data = response
                
            # Add summary information
            summary = {
                "workflow_id": workflow_id,
                "status": "completed",
                "architecture_score": architecture_data.get("architecture_score", 0),
                "architecture_status": architecture_data.get("architecture_status", "UNKNOWN"),
                "findings_count": len(architecture_data.get("findings", [])),
                "optimizations_count": len(architecture_data.get("optimizations", []))
            }
            
            return {
                "summary": summary,
                "details": architecture_data
            }
        except json.JSONDecodeError:
            return {
                "workflow_id": workflow_id,
                "status": "error",
                "message": "Invalid architecture analysis data"
            }
    except Exception as e:
        logger.error(f"Error getting architecture analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))