-- Table: "CatchupProviders"

-- DROP TABLE "CatchupProviders";

CREATE TABLE "CatchupProviders"
(
  _id serial NOT NULL,
  name character varying(255),
  expiration integer, -- seconds
  CONSTRAINT "CatchupProviders_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);
-- ALTER TABLE "CatchupProviders"
--   OWNER TO postgres;

-- links
ALTER TABLE "Movies" ADD COLUMN "catchupProviderId" integer;
ALTER TABLE "Seasons" ADD COLUMN "catchupProviderId" integer;
ALTER TABLE "Episodes" ADD COLUMN "catchupProviderId" integer;
ALTER TABLE "Videos" ADD COLUMN "catchupProviderId" integer;