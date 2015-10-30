-- Table: "GiftGivers"

-- DROP TABLE "GiftGivers";

CREATE TABLE "GiftGivers"
(
  _id serial NOT NULL,
  first_name character varying(255),
  last_name character varying(255),
  email character varying(255),
  recipient_email character varying(255),
  CONSTRAINT "GiftGivers_pkey" PRIMARY KEY (_id),
  CONSTRAINT "GiftGivers_email_key" UNIQUE (email)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE "GiftGivers"
  OWNER TO postgres;
