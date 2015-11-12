-- Table: "WaitingUsers"

-- DROP TABLE "WaitingUsers";

CREATE TABLE "WaitingUsers"
(
  _id serial NOT NULL,
  "email" character varying(255),
  "country" character varying(3),
  date timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "WaitingUsers_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);
-- ALTER TABLE "WaitingUsers" OWNER TO postgres;