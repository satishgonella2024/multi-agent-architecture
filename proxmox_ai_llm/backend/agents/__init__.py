import logging
import multiprocessing
import os
import signal
from typing import List, Dict, Any

logger = logging.getLogger("multi_agent")

# Running agent processes
running_agents = []

def start_agents():
    """Start agent processes"""
    global running_agents
    
    try:
        # Start Command Agent
        from proxmox_ai_llm.backend.agents.command import start_command_agent
        
        command_agent_process = multiprocessing.Process(
            target=start_command_agent,
            name="command_agent"
        )
        command_agent_process.start()
        running_agents.append(command_agent_process)
        logger.info(f"Started Command Agent (PID: {command_agent_process.pid})")
        
        # Start Generator Agent
        from proxmox_ai_llm.backend.agents.generator import start_generator_agent
        
        generator_agent_process = multiprocessing.Process(
            target=start_generator_agent,
            name="generator_agent"
        )
        generator_agent_process.start()
        running_agents.append(generator_agent_process)
        logger.info(f"Started Generator Agent (PID: {generator_agent_process.pid})")
        
        # Add more agent processes here as they are implemented
        # e.g. Security Agent, Architect Agent, etc.
        
    except Exception as e:
        logger.error(f"Error starting agents: {e}")

def stop_agents():
    """Stop agent processes"""
    global running_agents
    
    for process in running_agents:
        try:
            if process.is_alive():
                logger.info(f"Terminating {process.name} (PID: {process.pid})")
                process.terminate()
                process.join(timeout=5)
                
                # Force kill if still alive
                if process.is_alive():
                    logger.warning(f"Force killing {process.name} (PID: {process.pid})")
                    os.kill(process.pid, signal.SIGKILL)
        except Exception as e:
            logger.error(f"Error stopping {process.name}: {e}")
            
    running_agents = []
