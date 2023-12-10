FROM node:latest AS server-builder

WORKDIR /usr/src/app/server

COPY ./server/package*.json ./

RUN npm install
RUN npm install -g nodemon
RUN npm install sqlite3
RUN npm install sqlite

COPY ./server .

CMD ["npm", "run", "dev"] 
