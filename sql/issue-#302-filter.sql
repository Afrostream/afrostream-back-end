-- DROP TABLE "Broadcasters"

CREATE TABLE "Broadcasters"
(
  _id character varying(4),
  name character varying(128),
  fqdns character varying(128) Array,
  CONSTRAINT "Broadcasters_pkey" PRIMARY KEY ("_id")
)
WITH (
  OIDS=FALSE
);

-- PROD
INSERT INTO "Broadcasters"
       ("_id", "name", "fqdns")
VALUES
     ('MOBI', 'AFROSTREAM_MOBILE', '{"legacy-api.afrostream.tv"}'),
     ('WEB', 'AFROSTREAM_WEB', '{"afrostream-backend.herokuapp.com"}'),
     ('BOUY', 'BOUYGUES', '{"legacy-api-bouygues.afrostream.tv"}'),
     ('EB', 'EXPORTS_BOUYGUES', '{"afrostream-backend.herokuapp.com"}'),
     ('EOCI', 'EXPORTS_OCI', '{"afrostream-backend.herokuapp.com"}'),
     ('EOS', 'EXPORTS_OSEARCH', '{"afrostream-backend.herokuapp.com"}'),
     ('ORAN', 'ORANGE', '{"legacy-api-orange.afrostream.tv"}'),
     ('ROKU', 'ROKU', '{"afrostream-backend.herokuapp.com"}');  -- fixme: should have it's own domain.

-- STAGING
INSERT INTO "Broadcasters"
       ("_id", "name", "fqdns")
VALUES
     ('MOBI', 'AFROSTREAM_MOBILE', '{"legacy-api-staging.afrostream.tv"}'),
     ('WEB', 'AFROSTREAM_WEB', '{"afr-back-end-staging.herokuapp.com"}'),
     ('BOUY', 'BOUYGUES', '{"legacy-api-bouygues-staging.afrostream.tv"}'),
     ('EB', 'EXPORTS_BOUYGUES', '{"afr-back-end-staging.herokuapp.com"}'),
     ('EOCI', 'EXPORTS_OCI', '{"afr-back-end-staging.herokuapp.com"}'),
     ('EOS', 'EXPORTS_OSEARCH', '{"afr-back-end-staging.herokuapp.com"}'),
     ('ORAN', 'ORANGE', '{"legacy-api-orange-staging.afrostream.tv"}'),
     ('ROKU', 'ROKU', '{"afr-back-end-staging.herokuapp.com"}');

-- DEV
INSERT INTO "Broadcasters"
       ("_id", "name", "fqdns")
VALUES
     ('MOBI', 'AFROSTREAM_MOBILE', '{"localhost"}'),
     ('WEB', 'AFROSTREAM_WEB', '{"localhost"}'),
     ('BOUY', 'BOUYGUES', '{"localhost"}'),
     ('EB', 'EXPORTS_BOUYGUES', '{"localhost"}'),
     ('EOCI', 'EXPORTS_OCI', '{"localhost"}'),
     ('EOS', 'EXPORTS_OSEARCH', '{"localhost"}'),
     ('ORAN', 'ORANGE', '{"localhost"}'),
     ('ROKU', 'ROKU', '{"localhost"}');

-- DROP TABLE "BroadcasterClients"
CREATE TABLE "BroadcasterClients"
(
  _id serial NOT NULL,
  "broadcasterId" character varying(4), -- Broadcasters._id
  "clientId" uuid NOT NULL,             -- Clients._id
  CONSTRAINT "BroadcasterClients_pkey" PRIMARY KEY ("broadcasterId", "clientId"),
  CONSTRAINT "BroadcasterClients_BroadcasterId_fkey" FOREIGN KEY ("broadcasterId")
      REFERENCES "Broadcasters" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "BroadcasterClients_ClientId_fkey" FOREIGN KEY ("clientId")
      REFERENCES "Clients" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);

-- PROD
INSERT INTO "BroadcasterClients"
       ("broadcasterId", "clientId")
SELECT "Broadcasters"._id, "Clients"."_id" from "Broadcasters"
  inner join "Clients" on
      "Broadcasters"."name" = 'AFROSTREAM_MOBILE' AND "Clients".type = 'legacy-api.tapptic' OR
      "Broadcasters"."name" = 'AFROSTREAM_WEB' AND "Clients".type = 'front-api.front-end' OR
      "Broadcasters"."name" = 'BOUYGUES' AND "Clients".type = 'legacy-api.bouygues-miami' OR
      "Broadcasters"."name" = 'EXPORTS_BOUYGUES' AND "Clients".type = 'afrostream-exports-bouygues' OR
      "Broadcasters"."name" = 'EXPORTS_OCI' AND "Clients".type = 'afrostream-exports-oci' OR
      "Broadcasters"."name" = 'EXPORTS_OSEARCH' AND "Clients".type = 'afrostream-exports-osearch' OR
      "Broadcasters"."name" = 'ORANGE' AND "Clients".type = 'legacy-api.orange' OR
      "Broadcasters"."name" = 'ORANGE' AND "Clients".type = 'legacy-api.orange-newbox' OR
      "Broadcasters"."name" = 'ROKU' AND "Clients".type = 'legacy-api.roku';

--
ALTER TABLE "Categories" ADD COLUMN "countries" character varying(2) ARRAY;
ALTER TABLE "Categories" ADD COLUMN "broadcasters" integer ARRAY;
ALTER TABLE "Movies" ADD COLUMN "countries" character varying(2) ARRAY;
ALTER TABLE "Movies" ADD COLUMN "broadcasters" integer ARRAY;
ALTER TABLE "Seasons" ADD COLUMN "countries" character varying(2) ARRAY;
ALTER TABLE "Seasons" ADD COLUMN "broadcasters" integer ARRAY;
ALTER TABLE "Episodes" ADD COLUMN "countries" character varying(2) ARRAY;
ALTER TABLE "Episodes" ADD COLUMN "broadcasters" integer ARRAY;
ALTER TABLE "Videos" ADD COLUMN "countries" character varying(2) ARRAY;
ALTER TABLE "Videos" ADD COLUMN "broadcasters" integer ARRAY;


-- 19/09/2016
DROP TABLE "BroadcastersClients";
DROP TABLE "Broadcasters";

  -- + recréer les tables

ALTER TABLE "Categories" DROP COLUMN broadcasters;
ALTER TABLE "Movies" DROP COLUMN broadcasters;
ALTER TABLE "Seasons" DROP COLUMN broadcasters;
ALTER TABLE "Episodes" DROP COLUMN broadcasters;
ALTER TABLE "Videos" DROP COLUMN broadcasters;

ALTER TABLE "Categories" ADD COLUMN "broadcasters" character varying(4) ARRAY;
ALTER TABLE "Movies" ADD COLUMN "broadcasters" character varying(4) ARRAY;
ALTER TABLE "Seasons" ADD COLUMN "broadcasters" character varying(4) ARRAY;
ALTER TABLE "Episodes" ADD COLUMN "broadcasters" character varying(4) ARRAY;
ALTER TABLE "Videos" ADD COLUMN "broadcasters" character varying(4) ARRAY;
