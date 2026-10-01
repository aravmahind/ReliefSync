# Base image
FROM node:18-alpine

# Working directory set kara
WORKDIR /app

# Backend folder madhun package.json copy kara
COPY backend/package*.json ./

# Dependencies install kara
RUN npm install

# Backend cha baaki complete code copy kara
COPY backend/ ./

# Application port expose kara
EXPOSE 5001

# App start command
CMD ["npm", "start"]