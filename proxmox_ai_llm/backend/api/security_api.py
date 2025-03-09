# proxmox_ai_llm/backend/api/security_api.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
import logging
import json
from proxmox_ai_llm.backend.database import get_database
from proxmox_ai_llm.backend.api.event_api import get_orchestrator

logger = logging.getLogger("multi_agent")

router = APIRouter(prefix="/security", tags=["Security Analysis"])

@router.get("/{workflow_id}")
async def get_security_analysis(workflow_id: str):
    """
    Get detailed security analysis for a workflow
    """
    try:
        db = get_database()
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        # Fetch security agent output
        outputs = db.fetch_agent_outputs(
            agent_name="security",
            workflow_id=workflow_id
        )
        
        if not outputs:
            # Check if security agent has been started for this workflow
            orchestrator = get_orchestrator()
            if not orchestrator:
                raise HTTPException(status_code=503, detail="Orchestrator not available")
                
            status = await orchestrator.get_workflow_status(workflow_id)
            
            if "security" in status.get("started_agents", []):
                return {
                    "workflow_id": workflow_id,
                    "status": "processing",
                    "message": "Security analysis is currently processing"
                }
            else:
                return {
                    "workflow_id": workflow_id,
                    "status": "pending",
                    "message": "Security analysis has not been started yet"
                }
            
        # Extract latest security analysis
        latest_output = outputs[0]
        response = latest_output.get("response", "{}")
        
        # Parse JSON response
        try:
            if isinstance(response, str):
                security_data = json.loads(response)
            else:
                security_data = response
                
            # Add summary information
            summary = {
                "workflow_id": workflow_id,
                "status": "completed",
                "security_score": security_data.get("security_score", 0),
                "security_status": security_data.get("security_status", "UNKNOWN"),
                "vulnerabilities_count": len(security_data.get("vulnerabilities", []))
            }
            
            return {
                "summary": summary,
                "details": security_data
            }
        except json.JSONDecodeError:
            return {
                "workflow_id": workflow_id,
                "status": "error",
                "message": "Invalid security analysis data"
            }
    except Exception as e:
        logger.error(f"Error getting security analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))