# Multi-Agent Architecture

An event-driven multi-agent system for infrastructure deployment and management. This system uses a Kafka-based messaging system, Weaviate vector database, and a collection of specialized agents to automate and optimize deployments.

## Getting Started

### Prerequisites

- Python 3.8+
- Docker and Docker Compose (for Kafka and Weaviate)
- Ollama (for LLM capabilities)

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```
2. Start Kafka and Weaviate:
```bash
docker-compose up -d
```
3. Run the application:
```bash
python main.py
```
Architecture
This system uses an event-driven architecture with the following components:

Event-Driven Orchestrator: Coordinates workflow between agents using Kafka
Weaviate Database: Stores agent outputs, workflow states, and learning data
Specialized Agents:

Command Agent: Interprets user commands
Generator Agent: Generates infrastructure code
Security Agent: Evaluates security vulnerabilities
Architect Agent: Reviews architectural design
Validator Agent: Validates generated content
Deployment Agent: Handles deployment
Feedback Agent: Provides integrated feedback
Cost Estimation Agent: Estimates deployment costs
Learning Agent: Continuously improves system performance



License
This project is licensed under the MIT License.