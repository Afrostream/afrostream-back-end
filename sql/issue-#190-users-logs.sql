-- Table: "Logs"

-- DROP TABLE "Logs";

CREATE TABLE "Logs"
(
  _id serial NOT NULL,
  "createdAt" timestamp with time zone NOT NULL,
  type character varying(32),
  "userId" integer,
  "clientId" uuid,
  data json,
  CONSTRAINT "Logs_pkey" PRIMARY KEY (_id)
) WITH (
  OIDS=FALSE
);

-- migration of old AccessLogs data into Logs
insert into "Logs" ("createdAt", "type", "userId", "clientId", "data")
  select "created" as "createdAt", 'access_token' as "type", "userId", "clientId", json_build_object('token', "token", 'userIp', "userIp", 'userAgent', "userAgent") as "data" from "AccessTokens" order by "createdAt"
