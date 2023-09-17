FROM node:20
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm install

CMD npm run start
