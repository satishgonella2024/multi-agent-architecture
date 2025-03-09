# proxmox_ai_llm/backend/api/websocket_api.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
import asyncio
import json
import logging

logger = logging.getLogger("multi_agent")

router = APIRouter(tags=["WebSockets"])

class WebSocketManager:
    """
    WebSocket connection manager for real-time updates
    """
    def __init__(self):
        """Initialize the WebSocket manager"""
        self.active_connections: Dict[str, List[WebSocket]] = {}
        logger.info("WebSocket manager initialized")
    
    async def connect(self, websocket: WebSocket, workflow_id: str):
        """
        Connect a new WebSocket client for a specific workflow
        
        Args:
            websocket: WebSocket connection
            workflow_id: Workflow ID
        """
        await websocket.accept()
        
        if workflow_id not in self.active_connections:
            self.active_connections[workflow_id] = []
            
        self.active_connections[workflow_id].append(websocket)
        logger.info(f"WebSocket client connected for workflow {workflow_id}")
    
    def disconnect(self, websocket: WebSocket, workflow_id: str):
        """
        Disconnect a WebSocket client
        
        Args:
            websocket: WebSocket connection
            workflow_id: Workflow ID
        """
        if workflow_id in self.active_connections:
            if websocket in self.active_connections[workflow_id]:
                self.active_connections[workflow_id].remove(websocket)
                
            if not self.active_connections[workflow_id]:
                del self.active_connections[workflow_id]
                
            logger.info(f"WebSocket client disconnected from workflow {workflow_id}")
    
    async def broadcast(self, workflow_id: str, message: Dict[str, Any]):
        """
        Broadcast message to all clients for a workflow
        
        Args:
            workflow_id: Workflow ID
            message: Message to broadcast
        """
        if workflow_id in self.active_connections:
            disconnected_clients = []
            message_json = json.dumps(message)
            
            for websocket in self.active_connections[workflow_id]:
                try:
                    await websocket.send_text(message_json)
                except Exception as e:
                    logger.error(f"Error sending message to WebSocket client: {e}")
                    disconnected_clients.append(websocket)
            
            # Clean up any disconnected clients
            for websocket in disconnected_clients:
                self.disconnect(websocket, workflow_id)
                
            if disconnected_clients:
                logger.info(f"Removed {len(disconnected_clients)} disconnected clients for workflow {workflow_id}")

# Create manager instance
manager = WebSocketManager()

@router.websocket("/ws/workflow/{workflow_id}")
async def websocket_endpoint(websocket: WebSocket, workflow_id: str):
    """
    WebSocket endpoint for workflow updates
    
    Args:
        websocket: WebSocket connection
        workflow_id: Workflow ID
    """
    await manager.connect(websocket, workflow_id)
    
    try:
        while True:
            # Wait for any messages from client (ping/pong heartbeat)
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, workflow_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, workflow_id)