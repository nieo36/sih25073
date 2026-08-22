FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY backend/package*.json ./backend/

RUN npm install
RUN npm install --prefix backend
RUN npm install --include=dev --prefix client

COPY . .

RUN npm run build

EXPOSE 2000

CMD ["npm", "run", "start"]