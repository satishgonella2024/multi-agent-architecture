import os
import requests
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("multi_agent")

def query_ollama(prompt: str, model: Optional[str] = None) -> str:
    """
    Query Ollama API for LLM responses
    
    Args:
        prompt: Input prompt
        model: Ollama model to use (defaults to environment variable)
        
    Returns:
        response_text: Generated response
    """
    try:
        # Get Ollama URL and model from environment or use defaults
        ollama_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/generate")
        model = model or os.getenv("OLLAMA_MODEL", "llama3")
        
        logger.debug(f"Querying Ollama model {model} with prompt: {prompt[:100]}...")
        
        # Prepare request
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }
        
        # Make request
        response = requests.post(ollama_url, json=payload)
        response.raise_for_status()
        
        # Process response
        data = response.json()
        response_text = data.get("response", "")
        
        logger.debug(f"Received response from Ollama: {response_text[:100]}...")
        return response_text
    except Exception as e:
        logger.error(f"Error querying Ollama: {e}")
        return f"Error generating response: {str(e)}"
