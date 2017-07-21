FROM node:6.11
MAINTAINER Marc Dassonneville <marcdassonneville@afrostream.tv>

# creating our directory
RUN mkdir -p /opt/backend
WORKDIR /opt/backend

# installing dependencies
COPY package.json /opt/backend/package.json
COPY yarn.lock /opt/backend/yarn.lock
RUN yarn

# we add our code
COPY . .

EXPOSE 5602

# best practice: call node directly.
CMD ["node", "server.js"]
