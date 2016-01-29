-- Table: "Logs"

-- DROP TABLE "Logs";

CREATE TABLE "Logs"
(
  _id serial NOT NULL,
  "createdAt" timestamp with time zone NOT NULL,
  type character varying(32),
  "userId" integer,
  "clientId" uuid,
  data json
) WITH (
  OIDS=FALSE
);