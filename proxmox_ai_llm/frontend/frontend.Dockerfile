# frontend.Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY proxmox_ai_llm/frontend/package*.json ./

RUN npm install

COPY proxmox_ai_llm/frontend/ ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]