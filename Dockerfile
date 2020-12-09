FROM node:12-slim

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# If you are building your code for production
RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 8080

# HEALTHCHECK --interval=10s --timeout=2s --start-period=5s \  
#     CMD node ./healthcheck.js

CMD [ "node", "src/app.js" ]