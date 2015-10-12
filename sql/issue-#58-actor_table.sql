-- Table: "Actors"

-- DROP TABLE "Actors";

CREATE TABLE "Actors"
(
  _id serial NOT NULL,
  "firstName" character varying(255),
  "lastName" character varying(255),
  "pictureId" uuid,
  "imdbId" character varying(16),
  "active" boolean DEFAULT false,
  CONSTRAINT "Actors_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);
-- ALTER TABLE "Actors" OWNER TO postgres;