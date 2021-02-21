FROM node:lts-alpine3.13
WORKDIR /srv
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start"]
