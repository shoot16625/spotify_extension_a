FROM node:lts-alpine3.13
WORKDIR /srv
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "run", "start"]
