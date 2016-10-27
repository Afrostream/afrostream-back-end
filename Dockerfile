FROM node:0.12

RUN apt-get -y update && apt-get -y install dnsutils && rm -rf /var/lib/apt/lists/*

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY entrypoint.sh /

CMD [ "/entrypoint.sh" ]
EXPOSE 5602
