#!/usr/bin/env python3
"""
Test client for Multi-Agent Architecture API
"""
import os
import sys
import json
import argparse
import requests
from pprint import pprint

def parse_args():
    parser = argparse.ArgumentParser(description="Test client for Multi-Agent Architecture")
    parser.add_argument("--host", default="localhost", help="API host")
    parser.add_argument("--port", type=int, default=8000, help="API port")
    parser.add_argument("--action", choices=["orchestrate", "status", "outputs", "cost", "feedback"],
                      required=True, help="Action to perform")
    parser.add_argument("--workflow-id", help="Workflow ID for status/outputs/cost actions")
    parser.add_argument("--prompt", help="Prompt for orchestrate action")
    parser.add_argument("--rating", type=float, help="Rating for feedback action")
    parser.add_argument("--comments", help="Comments for feedback action")
    
    return parser.parse_args()

def main():
    args = parse_args()
    base_url = f"http://{args.host}:{args.port}/api/agents/event"
    
    if args.action == "orchestrate":
        if not args.prompt:
            print("Error: --prompt is required for orchestrate action")
            sys.exit(1)
            
        response = requests.post(
            f"{base_url}/orchestrate",
            json={"prompt": args.prompt}
        )
        
    elif args.action == "status":
        if not args.workflow_id:
            print("Error: --workflow-id is required for status action")
            sys.exit(1)
            
        response = requests.get(f"{base_url}/status/{args.workflow_id}")
        
    elif args.action == "outputs":
        if not args.workflow_id:
            print("Error: --workflow-id is required for outputs action")
            sys.exit(1)
            
        response = requests.get(f"{base_url}/outputs/{args.workflow_id}")
        
    elif args.action == "cost":
        if not args.workflow_id:
            print("Error: --workflow-id is required for cost action")
            sys.exit(1)
            
        response = requests.get(f"{base_url}/cost-estimate/{args.workflow_id}")
        
    elif args.action == "feedback":
        if not args.workflow_id or not args.rating:
            print("Error: --workflow-id and --rating are required for feedback action")
            sys.exit(1)
            
        feedback_data = {
            "workflow_id": args.workflow_id,
            "rating": args.rating
        }
        
        if args.comments:
            feedback_data["comments"] = args.comments
            
        response = requests.post(
            f"{base_url}/feedback",
            json=feedback_data
        )
    
    # Print response
    print(f"Status code: {response.status_code}")
    try:
        data = response.json()
        print("Response:")
        pprint(data)
    except json.JSONDecodeError:
        print("Response (not JSON):")
        print(response.text)

if __name__ == "__main__":
    main()
