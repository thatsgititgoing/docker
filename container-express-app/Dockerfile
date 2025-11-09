FROM node:22

WORKDIR /app 

# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm ci
# Copy the rest of the application code
COPY src/index.js ./
#expose the application port   
EXPOSE 3000
#start the application
CMD ["node", "index.js"]